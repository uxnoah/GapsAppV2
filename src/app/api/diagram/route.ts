/**
 * API ROUTE: DIAGRAM MANAGEMENT (/api/diagram/route.ts)
 * =====================================================
 * **UPDATED**: Now uses professional database storage instead of memory!
 * 
 * This file handles two main operations:
 * 1. GET requests - Return current diagram data (frontend asking "what's the current state?")
 * 2. PUT requests - Update diagram with new data (external/system or frontend save)
 * 
 * NEW FEATURES:
 * - ✅ Persistent database storage (data survives server restarts)
 * - ✅ Multi-user ready (each user gets their own boards)
 * - ✅ Activity logging (track all changes)
 * - ✅ Proper relationships and data integrity
 */

// IMPORTS SECTION
// ===============
import { NextRequest, NextResponse } from 'next/server'
import { Section, DiagramApi } from '@/lib/types'
import { 
  getBoardById,
  updateBoard,
  createThought,
  updateThought,
  deleteThought,
  prisma,
  getOrCreateUserBoard
} from '@/lib/database'
import { logActivity } from '@/lib/activity'
import { requireSession } from '@/lib/auth'

// =============================================================================
// DATABASE INTEGRATION
// =============================================================================
const DEFAULT_BOARD_TITLE = 'My GAPS Diagram'

// Demo bootstrapping removed; we now rely on authenticated session and per-user boards.

/**
 * CONVERT DATABASE TO API FORMAT
 * ==============================
 * Converts our database board+thoughts into the API format your frontend expects.
 */
// Minimal DB board shape for conversion
type DbThought = {
  id: number
  content: string
  section: string
  position: number | null
  tags?: string[] | null
  priority?: string | null
  status?: string | null
  aiGenerated: boolean
  confidence?: number | null
  metadata?: unknown
  createdAt: string | Date
  updatedAt: string | Date
}

type DbBoardForApi = {
  id: number
  title: string
  thoughts: DbThought[]
}

function convertDatabaseToApiFormat(board: DbBoardForApi): DiagramApi {
  if (!board || !board.thoughts) {
    return { id: 0, title: DEFAULT_BOARD_TITLE, thoughts: [] }
  }

  const thoughts = board.thoughts
    .sort((a: DbThought, b: DbThought) => (a.position ?? 0) - (b.position ?? 0))
    .map((t: DbThought) => ({
      id: String(t.id),
      text: t.content,
      section: t.section as Section,
      order: t.position ?? 0,
      tags: (t.tags ?? []) as string[],
      priority: t.priority ?? undefined,
      status: t.status ?? undefined,
      aiGenerated: Boolean(t.aiGenerated),
      confidence: t.confidence ?? undefined,
      metadata: t.metadata as Record<string, unknown> | undefined,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }))

  return { id: board.id, title: board.title, thoughts }
}

// =============================================================================
// HTTP REQUEST HANDLERS
// =============================================================================
// These functions handle incoming HTTP requests from browsers and external services

/**
 * GET REQUEST HANDLER
 * ===================
 * **UPDATED**: Now loads data from database instead of memory!
 * 
 * This is called when:
 * - Your React frontend wants to load the current diagram
 * - External services want to read the current state
 * 
 * Returns the same API format as before, so your frontend keeps working!
 */
export async function GET() {
  try {
    console.log('🔥 GET /api/diagram called at:', new Date().toISOString())
    const session = await requireSession()
    const board = await getOrCreateUserBoard(session.userId)
    
    console.log('🔥 Loaded board:', board?.title, 'with', board?.thoughts?.length || 0, 'thoughts')
    
    // Convert database format to API format
    if (!board) {
      throw new Error('Board not found for user')
    }
    // Normalize tags to string[] for conversion (DB may return JSON)
    const normalized = {
      ...board,
      thoughts: (board.thoughts || []).map((t: any) => ({
        ...t,
        tags: Array.isArray(t.tags) ? t.tags : (t.tags ? [] : []),
      })),
    } as unknown as DbBoardForApi
    const response = convertDatabaseToApiFormat(normalized)

    console.log('🔥 Returning GET response:', JSON.stringify(response, null, 2))
    return NextResponse.json(response)
  } catch (error) {
    console.error('🔥 Error fetching diagram:', error)
    const status = (error as any)?.status || 500
    return NextResponse.json(
      { error: 'Failed to fetch diagram', details: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    )
  }
}

/**
 * PUT REQUEST HANDLER
 * ===================
 * **UPDATED**: Now saves data to database instead of memory!
 * 
 * This is called when:
 * - Chipp.ai sends new diagram data
 * - Your frontend saves changes
 * - External services update the diagram
 * 
 * Maintains the same API format, but now with persistent database storage!
 */
export async function PUT(request: NextRequest) {
  try {
    console.log('🔥 PUT /api/diagram called at:', new Date().toISOString())
    
    // Parse the request body
    const body = await request.json()
    console.log('🔥 Request body received:', JSON.stringify(body, null, 2))
    
    // Extract data variables
    let title: string
    let status: string[]
    let goal: string[]
    let analysis: string[]
    let plan: string[]

    // Handle different data formats (Chipp vs direct)
    if ((body['current state'] || body.current_state) && body.gap_analysis) {
      console.log('🔥 Processing Chipp two-parameter format')
      
      const currentStateData = body['current state'] || body.current_state
      const gapAnalysisData = body.gap_analysis
      
      title = currentStateData?.title || ''
      status = Array.isArray(currentStateData?.status) ? currentStateData.status : []
      goal = Array.isArray(currentStateData?.goal) ? currentStateData.goal : []
      analysis = Array.isArray(gapAnalysisData?.analysis) ? gapAnalysisData.analysis : []
      plan = Array.isArray(gapAnalysisData?.plan) ? gapAnalysisData.plan : []
    } else {
      console.log('🔥 Processing direct format')
      title = body.title || ''
      status = Array.isArray(body.status) ? body.status : []
      goal = Array.isArray(body.goal) ? body.goal : []
      analysis = Array.isArray(body.analysis) ? body.analysis : []
      plan = Array.isArray(body.plan) ? body.plan : []
    }

    console.log('🔥 Extracted data:')
    console.log('  - title:', title)
    console.log('  - status:', status.length, 'items')
    console.log('  - goal:', goal.length, 'items')
    console.log('  - analysis:', analysis.length, 'items')
    console.log('  - plan:', plan.length, 'items')

    const session = await requireSession()
    const board = await getOrCreateUserBoard(session.userId)
    
    if (!board) {
      throw new Error('Failed to get or create board')
    }

    // UPDATE BOARD TITLE IF PROVIDED
    // ==============================
    if (title.trim() && title.trim() !== board.title) {
      await updateBoard(board.id, { title: title.trim() })
      console.log('🔥 Updated board title to:', title.trim())
      await logActivity({
        action: 'update_title',
        detail: `Title changed from "${board.title}" to "${title.trim()}" (bulk save)`,
        boardId: board.id,
        userId: session.userId,
        entityType: 'board',
        entityId: board.id,
        source: 'backend'
      })
    }

    // DATABASE TRANSACTION: REPLACE ALL THOUGHTS
    // ==========================================
    // We'll delete all existing thoughts and create new ones
    // This ensures clean updates when data comes from external sources
    
    await prisma.$transaction(async (tx) => {
      // Delete all existing thoughts for this board
      await tx.thought.deleteMany({
        where: { boardId: board.id }
      })
      console.log('🔥 Deleted existing thoughts')

      // Create new thoughts for each section
      const thoughtsToCreate: Array<{
        content: string
        section: Section
        boardId: number
        position: number
        aiGenerated: boolean
      }> = []

      // Process each section
      const sectionData: Array<{ array: string[]; section: Section }> = [
        { array: status, section: 'status' as Section },
        { array: goal, section: 'goal' as Section },
        { array: analysis, section: 'analysis' as Section },
        { array: plan, section: 'plan' as Section },
      ]

      for (const { array, section } of sectionData) {
        array.forEach((text: string, index: number) => {
          if (typeof text === 'string' && text.trim()) {
            thoughtsToCreate.push({
              content: text.trim(),
              section: section,
              boardId: board.id,
              position: index,
              aiGenerated: true, // Mark as AI generated since it came via API
            })
          }
        })
      }

      // Create all thoughts in batch
      if (thoughtsToCreate.length > 0) {
        await tx.thought.createMany({
          data: thoughtsToCreate
        })
        console.log('🔥 Created', thoughtsToCreate.length, 'new thoughts')
      }
    })

    // LOG THE ACTIVITY
    // ===============
    try {
      await logActivity({
        action: 'save_diagram',
        detail: `Updated diagram via API: ${title.trim() || 'Untitled'} (${status.length + goal.length + analysis.length + plan.length} total items)`,
        boardId: board.id,
        userId: session.userId,
        entityType: 'board',
        entityId: board.id,
        source: 'backend'
      })
    } catch (logError) {
      console.warn('🔥 Failed to log activity:', logError)
    }

    // PREPARE SUCCESS RESPONSE
    // ========================
    // Return the same format as before so clients continue working
    const response = {
      success: true,
      message: 'Diagram updated successfully',
      diagram: {
        title: title.trim(),
        status,
        goal,
        analysis,
        plan
      }
    }

    console.log('🔥 Database update successful!')
    return NextResponse.json(response)
  } catch (error) {
    console.error('🔥 ERROR updating diagram:', error)
    const status = (error as any)?.status || 500
    return NextResponse.json(
      { 
        error: 'Failed to update diagram', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status }
    )
  }
} 
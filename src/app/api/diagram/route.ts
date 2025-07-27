/**
 * API ROUTE: DIAGRAM MANAGEMENT (/api/diagram/route.ts)
 * =====================================================
 * **UPDATED**: Now uses professional database storage instead of memory!
 * 
 * This file handles two main operations:
 * 1. GET requests - Return current diagram data (frontend asking "what's the current state?")
 * 2. PUT requests - Update diagram with new data (Chipp.ai saying "here's new data!")
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
import { GapsDiagram, GapsItem } from '@/lib/types'
import { 
  getUserByEmail, 
  createUser, 
  getUserBoards, 
  createBoard, 
  getBoardById,
  updateBoard,
  createThought,
  updateThought,
  deleteThought,
  logActivityToBoard,
  prisma
} from '@/lib/database'
import bcrypt from 'bcryptjs'

// =============================================================================
// DATABASE INTEGRATION
// =============================================================================

/**
 * DEFAULT USER SETUP (TEMPORARY - BEFORE AUTHENTICATION)
 * ======================================================
 * For now, we'll create a default user so the app works without login.
 * Later, this will be replaced with proper authentication.
 */
const DEFAULT_USER_EMAIL = 'demo@chapp.local'
const DEFAULT_BOARD_TITLE = 'My GAPS Diagram'

/**
 * GET OR CREATE DEFAULT USER
 * ==========================
 * Ensures we have a default user to work with before authentication is added.
 */
async function getOrCreateDefaultUser() {
  try {
    // Try to find existing default user
    let user = await getUserByEmail(DEFAULT_USER_EMAIL)
    
    if (!user) {
      console.log('🏗️ Creating default user for demo')
      // Create default user
      const hashedPassword = await bcrypt.hash('demo-password', 10)
      user = await createUser({
        username: 'demo-user',
        email: DEFAULT_USER_EMAIL,
        passwordHash: hashedPassword,
        isAdmin: false
      })
    }
    
    return user
  } catch (error) {
    console.error('Error with default user:', error)
    throw error
  }
}

/**
 * GET OR CREATE DEFAULT BOARD
 * ===========================
 * Ensures the default user has a board to work with.
 */
async function getOrCreateDefaultBoard(userId: number) {
  try {
    // Get user's boards
    const boards = await getUserBoards(userId)
    
    if (boards.length === 0) {
      console.log('🏗️ Creating default board for user')
      // Create default board
      return await createBoard({
        title: DEFAULT_BOARD_TITLE,
        userId: userId,
        description: 'Default GAPS diagram board'
      })
    }
    
    // Return the first board (most recently updated)
    return await getBoardById(boards[0].id)
  } catch (error) {
    console.error('Error with default board:', error)
    throw error
  }
}

/**
 * CONVERT DATABASE TO API FORMAT
 * ==============================
 * Converts our database board+thoughts into the API format your frontend expects.
 */
function convertDatabaseToApiFormat(board: any): any {
  if (!board || !board.thoughts) {
    return {
      title: DEFAULT_BOARD_TITLE,
      status: [],
      goal: [],
      analysis: [],
      plan: []
    }
  }

  // Group thoughts by quadrant and sort by position
  const groupedThoughts = {
    status: board.thoughts
      .filter((t: any) => t.quadrant === 'status')
      .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
      .map((t: any) => t.content),
    goal: board.thoughts
      .filter((t: any) => t.quadrant === 'goal')
      .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
      .map((t: any) => t.content),
    analysis: board.thoughts
      .filter((t: any) => t.quadrant === 'analysis')
      .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
      .map((t: any) => t.content),
    plan: board.thoughts
      .filter((t: any) => t.quadrant === 'plan')
      .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
      .map((t: any) => t.content)
  }

  return {
    title: board.title,
    ...groupedThoughts
  }
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
    
    // Get or create default user and board
    const user = await getOrCreateDefaultUser()
    const board = await getOrCreateDefaultBoard(user.id)
    
    console.log('🔥 Loaded board:', board?.title, 'with', board?.thoughts?.length || 0, 'thoughts')
    
    // Convert database format to API format
    const response = convertDatabaseToApiFormat(board)

    console.log('🔥 Returning GET response:', JSON.stringify(response, null, 2))
    return NextResponse.json(response)
  } catch (error) {
    console.error('🔥 Error fetching diagram:', error)
    return NextResponse.json(
      { error: 'Failed to fetch diagram', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
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

    // GET OR CREATE USER AND BOARD
    // ============================
    const user = await getOrCreateDefaultUser()
    const board = await getOrCreateDefaultBoard(user.id)
    
    if (!board) {
      throw new Error('Failed to get or create board')
    }

    // UPDATE BOARD TITLE IF PROVIDED
    // ==============================
    if (title.trim() && title.trim() !== board.title) {
      await updateBoard(board.id, { title: title.trim() })
      console.log('🔥 Updated board title to:', title.trim())
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

      // Create new thoughts for each quadrant
      const thoughtsToCreate = []

      // Process each quadrant
      const quadrantData = [
        { array: status, quadrant: 'status' },
        { array: goal, quadrant: 'goal' },
        { array: analysis, quadrant: 'analysis' },
        { array: plan, quadrant: 'plan' }
      ]

      for (const { array, quadrant } of quadrantData) {
        array.forEach((text: string, index: number) => {
          if (typeof text === 'string' && text.trim()) {
            thoughtsToCreate.push({
              content: text.trim(),
              quadrant: quadrant,
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
      await logActivityToBoard({
        action: 'bulk_update',
        detail: `Updated diagram via API: ${title.trim() || 'Untitled'} (${status.length + goal.length + analysis.length + plan.length} total items)`,
        boardId: board.id,
        userId: user.id,
        entityType: 'board',
        entityId: board.id
      })
    } catch (logError) {
      console.warn('🔥 Failed to log activity:', logError)
      // Don't fail the whole request if logging fails
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
    return NextResponse.json(
      { 
        error: 'Failed to update diagram', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 
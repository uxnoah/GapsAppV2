/**
 * API ROUTE: DIAGRAM TITLE UPDATE (/api/diagram/title/route.ts)
 * =============================================================
 * 
 * This endpoint allows updating the title of the current diagram.
 * It's designed for AI systems to update diagram titles programmatically.
 * 
 * USAGE:
 * PUT /api/diagram/title
 * Body: { "title": "New Diagram Title" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { Section, DiagramApi } from '@/lib/types'
import { getOrCreateUserBoard, getBoardById, updateBoard } from '@/lib/database'
import { logActivity } from '@/lib/activity'
import { requireSession } from '@/lib/auth'

/**
 * CONVERT DATABASE TO API FORMAT
 * ==============================
 * Converts our database board+thoughts into the API format your frontend expects.
 */
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
    return { id: 0, title: 'GAPS Diagram', thoughts: [] }
  }

  // Convert thoughts to frontend GapsItem format with real database IDs and full metadata
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

/**
 * PUT REQUEST HANDLER
 * ===================
 * Updates the title of the current diagram.
 * 
 * This is called when:
 * - AI systems want to update the diagram title
 * - External services need to change the title
 * - Frontend needs to update the title programmatically
 */
export async function PUT(request: NextRequest) {
  try {
    console.log('🎯 PUT /api/diagram/title called at:', new Date().toISOString())
    
    // Parse the request body
    const body = await request.json()
    console.log('🎯 Request body received:', JSON.stringify(body, null, 2))
    
    // Validate title
    const { title } = body
    
    if (!title) {
      console.log('❌ Missing title in request')
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }
    
    if (typeof title !== 'string') {
      console.log('❌ Title must be a string')
      return NextResponse.json(
        { error: 'Title must be a string' },
        { status: 400 }
      )
    }
    
    const trimmedTitle = title.trim()
    
    if (!trimmedTitle) {
      console.log('❌ Title cannot be empty')
      return NextResponse.json(
        { error: 'Title cannot be empty' },
        { status: 400 }
      )
    }

    // Require session; get or create board for this user
    const session = await requireSession()
    const board = await getOrCreateUserBoard(session.userId)
    if (!board) {
      throw new Error('Failed to get or create board')
    }

    // UPDATE BOARD TITLE
    // ==================
    if (trimmedTitle !== board.title) {
      console.log('🎯 Updating board title from:', board.title, 'to:', trimmedTitle)
      
      await updateBoard(board.id, { title: trimmedTitle })

      // Centralized activity logging
      await logActivity({
        action: 'update_title',
        detail: `Title changed from "${board.title}" to "${trimmedTitle}"`,
          boardId: board.id,
          userId: session.userId,
        entityType: 'board',
        entityId: board.id,
        source: 'backend'
      })
      
      console.log('✅ Board title updated successfully')
    } else {
      console.log('ℹ️ Title unchanged, no update needed')
    }

    // GET UPDATED BOARD DATA
    // ======================
    const updatedBoard = await getBoardById(board.id)
    const response = convertDatabaseToApiFormat(updatedBoard as any)

    // PREPARE SUCCESS RESPONSE
    // ========================
    const successResponse = {
      success: true,
      message: 'Diagram title updated successfully',
      diagram: {
        id: response.id,
        title: response.title,
        thoughts: response.thoughts
      }
    }

    console.log('✅ Title update successful!')
    return NextResponse.json(successResponse)
  } catch (error) {
    console.error('❌ ERROR updating diagram title:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update diagram title', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * THOUGHT MOVE OPERATION API ROUTE
 * ================================
 * Endpoint: PATCH /api/thoughts/[id]/move
 * Purpose: Move a thought to a different section or position.
 *
 * Contracts (Types):
 * - Request: ThoughtMoveRequest
 * - Response: ThoughtResponse { success: true, thought: ThoughtDto }
 *
 * Notes:
 * - DB rebalances positions for impacted thoughts; we map DB position -> ThoughtDto.order
 * - Single error surface: route returns { error } with status; the client wrapper converts non-OK results to ApiError
 */

import { NextRequest, NextResponse } from 'next/server'
import { moveThought } from '@/lib/database'
import { requireSession } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import type { ThoughtMoveRequest, ThoughtResponse, Section } from '@/lib/types'

/**
 * PATCH /api/thoughts/[id]/move - Move thought and adjust other positions
 * 
 * This endpoint moves a thought to a new section and/or position.
 * The database automatically handles all the complex position adjustments
 * to maintain proper ordering of thoughts in both the source and target sections.
 * 
 * Use Cases:
 * - Drag and drop a thought from Status to Goal section
 * - Reorder thoughts within the same section
 * - Move a thought to a specific position in any section
 * 
 * Request Body:
 * {
 *   targetSection: string,    // Required: 'status', 'goal', 'analysis', or 'plan'
 *   targetIndex: number       // Required: New position (0 = first, 1 = second, etc.)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   thought: {
 *     id: number,              // Database ID
 *     content: string,         // The thought text
 *     section: string,         // New section (targetSection)
 *     order: number,           // New position (targetIndex)
 *     tags: string[],          // Associated tags
 *     priority: string,        // Priority level
 *     status: string,          // Current status
 *     aiGenerated: boolean,    // AI creation flag
 *     confidence: number,      // AI confidence score
 *     metadata: object,        // Additional data
 *     createdAt: string,       // Creation timestamp
 *     updatedAt: string        // Last update timestamp
 *   }
 * }
 * 
 * Database Behavior:
 * - If moving within same section: Reorders thoughts around the moved item
 * - If moving between sections: 
 *   1. Removes thought from source section and shifts others up
 *   2. Inserts thought into target section and shifts others down
 * - All operations are wrapped in a database transaction for safety
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSession()
    // Extract move parameters from request body
    const { targetSection, targetIndex } = (await request.json()) as ThoughtMoveRequest
    const thoughtId = parseInt(params.id)
    
    console.log('🎯 PATCH /api/thoughts/' + thoughtId + '/move called with:', { 
      targetSection, 
      targetIndex 
    })
    
    // Validate required parameters
    if (!targetSection || targetIndex === undefined) {
      return NextResponse.json(
        { error: 'targetSection and targetIndex are required' },
        { status: 400 }
      )
    }
    
    // Use the moveThought function which handles all the complex position adjustments
    // This function automatically:
    // - Calculates new positions for all affected thoughts
    // - Handles both same-section and cross-section moves
    // - Maintains data integrity with database transactions
    const updatedThought = await moveThought(thoughtId, targetSection, targetIndex)
    
    console.log('✅ Moved thought:', thoughtId, 'to', targetSection, 'at index', targetIndex)

    // Centralized activity logging (move_thought)
    await logActivity({
      action: 'move_thought',
      detail: `Moved to ${targetSection} @ ${targetIndex}`,
      boardId: updatedThought.boardId,
      userId: undefined,
      entityType: 'thought',
      entityId: updatedThought.id,
      source: 'backend'
    })
    
    // Return the moved thought with all its metadata
    // Note: We map database field names to frontend field names for consistency
    const payload: ThoughtResponse = {
      success: true,
      thought: {
        id: updatedThought.id,
        content: updatedThought.content,      // API uses 'content' (database field)
        section: updatedThought.section as Section,      // Normalize to Section type
        order: updatedThought.position || 0,  // Map database 'position' -> frontend 'order'
        
        // Metadata and organization fields
        tags: Array.isArray(updatedThought.tags) ? (updatedThought.tags as string[]) : [],
        priority: updatedThought.priority ?? undefined,
        status: updatedThought.status ?? undefined,
        
        // AI and collaboration fields
        aiGenerated: updatedThought.aiGenerated || false,
        confidence: updatedThought.confidence ?? undefined,
        metadata: (updatedThought.metadata as unknown as Record<string, unknown>) ?? undefined,
        
        // Timestamps
        createdAt: updatedThought.createdAt,
        updatedAt: updatedThought.updatedAt
      }
    }
    return NextResponse.json< ThoughtResponse >(payload)
    
  } catch (error) {
    console.error('❌ Error moving thought:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 
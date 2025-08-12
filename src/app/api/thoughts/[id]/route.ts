/**
 * INDIVIDUAL THOUGHT CRUD API ROUTE
 * =================================
 * Endpoints:
 * - PUT /api/thoughts/[id] - Update an existing thought
 * - DELETE /api/thoughts/[id] - Delete a thought
 *
 * Contracts (Types):
 * - PUT Request: ThoughtUpdateRequest
 * - PUT Response: ThoughtResponse { success: true, thought: ThoughtDto }
 * - DELETE Response: { success: true, message: string }
 *
 * Notes:
 * - Order is derived from DB position; we map DB position -> ThoughtDto.order
 * - Single error surface: route returns { error } with status; the client wrapper converts non-OK results to ApiError
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateThought, deleteThought } from '@/lib/database'
import { requireSession } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import type { ThoughtUpdateRequest, ThoughtResponse, Section } from '@/lib/types'

/**
 * PUT /api/thoughts/[id] - Edit thought content and metadata
 * 
 * This endpoint updates an existing thought with new content and/or metadata.
 * All fields are optional except content - you can update just the text,
 * just the metadata, or both.
 * 
 * Request Body:
 * {
 *   content: string,           // Required: New text content
 *   tags?: string[],           // Optional: Array of tag strings
 *   priority?: string,         // Optional: 'low', 'medium', 'high'
 *   status?: string,           // Optional: 'pending', 'in_progress', 'completed'
 *   aiGenerated?: boolean,     // Optional: Whether AI created this thought
 *   confidence?: number,       // Optional: AI confidence score (0-1)
 *   metadata?: object          // Optional: Additional metadata
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   thought: {
 *     id: number,              // Database ID
 *     content: string,         // Updated text content
 *     section: string,         // Which GAPS section
 *     order: number,           // Position within section
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
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSession()
    // Extract all possible fields from the request body
    const { content, tags, priority, status, aiGenerated, confidence, metadata } = (await request.json()) as ThoughtUpdateRequest
    const thoughtId = parseInt(params.id)
    
    console.log('🎯 PUT /api/thoughts/' + thoughtId + ' called with:', { content, tags, priority, status })
    
    // Allow empty content; no validation here
    
    // Update the thought in the database with all provided fields
    const updatedThought = await updateThought(thoughtId, { 
      content: content ?? '',     // Allow empty content
      tags,                       // Array of tag strings
      priority,                   // Priority level (low/medium/high)
      status,                     // Status (pending/in_progress/completed)
      aiGenerated,                // Whether AI generated this thought
      confidence,                 // AI confidence score (0.0 to 1.0)
      metadata: (metadata as any) // Additional metadata object
    })
    
    console.log('✅ Updated thought:', thoughtId)

    await logActivity({
      action: 'update_thought',
      detail: 'Updated thought content/metadata',
      boardId: undefined,
      userId: undefined,
      entityType: 'thought',
      entityId: updatedThought.id,
      source: 'backend'
    })
    
    // Return the updated thought with all its metadata
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
    console.error('❌ Error updating thought:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/thoughts/[id] - Delete thought
 * 
 * This endpoint permanently removes a thought from the database.
 * When a thought is deleted, the positions of remaining thoughts
 * in the same section are automatically rebalanced to maintain
 * proper ordering.
 * 
 * Request: No body required, just the thought ID in the URL
 * 
 * Response:
 * {
 *   success: true,
 *   message: 'Thought deleted successfully'
 * }
 * 
 * Database Behavior:
 * - Thought is permanently deleted
 * - Remaining thoughts in the same section are repositioned
 * - All relationships and metadata are cleaned up
 * - Activity is logged for audit trail
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSession()
    const thoughtId = parseInt(params.id)
    
    console.log('🎯 DELETE /api/thoughts/' + thoughtId + ' called')
    
    // Delete the thought from the database
    // This function also handles repositioning remaining thoughts
    await deleteThought(thoughtId)
    
    console.log('✅ Deleted thought:', thoughtId)

    await logActivity({
      action: 'delete_thought',
      detail: 'Deleted thought',
      boardId: undefined,
      userId: undefined,
      entityType: 'thought',
      entityId: thoughtId,
      source: 'backend'
    })
    
    return NextResponse.json({
      success: true,
      message: 'Thought deleted successfully'
    })
    
  } catch (error) {
    console.error('❌ Error deleting thought:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 
/**
 * THOUGHT MOVE OPERATION API ROUTE
 * ================================
 * This file handles HTTP requests for moving thoughts between sections
 * and reordering them within sections.
 * 
 * Endpoint: PATCH /api/thoughts/[id]/move
 * Purpose: Move a thought to a different section or position
 * 
 * URL Parameters:
 * - [id] - The database ID of the thought to move
 * 
 * Data Flow:
 * 1. Frontend sends PATCH request with target location
 * 2. API validates the move request
 * 3. Database automatically adjusts positions of all affected thoughts
 * 4. Returns the moved thought with updated position
 * 
 * Key Features:
 * - Automatic position rebalancing for all affected thoughts
 * - Support for both same-section reordering and cross-section moves
 * - Database transaction safety
 * - Maintains data integrity during complex operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { moveThought } from '@/lib/database'

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
    // Extract move parameters from request body
    const { targetSection, targetIndex } = await request.json()
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
    
    // Return the moved thought with all its metadata
    // Note: We map database field names to frontend field names for consistency
    return NextResponse.json({
      success: true,
      thought: {
        id: updatedThought.id,
        content: updatedThought.content,      // API uses 'content' (database field)
        section: updatedThought.section,      // Database and frontend both use 'section'
        order: updatedThought.position || 0,  // Map database 'position' -> frontend 'order'
        
        // Metadata and organization fields
        tags: updatedThought.tags || [],
        priority: updatedThought.priority,
        status: updatedThought.status,
        
        // AI and collaboration fields
        aiGenerated: updatedThought.aiGenerated || false,
        confidence: updatedThought.confidence,
        metadata: updatedThought.metadata,
        
        // Timestamps
        createdAt: updatedThought.createdAt,
        updatedAt: updatedThought.updatedAt
      }
    })
    
  } catch (error) {
    console.error('❌ Error moving thought:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 
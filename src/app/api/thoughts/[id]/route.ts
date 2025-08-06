/**
 * INDIVIDUAL THOUGHT CRUD API ROUTE
 * =================================
 * This file handles HTTP requests for updating and deleting specific thoughts.
 * 
 * Endpoints:
 * - PUT /api/thoughts/[id] - Update an existing thought
 * - DELETE /api/thoughts/[id] - Delete a thought
 * 
 * URL Parameters:
 * - [id] - The database ID of the thought to modify
 * 
 * Data Flow:
 * 1. Frontend sends request with thought ID in URL
 * 2. API validates the request and thought ID
 * 3. Performs database operation (update or delete)
 * 4. Returns success/error response
 * 
 * Key Features:
 * - Full metadata support for updates
 * - Automatic position rebalancing on delete
 * - Database transaction safety
 * - Error handling and validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateThought, deleteThought } from '@/lib/database'

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
    // Extract all possible fields from the request body
    const { content, tags, priority, status, aiGenerated, confidence, metadata } = await request.json()
    const thoughtId = parseInt(params.id)
    
    console.log('🎯 PUT /api/thoughts/' + thoughtId + ' called with:', { content, tags, priority, status })
    
    // Validate required fields
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }
    
    // Update the thought in the database with all provided fields
    const updatedThought = await updateThought(thoughtId, { 
      content,                    // The new text content
      tags,                       // Array of tag strings
      priority,                   // Priority level (low/medium/high)
      status,                     // Status (pending/in_progress/completed)
      aiGenerated,                // Whether AI generated this thought
      confidence,                 // AI confidence score (0.0 to 1.0)
      metadata                    // Additional metadata object
    })
    
    console.log('✅ Updated thought:', thoughtId)
    
    // Return the updated thought with all its metadata
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
    const thoughtId = parseInt(params.id)
    
    console.log('🎯 DELETE /api/thoughts/' + thoughtId + ' called')
    
    // Delete the thought from the database
    // This function also handles repositioning remaining thoughts
    await deleteThought(thoughtId)
    
    console.log('✅ Deleted thought:', thoughtId)
    
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
/**
 * THOUGHTS API ROUTE
 * ==================
 * This file handles HTTP requests for creating new thoughts in the GAPS diagram.
 * 
 * Endpoint: POST /api/thoughts
 * Purpose: Add a new thought/idea to any of the four GAPS sections
 * 
 * Data Flow:
 * 1. Frontend sends POST request with thought data
 * 2. API validates the request data
 * 3. Gets or creates default user/board (temporary until auth is implemented)
 * 4. Creates thought in database with auto-calculated position
 * 5. Returns the created thought with all metadata
 * 
 * Key Features:
 * - Automatic position calculation (appends to end of section)
 * - Full metadata support (tags, priority, status, AI flags)
 * - Error handling and validation
 * - Database transaction safety
 */

import { NextRequest, NextResponse } from 'next/server'
import { createThought, getOrCreateDefaultUser, getOrCreateDefaultBoard } from '@/lib/database'

/**
 * POST /api/thoughts - Add new thought
 * 
 * This endpoint creates a new thought in the specified GAPS section.
 * The thought will be automatically positioned at the end of its section.
 * 
 * Request Body:
 * {
 *   content: string,           // Required: The text content of the thought
 *   section: string,           // Required: 'status', 'goal', 'analysis', or 'plan'
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
 *     content: string,         // The thought text
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
export async function POST(request: NextRequest) {
  try {
    // Extract all possible fields from the request body
    const { content, section, tags, priority, status, aiGenerated, confidence, metadata } = await request.json()
    
    console.log('🎯 POST /api/thoughts called with:', { content, section, tags, priority, status })
    
    // Validate required fields
    if (!content || !section) {
      return NextResponse.json(
        { error: 'Content and section are required' },
        { status: 400 }
      )
    }
    
    // TEMPORARY: Get default user and board (before authentication is implemented)
    // In production, this would get the authenticated user from the session
    const user = await getOrCreateDefaultUser()
    if (!user) {
      throw new Error('Failed to get or create user')
    }
    const board = await getOrCreateDefaultBoard(user.id)
    if (!board) {
      throw new Error('Failed to get or create board')
    }
    
    // Create the thought in the database
    // Note: order is undefined, so createThought will auto-calculate the next position
    const newThought = await createThought({
      content,                    // The actual text content
      section,                    // Which GAPS section (status/goal/analysis/plan)
      boardId: board.id,          // Which board this thought belongs to
      // order: undefined,        // Let createThought calculate the next position automatically
      tags: tags || [],           // Array of tag strings
      priority,                   // Priority level (low/medium/high)
      status: status || 'pending', // Default to 'pending' if not specified
      aiGenerated: aiGenerated || false, // Whether AI generated this thought
      confidence,                 // AI confidence score (0.0 to 1.0)
      metadata: metadata || {}    // Additional metadata object
    })
    
    console.log('✅ Created new thought:', newThought.id)
    
    // Return the created thought with all its metadata
    // Note: We map database field names to frontend field names for consistency
    return NextResponse.json({
      success: true,
      thought: {
        id: newThought.id,
        content: newThought.content,      // API uses 'content' (database field)
        section: newThought.section,      // Database and frontend both use 'section'
        order: newThought.position || 0,  // Map database 'position' -> frontend 'order'
        
        // Metadata and organization fields
        tags: newThought.tags || [],
        priority: newThought.priority,
        status: newThought.status,
        
        // AI and collaboration fields
        aiGenerated: newThought.aiGenerated || false,
        confidence: newThought.confidence,
        metadata: newThought.metadata,
        
        // Timestamps
        createdAt: newThought.createdAt,
        updatedAt: newThought.updatedAt
      }
    })
    
  } catch (error) {
    console.error('❌ Error creating thought:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 

//  QUESTION [What is this page/function even for? I need more context, is this redundant? ]

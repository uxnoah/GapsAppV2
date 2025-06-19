/**
 * API ROUTE: DIAGRAM MANAGEMENT (/api/diagram/route.ts)
 * =====================================================
 * This is the "server" part of our application - it runs on Vercel's servers
 * and handles requests from both our frontend and external services like Chipp.ai
 * 
 * This file handles two main operations:
 * 1. GET requests - Return current diagram data (frontend asking "what's the current state?")
 * 2. PUT requests - Update diagram with new data (Chipp.ai saying "here's new data!")
 * 
 * IMPORTANT CONCEPTS:
 * - This runs in a "serverless" environment (functions that start/stop as needed)
 * - Memory storage only lasts during the function's lifetime
 * - Each request might use a different function instance
 * - We use simple memory storage for this demo (in production, we'd use a database)
 */

// IMPORTS SECTION
// ===============
import { NextRequest, NextResponse } from 'next/server' // Next.js tools for handling HTTP requests
import { GapsDiagram, GapsItem } from '@/lib/types'      // Our custom data types

// =============================================================================
// MEMORY STORAGE SYSTEM
// =============================================================================
// NOTE: This is a simple storage system for our demo. In a real production app,
// we would use a proper database like PostgreSQL, MongoDB, or Redis.

/**
 * GLOBAL MEMORY VARIABLE
 * ======================
 * This variable holds our diagram data in the server's memory.
 * It persists as long as the serverless function stays "warm" (active).
 * When the function goes "cold" (inactive), this data is lost.
 */
let memoryDiagram: GapsDiagram | null = null

/**
 * DEFAULT DIAGRAM TEMPLATE
 * ========================
 * This is the starting point when no diagram exists yet.
 * It creates an empty diagram structure that can be populated.
 */
const defaultDiagram: GapsDiagram = {
  id: 'demo-diagram',        // Fixed ID for our demo
  title: '',                 // Empty title to start
  items: [],                 // No items initially
  createdAt: new Date(),     // Current timestamp
  updatedAt: new Date(),     // Current timestamp
  version: 1                 // Start at version 1
}

/**
 * GET DIAGRAM FROM MEMORY
 * =======================
 * This function retrieves the current diagram from memory.
 * If no diagram exists, it creates a new empty one.
 * Think of this as opening a file - if the file doesn't exist, create a blank one.
 */
const getDiagram = (): GapsDiagram => {
  // Check if we have a diagram in memory
  if (!memoryDiagram) {
    console.log('📀 Initializing new diagram in memory')
    memoryDiagram = { ...defaultDiagram } // Create a copy of the default diagram
  }
  console.log('📀 Loaded diagram from memory:', memoryDiagram.title, 'with', memoryDiagram.items?.length || 0, 'items')
  return memoryDiagram
}

/**
 * SAVE DIAGRAM TO MEMORY
 * ======================
 * This function saves a diagram to memory storage.
 * Think of this as saving a file to disk.
 */
const setDiagram = (diagram: GapsDiagram): void => {
  memoryDiagram = diagram // Store the diagram in our global variable
  console.log('💾 Saved diagram to memory:', diagram.title, 'with', diagram.items.length, 'items')
}

// =============================================================================
// HTTP REQUEST HANDLERS
// =============================================================================
// These functions handle incoming HTTP requests from browsers and external services

/**
 * GET REQUEST HANDLER
 * ===================
 * Handles GET requests to /api/diagram
 * This is called when:
 * - Our frontend wants to load the current diagram
 * - External services want to read the current state
 * 
 * Returns the diagram data in a format that's easy for clients to use
 */
export async function GET() {
  try {
    console.log('🔥 GET /api/diagram called at:', new Date().toISOString())
    
    // Get the current diagram from memory
    const currentDiagram = getDiagram()
    console.log('🔥 Current diagram has', currentDiagram.items.length, 'items')
    
    // FORMAT THE RESPONSE FOR CLIENTS
    // ================================
    // We organize the data by section, making it easy for clients to use
    const response = {
      title: currentDiagram.title,
      // STATUS SECTION - Filter, sort, and extract just the text
      status: currentDiagram.items
        .filter(item => item.section === 'status')  // Keep only status items
        .sort((a, b) => a.order - b.order)          // Sort by order (0, 1, 2...)
        .map(item => item.text),                    // Extract just the text content
      // GOAL SECTION
      goal: currentDiagram.items
        .filter(item => item.section === 'goal')
        .sort((a, b) => a.order - b.order)
        .map(item => item.text),
      // ANALYSIS SECTION
      analysis: currentDiagram.items
        .filter(item => item.section === 'analysis')
        .sort((a, b) => a.order - b.order)
        .map(item => item.text),
      // PLAN SECTION
      plan: currentDiagram.items
        .filter(item => item.section === 'plan')
        .sort((a, b) => a.order - b.order)
        .map(item => item.text)
    }

    console.log('🔥 Returning GET response:', JSON.stringify(response, null, 2))
    return NextResponse.json(response) // Send the data back as JSON
  } catch (error) {
    // If something goes wrong, return an error response
    console.error('🔥 Error fetching diagram:', error)
    return NextResponse.json(
      { error: 'Failed to fetch diagram' },
      { status: 500 } // HTTP status code 500 means "server error"
    )
  }
}

/**
 * PUT REQUEST HANDLER
 * ===================
 * Handles PUT requests to /api/diagram
 * This is called when:
 * - Chipp.ai sends us new diagram data
 * - Our frontend test button sends sample data
 * 
 * PUT requests are used for "update" operations - replacing existing data with new data
 */
export async function PUT(request: NextRequest) {
  try {
    console.log('🔥 PUT /api/diagram called at:', new Date().toISOString())
    console.log('🔥 Request headers:', Object.fromEntries(request.headers.entries()))
    
    // PARSE THE REQUEST BODY
    // ======================
    // The request contains JSON data that we need to extract and parse
    const body = await request.json()
    console.log('🔥 Request body received:', JSON.stringify(body, null, 2))
    
    // DECLARE VARIABLES FOR EXTRACTED DATA
    // ====================================
    // We'll populate these variables based on the format of incoming data
    let title: string
    let status: string[]
    let goal: string[]
    let analysis: string[]
    let plan: string[]

    // HANDLE DIFFERENT DATA FORMATS
    // =============================
    // Chipp.ai sends data in a specific two-parameter format, but we also
    // support a simpler direct format for testing and backward compatibility
    
    // Check for Chipp's format with "current state" (space) and "gap_analysis"
    if ((body['current state'] || body.current_state) && body.gap_analysis) {
      console.log('🔥 Processing Chipp two-parameter format')
      
      // CHIPP FORMAT EXPLANATION:
      // Chipp sends data in two main objects:
      // 1. "current state" - contains title, status, and goal
      // 2. "gap_analysis" - contains analysis and plan
      
      // Handle "current state" (with space) or "current_state" (with underscore)
      const currentStateData = body['current state'] || body.current_state
      const gapAnalysisData = body.gap_analysis
      
      console.log('🔥 Current state data:', currentStateData)
      console.log('🔥 Gap analysis data:', gapAnalysisData)

      // Extract fields from the two-parameter format
      title = currentStateData?.title || ''
      status = Array.isArray(currentStateData?.status) ? currentStateData.status : []
      goal = Array.isArray(currentStateData?.goal) ? currentStateData.goal : []
      analysis = Array.isArray(gapAnalysisData?.analysis) ? gapAnalysisData.analysis : []
      plan = Array.isArray(gapAnalysisData?.plan) ? gapAnalysisData.plan : []
    } else {
      console.log('🔥 Processing old/direct format')
      // DIRECT FORMAT - simpler structure for testing
      // All fields are directly in the main body object
      title = body.title || ''
      status = Array.isArray(body.status) ? body.status : []
      goal = Array.isArray(body.goal) ? body.goal : []
      analysis = Array.isArray(body.analysis) ? body.analysis : []
      plan = Array.isArray(body.plan) ? body.plan : []
    }

    console.log('🔥 Extracted data:')
    console.log('  - title:', title)
    console.log('  - status:', status)
    console.log('  - goal:', goal)
    console.log('  - analysis:', analysis)
    console.log('  - plan:', plan)

    // CONVERT ARRAYS TO GAPS ITEMS
    // ============================
    // We need to convert the simple string arrays into proper GapsItem objects
    // with IDs, timestamps, and metadata
    const newItems: GapsItem[] = []
    let idCounter = 1 // Counter to ensure unique IDs

    // PROCESS STATUS ITEMS
    // Each item in the status array becomes a GapsItem
    status.forEach((text: string, index: number) => {
      if (typeof text === 'string' && text.trim()) { // Only add non-empty strings
        newItems.push({
          id: `status-${idCounter++}`,    // Unique ID like "status-1", "status-2"
          text: text.trim(),              // Clean up whitespace
          section: 'status',              // Mark as status section
          order: index,                   // Position in the list (0, 1, 2...)
          createdAt: new Date(),          // Current timestamp
          updatedAt: new Date()           // Current timestamp
        })
      }
    })

    // PROCESS GOAL ITEMS (same pattern as status)
    goal.forEach((text: string, index: number) => {
      if (typeof text === 'string' && text.trim()) {
        newItems.push({
          id: `goal-${idCounter++}`,
          text: text.trim(),
          section: 'goal',
          order: index,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    })

    // PROCESS ANALYSIS ITEMS (same pattern)
    analysis.forEach((text: string, index: number) => {
      if (typeof text === 'string' && text.trim()) {
        newItems.push({
          id: `analysis-${idCounter++}`,
          text: text.trim(),
          section: 'analysis',
          order: index,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    })

    // PROCESS PLAN ITEMS (same pattern)
    plan.forEach((text: string, index: number) => {
      if (typeof text === 'string' && text.trim()) {
        newItems.push({
          id: `plan-${idCounter++}`,
          text: text.trim(),
          section: 'plan',
          order: index,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    })

    console.log('🔥 Generated', newItems.length, 'items:', newItems.map(i => `${i.section}: ${i.text}`))

    // UPDATE THE DIAGRAM
    // ==================
    // Load the current diagram, update it with new data, and save it back
    const currentDiagram = getDiagram()
    const updatedDiagram = {
      ...currentDiagram,              // Keep existing properties (id, createdAt, etc.)
      title: title.trim(),            // Update title
      items: newItems,                // Replace all items with new ones
      updatedAt: new Date(),          // Update the timestamp
      version: currentDiagram.version + 1  // Increment version number
    }

    // Save the updated diagram to memory
    setDiagram(updatedDiagram)
    
    console.log('🔥 Updated diagram. New version:', updatedDiagram.version)
    console.log('🔥 Current diagram now has', updatedDiagram.items.length, 'items')

    // PREPARE SUCCESS RESPONSE
    // ========================
    // Send back confirmation that the update worked, along with the new data
    // This response helps clients know the update was successful and shows the final data
    const response = {
      success: true,                           // Indicates the operation succeeded
      message: 'Diagram updated successfully', // Human-readable success message
      diagram: {
        title: updatedDiagram.title,
        // Extract text arrays for each section (same format as GET response)
        status: newItems.filter(item => item.section === 'status').map(item => item.text),
        goal: newItems.filter(item => item.section === 'goal').map(item => item.text),
        analysis: newItems.filter(item => item.section === 'analysis').map(item => item.text),
        plan: newItems.filter(item => item.section === 'plan').map(item => item.text)
      }
    }

    console.log('🔥 Returning response:', JSON.stringify(response, null, 2))
    return NextResponse.json(response) // Send the success response back to the client
  } catch (error) {
    // ERROR HANDLING
    // ==============
    // If anything goes wrong during the update process, we catch the error
    // and return a proper error response instead of crashing
    console.error('🔥 ERROR updating diagram:', error)
    return NextResponse.json(
      { error: 'Failed to update diagram' },  // Error message for the client
      { status: 500 }                         // HTTP status code 500 = server error
    )
  }
} 
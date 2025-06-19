import { NextRequest, NextResponse } from 'next/server'
import { GapsDiagram, GapsItem } from '@/lib/types'

// Simple in-memory store - works fine for our needs
let currentDiagram: GapsDiagram = {
  id: 'demo-diagram',
  title: '',
  items: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  version: 1
}

// GET /api/diagram - Returns current diagram state
export async function GET() {
  try {
    // Format the response for Chipp AI
    const response = {
      title: currentDiagram.title,
      status: currentDiagram.items
        .filter(item => item.section === 'status')
        .sort((a, b) => a.order - b.order)
        .map(item => item.text),
      goal: currentDiagram.items
        .filter(item => item.section === 'goal')
        .sort((a, b) => a.order - b.order)
        .map(item => item.text),
      analysis: currentDiagram.items
        .filter(item => item.section === 'analysis')
        .sort((a, b) => a.order - b.order)
        .map(item => item.text),
      plan: currentDiagram.items
        .filter(item => item.section === 'plan')
        .sort((a, b) => a.order - b.order)
        .map(item => item.text)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching diagram:', error)
    return NextResponse.json(
      { error: 'Failed to fetch diagram' },
      { status: 500 }
    )
  }
}

// PUT /api/diagram - Updates diagram with new state from Chipp AI
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Support both old format and new two-parameter format
    let title: string
    let status: string[]
    let goal: string[]
    let analysis: string[]
    let plan: string[]

    // Check if this is the new two-parameter format
    if (body.current_state && body.gap_analysis) {
      // New format: two parameters from Chipp
      const { current_state, gap_analysis } = body
      
      // Parse current_state (can be string or object)
      let currentStateData
      if (typeof current_state === 'string') {
        try {
          currentStateData = JSON.parse(current_state)
        } catch {
          return NextResponse.json(
            { error: 'Invalid current_state format. Must be valid JSON.' },
            { status: 400 }
          )
        }
      } else {
        currentStateData = current_state
      }

      // Parse gap_analysis (can be string or object)
      let gapAnalysisData
      if (typeof gap_analysis === 'string') {
        try {
          gapAnalysisData = JSON.parse(gap_analysis)
        } catch {
          return NextResponse.json(
            { error: 'Invalid gap_analysis format. Must be valid JSON.' },
            { status: 400 }
          )
        }
      } else {
        gapAnalysisData = gap_analysis
      }

      // Extract fields from parsed data
      title = currentStateData?.title || ''
      status = Array.isArray(currentStateData?.status) ? currentStateData.status : []
      goal = Array.isArray(currentStateData?.goal) ? currentStateData.goal : []
      analysis = Array.isArray(gapAnalysisData?.analysis) ? gapAnalysisData.analysis : []
      plan = Array.isArray(gapAnalysisData?.plan) ? gapAnalysisData.plan : []
    } else {
      // Old format: direct fields (for backward compatibility)
      title = body.title || ''
      status = Array.isArray(body.status) ? body.status : []
      goal = Array.isArray(body.goal) ? body.goal : []
      analysis = Array.isArray(body.analysis) ? body.analysis : []
      plan = Array.isArray(body.plan) ? body.plan : []
    }

    // Generate new items with proper IDs and metadata
    const newItems: GapsItem[] = []
    let idCounter = 1

    // Add status items (can be 0 or more)
    status.forEach((text: string, index: number) => {
      if (typeof text === 'string' && text.trim()) {
        newItems.push({
          id: `status-${idCounter++}`,
          text: text.trim(),
          section: 'status',
          order: index,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    })

    // Add goal items (can be 0 or more)
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

    // Add analysis items (can be 0 or more)
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

    // Add plan items (can be 0 or more)
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

    // Update the diagram
    const updatedDiagram = {
      ...currentDiagram,
      title: title.trim(),
      items: newItems,
      updatedAt: new Date(),
      version: currentDiagram.version + 1
    }

    currentDiagram = updatedDiagram

    return NextResponse.json({
      success: true,
      message: 'Diagram updated successfully',
      diagram: {
        title: updatedDiagram.title,
        status: newItems.filter(item => item.section === 'status').map(item => item.text),
        goal: newItems.filter(item => item.section === 'goal').map(item => item.text),
        analysis: newItems.filter(item => item.section === 'analysis').map(item => item.text),
        plan: newItems.filter(item => item.section === 'plan').map(item => item.text)
      }
    })
  } catch (error) {
    console.error('Error updating diagram:', error)
    return NextResponse.json(
      { error: 'Failed to update diagram' },
      { status: 500 }
    )
  }
} 
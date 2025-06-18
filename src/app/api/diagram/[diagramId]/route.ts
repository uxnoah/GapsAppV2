import { NextRequest, NextResponse } from 'next/server'
import { GapsDiagram, GapsItem } from '@/lib/types'

// In a real app, this would be stored in a database with user authentication
// For now, we'll use a Map to store multiple diagrams by ID
const diagrams = new Map<string, GapsDiagram>()

// Initialize with a default diagram
const defaultDiagram: GapsDiagram = {
  id: 'demo-diagram',
  title: 'GAPS Diagram',
  items: [
    { id: '1', text: 'In progress', section: 'status', order: 0, createdAt: new Date(), updatedAt: new Date() },
    { id: '2', text: 'On track', section: 'status', order: 1, createdAt: new Date(), updatedAt: new Date() },
    { id: '3', text: 'Finish project', section: 'goal', order: 0, createdAt: new Date(), updatedAt: new Date() },
    { id: '4', text: 'Learn new skills', section: 'goal', order: 1, createdAt: new Date(), updatedAt: new Date() },
    { id: '5', text: 'Need better time management', section: 'analysis', order: 0, createdAt: new Date(), updatedAt: new Date() },
    { id: '6', text: 'Good team collaboration', section: 'analysis', order: 1, createdAt: new Date(), updatedAt: new Date() },
    { id: '7', text: 'Work 2 hours daily', section: 'plan', order: 0, createdAt: new Date(), updatedAt: new Date() },
    { id: '8', text: 'Weekly reviews', section: 'plan', order: 1, createdAt: new Date(), updatedAt: new Date() },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  version: 1
}

// Set default diagram
diagrams.set('demo-diagram', defaultDiagram)

// GET /api/diagram/[diagramId] - Returns specific diagram state
export async function GET(
  request: NextRequest,
  { params }: { params: { diagramId: string } }
) {
  try {
    const diagramId = params.diagramId
    const diagram = diagrams.get(diagramId)
    
    if (!diagram) {
      return NextResponse.json(
        { error: 'Diagram not found' },
        { status: 404 }
      )
    }

    // Format the response for Chipp AI
    const response = {
      id: diagram.id,
      title: diagram.title,
      status: diagram.items
        .filter(item => item.section === 'status')
        .sort((a, b) => a.order - b.order)
        .map(item => item.text),
      goal: diagram.items
        .filter(item => item.section === 'goal')
        .sort((a, b) => a.order - b.order)
        .map(item => item.text),
      analysis: diagram.items
        .filter(item => item.section === 'analysis')
        .sort((a, b) => a.order - b.order)
        .map(item => item.text),
      plan: diagram.items
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

// PUT /api/diagram/[diagramId] - Updates specific diagram with new state from Chipp AI
export async function PUT(
  request: NextRequest,
  { params }: { params: { diagramId: string } }
) {
  try {
    const diagramId = params.diagramId
    const existingDiagram = diagrams.get(diagramId)
    
    if (!existingDiagram) {
      return NextResponse.json(
        { error: 'Diagram not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { title, status, goal, analysis, plan } = body

    // Validate required fields
    if (!title || !Array.isArray(status) || !Array.isArray(goal) || 
        !Array.isArray(analysis) || !Array.isArray(plan)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected title (string) and status, goal, analysis, plan (arrays)' },
        { status: 400 }
      )
    }

    // Generate new items with proper IDs and metadata
    const newItems: GapsItem[] = []
    let idCounter = 1

    // Add status items
    status.forEach((text: string, index: number) => {
      if (text.trim()) {
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

    // Add goal items
    goal.forEach((text: string, index: number) => {
      if (text.trim()) {
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

    // Add analysis items
    analysis.forEach((text: string, index: number) => {
      if (text.trim()) {
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

    // Add plan items
    plan.forEach((text: string, index: number) => {
      if (text.trim()) {
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

    // Update the specific diagram
    const updatedDiagram = {
      ...existingDiagram,
      title: title.trim(),
      items: newItems,
      updatedAt: new Date(),
      version: existingDiagram.version + 1
    }
    
    diagrams.set(diagramId, updatedDiagram)

    return NextResponse.json({
      success: true,
      message: 'Diagram updated successfully',
      diagram: {
        id: diagramId,
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
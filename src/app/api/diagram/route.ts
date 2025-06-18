import { NextRequest, NextResponse } from 'next/server'
import { GapsDiagram, GapsItem } from '@/lib/types'

// In a real app, this would be stored in a database
// For now, we'll use a simple in-memory store
let currentDiagram: GapsDiagram = {
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

    // Update the diagram
    currentDiagram = {
      ...currentDiagram,
      title: title.trim(),
      items: newItems,
      updatedAt: new Date(),
      version: currentDiagram.version + 1
    }

    return NextResponse.json({
      success: true,
      message: 'Diagram updated successfully',
      diagram: {
        title: currentDiagram.title,
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
import { NextRequest, NextResponse } from 'next/server'
import { GapsDiagram, GapsItem } from '@/lib/types'
import { kv } from '@vercel/kv'

const DIAGRAM_KEY = 'current-diagram'

// Default diagram structure
const defaultDiagram: GapsDiagram = {
  id: 'demo-diagram',
  title: '',
  items: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  version: 1
}

// Load diagram from database
const loadDiagram = async (): Promise<GapsDiagram> => {
  try {
    const stored = await kv.get(DIAGRAM_KEY)
    if (stored) {
      console.log('📀 Loaded diagram from database:', (stored as any).title, 'with', (stored as any).items?.length || 0, 'items')
      return {
        ...(stored as GapsDiagram),
        createdAt: new Date((stored as any).createdAt),
        updatedAt: new Date((stored as any).updatedAt)
      }
    }
  } catch (error) {
    console.error('📀 Error loading from database:', error)
  }
  
  console.log('📀 Using default empty diagram')
  return defaultDiagram
}

// Save diagram to database
const saveDiagram = async (diagram: GapsDiagram): Promise<void> => {
  try {
    await kv.set(DIAGRAM_KEY, diagram)
    console.log('💾 Saved diagram to database:', diagram.title, 'with', diagram.items.length, 'items')
  } catch (error) {
    console.error('💾 Error saving to database:', error)
  }
}

// GET /api/diagram - Returns current diagram state
export async function GET() {
  try {
    console.log('🔥 GET /api/diagram called at:', new Date().toISOString())
    
    const currentDiagram = await loadDiagram()
    console.log('🔥 Current diagram has', currentDiagram.items.length, 'items')
    
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

    console.log('🔥 Returning GET response:', JSON.stringify(response, null, 2))
    return NextResponse.json(response)
  } catch (error) {
    console.error('🔥 Error fetching diagram:', error)
    return NextResponse.json(
      { error: 'Failed to fetch diagram' },
      { status: 500 }
    )
  }
}

// PUT /api/diagram - Updates diagram with new state from Chipp AI
export async function PUT(request: NextRequest) {
  try {
    console.log('🔥 PUT /api/diagram called at:', new Date().toISOString())
    console.log('🔥 Request headers:', Object.fromEntries(request.headers.entries()))
    
    const body = await request.json()
    console.log('🔥 Request body received:', JSON.stringify(body, null, 2))
    
    // Support multiple formats from Chipp
    let title: string
    let status: string[]
    let goal: string[]
    let analysis: string[]
    let plan: string[]

    // Check for Chipp's format with "current state" (space) and "gap_analysis"
    if ((body['current state'] || body.current_state) && body.gap_analysis) {
      console.log('🔥 Processing Chipp two-parameter format')
      
      // Handle "current state" (with space) or "current_state" (with underscore)
      const currentStateData = body['current state'] || body.current_state
      const gapAnalysisData = body.gap_analysis
      
      console.log('🔥 Current state data:', currentStateData)
      console.log('🔥 Gap analysis data:', gapAnalysisData)

      // Extract fields from parsed data
      title = currentStateData?.title || ''
      status = Array.isArray(currentStateData?.status) ? currentStateData.status : []
      goal = Array.isArray(currentStateData?.goal) ? currentStateData.goal : []
      analysis = Array.isArray(gapAnalysisData?.analysis) ? gapAnalysisData.analysis : []
      plan = Array.isArray(gapAnalysisData?.plan) ? gapAnalysisData.plan : []
    } else {
      console.log('🔥 Processing old/direct format')
      // Old format: direct fields (for backward compatibility)
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

    console.log('🔥 Generated', newItems.length, 'items:', newItems.map(i => `${i.section}: ${i.text}`))

    // Load current diagram and update it
    const currentDiagram = await loadDiagram()
    const updatedDiagram = {
      ...currentDiagram,
      title: title.trim(),
      items: newItems,
      updatedAt: new Date(),
      version: currentDiagram.version + 1
    }

    // Save to database
    await saveDiagram(updatedDiagram)
    
    console.log('🔥 Updated diagram. New version:', updatedDiagram.version)
    console.log('🔥 Current diagram now has', updatedDiagram.items.length, 'items')

    const response = {
      success: true,
      message: 'Diagram updated successfully',
      diagram: {
        title: updatedDiagram.title,
        status: newItems.filter(item => item.section === 'status').map(item => item.text),
        goal: newItems.filter(item => item.section === 'goal').map(item => item.text),
        analysis: newItems.filter(item => item.section === 'analysis').map(item => item.text),
        plan: newItems.filter(item => item.section === 'plan').map(item => item.text)
      }
    }

    console.log('🔥 Returning response:', JSON.stringify(response, null, 2))
    return NextResponse.json(response)
  } catch (error) {
    console.error('🔥 ERROR updating diagram:', error)
    return NextResponse.json(
      { error: 'Failed to update diagram' },
      { status: 500 }
    )
  }
} 
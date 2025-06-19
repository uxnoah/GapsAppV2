import { NextRequest, NextResponse } from 'next/server'
import { GapsDiagram, GapsItem } from '@/lib/types'

// Global state that persists across requests in the same instance
// In serverless, this will reset on cold starts, but it's better than nothing
global.diagramState = global.diagramState || null

function getDiagram(): GapsDiagram {
  if (!global.diagramState) {
    console.log('🚀 Creating new diagram state (cold start)')
    global.diagramState = {
      id: 'demo-diagram',
      title: '',
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    }
  }
  return global.diagramState
}

function setDiagram(diagram: GapsDiagram): void {
  global.diagramState = diagram
  console.log('💾 Updated diagram state:', {
    title: diagram.title,
    itemCount: diagram.items.length,
    version: diagram.version
  })
}

// GET /api/diagram - Returns current diagram state
export async function GET() {
  try {
    const diagram = getDiagram()
    console.log('📖 GET request - Current diagram state:', {
      title: diagram.title,
      itemCount: diagram.items.length,
      version: diagram.version
    })
    
    // Format the response for Chipp AI
    const response = {
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

// PUT /api/diagram - Updates diagram with new state from Chipp AI
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔍 PUT request received - Raw body:', JSON.stringify(body, null, 2))
    
    // Support both old format and new two-parameter format
    let title: string
    let status: string[]
    let goal: string[]
    let analysis: string[]
    let plan: string[]

    // Check if this is the new two-parameter format
    if (body.current_state && body.gap_analysis) {
      console.log('📦 Using NEW two-parameter format')
      // New format: two parameters from Chipp
      const { current_state, gap_analysis } = body
      
      console.log('📊 current_state:', JSON.stringify(current_state, null, 2))
      console.log('📈 gap_analysis:', JSON.stringify(gap_analysis, null, 2))
      
      // Parse current_state (can be string or object)
      let currentStateData
      if (typeof current_state === 'string') {
        try {
          currentStateData = JSON.parse(current_state)
          console.log('✅ Parsed current_state from string:', currentStateData)
        } catch {
          console.error('❌ Failed to parse current_state as JSON')
          return NextResponse.json(
            { error: 'Invalid current_state format. Must be valid JSON.' },
            { status: 400 }
          )
        }
      } else {
        currentStateData = current_state
        console.log('✅ Using current_state as object:', currentStateData)
      }

      // Parse gap_analysis (can be string or object)
      let gapAnalysisData
      if (typeof gap_analysis === 'string') {
        try {
          gapAnalysisData = JSON.parse(gap_analysis)
          console.log('✅ Parsed gap_analysis from string:', gapAnalysisData)
        } catch {
          console.error('❌ Failed to parse gap_analysis as JSON')
          return NextResponse.json(
            { error: 'Invalid gap_analysis format. Must be valid JSON.' },
            { status: 400 }
          )
        }
      } else {
        gapAnalysisData = gap_analysis
        console.log('✅ Using gap_analysis as object:', gapAnalysisData)
      }

      // Extract fields from parsed data
      title = currentStateData?.title || 'GAPS Diagram'
      status = Array.isArray(currentStateData?.status) ? currentStateData.status : []
      goal = Array.isArray(currentStateData?.goal) ? currentStateData.goal : []
      analysis = Array.isArray(gapAnalysisData?.analysis) ? gapAnalysisData.analysis : []
      plan = Array.isArray(gapAnalysisData?.plan) ? gapAnalysisData.plan : []
    } else {
      console.log('📦 Using OLD direct fields format')
      // Old format: direct fields (for backward compatibility)
      title = body.title || 'GAPS Diagram'
      status = Array.isArray(body.status) ? body.status : []
      goal = Array.isArray(body.goal) ? body.goal : []
      analysis = Array.isArray(body.analysis) ? body.analysis : []
      plan = Array.isArray(body.plan) ? body.plan : []
    }

    console.log('🎯 Final extracted data:', {
      title,
      status,
      goal,
      analysis,
      plan
    })

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
      ...getDiagram(),
      title: title.trim(),
      items: newItems,
      updatedAt: new Date(),
      version: getDiagram().version + 1
    }

    setDiagram(updatedDiagram)

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
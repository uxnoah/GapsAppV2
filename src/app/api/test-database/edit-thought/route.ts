import { NextRequest, NextResponse } from 'next/server'
import { editThought } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { thoughtId, content, priority, status, tags, aiGenerated, confidence } = await request.json()
    
    const thought = await editThought(thoughtId, {
      content,
      priority,
      status,
      tags,
      aiGenerated,
      confidence,
    })
    
    return NextResponse.json({
      success: true,
      thought,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 
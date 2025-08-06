import { NextRequest, NextResponse } from 'next/server'
import { moveThought } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { thoughtId, section, position, boardId } = await request.json()
    
    const thought = await moveThought(thoughtId, section, position)
    
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
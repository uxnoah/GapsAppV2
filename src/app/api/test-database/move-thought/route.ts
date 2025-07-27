import { NextRequest, NextResponse } from 'next/server'
import { moveThought } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { thoughtId, quadrant, position, boardId } = await request.json()
    
    const thought = await moveThought(thoughtId, {
      quadrant,
      position,
      boardId,
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
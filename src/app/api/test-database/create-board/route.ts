import { NextRequest, NextResponse } from 'next/server'
import { createBoard } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { userId, title, description } = await request.json()
    
    const board = await createBoard({
      userId,
      title,
      description,
    })
    
    return NextResponse.json({
      success: true,
      board,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
} 
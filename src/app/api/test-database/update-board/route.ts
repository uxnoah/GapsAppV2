import { NextRequest, NextResponse } from 'next/server'
import { updateBoard } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { boardId, title, description, isPublic, isTemplate } = await request.json()
    
    const board = await updateBoard(boardId, {
      title,
      description,
      isPublic,
      isTemplate,
    })
    
    return NextResponse.json({
      success: true,
      board,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { getBoardById } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const boardId = parseInt(params.id)
    
    const board = await getBoardById(boardId)
    
    if (!board) {
      return NextResponse.json(
        { success: false, error: 'Board not found' },
        { status: 404 }
      )
    }
    
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
import { NextRequest, NextResponse } from 'next/server'
import { logActivityToBoard } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { boardId, userId, action, detail } = await request.json()
    
    const activity = await logActivityToBoard({
      boardId,
      userId,
      action,
      detail,
    })
    
    return NextResponse.json({
      success: true,
      activity,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 
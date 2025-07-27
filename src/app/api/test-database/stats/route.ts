import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET() {
  try {
    const [users, boards, thoughts, activities] = await Promise.all([
      prisma.user.count(),
      prisma.board.count(),
      prisma.thought.count(),
      prisma.activityLog.count(),
    ])
    
    return NextResponse.json({
      success: true,
      stats: {
        users,
        boards,
        thoughts,
        activities,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 
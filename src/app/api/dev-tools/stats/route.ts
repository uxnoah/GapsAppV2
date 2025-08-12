import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { requireSession } from '@/lib/auth'

export async function GET() {
  try {
    await requireSession()
    const [users, boards, thoughts, activities] = await Promise.all([
      prisma.user.count(),
      prisma.board.count(),
      prisma.thought.count(),
      prisma.activityLog.count(),
    ])
    return NextResponse.json({ stats: { users, boards, thoughts, activities } })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}



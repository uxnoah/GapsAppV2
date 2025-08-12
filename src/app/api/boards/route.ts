import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { createBoard, getUserBoards } from '@/lib/database'

// GET /api/boards → list current user's boards (id, title, counts)
export async function GET() {
  try {
    const session = await requireSession()
    const boards = await getUserBoards(session.userId)
    return NextResponse.json({ boards })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: (error as any)?.status || 500 }
    )
  }
}

// POST /api/boards → create a new board with title
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession()
    const { title } = await request.json()
    const board = await createBoard({ title: String(title || 'New Diagram'), userId: session.userId })
    return NextResponse.json({ board })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: (error as any)?.status || 500 }
    )
  }
}



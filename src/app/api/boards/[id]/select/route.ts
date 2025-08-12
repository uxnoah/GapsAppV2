import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { setCurrentBoardForUser } from '@/lib/database'

// POST /api/boards/:id/select → set as current board for the user
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession()
    const boardId = Number(params.id)
    await setCurrentBoardForUser(session.userId, boardId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: (error as any)?.status || 500 }
    )
  }
}



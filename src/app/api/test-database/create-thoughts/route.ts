import { NextRequest, NextResponse } from 'next/server'
import { createThought } from '@/lib/database'
import type { Section } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const { boardId, thoughts } = await request.json()
    
    const createdThoughts = await Promise.all(
      (thoughts as Array<{ content: string; section: Section }>).map((thought) =>
        createThought({
          content: thought.content,
          section: thought.section,
          boardId,
        })
      )
    )
    
    return NextResponse.json({
      success: true,
      thoughts: createdThoughts,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 
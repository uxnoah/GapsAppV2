import { NextRequest, NextResponse } from 'next/server'
import { createThought } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { boardId, thoughts } = await request.json()
    
    const createdThoughts = await Promise.all(
      thoughts.map((thought: any) => 
        createThought({
          content: thought.content,
          quadrant: thought.quadrant,
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
      { success: false, error: error.message },
      { status: 500 }
    )
  }
} 
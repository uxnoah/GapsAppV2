import { NextResponse } from 'next/server'
import { 
  getUserByEmail, 
  createUser, 
  getUserBoards, 
  createBoard, 
  getBoardById
} from '@/lib/database'
import bcrypt from 'bcryptjs'

const DEFAULT_USER_EMAIL = 'demo@chapp.local'
const DEFAULT_BOARD_TITLE = 'My GAPS Diagram'

// Same logic as diagram API to get the actual board being used
async function getOrCreateDefaultUser() {
  try {
    let user = await getUserByEmail(DEFAULT_USER_EMAIL)
    
    if (!user) {
      const hashedPassword = await bcrypt.hash('demo-password', 10)
      user = await createUser({
        username: 'demo-user',
        email: DEFAULT_USER_EMAIL,
        passwordHash: hashedPassword,
        isAdmin: false
      })
    }
    
    return user
  } catch (error) {
    console.error('Error with default user:', error)
    throw error
  }
}

async function getOrCreateDefaultBoard(userId: number) {
  try {
    const boards = await getUserBoards(userId)
    
    if (boards.length === 0) {
      return await createBoard({
        title: DEFAULT_BOARD_TITLE,
        userId: userId,
        description: 'Default GAPS diagram board'
      })
    }
    
    return await getBoardById(boards[0].id)
  } catch (error) {
    console.error('Error with default board:', error)
    throw error
  }
}

export async function GET() {
  try {
    // Use the exact same logic as the main diagram API
    const user = await getOrCreateDefaultUser()
    const board = await getOrCreateDefaultBoard(user.id)

    return NextResponse.json({
      success: true,
      board: board
    })
  } catch (error) {
    console.error('Error getting current board:', error)
    return NextResponse.json(
      { error: 'Failed to get current board', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 
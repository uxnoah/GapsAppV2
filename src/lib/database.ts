/**
 * DATABASE UTILITY MODULE
 * =======================
 * This module provides a centralized way to access the database using Prisma.
 * It includes connection management, helper functions, and type-safe operations.
 */

// =============================================================================
// MY COMMENTS & QUESTIONS
// =============================================================================

// Add your comments here using the prefixes:
// 🧠 MY THOUGHTS: [Your understanding or interpretation]
// ❓ QUESTION: [Your questions about the code]
// 💡 IDEA: [Your suggestions or improvements]
// 🔧 TODO: [Things you want to change or add]
// 🐛 BUG: [Issues you've found]
// 📝 NOTE: [Important things to remember]

import { PrismaClient } from '../../generated/prisma'

// Global variable to hold the Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined
}

/**
 * Singleton Prisma Client
 * =======================
 * In development, we create a new client each time due to hot reloading.
 * In production, we reuse the same client instance for performance.
 */
const prisma = globalThis.__prisma ?? new PrismaClient()

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

export { prisma }




/**
 * Database Helper Functions
 * ========================
 */

// User Management
export async function createUser(data: {
  username: string
  email: string
  passwordHash: string
  isAdmin?: boolean
}) {
  return await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      passwordHash: data.passwordHash,
      isAdmin: data.isAdmin || false,
    },
  })
}

export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
    include: { boards: true },
  })
}

export async function getUserById(id: number) {
  return await prisma.user.findUnique({
    where: { id },
    include: { boards: true },
  })
}

export async function updateUser(id: number, data: {
  username?: string
  email?: string
  displayName?: string
  avatarUrl?: string
  preferences?: any
}) {
  return await prisma.user.update({
    where: { id },
    data,
    select: { 
      id: true, 
      username: true, 
      email: true, 
      displayName: true,
      avatarUrl: true,
      isAdmin: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function deleteUser(id: number) {
  // This will cascade delete all user's boards, thoughts, etc.
  return await prisma.user.delete({
    where: { id },
  })
}


// 🔧 TODO: [Function below should we have a way to data to the board. It's certainly want to be able to have a title. User ID would be presumably randomly created. Description, yeah, I either provide that or maybe not. It might be kids were like I don't know. Duplicate a border right so then you'd want to copy all of it. Or maybe your importing the board so I think we want to have that. Some part of this function where you can actually include the thoughts and I just can't tell if that's being done]
// Board Management
export async function createBoard(data: {
  title: string
  userId: number
  description?: string
}) {
  return await prisma.board.create({
    data: {
      title: data.title,
      userId: data.userId,
      description: data.description,
    },
    include: {
      thoughts: true,
      user: {
        select: { id: true, username: true, email: true },
      },
    },
  })
}

export async function getBoardById(id: number, userId?: number) {
  const where: any = { id }
  
  // If userId is provided, ensure user can only access their own boards
  if (userId) {
    where.userId = userId
  }
  

  // QUESITON: [What's happened below here?]
  return await prisma.board.findUnique({
    where,
    include: {
      thoughts: {
        orderBy: [
          { section: 'asc' },
          { position: 'asc' },
          { createdAt: 'asc' },
        ],
      },
      user: {
        select: { id: true, username: true, email: true },
      },
      _count: {
        select: { thoughts: true, workSessions: true },
      },
    },
  })
}

export async function getUserBoards(userId: number) {
  return await prisma.board.findMany({
    where: { userId },
    include: {
      _count: {
        select: { thoughts: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

// 📝 NOTE: [This function updates board metadata (title, description, etc.) but not thoughts. Thoughts are updated separately using thought-specific functions.]


export async function updateBoard(id: number, data: {
  title?: string
  description?: string
  isPublic?: boolean
  isTemplate?: boolean
}) {
  return await prisma.board.update({
    where: { id },
    data,
    include: {
      thoughts: true,
      user: {
        select: { id: true, username: true, email: true },
      },
    },
  })
}

export async function deleteBoard(id: number, userId: number) {
  // Ensure user can only delete their own boards
  return await prisma.board.delete({
    where: { 
      id,
      userId, // This ensures data isolation
    },
  })
}

// Thought Management
export async function createThought(data: {
  content: string
  section: string
  boardId: number
  order?: number  // maps to position in DB
  tags?: string[]
  priority?: string
  status?: string
  aiGenerated?: boolean
  confidence?: number
  metadata?: any
}) {
  // Get the next position if not provided
  let position = data.order
  if (position === undefined) {
    // Count existing thoughts in this section to get the next position
    const thoughtCount = await prisma.thought.count({
      where: { 
        boardId: data.boardId, 
        section: data.section
      }
    })
    position = thoughtCount // 0-based positioning: 0, 1, 2, etc.
  }

  return await prisma.thought.create({
    data: {
      content: data.content,
      section: data.section,
      boardId: data.boardId,
      position: position,      // order -> position
      tags: data.tags,
      priority: data.priority,
      status: data.status,
      aiGenerated: data.aiGenerated || false,
      confidence: data.confidence,
      metadata: data.metadata,
    },
  })
}

export async function updateThought(id: number, data: {
  content?: string
  section?: string
  position?: number
  tags?: string[]
  priority?: string
  status?: string
  aiGenerated?: boolean
  confidence?: number
  metadata?: any
}) {
  return await prisma.thought.update({
    where: { id },
    data,
  })
}

export async function deleteThought(id: number) {
  return await prisma.$transaction(async (tx) => {
    // Get the thought to be deleted
    const thoughtToDelete = await tx.thought.findUnique({
      where: { id },
      select: { section: true, position: true, boardId: true }
    })
    
    if (!thoughtToDelete) {
      throw new Error(`Thought with id ${id} not found`)
    }
    
    // Delete the thought
    const deletedThought = await tx.thought.delete({
      where: { id },
    })
    
    // Shift remaining thoughts in the same section up to fill the gap
    if (thoughtToDelete.position !== null) {
      await tx.thought.updateMany({
        where: {
          boardId: thoughtToDelete.boardId,
          section: thoughtToDelete.section,
          position: { gt: thoughtToDelete.position }
        },
        data: { position: { decrement: 1 } }
      })
    }
    
    return deletedThought
  })
}

export async function moveThought(id: number, targetSection: string, targetIndex: number) {
  return await prisma.$transaction(async (tx) => {
    // Get the current thought
    const currentThought = await tx.thought.findUnique({
      where: { id },
      select: { section: true, position: true, boardId: true }
    })
    
    if (!currentThought) {
      throw new Error(`Thought with id ${id} not found`)
    }
    
    const { section: sourceSection, position: sourceIndex, boardId } = currentThought
    
    // If moving within the same section
    if (sourceSection === targetSection && sourceIndex !== null) {
      // Reorder within same section
      if (sourceIndex < targetIndex) {
        // Moving down: shift items up
        await tx.thought.updateMany({
          where: {
            boardId,
            section: targetSection,
            position: { gt: sourceIndex, lte: targetIndex }
          },
          data: { position: { decrement: 1 } }
        })
      } else if (sourceIndex > targetIndex) {
        // Moving up: shift items down
        await tx.thought.updateMany({
          where: {
            boardId,
            section: targetSection,
            position: { gte: targetIndex, lt: sourceIndex }
          },
          data: { position: { increment: 1 } }
        })
      }
    } else {
      // Moving between sections
      
      // Shift items in source section up to fill the gap
      if (sourceIndex !== null) {
        await tx.thought.updateMany({
          where: {
            boardId,
            section: sourceSection,
            position: { gt: sourceIndex }
          },
          data: { position: { decrement: 1 } }
        })
      }
      
      // Shift items in target section down to make space
      await tx.thought.updateMany({
        where: {
          boardId,
          section: targetSection,
          position: { gte: targetIndex }
        },
        data: { position: { increment: 1 } }
      })
    }
    
    // Update the moved thought
    return await tx.thought.update({
      where: { id },
      data: {
        section: targetSection,
        position: targetIndex,
      },
    })
  })
}

export async function reorderThoughts(boardId: number, section: string, thoughtOrders: { id: number, position: number }[]) {
  // Update multiple thoughts' positions in a single transaction
  return await prisma.$transaction(
    thoughtOrders.map(({ id, position }) =>
      prisma.thought.update({
        where: { id, boardId }, // Ensure thought belongs to the board
        data: { position },
      })
    )
  )
}
// QUESTION [ Lots of qquestions about the stuff aboove and below. How are these different than the API calls? Or are these just the results of hte API calls that call these functions to actually make database changes? Looking below. Why is edit here and update above? How are they different? ]


export async function editThought(id: number, data: {
  content?: string
  priority?: string
  status?: string
  tags?: any
  aiGenerated?: boolean
  confidence?: number
}) {
  return await prisma.thought.update({
    where: { id },
    data,
  })
}

// Session and Activity Logging
export async function createWorkSession(data: {
  boardId: number
  userId: number
  title?: string
  description?: string
}) {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  return await prisma.workSession.create({
    data: {
      boardId: data.boardId,
      userId: data.userId,
      title: data.title,
      description: data.description,
      sessionId,
    },
  })
}

export async function logActivity(data: {
  action: string
  detail: string
  sessionId: number // Now requires a session ID
  entityType?: string
  entityId?: number
}) {
  return await prisma.activityLog.create({
    data: {
      action: data.action,
      detail: data.detail,
      sessionId: data.sessionId,
      entityType: data.entityType,
      entityId: data.entityId,
    },
  })
}

// Convenience function for simple activity logging
export async function logActivityToBoard(data: {
  action: string
  detail: string
  boardId: number
  userId: number
  entityType?: string
  entityId?: number
}) {
  // Create or get current session for this board/user
  const session = await createWorkSession({
    boardId: data.boardId,
    userId: data.userId,
    title: 'Auto Session',
    description: 'Automatically created session for activity logging'
  })
  
  return await logActivity({
    action: data.action,
    detail: data.detail,
    sessionId: session.id,
    entityType: data.entityType,
    entityId: data.entityId,
  })
}

// Database Health Check
export async function healthCheck() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy', database: 'connected' }
  } catch (error) {
    return { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Graceful Shutdown
export async function disconnectDatabase() {
  await prisma.$disconnect()
}


// NOTE [section below will need to be updated when we add authentication.]

// DEFAULT USER HELPERS (before authentication is implemented)
const DEFAULT_USER_EMAIL = 'demo@chapp.local'
const DEFAULT_BOARD_TITLE = 'My GAPS Diagram'

export async function getOrCreateDefaultUser() {
  try {
    // Try to find existing default user
    let user = await getUserByEmail(DEFAULT_USER_EMAIL)
    
    if (!user) {
      console.log('🏗️ Creating default user for demo')
      // Create default user
      const bcrypt = await import('bcryptjs')
      const hashedPassword = await bcrypt.hash('demo-password', 10)
      const newUser = await createUser({
        username: 'demo-user',
        email: DEFAULT_USER_EMAIL,
        passwordHash: hashedPassword,
        isAdmin: false
      })
      user = await getUserByEmail(DEFAULT_USER_EMAIL)
    }
    
    return user
  } catch (error) {
    console.error('Error with default user:', error)
    throw error
  }
}

// 📝 NOTE: [This function creates a default board for new users so they don't start with an empty app. Used for better UX.]

export async function getOrCreateDefaultBoard(userId: number) {
  try {
    // Get user's boards
    const boards = await getUserBoards(userId)
    
    if (boards.length === 0) {
      console.log('🏗️ Creating default board for user')
      // Create default board
      return await createBoard({
        title: DEFAULT_BOARD_TITLE,
        userId: userId,
        description: 'Default GAPS diagram board'
      })
    }
    
    // Return the first board (most recently updated)
    return await getBoardById(boards[0].id)
  } catch (error) {
    console.error('Error with default board:', error)
    throw error
  }
} 

// =============================================================================
// CONVERSATION MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Create a new conversation within a board
 */
export async function createConversation(data: {
  boardId: number
  title?: string
  model?: string
  systemPrompt?: string
}) {
  return await prisma.conversation.create({
    data: {
      boardId: data.boardId,
      title: data.title,
      model: data.model,
      systemPrompt: data.systemPrompt,
      messageCount: 0,
    },
    include: {
      messages: true,
    },
  })
}

/**
 * Get a conversation with all its messages
 */
export async function getConversationWithMessages(conversationId: number) {
  return await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { sequenceNumber: 'asc' },
      },
    },
  })
}

/**
 * Add a message to a conversation
 */
export async function addMessage(data: {
  conversationId: number
  role: string // human, ai, system, function
  content: string
  model?: string
  tokens?: number
  metadata?: any
}) {
  // Get current message count for sequence number
  const conversation = await prisma.conversation.findUnique({
    where: { id: data.conversationId },
    select: { messageCount: true },
  })
  
  if (!conversation) {
    throw new Error(`Conversation ${data.conversationId} not found`)
  }
  
  return await prisma.$transaction(async (tx) => {
    // Create the message
    const message = await tx.message.create({
      data: {
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        sequenceNumber: conversation.messageCount,
        model: data.model,
        tokens: data.tokens,
        metadata: data.metadata,
      },
    })
    
    // Update conversation message count
    await tx.conversation.update({
      where: { id: data.conversationId },
      data: { 
        messageCount: { increment: 1 },
        updatedAt: new Date(),
      },
    })
    
    return message
  })
}

/**
 * Update conversation summary
 */
export async function updateConversationSummary(conversationId: number, summary: string) {
  return await prisma.conversation.update({
    where: { id: conversationId },
    data: { summary },
  })
}

/**
 * Get all conversations for a board
 */
export async function getBoardConversations(boardId: number) {
  return await prisma.conversation.findMany({
    where: { boardId },
    include: {
      messages: {
        orderBy: { sequenceNumber: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}
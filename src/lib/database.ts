/**
 * DATABASE UTILITY MODULE
 * =======================
 * This module provides a centralized way to access the database using Prisma.
 * It includes connection management, helper functions, and type-safe operations.
 */

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
  
  return await prisma.board.findUnique({
    where,
    include: {
      thoughts: {
        orderBy: [
          { quadrant: 'asc' },
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
  quadrant: string
  boardId: number
  position?: number
  aiGenerated?: boolean
}) {
  return await prisma.thought.create({
    data: {
      content: data.content,
      quadrant: data.quadrant,
      boardId: data.boardId,
      position: data.position,
      aiGenerated: data.aiGenerated || false,
    },
  })
}

export async function updateThought(id: number, data: {
  content?: string
  quadrant?: string
  position?: number
  priority?: string
  status?: string
}) {
  return await prisma.thought.update({
    where: { id },
    data,
  })
}

export async function deleteThought(id: number) {
  return await prisma.thought.delete({
    where: { id },
  })
}

export async function moveThought(id: number, data: {
  quadrant: string
  position?: number
  boardId?: number // Optional: move to different board
}) {
  return await prisma.thought.update({
    where: { id },
    data: {
      quadrant: data.quadrant,
      position: data.position,
      boardId: data.boardId,
    },
  })
}

export async function reorderThoughts(boardId: number, quadrant: string, thoughtOrders: { id: number, position: number }[]) {
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
    return { status: 'error', error: error.message }
  }
}

// Graceful Shutdown
export async function disconnectDatabase() {
  await prisma.$disconnect()
} 
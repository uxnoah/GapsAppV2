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
        select: { thoughts: true, meetingMinutes: true },
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

// Activity Logging
export async function logActivity(data: {
  action: string
  detail: string
  boardId: number
  userId?: number
  entityType?: string
  entityId?: number
  sessionId?: string
}) {
  return await prisma.meetingMinute.create({
    data: {
      action: data.action,
      detail: data.detail,
      boardId: data.boardId,
      userId: data.userId,
      entityType: data.entityType,
      entityId: data.entityId,
      sessionId: data.sessionId,
    },
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
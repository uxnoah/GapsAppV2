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

// Node.js path utilities, used here to normalize SQLite `file:` URLs
// Hosted DBs (e.g., postgres://...) won't use this; see note below
// Node.js path utilities, used here to normalize SQLite `file:` URLs
// Hosted DBs (e.g., postgres://...) won't use this; see note below
import path from 'path'
import type { Prisma } from '../../generated/prisma'
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
/**
 * Normalize DATABASE_URL
 * ----------------------
 * Converts relative SQLite paths (file:./...) to absolute paths so workers
 * launched from different CWDs (e.g., Next.js workers) can resolve the same
 * on-disk database file reliably.
 * 
 * Hosted DB note:
 * - For postgres/mysql providers, DATABASE_URL will be like `postgres://...`.
 * - This block only runs for `file:` URLs and is a no-op for hosted DBs.
 * - When you switch to a hosted DB, you can keep this safely or remove it.
 */
(() => {
  const url = process.env.DATABASE_URL
  if (!url) return
  if (url.startsWith('file:./') || url.startsWith('file:../')) {
    const relative = url.slice('file:'.length)
    const absolute = 'file:' + path.resolve(process.cwd(), relative)
    process.env.DATABASE_URL = absolute
  }
})()

// Hosted DB note:
// - Keep a single PrismaClient to avoid too many connections.
// - For serverless Postgres, consider Prisma Accelerate/Data Proxy or a pooler.
const prisma = globalThis.__prisma ?? new PrismaClient()

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

export { prisma }




/**
 * File structure overview
 * =======================
 * 1) Prisma client setup (singleton + DATABASE_URL normalization)
 * 2) User management (create/get/update/delete)
 * 3) Board management (create/get/update/delete/list)
 * 4) Thought management (CRUD + move/reorder/edit content)
 * 5) Session & activity logging (work sessions + audit trail)
 * 6) Default demo helpers (until authentication is added)
 * 7) Conversation management (boards ↔ conversations/messages)
 * 8) Health/shutdown helpers
 *
 * Typical usage
 * -------------
 * - Diagram API routes call user/board helpers and activity logging
 * - Thoughts API routes call thought CRUD/move and activity logging
 * - Test-database routes exercise a mix of the above
 */

// =============================================================================
// Return type helpers (Option A)
// =============================================================================
export type BoardWithRelations = Prisma.BoardGetPayload<{
  include: {
    thoughts: true
    user: { select: { id: true; username: true; email: true } }
    _count: { select: { thoughts: true; workSessions: true } }
  }
}>

export type BoardSummaryWithCounts = Prisma.BoardGetPayload<{
  select: {
    id: true
    title: true
    updatedAt: true
    _count: { select: { thoughts: true } }
  }
}>

// User Management
/** Create a new user (used by demo bootstrap and test utilities). */
export async function createUser(data: {
  username: string
  email: string
  passwordHash: string
  isAdmin?: boolean
  authId?: string
}) {
  return await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      passwordHash: data.passwordHash,
      isAdmin: data.isAdmin || false,
      authId: data.authId ?? undefined,
    },
  })
}

/** Find a user by email; optionally include boards (used by demo bootstrap). */
export async function getUserByEmail(
  email: string,
  options?: { includeBoards?: boolean }
) {
  return await prisma.user.findUnique({
    where: { email },
    include: options?.includeBoards ? { boards: true } : undefined,
  })
}

/** Set authId for a user (used to link Supabase auth.uid() to our users row). */
export async function setUserAuthIdByEmail(email: string, authId: string) {
  return await prisma.user.update({
    where: { email },
    data: { authId },
    select: { id: true, authId: true },
  })
}

/** Find a user by id and include boards (admin/test helpers). */
export async function getUserById(id: number) {
  return await prisma.user.findUnique({
    where: { id },
    include: { boards: true },
  })
}

/** Update user profile/settings; returns a safe selection for UI display. */
// Preferences note:
// - `preferences` exists in Prisma schema as `Json?` (see prisma/schema.prisma).
// - It's currently typed as `any` here as a placeholder until we define a shape.
// - This function selects specific fields to return and does NOT include `preferences` in the select.
//   The update still applies to `preferences` if provided, it just isn't returned.
// - TODO: define a `UserPreferences` type and either include it in the return when needed
//         or create a dedicated getter for preferences.
export async function updateUser(id: number, data: {
  username?: string
  email?: string
  displayName?: string
  avatarUrl?: string
  preferences?: Prisma.JsonValue | null
}) {
  return await prisma.user.update({
    where: { id },
    data: {
      ...data,
      // Prisma expects NullableJsonNullValueInput | InputJsonValue; coerce undefined/null properly
      preferences: (data.preferences as any) ?? undefined,
    },
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

/** Delete a user by id (cascades via relational schema). */
export async function deleteUser(id: number) {
  // This will cascade delete all user's boards, thoughts, etc.
  return await prisma.user.delete({
    where: { id },
  })
}


// 🔧 TODO: [Function below should we have a way to data to the board. It's certainly want to be able to have a title. User ID would be presumably randomly created. Description, yeah, I either provide that or maybe not. It might be kids were like I don't know. Duplicate a border right so then you'd want to copy all of it. Or maybe your importing the board so I think we want to have that. Some part of this function where you can actually include the thoughts and I just can't tell if that's being done]
// Board Management
/** Create a board for a user; include thoughts and basic user info for UI. */
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
      _count: {
        select: { thoughts: true, workSessions: true },
      },
    },
  })
}

/** Get board by id (optionally enforce user ownership); include ordered thoughts, user, counts. */
export async function getBoardById(id: number, userId?: number): Promise<BoardWithRelations | null> {
  // Use a typed where-clause. If userId is provided, enforce ownership.
  const where: Prisma.BoardWhereInput = userId ? { id, userId } : { id }

  return await prisma.board.findFirst({
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

/** List a user's boards with counts; ordered by last update. */
export async function getUserBoards(userId: number): Promise<BoardSummaryWithCounts[]> {
  return await prisma.board.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      _count: { select: { thoughts: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

// 📝 NOTE: [This function updates board metadata (title, description, etc.) but not thoughts. Thoughts are updated separately using thought-specific functions.]


/** Update board metadata; return with thoughts and user for immediate UI refresh. */
export async function updateBoard(id: number, data: {
  title?: string
  description?: string
  isPublic?: boolean
  isTemplate?: boolean
}): Promise<BoardWithRelations> {
  // Why `data` vs `include` look different:
  // - `data` lists fields we are updating on the Board model.
  // - `include` specifies related data Prisma should return along with the updated board.
  //   They serve different purposes, so the shapes differ.
  return await prisma.board.update({
    where: { id },
    data,
    include: {
      thoughts: true,
      user: {
        select: { id: true, username: true, email: true },
      },
      _count: {
        select: { thoughts: true, workSessions: true },
      },
    },
  })
}

/** Delete a board that belongs to a user (ownership enforced in where clause). */
export async function deleteBoard(id: number, userId: number): Promise<void> {
  // Ensure user can only delete their own boards
  await prisma.board.delete({
    where: {
      id,
      userId, // This ensures data isolation
    },
  })
}

/**
 * Return the user's most recently updated board, or create a new blank one.
 * Replaces demo-time bootstrapping and works under RLS.
 */
export async function getOrCreateUserBoard(userId: number): Promise<BoardWithRelations> {
  // Try to respect user's preferred current board if set in preferences
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } })
    const prefs = (user?.preferences as any) || {}
    const currentBoardId = typeof prefs?.currentBoardId === 'number' ? prefs.currentBoardId : undefined
    if (currentBoardId) {
      const byPref = await getBoardById(currentBoardId, userId)
      if (byPref) return byPref
    }
  } catch {
    // ignore preference read errors; fall back to most recent board
  }

  const boards = await getUserBoards(userId)
  if (boards.length === 0) {
    const created = await createBoard({ title: 'My GAPS Diagram', userId })
    const full = await getBoardById(created.id)
    if (!full) {
      throw new Error('Failed to create initial board')
    }
    return full
  }
  const latestId = boards[0].id
  const full = await getBoardById(latestId)
  if (!full) {
    throw new Error('Board not found for user')
  }
  return full
}

/** Set user's current board preference so future loads open the selected board. */
export async function setCurrentBoardForUser(userId: number, boardId: number): Promise<void> {
  // Ensure board belongs to user
  const owned = await prisma.board.findFirst({ where: { id: boardId, userId }, select: { id: true } })
  if (!owned) throw new Error('Board not found or not owned by user')
  // Merge preferences.currentBoardId
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } })
  const prefs = (existing?.preferences as any) || {}
  prefs.currentBoardId = boardId
  await prisma.user.update({ where: { id: userId }, data: { preferences: prefs as any } })
}

// Thought Management
/** Create a thought; if order not provided, auto-assign next position in section. */
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
  metadata?: Prisma.JsonValue
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
      confidence: data.confidence ?? undefined,
      metadata: (data.metadata as any) ?? undefined,
    },
  })
}

/** Update an existing thought (content/section/position/metadata). */
export async function updateThought(id: number, data: {
  content?: string
  section?: string
  position?: number
  tags?: string[]
  priority?: string
  status?: string
  aiGenerated?: boolean
  confidence?: number
  metadata?: Prisma.JsonValue | null
}) {
  return await prisma.thought.update({
    where: { id },
    data: {
      ...data,
      confidence: data.confidence ?? undefined,
      metadata: (data.metadata as any) ?? undefined,
    },
  })
}

/** Delete a thought and compact positions in its section; transactional for consistency. */
export async function deleteThought(id: number): Promise<void> {
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
    await tx.thought.delete({
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
    
    return
  })
}

/** Move a thought within or across sections while maintaining correct ordering. */
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

/** Bulk reorder specific thoughts (id → position) inside a board/section. */
export async function reorderThoughts(boardId: number, section: string, thoughtOrders: { id: number, position: number }[]): Promise<void> {
  // Update multiple thoughts' positions in a single transaction
  await prisma.$transaction(
    thoughtOrders.map(({ id, position }) =>
      prisma.thought.update({
        where: { id, boardId }, // Ensure thought belongs to the board
        data: { position },
      })
    )
  )
}


/** Edit convenience for a subset of thought fields (content/priority/status/tags/flags). */
export async function editThought(id: number, data: {
  content?: string
  priority?: string
  status?: string
  tags?: string[]
  aiGenerated?: boolean
  confidence?: number
}) {
  return await prisma.thought.update({
    where: { id },
    data,
  })
}

// Session and Activity Logging
/**
 * Activity logging policy
 * -----------------------
 * - Preferred path: create/reuse a WorkSession for a user+board and call logActivity(...)
 *   with that sessionId for each discrete user action (append many activities per session).
 * - Convenience path: call createSessionAndLogActivity(...) when you do not have a session and
 *   want to create a new one and immediately log a single activity. This always creates
 *   a new session and is best for one-off actions or scripts.
 *
 * Current code usage:
 * - createSessionAndLogActivity(...) is used in API routes to log actions and create a new session per call.
 * - logActivity(...) is currently only invoked by createSessionAndLogActivity(...).
 *
 * Guidance:
 * - In request flows that already manage sessions, call logActivity(...) directly to avoid
 *   creating multiple sessions for related actions.
 */
/** Create a work session to group activities for a user+board. */
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

/** Append an activity to an existing work session (audit log). */
export async function logActivity(data: {
  action: string
  detail: string
  sessionId: number // Now requires a session ID
  entityType?: string
  entityId?: number
}) {
  /**
   * Write an ActivityLog entry that is tied to an existing WorkSession.
   *
   * When to use:
   * - You already have a valid sessionId (e.g., you created/retrieved a session earlier
   *   in the same request or background job) and you want to append an activity to it.
   *
   * Inputs:
   * - action: A short verb phrase for what happened (e.g., "updated_title").
   * - detail: Human-readable details for audits/UX.
   * - sessionId: Required. Associates the activity to a board/user via the session.
   * - entityType/entityId: Optional target reference (e.g., Thought, Board, etc.).
   *
   * Notes:
   * - This function does not create or look up a WorkSession.
   * - In this codebase, it is currently used only by logActivityToBoard(...).
   */
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
/** Convenience: create a work session and immediately log one activity. */
export async function createSessionAndLogActivity(data: {
  action: string
  detail: string
  boardId: number
  userId: number
  entityType?: string
  entityId?: number
}) {
  /**
   * Convenience helper: create a new WorkSession for the given board/user
   * and immediately log a single activity into that session.
   *
   * When to use:
   * - You do not have a session yet, but you know the boardId and userId.
   * - Common in one-off API endpoints that perform a single action per request
   *   (e.g., "updated diagram title").
   *
   * Behavior:
   * - Always creates a NEW WorkSession record (no reuse/lookup).
   * - Calls logActivity(...) with the newly created session.id.
   *
   * Prefer logActivity(...) when:
   * - You are within an existing, ongoing session and want to avoid creating
   *   multiple sessions for related actions.
   *
   * Typical user contexts:
   * - API handler logs a single user action tied to a board.
   * - Test/admin utilities that need quick activity logging without session management.
   */
  // Create a new session for this board/user
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
/** Lightweight connectivity probe for health endpoints and test pages. */
export async function healthCheck() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy', database: 'connected' }
  } catch (error) {
    return { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Graceful Shutdown
/** Close Prisma connections; used during process shutdown or test cleanup. */
export async function disconnectDatabase() {
  await prisma.$disconnect()
}


// Deprecated demo helpers removed after auth+RLS rollout.

// =============================================================================
// CONVERSATION MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Create a new conversation within a board
 */
/** Create a new conversation within a board (includes messages for immediate UI). */
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
/** Get a conversation with all its messages ordered by sequence. */
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
/** Add a message and increment the conversation's message count transactionally. */
export async function addMessage(data: {
  conversationId: number
  role: string // human, ai, system, function
  content: string
  model?: string
  tokens?: number
  metadata?: Prisma.JsonValue | null
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
        metadata: (data.metadata as any) ?? undefined,
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
/** Update conversation summary text (used by AI summarization or admin tools). */
export async function updateConversationSummary(conversationId: number, summary: string) {
  return await prisma.conversation.update({
    where: { id: conversationId },
    data: { summary },
  })
}

/**
 * Get all conversations for a board
 */
/** List all conversations for a board with messages ordered by sequence. */
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
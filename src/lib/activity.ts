/**
 * Activity logging helper (centered, typed, flexible)
 * --------------------------------------------------
 * Why this file exists
 * - Give us ONE place to record user/system actions that matter (e.g., add/edit/move/delete thought)
 * - Keep route code simple: routes call `logActivity` and do not care where logs go
 * - Provide a small typed contract so action names are consistent (autocomplete, no typos)
 *
 * How it works
 * - You call `logActivity({ action, detail?, boardId?, userId?, entityType?, entityId?, source?, metadata? })`
 * - The helper validates/normalizes and sends the event to a selected "transport"
 * - Default transport is the database (via our Prisma helpers). If it fails, we fall back to a console line.
 * - In the future we can add other transports (e.g., webhook) without changing route code
 */

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * The fixed list of action names we allow. This prevents typos and keeps
 * analytics/filters consistent across the app. Extend as needed.
 */
export type ActivityAction =
  | 'create_thought'
  | 'update_thought'
  | 'move_thought'
  | 'delete_thought'
  | 'save_diagram'
  | 'update_title'
  | 'ai_event'

/**
 * The activity event data we accept from routes. Only `action` is required.
 * Keep this payload small; add fields only when they are truly useful.
 */
export interface ActivityEvent {
  action: ActivityAction
  detail?: string
  boardId?: number
  userId?: number
  entityType?: 'board' | 'thought'
  entityId?: number
  source?: 'backend' | 'frontend' | 'ai'
  metadata?: Record<string, unknown>
}

/**
 * Transport interface – a destination for activity events (DB, console, webhook...)
 * Implementations must not throw; `logActivity` already guards and falls back.
 */
interface ActivityTransport {
  log: (evt: ActivityEvent) => Promise<void>
}

// -----------------------------------------------------------------------------
// Transport: Database (default)
// -----------------------------------------------------------------------------

/**
 * DB adapter – writes activity using our existing database helper.
 * If you later change the DB schema, do it in one place here.
 */
import { createSessionAndLogActivity } from '@/lib/database'

const dbTransport: ActivityTransport = {
  async log(evt: ActivityEvent): Promise<void> {
    // Map our event into the existing DB helper shape
    await createSessionAndLogActivity({
      action: evt.action,
      detail: evt.detail ?? '',
      boardId: evt.boardId,
      userId: evt.userId,
      entityType: evt.entityType,
      entityId: evt.entityId,
      // The DB layer may ignore unknown fields; keep metadata small
      metadata: evt.metadata,
      source: evt.source ?? 'backend',
    } as any)
  },
}

// -----------------------------------------------------------------------------
// Transport: Console (for dev / fallback)
// -----------------------------------------------------------------------------

const consoleTransport: ActivityTransport = {
  async log(evt: ActivityEvent): Promise<void> {
    // Short, single-line breadcrumb to aid debugging
    // Intentionally minimal to keep server logs readable
    // Example: [activity] create_thought board=12 thought=34 user=1
    const parts = [
      `[activity] ${evt.action}`,
      evt.boardId != null ? `board=${evt.boardId}` : undefined,
      evt.entityId != null ? `${evt.entityType ?? 'entity'}=${evt.entityId}` : undefined,
      evt.userId != null ? `user=${evt.userId}` : undefined,
      evt.source ? `source=${evt.source}` : undefined,
    ].filter(Boolean)
    // eslint-disable-next-line no-console
    console.log(parts.join(' '))
  },
}

// -----------------------------------------------------------------------------
// Transport selection (env-based)
// -----------------------------------------------------------------------------

/**
 * Select the primary transport using an environment variable.
 * - db (default): write to database
 * - console: log to server console only (useful in local dev / testing)
 * - webhook: reserved for future use
 */
function choosePrimaryTransport(): ActivityTransport {
  const mode = (process.env.ACTIVITY_LOG_TRANSPORT || 'db').toLowerCase()
  if (mode === 'console') return consoleTransport
  // webhook could be added here later
  return dbTransport
}

const primaryTransport = choosePrimaryTransport()

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Call this from routes to log an activity. It will:
 * - Use the configured primary transport (DB by default)
 * - Never throw (errors are swallowed) – user flows must not break on logging
 * - On error, emit a minimal console fallback line
 */
export const logActivity = async (evt: ActivityEvent): Promise<void> => {
  try {
    // Guard against empty/invalid actions early
    if (!evt || !evt.action) return
    await primaryTransport.log(evt)
    if (process.env.ACTIVITY_LOG_DEBUG === 'true') {
      const ok = [
        `[activity:ok] ${evt.action}`,
        evt.boardId != null ? `board=${evt.boardId}` : undefined,
        evt.entityId != null ? `${evt.entityType ?? 'entity'}=${evt.entityId}` : undefined,
        evt.userId != null ? `user=${evt.userId}` : undefined,
      ].filter(Boolean)
      // eslint-disable-next-line no-console
      console.log(ok.join(' '))
    }
  } catch (error) {
    // Final safety: ensure logging problems do not affect the main request
    const safe = [
      `[activity:fallback] ${evt.action}`,
      evt.boardId != null ? `board=${evt.boardId}` : undefined,
      evt.entityId != null ? `${evt.entityType ?? 'entity'}=${evt.entityId}` : undefined,
    ].filter(Boolean)
    // eslint-disable-next-line no-console
    console.error(safe.join(' '))
  }
}

/**
 * Example usage in a route:
 * await logActivity({
 *   action: 'update_title',
 *   detail: `Title changed from "${old}" to "${newTitle}"`,
 *   boardId,
 *   userId,
 *   entityType: 'board',
 *   entityId: boardId,
 *   source: 'backend'
 * })
 */



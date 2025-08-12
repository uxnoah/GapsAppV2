import { getServerSupabase } from '@/lib/supabase-server'
import { createUser, getUserByEmail, setUserAuthIdByEmail } from '@/lib/database'

export interface SessionContext {
  userId: number
  email: string
  isAdmin: boolean
}

export interface OptionalSessionContext {
  userId?: number
  email: string
  isAdmin: boolean
}

/** Ensure an app `users` row exists for the Supabase user (by email for now). */
async function ensureAppUser(email: string, authId?: string): Promise<{ id: number; isAdmin: boolean }> {
  const existing = await getUserByEmail(email)
  if (existing) {
    // Backfill authId if missing (critical for RLS-backed realtime)
    if (!('authId' in existing) || !(existing as any).authId) {
      if (authId) {
        try { await setUserAuthIdByEmail(email, authId) } catch {}
      }
    }
    return { id: existing.id as number, isAdmin: Boolean((existing as any).isAdmin) }
  }

  // Create a lightweight user record for external auth. We store a placeholder password hash.
  const bcrypt = await import('bcryptjs')
  const hashed = await bcrypt.hash('external-auth', 10)
  const usernameBase = email.split('@')[0] || 'user'
  const created = await createUser({
    username: `${usernameBase}-${Math.random().toString(36).slice(2, 7)}`,
    email,
    passwordHash: hashed,
    isAdmin: false,
    authId,
  })
  return { id: (created as any).id as number, isAdmin: false }
}

/** Require a Supabase session and return our local user id. Throws on 401. */
export const requireSession = async (): Promise<SessionContext> => {
  const supabase = getServerSupabase()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    const err = new Error('Unauthorized') as Error & { status?: number }
    err.status = 401
    throw err
  }
  const email = data.user.email
  if (!email) {
    const err = new Error('Unauthorized: missing email') as Error & { status?: number }
    err.status = 401
    throw err
  }
  const ensured = await ensureAppUser(email, data.user.id)
  return { userId: ensured.id, email, isAdmin: ensured.isAdmin }
}

/**
 * Get current session info without creating any app user rows.
 * Safe to call in server components for rendering headers.
 */
export const getOptionalSession = async (): Promise<OptionalSessionContext | null> => {
  const supabase = getServerSupabase()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) return null
  const email = data.user.email
  if (!email) return null
  const existing = await getUserByEmail(email)
  return {
    userId: existing?.id as number | undefined,
    email,
    isAdmin: Boolean((existing as any)?.isAdmin),
  }
}



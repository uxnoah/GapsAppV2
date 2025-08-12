"use client"
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let browserSupabase: SupabaseClient | null = null

export const getBrowserSupabase = () => {
  if (browserSupabase) return browserSupabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  browserSupabase = createClient(url, anon)
  try {
    const host = new URL(url).host
    console.log('[realtime][env] browser using supabase host:', host)
  } catch {}
  return browserSupabase
}

// Ensure the browser client has a session token for Realtime (PKCE flows set only httpOnly cookies)
export const ensureBrowserSupabaseSession = async () => {
  const supabase = getBrowserSupabase()
  const json = await fetch('/api/auth/session').then((r) => r.ok ? r.json() : null).catch(() => null) as any
  const access_token = json?.session?.access_token
  const refresh_token = json?.session?.refresh_token
  if (!access_token) {
    try {
      const { data } = await supabase.auth.getSession()
      console.log('[realtime][auth] browser has session already:', Boolean(data?.session))
    } catch {}
  }
  if (access_token) {
    try {
      await supabase.auth.setSession({ access_token, refresh_token })
      console.log('[realtime][auth] session set in browser for realtime')
      // Nudge realtime socket auth explicitly (defensive)
      try { (supabase as any).realtime?.setAuth?.(access_token) } catch {}
    } catch { /* no-op */ }
  }
}



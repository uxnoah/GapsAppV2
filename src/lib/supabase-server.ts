import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const getServerSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  const cookieStore = cookies()
  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // In non-mutable contexts (RSC render), cookie writes are not allowed.
          // It's safe to ignore here; writes will occur in Route Handlers.
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          // Ignore in non-mutable contexts
        }
      },
    },
  })
}



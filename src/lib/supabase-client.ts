import { createBrowserClient, createServerClient } from '@supabase/supabase-js'

export const getBrowserSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  return createBrowserClient(url, anon)
}

export const getServerSupabase = (headers: Headers, cookies: () => string | undefined) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookies?.() || undefined
      },
    },
    headers,
  })
}



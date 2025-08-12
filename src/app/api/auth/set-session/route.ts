import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: NextRequest) {
  const { access_token, refresh_token } = await req.json().catch(() => ({}))
  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: 'Missing tokens' }, { status: 400 })
  }

  const res = NextResponse.json({ ok: true })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  const supabase = createServerClient(url, anon, {
    cookies: {
      get: (name: string) => req.cookies.get(name)?.value,
      set: (name: string, value: string, options: any) => {
        res.cookies.set({ name, value, ...options })
      },
      remove: (name: string, options: any) => {
        res.cookies.set({ name, value: '', ...options })
      },
    },
  })

  const { error } = await supabase.auth.setSession({ access_token, refresh_token })
  if (error) return NextResponse.json({ error: error.message }, { status: 401 })
  return res
}



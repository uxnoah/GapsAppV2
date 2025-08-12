import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server'

export async function POST() {
  const supabase = getServerSupabase()
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}



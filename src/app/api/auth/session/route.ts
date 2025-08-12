import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server'

export async function GET() {
  const supabase = getServerSupabase()
  const { data, error } = await supabase.auth.getSession()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data?.session) return NextResponse.json({ session: null }, { status: 200 })

  // Expose tokens to client to enable realtime websocket auth in the browser
  const { access_token, refresh_token } = data.session
  return NextResponse.json({ session: { access_token, refresh_token } })
}



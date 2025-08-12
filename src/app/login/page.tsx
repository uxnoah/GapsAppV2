import ClientLogin from './client-login'
import { getServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const supabase = getServerSupabase()
  const { data } = await supabase.auth.getUser()
  if (data?.user) {
    redirect('/')
  }
  return <ClientLogin />
}



"use client"
import { getBrowserSupabase } from '@/lib/supabase-client'

const LoginPage = () => {
  const supabase = getBrowserSupabase()

  const handleSignIn = async (provider: 'google' | 'github') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}` },
    })
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <button
        className="w-full rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800"
        onClick={() => handleSignIn('google')}
      >
        Continue with Google
      </button>
      <button
        className="w-full rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-800"
        onClick={() => handleSignIn('github')}
      >
        Continue with GitHub
      </button>
    </main>
  )
}

export default LoginPage



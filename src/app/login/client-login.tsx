"use client"
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

export default function ClientLogin() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'magic' | 'password_signin' | 'password_signup'>('magic')

  const handleOAuth = async (provider: 'google') => {
    setError(null)
    setLoading(provider)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    if (!url || !anon) {
      // eslint-disable-next-line no-alert
      alert('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
      setLoading(null)
      return
    }
    const supabase = createClient(url, anon)
    try {
      const { error: authError, data } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
        flowType: 'pkce',
      } as any)
      if (authError) {
        setError(authError.message)
      } else if (!data?.url) {
        setError('Provider did not return a redirect URL. Check provider is enabled in Supabase.')
      }
    } catch (e: any) {
      setError(e?.message || 'Sign-in failed')
    } finally {
      setLoading(null)
    }
  }

  const createClientOrFail = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    if (!url || !anon) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return createClient(url, anon)
  }

  const handleSendMagicLink = async () => {
    setError(null)
    setLoading('magic')
    try {
      const supabase = createClientOrFail()
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (authError) setError(authError.message)
      else alert('Check your email for a sign-in link.')
    } catch (e: any) {
      setError(e?.message || 'Failed to send link')
    } finally {
      setLoading(null)
    }
  }

  const handlePasswordSignUp = async () => {
    setError(null)
    setLoading('signup')
    try {
      const supabase = createClientOrFail()
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (authError) setError(authError.message)
      else alert('Account created. Check your email to confirm, then sign in.')
    } catch (e: any) {
      setError(e?.message || 'Sign up failed')
    } finally {
      setLoading(null)
    }
  }

  const handlePasswordSignIn = async () => {
    setError(null)
    setLoading('signin')
    try {
      const supabase = createClientOrFail()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) setError(authError.message)
      else window.location.replace('/')
    } catch (e: any) {
      setError(e?.message || 'Sign in failed')
    } finally {
      setLoading(null)
    }
  }

  // Fallback: if provider returned implicit flow (hash fragment), set session client-side
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    if (!url || !anon) return
    const hash = window.location.hash
    if (!hash || !hash.includes('access_token')) return
    const params = new URLSearchParams(hash.replace(/^#/, ''))
    const access_token = params.get('access_token') || undefined
    const refresh_token = params.get('refresh_token') || undefined
    if (!access_token || !refresh_token) return
    fetch('/api/auth/set-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token, refresh_token }),
    })
      .then(() => window.location.replace('/'))
      .catch(() => {})
  }, [])

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      {error && (
        <div className="w-full rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}
      {/* Google OAuth (keep) */}
      <button
        className="w-full rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800"
        onClick={() => handleOAuth('google')}
        aria-label="Continue with Google"
        disabled={loading !== null}
      >
        {loading === 'google' ? 'Working…' : 'Continue with Google'}
      </button>

      {/* Email options */}
      <div className="w-full rounded-md border p-4">
        <div className="mb-3 flex gap-2 text-sm">
          <button
            className={`px-2 py-1 rounded ${mode==='magic' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}
            onClick={() => setMode('magic')}
            aria-label="Use email magic link"
          >Magic link</button>
          <button
            className={`px-2 py-1 rounded ${mode==='password_signin' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}
            onClick={() => setMode('password_signin')}
            aria-label="Use email + password"
          >Password</button>
          <button
            className={`px-2 py-1 rounded ${mode==='password_signup' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}
            onClick={() => setMode('password_signup')}
            aria-label="Create account"
          >Sign up</button>
        </div>
        <div className="space-y-2">
          <input
            type="email"
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email"
          />
          {(mode === 'password_signin' || mode === 'password_signup') && (
            <input
              type="password"
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder={mode==='password_signup' ? 'Create a password' : 'Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Password"
            />
          )}
          {mode === 'magic' && (
            <button
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              onClick={handleSendMagicLink}
              disabled={loading !== null || !email}
              aria-label="Send sign-in link to email"
            >
              {loading === 'magic' ? 'Sending…' : 'Email me a sign-in link'}
            </button>
          )}
          {mode === 'password_signin' && (
            <button
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              onClick={handlePasswordSignIn}
              disabled={loading !== null || !email || !password}
              aria-label="Sign in with email and password"
            >
              {loading === 'signin' ? 'Signing in…' : 'Sign in'}
            </button>
          )}
          {mode === 'password_signup' && (
            <button
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              onClick={handlePasswordSignUp}
              disabled={loading !== null || !email || !password}
              aria-label="Create account with email and password"
            >
              {loading === 'signup' ? 'Creating…' : 'Create account'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}



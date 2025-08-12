"use client"
import React from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start gap-4 p-6">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <pre className="w-full overflow-auto rounded bg-gray-100 p-3 text-sm text-red-700">
        {error?.message || 'Unknown error'}
      </pre>
      {error?.stack ? (
        <details className="w-full">
          <summary className="cursor-pointer text-sm text-gray-600">Stack trace</summary>
          <pre className="mt-2 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-700">{error.stack}</pre>
        </details>
      ) : null}
      <button className="rounded bg-black px-3 py-2 text-white" onClick={() => reset()}>Retry</button>
    </main>
  )
}



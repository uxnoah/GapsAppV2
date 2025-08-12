'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, routes } from '@/lib/api'

type BoardSummary = { id: number; title: string; _count?: { thoughts: number } }

export default function MenuPage() {
  const [boards, setBoards] = useState<BoardSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadBoards = async () => {
    setIsLoading(true)
    try {
      const res = await api.get<{ boards: BoardSummary[] }>('/api/boards')
      setBoards(res.boards)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBoards()
  }, [])

  const handleCreate = async () => {
    setIsLoading(true)
    try {
      const res = await api.post<{ board: { id: number } }>('/api/boards', { title: 'Untitled Diagram' })
      await api.post(`/api/boards/${res.board.id}/select`)
      window.location.href = '/'
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = async (boardId: number) => {
    setIsLoading(true)
    try {
      await api.post(`/api/boards/${boardId}/select`)
      window.location.href = '/'
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Menu</h1>
      <div className="flex items-center gap-4">
        <Link href="/settings" className="text-sm underline">Settings</Link>
        <button onClick={handleLogout} className="text-sm underline">Logout</button>
      </div>

      <div className="rounded border">
        <div className="p-3 border-b font-medium">Your Diagrams</div>
        {isLoading ? (
          <div className="p-3 text-sm text-gray-500">Loading…</div>
        ) : boards.length === 0 ? (
          <div className="p-3 text-sm text-gray-500">No diagrams yet. Create one above.</div>
        ) : (
          <ul className="divide-y">
            {boards.map((b) => (
              <li key={b.id} className="flex items-center justify-between p-3">
                <div>
                  <div className="font-medium text-sm">{b.title}</div>
                  <div className="text-xs text-gray-500">{b._count?.thoughts ?? 0} thoughts</div>
                </div>
                <button
                  onClick={() => handleSelect(b.id)}
                  className="px-2 py-1 bg-gray-900 text-white rounded text-xs"
                >
                  Open
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pt-2">
        <button
          onClick={handleCreate}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
          disabled={isLoading}
        >
          ➕ Create New Diagram
        </button>
      </div>
    </div>
  )
}



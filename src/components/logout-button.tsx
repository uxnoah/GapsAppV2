'use client'

import { useState } from 'react'

const LogoutButton = () => {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      window.location.href = '/login'
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="px-3 py-1.5 rounded-md text-sm bg-gray-900 text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
      aria-label="Logout"
    >
      {isLoading ? 'Logging out…' : 'Logout'}
    </button>
  )
}

export default LogoutButton



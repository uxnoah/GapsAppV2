'use client'

/**
 * LIVE TEST PAGE - UI + Database Visualization
 * ===========================================
 * This page shows your actual GAPS interface alongside real-time database state.
 * You can interact with the UI and see database changes happen instantly!
 */

import { useState, useEffect } from 'react'
import { GapsCanvas } from '@/components/gaps-canvas'

interface DatabaseStats {
  users: number
  boards: number
  thoughts: number
  activities: number
}

interface DatabaseBoard {
  id: number
  title: string
  thoughts: Array<{
    id: number
    content: string
    quadrant: string
    position: number
    aiGenerated: boolean
    createdAt: string
  }>
}

export default function LiveTestPage() {
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [currentBoard, setCurrentBoard] = useState<DatabaseBoard | null>(null)
  const [apiLogs, setApiLogs] = useState<string[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  // Add API call to logs
  const addLog = (message: string) => {
    setApiLogs(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 9)])
  }

  // Load database stats and current board
  const loadDatabaseState = async () => {
    try {
      // Get stats
      const statsResponse = await fetch('/api/test-database/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
      }

      // Get current diagram state 
      const diagramResponse = await fetch('/api/diagram')
      if (diagramResponse.ok) {
        const diagramData = await diagramResponse.json()
        
        // Get the actual board from database to see full data
        const boardResponse = await fetch('/api/test-database/get-board/1') // Assuming board ID 1
        if (boardResponse.ok) {
          const boardData = await boardResponse.json()
          setCurrentBoard(boardData.board)
        }
      }
    } catch (error) {
      console.error('Error loading database state:', error)
    }
  }

  // Auto-refresh database state
  useEffect(() => {
    loadDatabaseState()
    
    const interval = setInterval(() => {
      loadDatabaseState()
    }, 2000) // Refresh every 2 seconds
    
    return () => clearInterval(interval)
  }, [refreshKey])

  // Manual refresh
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    addLog('Manual refresh triggered')
  }

  // Test operations
  const addTestThought = async () => {
    try {
      addLog('Adding test thought...')
      const response = await fetch('/api/test-database/create-thoughts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId: currentBoard?.id || 1,
          thoughts: [{
            content: `Test thought ${Date.now()}`,
            quadrant: 'status'
          }]
        })
      })
      
      if (response.ok) {
        addLog('✅ Test thought added successfully')
        handleRefresh()
      } else {
        addLog('❌ Failed to add test thought')
      }
    } catch (error) {
      addLog(`❌ Error: ${error.message}`)
    }
  }

  const saveCurrentUIState = async () => {
    try {
      addLog('Saving current UI state to database...')
      
      // Get current state from the API
      const response = await fetch('/api/diagram')
      const currentData = await response.json()
      
      // Save it back (this tests the PUT endpoint)
      const putResponse = await fetch('/api/diagram', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentData)
      })
      
      if (putResponse.ok) {
        addLog('✅ UI state saved to database')
        handleRefresh()
      } else {
        addLog('❌ Failed to save UI state')
      }
    } catch (error) {
      addLog(`❌ Error: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              🔬 Live Test: UI + Database
            </h1>
            <p className="text-gray-600">
              Interact with your UI and watch database changes in real-time
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🔄 Refresh
            </button>
            
            <button
              onClick={addTestThought}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              ➕ Add Test Thought
            </button>
            
            <button
              onClick={saveCurrentUIState}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              💾 Save UI to DB
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main UI Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  Your GAPS Interface
                </h2>
                <p className="text-sm text-gray-600">
                  Interact with this like normal - drag, drop, edit
                </p>
              </div>
              
              <div className="p-4">
                <GapsCanvas />
              </div>
            </div>
          </div>

          {/* Database State Column */}
          <div className="space-y-6">
            
            {/* Database Stats */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📊 Database Stats
              </h3>
              
              {stats ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.users}</div>
                    <div className="text-xs text-blue-800">Users</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.boards}</div>
                    <div className="text-xs text-green-800">Boards</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.thoughts}</div>
                    <div className="text-xs text-purple-800">Thoughts</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.activities}</div>
                    <div className="text-xs text-orange-800">Activities</div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">Loading...</div>
              )}
            </div>

            {/* Current Board Data */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📋 Current Board
              </h3>
              
              {currentBoard ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Title:</div>
                    <div className="text-sm text-gray-900">{currentBoard.title}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Thoughts ({currentBoard.thoughts.length}):
                    </div>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {currentBoard.thoughts.map(thought => (
                        <div key={thought.id} className="text-xs bg-gray-50 p-2 rounded">
                          <div className="font-medium text-gray-800">
                            {thought.quadrant}: {thought.content}
                          </div>
                          <div className="text-gray-500">
                            pos: {thought.position} | ai: {thought.aiGenerated ? '🤖' : '👤'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">Loading...</div>
              )}
            </div>

            {/* API Logs */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📡 API Activity
              </h3>
              
              <div className="space-y-1 max-h-40 overflow-y-auto text-xs font-mono">
                {apiLogs.length > 0 ? (
                  apiLogs.map((log, index) => (
                    <div key={index} className="text-gray-700 bg-gray-50 p-1 rounded">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">No API activity yet...</div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
} 
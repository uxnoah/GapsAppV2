'use client'

/**
 * DATABASE TEST PAGE
 * ==================
 * This page provides a visual interface to test database operations.
 * You can see all database interactions happening in real-time.
 */

import { useState, useEffect } from 'react'

interface TestResult {
  test: string
  status: 'pending' | 'running' | 'success' | 'error'
  result?: any
  error?: string
  duration?: number
}

interface DatabaseStats {
  users: number
  boards: number
  thoughts: number
  activities: number
}

export default function DatabaseTestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [currentData, setCurrentData] = useState<any>(null)

  // Initialize test results
  const initializeTests = () => {
    setTestResults([
      { test: 'Database Connection', status: 'pending' },
      { test: 'Create Test User', status: 'pending' },
      { test: 'Create Test Board', status: 'pending' },
      { test: 'Add GAPS Thoughts', status: 'pending' },
      { test: 'Edit Thought Content', status: 'pending' },
      { test: 'Move Thought Between Quadrants', status: 'pending' },
      { test: 'Update Board Title', status: 'pending' },
      { test: 'Update Diagram Title via API', status: 'pending' },
      { test: 'Log Activities', status: 'pending' },
      { test: 'Retrieve Full Data', status: 'pending' },
      { test: 'Verify Relationships', status: 'pending' },
    ])
  }

  // Update a specific test result
  const updateTest = (testName: string, update: Partial<TestResult>) => {
    setTestResults(prev => prev.map(test => 
      test.test === testName ? { ...test, ...update } : test
    ))
  }

  // Run all database tests
  const runTests = async () => {
    setIsRunning(true)
    initializeTests()

    try {
      // Test 1: Database Connection
      updateTest('Database Connection', { status: 'running' })
      const startTime = Date.now()
      
      const healthResponse = await fetch('/api/test-database/health')
      const healthData = await healthResponse.json()
      
      updateTest('Database Connection', {
        status: healthData.status === 'healthy' ? 'success' : 'error',
        result: healthData,
        duration: Date.now() - startTime
      })

      if (healthData.status !== 'healthy') {
        throw new Error('Database connection failed')
      }

      // Test 2: Create Test User
      updateTest('Create Test User', { status: 'running' })
      const userStart = Date.now()
      
      const userResponse = await fetch('/api/test-database/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `testuser_${Date.now()}`,
          email: `test_${Date.now()}@example.com`,
          password: 'testpassword123'
        })
      })
      const userData = await userResponse.json()
      
      updateTest('Create Test User', {
        status: userData.success ? 'success' : 'error',
        result: userData.user,
        duration: Date.now() - userStart
      })

      // Test 3: Create Test Board
      updateTest('Create Test Board', { status: 'running' })
      const boardStart = Date.now()
      
      const boardResponse = await fetch('/api/test-database/create-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.user.id,
          title: 'Visual Test Board',
          description: 'Created by the visual test interface'
        })
      })
      const boardData = await boardResponse.json()
      
      updateTest('Create Test Board', {
        status: boardData.success ? 'success' : 'error',
        result: boardData.board,
        duration: Date.now() - boardStart
      })

      // Test 4: Add GAPS Thoughts
      updateTest('Add GAPS Thoughts', { status: 'running' })
      const thoughtsStart = Date.now()
      
      const thoughtsResponse = await fetch('/api/test-database/create-thoughts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId: boardData.board.id,
          thoughts: [
                { content: 'System is running slowly', section: 'status' },
    { content: 'Achieve 2x performance improvement', section: 'goal' },
    { content: 'Database queries are inefficient', section: 'analysis' },
    { content: 'Implement query optimization', section: 'plan' }
          ]
        })
      })
      const thoughtsData = await thoughtsResponse.json()
      
      updateTest('Add GAPS Thoughts', {
        status: thoughtsData.success ? 'success' : 'error',
        result: `${thoughtsData.thoughts?.length} thoughts created`,
        duration: Date.now() - thoughtsStart
      })

      // Test 5: Edit Thought Content
      updateTest('Edit Thought Content', { status: 'running' })
      const editStart = Date.now()
      
      const editResponse = await fetch('/api/test-database/edit-thought', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thoughtId: thoughtsData.thoughts[0].id,
          content: 'System performance is critically slow (UPDATED)',
          priority: 'high'
        })
      })
      const editData = await editResponse.json()
      
      updateTest('Edit Thought Content', {
        status: editData.success ? 'success' : 'error',
        result: 'Thought updated with new content',
        duration: Date.now() - editStart
      })

      // Test 6: Move Thought Between Quadrants
      updateTest('Move Thought Between Quadrants', { status: 'running' })
      const moveStart = Date.now()
      
      const moveResponse = await fetch('/api/test-database/move-thought', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thoughtId: thoughtsData.thoughts[1].id,
          section: 'status',  // Move goal → status
          position: 1
        })
      })
      const moveData = await moveResponse.json()
      
      updateTest('Move Thought Between Quadrants', {
        status: moveData.success ? 'success' : 'error',
        result: 'Thought moved from goal to status',
        duration: Date.now() - moveStart
      })

      // Test 7: Update Board Title
      updateTest('Update Board Title', { status: 'running' })
      const boardUpdateStart = Date.now()
      
      const boardUpdateResponse = await fetch('/api/test-database/update-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId: boardData.board.id,
          title: 'Updated Visual Test Board 🚀',
          description: 'Board updated by the visual test interface'
        })
      })
      const boardUpdateData = await boardUpdateResponse.json()
      
      updateTest('Update Board Title', {
        status: boardUpdateData.success ? 'success' : 'error',
        result: 'Board title updated',
        duration: Date.now() - boardUpdateStart
      })

      // Test 8: Update Diagram Title via API
      updateTest('Update Diagram Title via API', { status: 'running' })
      const titleApiStart = Date.now()
      
      const titleApiResponse = await fetch('/api/diagram/title', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'AI Updated Title 🚀'
        })
      })
      const titleApiData = await titleApiResponse.json()
      
      updateTest('Update Diagram Title via API', {
        status: titleApiData.success ? 'success' : 'error',
        result: titleApiData.diagram?.title || 'Title update failed',
        duration: Date.now() - titleApiStart
      })

      // Test 9: Log Activities
      updateTest('Log Activities', { status: 'running' })
      const activityStart = Date.now()
      
      const activityResponse = await fetch('/api/test-database/log-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId: boardData.board.id,
          userId: userData.user.id,
          action: 'visual_test',
          detail: 'Completed visual database test'
        })
      })
      const activityData = await activityResponse.json()
      
      updateTest('Log Activities', {
        status: activityData.success ? 'success' : 'error',
        result: 'Activity logged',
        duration: Date.now() - activityStart
      })

      // Test 10: Retrieve Full Data
      updateTest('Retrieve Full Data', { status: 'running' })
      const retrieveStart = Date.now()
      
      const dataResponse = await fetch(`/api/test-database/get-board/${boardData.board.id}`)
      const fullData = await dataResponse.json()
      
      updateTest('Retrieve Full Data', {
        status: fullData.success ? 'success' : 'error',
        result: fullData.board,
        duration: Date.now() - retrieveStart
      })

      setCurrentData(fullData.board)

      // Test 11: Verify Relationships
      updateTest('Verify Relationships', { status: 'running' })
      const verifyStart = Date.now()
      
      const hasUser = fullData.board?.user?.username
      const hasThoughts = fullData.board?.thoughts?.length === 4
             const hasActivities = fullData.board?._count?.workSessions > 0
       
       updateTest('Verify Relationships', {
         status: hasUser && hasThoughts && hasActivities ? 'success' : 'error',
         result: {
           user: hasUser ? '✅' : '❌',
           thoughts: hasThoughts ? '✅ 4 thoughts' : '❌',
           activities: hasActivities ? `✅ ${fullData.board._count.workSessions} sessions` : '❌'
         },
        duration: Date.now() - verifyStart
      })

      // Get final stats
      const statsResponse = await fetch('/api/test-database/stats')
      const statsData = await statsResponse.json()
      setStats(statsData.stats)

    } catch (error) {
      console.error('Test failed:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'running': return '🔄'
      case 'success': return '✅'
      case 'error': return '❌'
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500'
      case 'running': return 'text-blue-500'
      case 'success': return 'text-green-500'
      case 'error': return 'text-red-500'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Database Test Laboratory
          </h1>
          <p className="text-gray-600">
            Visual testing interface for the new database system. 
            Watch database operations happen in real-time!
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <button
            onClick={runTests}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg font-medium text-white ${
              isRunning 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isRunning ? '🔄 Running Tests...' : '🚀 Run Database Tests'}
          </button>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Test Results</h2>
          
          <div className="space-y-3">
            {testResults.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getStatusIcon(test.status)}</span>
                  <span className={`font-medium ${getStatusColor(test.status)}`}>
                    {test.test}
                  </span>
                  {test.duration && (
                    <span className="text-xs text-gray-500">
                      ({test.duration}ms)
                    </span>
                  )}
                </div>
                
                {test.result && (
                  <div className="text-sm text-gray-600 max-w-md text-right">
                    {typeof test.result === 'object' 
                      ? JSON.stringify(test.result, null, 2)
                      : String(test.result)
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Database Stats */}
        {stats && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Database Statistics</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.users}</div>
                <div className="text-sm text-blue-800">Users</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{stats.boards}</div>
                <div className="text-sm text-green-800">Boards</div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.thoughts}</div>
                <div className="text-sm text-purple-800">Thoughts</div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.activities}</div>
                <div className="text-sm text-orange-800">Activities</div>
              </div>
            </div>
          </div>
        )}

        {/* Current Data Preview */}
        {currentData && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Current Board Data</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700">Board Info:</h3>
                <p className="text-gray-600">
                  "{currentData.title}" by {currentData.user.username}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700">GAPS Thoughts:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {['status', 'goal', 'analysis', 'plan'].map(section => {
                    const thoughts = currentData.thoughts.filter((t: any) => t.section === section)
                    return (
                      <div key={section} className="bg-gray-50 p-3 rounded">
                        <h4 className="font-medium text-gray-800 capitalize mb-2">
                          {section} ({thoughts.length})
                        </h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {thoughts.map((thought: any) => (
                            <li key={thought.id}>• {thought.content}</li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
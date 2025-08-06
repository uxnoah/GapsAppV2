/**
 * DATABASE TEST SCRIPT
 * ===================
 * This script tests basic database operations to ensure everything is working correctly.
 * Run with: npx tsx scripts/test-database.ts
 */

import bcrypt from 'bcryptjs'
import {
  prisma,
  createUser,
  getUserByEmail,
  createBoard,
  getBoardById,
  createThought,
  logActivityToBoard,
  healthCheck,
  disconnectDatabase,
} from '../src/lib/database'

async function testDatabase() {
  console.log('🧪 Testing Database Operations...\n')

  try {
    // Test 1: Health Check
    console.log('1. Testing database connection...')
    const health = await healthCheck()
    console.log('✅ Database health:', health)

    // Test 2: Create User
    console.log('\n2. Creating test user...')
    const hashedPassword = await bcrypt.hash('testpassword123', 10)
    
    const user = await createUser({
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: hashedPassword,
      isAdmin: false,
    })
    console.log('✅ User created:', { id: user.id, username: user.username, email: user.email })

    // Test 3: Get User
    console.log('\n3. Retrieving user by email...')
    const retrievedUser = await getUserByEmail('test@example.com')
    console.log('✅ User retrieved:', retrievedUser ? 'Found' : 'Not found')

    // Test 4: Create Board
    console.log('\n4. Creating test board...')
    const board = await createBoard({
      title: 'Test GAPS Board',
      userId: user.id,
      description: 'A test board for database verification',
    })
    console.log('✅ Board created:', { id: board.id, title: board.title })

    // Test 5: Create Thoughts
    console.log('\n5. Creating test thoughts...')
    const thoughts = await Promise.all([
      createThought({
        content: 'Current system is slow',
        section: 'status',
        boardId: board.id,
        order: 0,
      }),
      createThought({
        content: 'Improve system performance by 50%',
        section: 'goal',
        boardId: board.id,
        order: 0,
      }),
      createThought({
        content: 'Database queries are inefficient',
        section: 'analysis',
        boardId: board.id,
        order: 0,
      }),
      createThought({
        content: 'Optimize database indexes',
        section: 'plan',
        boardId: board.id,
        order: 0,
      }),
    ])
    console.log('✅ Thoughts created:', thoughts.length)

    // Test 6: Log Activity
    console.log('\n6. Testing activity logging...')
    await logActivityToBoard({
      action: 'test_run',
      detail: 'Database test script execution',
      boardId: board.id,
      userId: user.id,
      entityType: 'board',
      entityId: board.id,
    })
    console.log('✅ Activity logged')

    // Test 7: Get Full Board with Relations
    console.log('\n7. Retrieving full board data...')
    const fullBoard = await getBoardById(board.id, user.id)
    console.log('✅ Full board retrieved:')
    console.log(`   - Title: ${fullBoard?.title}`)
    console.log(`   - Thoughts: ${fullBoard?.thoughts.length}`)
    console.log(`   - User: ${fullBoard?.user.username}`)
    console.log(`   - Work Sessions: ${fullBoard?._count.workSessions}`)

    // Test 8: Verify Section Distribution
    console.log('\n8. Verifying thought distribution by section...')
    const sectionCounts = fullBoard?.thoughts.reduce((acc, thought) => {
      acc[thought.section] = (acc[thought.section] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}
    
    console.log('✅ Section distribution:', sectionCounts)

    console.log('\n🎉 All database tests passed successfully!')
    console.log('\n📊 Test Summary:')
    console.log(`   - Users created: 1`)
    console.log(`   - Boards created: 1`)
    console.log(`   - Thoughts created: ${thoughts.length}`)
    console.log(`   - Activity logs: 1`)
    console.log(`   - All operations: ✅`)

  } catch (error) {
    console.error('❌ Database test failed:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available')
    process.exit(1)
  } finally {
    // Cleanup: Disconnect from database
    await disconnectDatabase()
    console.log('\n🔌 Database connection closed')
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testDatabase()
    .then(() => {
      console.log('✅ Test script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Test script failed:', error)
      process.exit(1)
    })
}

export { testDatabase } 
// Test script to debug the API
const testAPI = async () => {
  // Test both local and production
  const urls = [
    'http://localhost:3001',
    'https://chapp-ashy.vercel.app'
  ]
  
  for (const baseUrl of urls) {
    console.log(`\n🧪 Testing ${baseUrl}`)
    
    try {
      // Test GET first
      console.log('📥 Testing GET /api/diagram...')
      const getResponse = await fetch(`${baseUrl}/api/diagram`)
      console.log('GET Response status:', getResponse.status)
      const getData = await getResponse.json()
      console.log('GET Response data:', JSON.stringify(getData, null, 2))
      
      // Test PUT with sample data
      console.log('\n📤 Testing PUT /api/diagram...')
      const testData = {
        title: 'Test from Script',
        status: ['Testing status 1', 'Testing status 2'],
        goal: ['Testing goal 1', 'Testing goal 2'],
        analysis: ['Testing analysis 1', 'Testing analysis 2'],
        plan: ['Testing plan 1', 'Testing plan 2']
      }
      
      const putResponse = await fetch(`${baseUrl}/api/diagram`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      })
      
      console.log('PUT Response status:', putResponse.status)
      const putData = await putResponse.json()
      console.log('PUT Response data:', JSON.stringify(putData, null, 2))
      
      // Test GET again to see if data persisted
      console.log('\n📥 Testing GET again after PUT...')
      const getResponse2 = await fetch(`${baseUrl}/api/diagram`)
      const getData2 = await getResponse2.json()
      console.log('GET Response data after PUT:', JSON.stringify(getData2, null, 2))
      
    } catch (error) {
      console.error(`❌ Error testing ${baseUrl}:`, error.message)
    }
  }
}

// Run if this is executed directly with Node
if (typeof window === 'undefined') {
  testAPI()
}

// Export for browser use
if (typeof window !== 'undefined') {
  window.testAPI = testAPI
} 
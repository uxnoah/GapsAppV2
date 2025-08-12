/**
 * Script: Run Debug Panel Tests
 * Calls the same API endpoints the UI debug panel uses, in roughly the same order.
 * Uses global fetch available in Node 18+.
 */

async function main() {
  const base = process.env.BASE_URL || 'http://localhost:3000'
  const req = (path: string, init?: RequestInit) => fetch(base + path, init)

  console.log('🚀 Starting debug test sequence against', base)

  const safe = async (label: string, fn: () => Promise<void>) => {
    try {
      await fn()
      console.log(`✅ ${label}`)
    } catch (e) {
      console.error(`❌ ${label}`, e)
    }
  }

  await safe('Load diagram', async () => {
    const r = await req('/api/diagram')
    if (!r.ok) throw new Error(await r.text())
  })

  await safe('Save diagram (no-op)', async () => {
    const body = { title: 'Script Save', status: [], goal: [], analysis: [], plan: [] }
    const r = await req('/api/diagram', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!r.ok) throw new Error(await r.text())
  })

  await safe('Test Data (PUT /api/diagram)', async () => {
    const body = { title: 'Test Data from Script', status: ['A','B'], goal: ['G1'], analysis: ['An1'], plan: ['P1'] }
    const r = await req('/api/diagram', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!r.ok) throw new Error(await r.text())
  })

  let createdId: number | null = null
  await safe('Add Thought', async () => {
    const r = await req('/api/thoughts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: 'Script thought', section: 'plan' }) })
    if (!r.ok) throw new Error(await r.text())
    const json = await r.json()
    createdId = json?.thought?.id ?? null
  })

  await safe('Edit Thought', async () => {
    if (!createdId) return
    const r = await req(`/api/thoughts/${createdId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: 'Script thought (edited)' }) })
    if (!r.ok) throw new Error(await r.text())
  })

  await safe('Move Thought', async () => {
    if (!createdId) return
    const r = await req(`/api/thoughts/${createdId}/move`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetSection: 'analysis', targetIndex: 0 }) })
    if (!r.ok) throw new Error(await r.text())
  })

  await safe('Title Update API', async () => {
    const r = await req('/api/diagram/title', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Script Updated Title' }) })
    if (!r.ok) throw new Error(await r.text())
  })

  await safe('Delete Thought', async () => {
    if (!createdId) return
    const r = await req(`/api/thoughts/${createdId}`, { method: 'DELETE' })
    if (!r.ok) throw new Error(await r.text())
  })

  console.log('✅ Debug test sequence complete')
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})






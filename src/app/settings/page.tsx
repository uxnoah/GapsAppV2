import { getOptionalSession } from '@/lib/auth'
import Link from 'next/link'

export default async function SettingsPage() {
  const session = await getOptionalSession()
  // Load existing preferences server-side (SSR) for initial paint
  let preferences: any = {}
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/users/preferences`, { cache: 'no-store' })
    if (res.ok) {
      const json = await res.json()
      preferences = json?.preferences || {}
    }
  } catch {}
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="rounded-lg border p-4 space-y-3">
        <div className="text-sm text-gray-600">Signed in as: {session?.email || 'Guest'}</div>
      </div>

      <div className="rounded-lg border p-4 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Preferences</h2>
        <div className="grid gap-4">
          <PrefToggle
            label="Open last diagram on launch"
            prefKey="openLastDiagram"
            defaultChecked={Boolean(preferences.openLastDiagram)}
          />
          <PrefToggle
            label="Enable realtime updates"
            prefKey="enableRealtime"
            defaultChecked={Boolean(preferences.enableRealtime)}
          />
          <label className="flex items-center gap-3">
            <input type="checkbox" className="h-4 w-4" />
            <span className="text-sm">Require human approval of AI‑generated thoughts</span>
          </label>
          <div className="flex items-center gap-3">
            <span className="text-sm w-56">Experience level</span>
            <PrefSelect
              prefKey="experienceLevel"
              defaultValue={String(preferences.experienceLevel || 'Beginner')}
              options={[ 'Beginner', 'Intermediate', 'Advanced' ]}
            />
          </div>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="h-4 w-4" />
            <span className="text-sm">Allow GAPS AI to use my past diagrams as a knowledge base</span>
          </label>
        </div>
      </div>
      <div className="text-xs text-gray-400">Preferences are stored as JSON and will evolve without schema churn.</div>
    </div>
  )
}

// Client helpers (embedded for simplicity)
function PrefToggle({ label, prefKey, defaultChecked }: { label: string; prefKey: string; defaultChecked?: boolean }) {
  async function handleChange(formData: FormData) {
    'use server'
    const checked = formData.get('value') === 'on'
    await fetch('/api/users/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: { [prefKey]: checked } }),
      cache: 'no-store',
    })
  }
  return (
    <form action={handleChange} className="flex items-center gap-3">
      <input name="value" defaultChecked={defaultChecked} type="checkbox" className="h-4 w-4" />
      <span className="text-sm">{label}</span>
    </form>
  )
}

function PrefSelect({ prefKey, defaultValue, options }: { prefKey: string; defaultValue: string; options: string[] }) {
  async function handleChange(formData: FormData) {
    'use server'
    const value = String(formData.get('value') || '')
    await fetch('/api/users/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: { [prefKey]: value } }),
      cache: 'no-store',
    })
  }
  return (
    <form action={handleChange} className="flex items-center gap-3">
      <select name="value" defaultValue={defaultValue} className="border rounded px-3 py-2 text-sm">
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </form>
  )
}



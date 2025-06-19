import { GapsCanvas } from '@/components/gaps-canvas'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      {/* Version indicator */}
      <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
        v3.3-fix-logic
      </div>
      <GapsCanvas />
    </main>
  )
} 
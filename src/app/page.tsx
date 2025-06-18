import { GapsCanvas } from '@/components/gaps-canvas'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      {/* Debug version marker */}
      <div className="hidden">DEBUG_VERSION_v2.1</div>
      <GapsCanvas />
    </main>
  )
} 
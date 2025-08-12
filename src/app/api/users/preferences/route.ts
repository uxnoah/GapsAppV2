import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { requireSession } from '@/lib/auth'

// GET: return current user's preferences JSON (or empty object)
export async function GET() {
  const { userId } = await requireSession()
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } })
  return NextResponse.json({ preferences: (user?.preferences as any) ?? {} })
}

// PUT: merge incoming preferences (partial) into existing JSON
export async function PUT(request: NextRequest) {
  const { userId } = await requireSession()
  const body = await request.json().catch(() => ({}))
  const incoming = (body?.preferences ?? {}) as Record<string, unknown>
  // Read current
  const current = await prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } })
  const merged = { ...(current?.preferences as any || {}), ...incoming }
  await prisma.user.update({ where: { id: userId }, data: { preferences: merged as any } })
  return NextResponse.json({ preferences: merged })
}



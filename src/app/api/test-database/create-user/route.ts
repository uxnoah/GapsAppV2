import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createUser } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json()
    
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10)
    
    // Create user
    const user = await createUser({
      username,
      email,
      passwordHash,
    })
    
    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user
    
    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
} 
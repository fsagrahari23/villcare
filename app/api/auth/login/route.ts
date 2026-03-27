import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from "@/lib/db"
import User from "@/lib/models/User"

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const { email, password, role } = await request.json()

    // Find user
    const user: any = await User.findOne({ email })

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const acceptedRoles = role === 'staff'
      ? ['staff', 'admin']
      : role === 'healthcenter'
        ? ['healthcenter']
        : role
          ? [role]
          : null

    if (acceptedRoles && !acceptedRoles.includes(user.role)) {
      return NextResponse.json(
        { message: 'Unauthorized role' },
        { status: 401 }
      )
    }

    // Verify password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create response with token in cookie
    const response = NextResponse.json({
      success: true,
      user
    })

    // Set httpOnly cookie with token
    response.cookies.set({
      name: 'auth_token',
      value: `token_${user._id}`,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json(
      { message: 'Login failed', details: error.message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Simple debug endpoint - no validation
export async function POST(request: NextRequest) {
  console.log('[Debug Auth] ===== START =====')
  
  try {
    const body = await request.json()
    console.log('[Debug Auth] Body:', body)
    
    const email = (body.email || '').toLowerCase().trim()
    const password = body.password || ''
    
    console.log('[Debug Auth] Email:', email)
    console.log('[Debug Auth] Password length:', password.length)
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and password required' 
      }, { status: 400 })
    }
    
    // Find user
    const user = await db.user.findUnique({
      where: { email },
      include: {
        company: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      }
    })
    
    console.log('[Debug Auth] User found:', !!user)
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'المستخدم غير موجود' 
      }, { status: 401 })
    }
    
    console.log('[Debug Auth] User active:', user.active)
    
    if (!user.active) {
      return NextResponse.json({ 
        success: false, 
        error: 'المستخدم غير مفعل' 
      }, { status: 401 })
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password)
    console.log('[Debug Auth] Password valid:', isValid)
    
    if (!isValid) {
      return NextResponse.json({ 
        success: false, 
        error: 'كلمة المرور غير صحيحة' 
      }, { status: 401 })
    }
    
    // Return user
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      branchId: user.branchId,
      company: user.company,
      branch: user.branch,
    }
    
    console.log('[Debug Auth] Success! User:', userResponse.email)
    
    return NextResponse.json({
      success: true,
      data: {
        user: userResponse,
        token: 'debug-token-' + Date.now()
      }
    })
    
  } catch (error: any) {
    console.error('[Debug Auth] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Debug Auth API - Use POST to test login',
    credentials: {
      email: 'a33maly@gmail.com',
      password: 'WEGSMs@1983'
    }
  })
}

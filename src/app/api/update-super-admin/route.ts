import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// API لتحديث بيانات السوبر أدمن
export async function POST(request: NextRequest) {
  try {
    const newPassword = 'WEGSMs@1983'
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    // تحديث أو إنشاء السوبر أدمن
    const existingUser = await db.user.findFirst({
      where: { email: 'a33maly@gmail.com' }
    })
    
    if (existingUser) {
      // تحديث كلمة المرور
      await db.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          active: true
        }
      })
      
      return NextResponse.json({
        success: true,
        message: 'تم تحديث كلمة مرور السوبر أدمن بنجاح',
        email: 'a33maly@gmail.com',
        password: newPassword
      })
    } else {
      // إنشاء مستخدم جديد
      const newUser = await db.user.create({
        data: {
          email: 'a33maly@gmail.com',
          name: 'مدير النظام',
          nameAr: 'مدير النظام',
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          active: true
        }
      })
      
      return NextResponse.json({
        success: true,
        message: 'تم إنشاء السوبر أدمن الجديد بنجاح',
        email: 'a33maly@gmail.com',
        password: newPassword
      })
    }
  } catch (error: any) {
    console.error('Update super admin error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'حدث خطأ'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await db.user.findFirst({
      where: { email: 'a33maly@gmail.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true
      }
    })
    
    return NextResponse.json({
      success: true,
      exists: !!user,
      user
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

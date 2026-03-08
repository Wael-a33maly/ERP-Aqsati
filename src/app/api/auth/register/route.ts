import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// POST - تسجيل شركة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      companyName, 
      companyNameAr,
      email, 
      phone, 
      password, 
      planId,
      contactName,
      city 
    } = body

    // التحقق من البيانات المطلوبة
    if (!companyName || !email || !phone || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'جميع الحقول المطلوبة يجب ملؤها' 
      }, { status: 400 })
    }

    // التحقق من عدم وجود البريد مسبقاً
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'البريد الإلكتروني مسجل مسبقاً' 
      }, { status: 400 })
    }

    // التحقق من عدم وجود شركة بنفس الاسم
    const existingCompany = await db.company.findFirst({ 
      where: { OR: [{ name: companyName }, { nameAr: companyNameAr }] } 
    })
    if (existingCompany) {
      return NextResponse.json({ 
        success: false, 
        error: 'اسم الشركة مسجل مسبقاً' 
      }, { status: 400 })
    }

    // جلب الخطة
    let plan = planId ? await db.subscriptionPlan.findUnique({ where: { id: planId } }) : null
    
    // إذا لم تختر خطة، استخدم الخطة الافتراضية (المجانية)
    if (!plan) {
      plan = await db.subscriptionPlan.findFirst({ where: { code: 'free' } })
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10)

    // إنشاء رمز الشركة
    const companyCode = generateCompanyCode(companyName)

    // حساب تاريخ انتهاء الفترة التجريبية
    const trialEnd = plan?.trialDays ? new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000) : null

    // إنشاء الشركة في معاملة واحدة
    const result = await db.$transaction(async (tx) => {
      // 1. إنشاء الشركة
      const company = await tx.company.create({
        data: {
          name: companyName,
          nameAr: companyNameAr || null,
          code: companyCode,
          email,
          phone,
          subscriptionStatus: plan?.trialDays ? 'trial' : (plan?.price === 0 ? 'active' : 'pending'),
          planType: plan?.code || 'free',
          trialEndsAt: trialEnd
        }
      })

      // 2. إنشاء فرع رئيسي
      const mainBranch = await tx.branch.create({
        data: {
          companyId: company.id,
          name: 'الفرع الرئيسي',
          nameAr: 'الفرع الرئيسي',
          code: 'MAIN',
          isMain: true
        }
      })

      // 3. إنشاء المستخدم الأدمن
      const user = await tx.user.create({
        data: {
          companyId: company.id,
          branchId: mainBranch.id,
          email,
          phone,
          name: contactName || companyName,
          password: hashedPassword,
          role: 'COMPANY_ADMIN',
          active: true
        }
      })

      // 4. إنشاء الاشتراك
      if (plan) {
        const endDate = new Date()
        if (plan.billingCycle === 'MONTHLY') {
          endDate.setMonth(endDate.getMonth() + 1)
        } else if (plan.billingCycle === 'YEARLY') {
          endDate.setFullYear(endDate.getFullYear() + 1)
        }

        await tx.subscription.create({
          data: {
            companyId: company.id,
            planId: plan.id,
            status: plan.trialDays ? 'trial' : (plan.price === 0 ? 'active' : 'pending'),
            billingCycle: plan.billingCycle,
            startDate: new Date(),
            endDate,
            trialEnd,
            originalPrice: plan.price,
            finalPrice: plan.price,
            currency: plan.currency
          }
        })
      }

      // 5. إنشاء مستودع رئيسي
      await tx.warehouse.create({
        data: {
          companyId: company.id,
          branchId: mainBranch.id,
          name: 'المستودع الرئيسي',
          nameAr: 'المستودع الرئيسي',
          code: 'WH-MAIN',
          isMain: true
        }
      })

      return { company, branch: mainBranch, user }
    })

    return NextResponse.json({ 
      success: true, 
      data: {
        companyId: result.company.id,
        companyName: result.company.name,
        email: result.user.email,
        plan: plan?.nameAr || 'المجانية',
        trialEnd,
        message: plan?.trialDays 
          ? `تم التسجيل بنجاح! لديك ${plan.trialDays} يوم تجريبي مجاني`
          : 'تم التسجيل بنجاح!'
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى' 
    }, { status: 500 })
  }
}

// GET - التحقق من توفر البريد الإلكتروني
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ success: false, error: 'البريد الإلكتروني مطلوب' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })
    
    return NextResponse.json({ 
      success: true, 
      available: !user,
      message: user ? 'البريد الإلكتروني مستخدم' : 'البريد الإلكتروني متاح'
    })
  } catch (error) {
    console.error('Error checking email:', error)
    return NextResponse.json({ success: false, error: 'خطأ في التحقق' }, { status: 500 })
  }
}

// توليد رمز الشركة
function generateCompanyCode(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '')
  const prefix = cleanName.substring(0, 3).toUpperCase()
  const timestamp = Date.now().toString(36).toUpperCase().substring(0, 4)
  const random = Math.random().toString(36).substring(2, 4).toUpperCase()
  return `${prefix}${timestamp}${random}`
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - جلب اشتراك شركة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (companyId) {
      const subscription = await db.subscription.findUnique({
        where: { companyId },
        include: { plan: true }
      })
      return NextResponse.json({ success: true, data: subscription })
    }

    // جلب كل الاشتراكات (للسوبر أدمن)
    const subscriptions = await db.subscription.findMany({
      include: { plan: true },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ success: true, data: subscriptions })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json({ success: false, error: 'فشل في جلب الاشتراك' }, { status: 500 })
  }
}

// POST - إنشاء اشتراك جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyId, planId, billingCycle = 'MONTHLY', couponCode } = body

    // جلب الخطة
    const plan = await db.subscriptionPlan.findUnique({ where: { id: planId } })
    if (!plan) {
      return NextResponse.json({ success: false, error: 'الخطة غير موجودة' }, { status: 404 })
    }

    // التحقق من عدم وجود اشتراك نشط
    const existingSubscription = await db.subscription.findUnique({
      where: { companyId }
    })

    if (existingSubscription && existingSubscription.status === 'active') {
      return NextResponse.json({ success: false, error: 'يوجد اشتراك نشط بالفعل' }, { status: 400 })
    }

    // حساب الأسعار
    let originalPrice = plan.price
    let discountPercent = 0
    let finalPrice = originalPrice

    // تطبيق الكوبون إذا وجد
    if (couponCode) {
      const coupon = await db.coupon.findUnique({ where: { code: couponCode } })
      if (coupon && coupon.active && new Date() >= coupon.validFrom && new Date() <= coupon.validUntil) {
        if (coupon.discountType === 'PERCENTAGE') {
          discountPercent = coupon.discountValue
          finalPrice = originalPrice * (1 - discountPercent / 100)
          if (coupon.maxDiscount) {
            finalPrice = Math.max(finalPrice, originalPrice - coupon.maxDiscount)
          }
        } else {
          finalPrice = Math.max(0, originalPrice - coupon.discountValue)
          discountPercent = ((originalPrice - finalPrice) / originalPrice) * 100
        }
        // تحديث استخدام الكوبون
        await db.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } }
        })
      }
    }

    // حساب تواريخ الاشتراك (سنوي فقط)
    const startDate = new Date()
    const endDate = new Date()
    endDate.setFullYear(endDate.getFullYear() + 1) // سنة كاملة

    const trialEnd = plan.trialDays > 0 ? new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000) : null

    // إنشاء أو تحديث الاشتراك
    const subscriptionData = {
      companyId,
      planId,
      status: plan.trialDays > 0 ? 'trial' : (plan.price === 0 ? 'active' : 'pending'),
      billingCycle,
      startDate,
      endDate,
      trialEnd,
      originalPrice,
      discountPercent,
      finalPrice,
      currency: plan.currency
    }

    let subscription
    if (existingSubscription) {
      subscription = await db.subscription.update({
        where: { companyId },
        data: subscriptionData
      })
    } else {
      subscription = await db.subscription.create({
        data: subscriptionData
      })
    }

    // تحديث حالة الشركة
    await db.company.update({
      where: { id: companyId },
      data: {
        subscriptionStatus: subscription.status,
        planType: plan.code,
        trialEndsAt: trialEnd
      }
    })

    return NextResponse.json({ success: true, data: subscription })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json({ success: false, error: 'فشل في إنشاء الاشتراك' }, { status: 500 })
  }
}

// PUT - تحديث الاشتراك
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, companyId, action, ...updateData } = body

    let subscription

    if (action === 'cancel') {
      // إلغاء الاشتراك
      subscription = await db.subscription.update({
        where: companyId ? { companyId } : { id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          autoRenew: false
        }
      })

      await db.company.update({
        where: { id: subscription.companyId },
        data: { subscriptionStatus: 'cancelled' }
      })
    } else if (action === 'upgrade' || action === 'downgrade') {
      // ترقية أو تخفيض الخطة
      const { newPlanId } = body
      const plan = await db.subscriptionPlan.findUnique({ where: { id: newPlanId } })
      
      if (!plan) {
        return NextResponse.json({ success: false, error: 'الخطة غير موجودة' }, { status: 404 })
      }

      subscription = await db.subscription.update({
        where: companyId ? { companyId } : { id },
        data: {
          planId: newPlanId,
          originalPrice: plan.price,
          finalPrice: plan.price,
          updatedAt: new Date()
        }
      })

      await db.company.update({
        where: { id: subscription.companyId },
        data: { planType: plan.code }
      })
    } else {
      // تحديث عادي
      subscription = await db.subscription.update({
        where: companyId ? { companyId } : { id },
        data: { ...updateData, updatedAt: new Date() }
      })
    }

    return NextResponse.json({ success: true, data: subscription })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json({ success: false, error: 'فشل في تحديث الاشتراك' }, { status: 500 })
  }
}

// DELETE - حذف الاشتراك
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'معرف الاشتراك مطلوب' }, { status: 400 })
    }

    await db.subscription.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'تم حذف الاشتراك' })
  } catch (error) {
    console.error('Error deleting subscription:', error)
    return NextResponse.json({ success: false, error: 'فشل في حذف الاشتراك' }, { status: 500 })
  }
}

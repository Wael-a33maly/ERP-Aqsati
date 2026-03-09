import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - جلب جميع بوابات الدفع
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    
    const whereClause: any = {}
    if (companyId) {
      whereClause.companyId = companyId
    }

    const gateways = await db.companyPaymentGateway.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })

    // جلب الإعدادات العامة
    let globalSettings = null
    try {
      const settings = await db.systemSetting.findFirst({
        where: { key: 'payment_global_settings' }
      })
      if (settings) {
        globalSettings = JSON.parse(settings.value || '{}')
      }
    } catch (e) {
      // جدول الإعدادات قد لا يكون موجوداً
    }

    return NextResponse.json({
      success: true,
      gateways,
      globalSettings: globalSettings || {
        defaultCurrency: 'EGP',
        callbackBaseUrl: '',
        webhookEnabled: true,
        autoSettlement: false,
        settlementSchedule: 'daily',
        notificationEmail: '',
        fraudDetection: true,
        maxRetryAttempts: 3
      }
    })
  } catch (error) {
    console.error('Payment gateways fetch error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

// POST - إضافة بوابة دفع جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const gateway = await db.companyPaymentGateway.create({
      data: {
        gatewayType: body.gatewayType,
        name: body.name,
        nameAr: body.nameAr,
        companyId: body.companyId || null,
        merchantId: body.merchantId || null,
        merchantSecret: body.merchantSecret || null,
        apiKey: body.apiKey || null,
        apiSecret: body.apiSecret || null,
        walletNumber: body.walletNumber || null,
        accountNumber: body.accountNumber || null,
        bankCode: body.bankCode || null,
        callbackUrl: body.callbackUrl || null,
        webhookSecret: body.webhookSecret || null,
        isLive: body.isLive || false,
        isActive: body.isActive ?? true,
        isDefault: body.isDefault || false,
        feesPercent: body.feesPercent || 0,
        feesFixed: body.feesFixed || 0,
        minAmount: body.minAmount || null,
        maxAmount: body.maxAmount || null,
        settlementDays: body.settlementDays || 1,
      }
    })

    return NextResponse.json({
      success: true,
      gateway,
      message: 'تم إضافة بوابة الدفع بنجاح'
    })
  } catch (error) {
    console.error('Payment gateway create error:', error)
    return NextResponse.json({ error: 'حدث خطأ في إنشاء البوابة' }, { status: 500 })
  }
}

// PUT - تحديث بوابة دفع
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'معرف البوابة مطلوب' }, { status: 400 })
    }

    const gateway = await db.companyPaymentGateway.update({
      where: { id },
      data: {
        gatewayType: data.gatewayType,
        name: data.name,
        nameAr: data.nameAr,
        merchantId: data.merchantId,
        merchantSecret: data.merchantSecret,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        walletNumber: data.walletNumber,
        accountNumber: data.accountNumber,
        bankCode: data.bankCode,
        callbackUrl: data.callbackUrl,
        webhookSecret: data.webhookSecret,
        isLive: data.isLive,
        isActive: data.isActive,
        isDefault: data.isDefault,
        feesPercent: data.feesPercent,
        feesFixed: data.feesFixed,
        minAmount: data.minAmount,
        maxAmount: data.maxAmount,
        settlementDays: data.settlementDays,
      }
    })

    return NextResponse.json({
      success: true,
      gateway,
      message: 'تم تحديث بوابة الدفع بنجاح'
    })
  } catch (error) {
    console.error('Payment gateway update error:', error)
    return NextResponse.json({ error: 'حدث خطأ في تحديث البوابة' }, { status: 500 })
  }
}

// PATCH - تحديث جزئي (مثل تغيير حالة التفعيل)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'معرف البوابة مطلوب' }, { status: 400 })
    }

    const gateway = await db.companyPaymentGateway.update({
      where: { id },
      data: { isActive }
    })

    return NextResponse.json({
      success: true,
      gateway,
      message: isActive ? 'تم تفعيل البوابة' : 'تم تعطيل البوابة'
    })
  } catch (error) {
    console.error('Payment gateway patch error:', error)
    return NextResponse.json({ error: 'حدث خطأ في تحديث البوابة' }, { status: 500 })
  }
}

// DELETE - حذف بوابة دفع
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'معرف البوابة مطلوب' }, { status: 400 })
    }

    await db.companyPaymentGateway.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'تم حذف بوابة الدفع بنجاح'
    })
  } catch (error) {
    console.error('Payment gateway delete error:', error)
    return NextResponse.json({ error: 'حدث خطأ في حذف البوابة' }, { status: 500 })
  }
}

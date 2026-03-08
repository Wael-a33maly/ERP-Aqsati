// API للدفع عبر بوابات الدفع المصرية
import { NextRequest, NextResponse } from 'next/server'
import { createPaymentManager, PaymentMethod } from '@/lib/egyptian-payments'
import { db } from '@/lib/db'

// إنشاء دفعة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      method, 
      amount, 
      customerId, 
      customerPhone, 
      customerEmail,
      customerName,
      description, 
      invoiceId,
      installmentId,
      companyId,
      branchId,
      userId 
    } = body

    // التحقق من البيانات المطلوبة
    if (!method || !amount || !customerId) {
      return NextResponse.json(
        { success: false, error: 'البيانات غير مكتملة' },
        { status: 400 }
      )
    }

    // الحصول على معلومات العميل
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      select: { name: true, phone: true }
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'العميل غير موجود' },
        { status: 404 }
      )
    }

    // إنشاء مدير الدفع
    const paymentManager = createPaymentManager(companyId)

    // إنشاء طلب الدفع
    const paymentRequest = {
      amount: parseFloat(amount),
      currency: 'EGP',
      customerId,
      customerPhone: customerPhone || customer.phone || undefined,
      customerEmail,
      customerName: customerName || customer.name,
      description: description || 'دفعة عبر نظام أقساطي',
      referenceId: invoiceId || installmentId
    }

    const result = await paymentManager.createPayment(method as PaymentMethod, paymentRequest)

    // حفظ المعاملة في قاعدة البيانات
    if (result.success) {
      // يمكن إضافة سجل للمعاملة هنا
    }

    return NextResponse.json({
      success: result.success,
      data: result
    })

  } catch (error: any) {
    console.error('Payment error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// التحقق من حالة الدفعة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const method = searchParams.get('method') as PaymentMethod
    const referenceNumber = searchParams.get('reference')
    const companyId = searchParams.get('companyId') || undefined

    if (!method || !referenceNumber) {
      return NextResponse.json(
        { success: false, error: 'البيانات غير مكتملة' },
        { status: 400 }
      )
    }

    const paymentManager = createPaymentManager(companyId)
    const result = await paymentManager.checkStatus(method, referenceNumber)

    return NextResponse.json({
      success: result.success,
      data: result
    })

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// استرداد دفعة (Refund)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { method, referenceNumber, amount, reason, companyId } = body

    if (!method || !referenceNumber || !amount) {
      return NextResponse.json(
        { success: false, error: 'البيانات غير مكتملة' },
        { status: 400 }
      )
    }

    const paymentManager = createPaymentManager(companyId)
    const result = await paymentManager.refundPayment(method, referenceNumber, parseFloat(amount), reason)

    return NextResponse.json({
      success: result.success,
      data: result
    })

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

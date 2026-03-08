import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calculateAndCreateCommission } from '@/lib/utils/commission'

// Payments API - مدفوعات الفواتير العادية
// هذا الملف للمدفوعات العادية - لا تستخدم paymentTransaction هنا
export async function GET(request: NextRequest) {
  try {
    console.log('[Payments API] Fetching regular invoice payments...')
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const method = searchParams.get('method') || ''

    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.OR = [
        { paymentNumber: { contains: search } },
        { Customer: { name: { contains: search } } }
      ]
    }
    if (method) {
      where.method = method
    }

    // استخدام Payment model للفواتير العادية
    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Customer: { select: { id: true, name: true, phone: true, companyId: true } },
          Branch: { select: { id: true, name: true } },
          User: { select: { id: true, name: true } }
        }
      }),
      db.payment.count({ where })
    ])

    console.log(`[Payments API] Found ${payments.length} payments`)
    return NextResponse.json({
      success: true,
      data: payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('[Payments API] Error:', error)
    return NextResponse.json({ success: false, error: 'فشل في جلب المدفوعات' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // توليد رقم دفعة جديد بالتنسيق الصحيح: PAY-YYYY-NNNNNN
    const year = new Date().getFullYear()
    const prefixPattern = `PAY-${year}-`

    const lastPayment = await db.payment.findFirst({
      where: {
        paymentNumber: { startsWith: prefixPattern }
      },
      orderBy: { paymentNumber: 'desc' },
      select: { paymentNumber: true }
    })

    let sequence = 1
    if (lastPayment) {
      const parts = lastPayment.paymentNumber.split('-')
      if (parts.length === 3) {
        const lastSequence = parseInt(parts[2], 10)
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1
        }
      }
    }

    const paymentNumber = `PAY-${year}-${String(sequence).padStart(6, '0')}`

    // جلب معلومات العميل للحصول على companyId
    const customer = await db.customer.findUnique({
      where: { id: data.customerId },
      select: { companyId: true, branchId: true }
    })

    const payment = await db.payment.create({
      data: {
        paymentNumber,
        customerId: data.customerId,
        branchId: data.branchId,
        invoiceId: data.invoiceId,
        agentId: data.agentId,
        method: data.method || 'CASH',
        amount: data.amount || 0,
        reference: data.reference,
        notes: data.notes,
        status: 'completed'
      },
      include: {
        Customer: { select: { companyId: true, branchId: true } }
      }
    })

    // تحديث حالة الفاتورة إذا كانت مرتبطة بفاتورة
    if (data.invoiceId) {
      const invoice = await db.invoice.findUnique({
        where: { id: data.invoiceId },
        select: { total: true, paidAmount: true }
      })
      
      if (invoice) {
        const newPaidAmount = invoice.paidAmount + data.amount
        const newStatus = newPaidAmount >= invoice.total ? 'paid' : 'partial'
        
        await db.invoice.update({
          where: { id: data.invoiceId },
          data: {
            paidAmount: newPaidAmount,
            remainingAmount: invoice.total - newPaidAmount,
            status: newStatus
          }
        })
      }
    }

    // حساب عمولة التحصيل للمندوب (إن وجد)
    if (data.agentId && customer) {
      try {
        await calculateAndCreateCommission({
          companyId: customer.companyId,
          branchId: data.branchId || customer.branchId,
          agentId: data.agentId,
          type: 'COLLECTION',
          amount: data.amount,
          referenceType: 'PAYMENT',
          referenceId: payment.id
        })
      } catch (commissionError) {
        console.error('Commission calculation failed:', commissionError)
      }
    }

    return NextResponse.json({ success: true, data: payment })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ success: false, error: 'فشل في إنشاء الدفعة' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

// GET - جلب روابط الدفع
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (customerId) where.customerId = customerId
    if (status) where.status = status

    const links = await db.paymentLink.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        Customer: {
          select: { id: true, name: true, phone: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: links
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - إنشاء رابط دفع جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      customerId, 
      amount, 
      description, 
      expiresInDays = 7,
      installmentId,
      invoiceId,
      paymentMethods = ['FAWRY', 'VODAFONE_CASH', 'INSTAPAY']
    } = body

    if (!customerId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'البيانات غير مكتملة' },
        { status: 400 }
      )
    }

    // توليد كود فريد للرابط
    const linkCode = crypto.randomBytes(8).toString('hex').toUpperCase()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    const link = await db.paymentLink.create({
      data: {
        customerId,
        amount,
        description: description || 'رابط دفع',
        linkCode,
        expiresAt,
        installmentId,
        invoiceId,
        paymentMethods: JSON.stringify(paymentMethods),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        Customer: {
          select: { id: true, name: true, phone: true }
        }
      }
    })

    // إنشاء الرابط الكامل
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    const paymentUrl = `${baseUrl}/pay/${linkCode}`

    return NextResponse.json({
      success: true,
      data: {
        ...link,
        paymentUrl,
        paymentMethods
      }
    })
  } catch (error: any) {
    console.error('Payment link creation error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - تحديث حالة رابط الدفع
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { linkCode, status, paidAmount, paymentMethod, transactionId } = body

    if (!linkCode || !status) {
      return NextResponse.json(
        { success: false, error: 'البيانات غير مكتملة' },
        { status: 400 }
      )
    }

    const link = await db.paymentLink.update({
      where: { linkCode },
      data: {
        status,
        paidAmount: paidAmount || undefined,
        paymentMethod: paymentMethod || undefined,
        transactionId: transactionId || undefined,
        paidAt: status === 'paid' ? new Date() : undefined,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: link
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

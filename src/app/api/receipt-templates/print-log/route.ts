import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - جلب سجلات الطباعة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const branchId = searchParams.get('branchId')
    const installmentId = searchParams.get('installmentId')
    const customerId = searchParams.get('customerId')
    const printedBy = searchParams.get('printedBy')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'معرف الشركة مطلوب' },
        { status: 400 }
      )
    }

    const where: any = { companyId }

    if (branchId) where.branchId = branchId
    if (installmentId) where.installmentId = installmentId
    if (customerId) where.customerId = customerId
    if (printedBy) where.printedBy = printedBy

    if (dateFrom || dateTo) {
      where.printedAt = {}
      if (dateFrom) where.printedAt.gte = new Date(dateFrom)
      if (dateTo) where.printedAt.lte = new Date(dateTo)
    }

    const [logs, total] = await Promise.all([
      db.receiptPrintLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { printedAt: 'desc' },
        include: {
          template: {
            select: { id: true, name: true, nameAr: true }
          }
        }
      }),
      db.receiptPrintLog.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching print logs:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب سجلات الطباعة' },
      { status: 500 }
    )
  }
}

// POST - تسجيل طباعة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      companyId,
      branchId,
      templateId,
      installmentId,
      invoiceId,
      customerId,
      contractNumber,
      installmentNumber,
      printedBy,
      printMethod,
      notes
    } = body

    if (!companyId || !installmentId || !customerId || !printedBy) {
      return NextResponse.json(
        { success: false, error: 'البيانات الأساسية مفقودة' },
        { status: 400 }
      )
    }

    // التحقق من وجود طباعة سابقة
    const existingPrint = await db.receiptPrintLog.findFirst({
      where: {
        companyId,
        installmentId,
        isReprint: false
      },
      orderBy: { printedAt: 'desc' }
    })

    const isReprint = !!existingPrint

    // إنشاء سجل الطباعة
    const printLog = await db.receiptPrintLog.create({
      data: {
        companyId,
        branchId: branchId || null,
        templateId: templateId || null,
        installmentId,
        invoiceId: invoiceId || null,
        customerId,
        contractNumber: contractNumber || null,
        installmentNumber: installmentNumber || null,
        printedBy,
        isReprint,
        originalPrintId: existingPrint?.id || null,
        printCount: 1,
        printMethod: printMethod || 'PRINT',
        notes: notes || null
      }
    })

    // تحديث عداد الطباعة للقالب
    if (templateId) {
      await db.companyReceiptTemplate.update({
        where: { id: templateId },
        data: { printCount: { increment: 1 } }
      })
    }

    return NextResponse.json({
      success: true,
      data: printLog,
      isReprint,
      message: isReprint 
        ? 'تم تسجيل إعادة الطباعة' 
        : 'تم تسجيل الطباعة بنجاح'
    })
  } catch (error) {
    console.error('Error creating print log:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في تسجيل الطباعة' },
      { status: 500 }
    )
  }
}

// GET - التحقق من طباعة سابقة
export async function checkPreviousPrint(companyId: string, installmentId: string) {
  const previousPrints = await db.receiptPrintLog.findMany({
    where: {
      companyId,
      installmentId
    },
    orderBy: { printedAt: 'desc' },
    take: 5
  })

  return {
    hasPreviousPrint: previousPrints.length > 0,
    printCount: previousPrints.length,
    lastPrint: previousPrints[0] || null,
    allPrints: previousPrints
  }
}

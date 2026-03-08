import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get receipt print logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const invoiceId = searchParams.get('invoiceId')
    const installmentId = searchParams.get('installmentId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (companyId) where.companyId = companyId
    if (invoiceId) where.invoiceId = invoiceId
    if (installmentId) where.installmentId = installmentId

    const logs = await db.receiptPrintLog.findMany({
      where,
      orderBy: { printedAt: 'desc' },
      take: limit,
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching receipt print logs:', error)
    return NextResponse.json({ error: 'Failed to fetch receipt print logs' }, { status: 500 })
  }
}

// POST - Log a receipt print
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { 
      companyId, 
      branchId, 
      installmentId, 
      invoiceId, 
      customerId,
      contractNumber,
      installmentNumber,
      printedBy,
      templateId,
      isReprint,
      originalPrintId,
      printMethod,
      notes
    } = data

    // Check if this installment was printed before
    const existingPrint = await db.receiptPrintLog.findFirst({
      where: {
        companyId,
        installmentId,
      },
      orderBy: { printedAt: 'desc' }
    })

    const printLog = await db.receiptPrintLog.create({
      data: {
        companyId,
        branchId,
        installmentId,
        invoiceId,
        customerId,
        contractNumber,
        installmentNumber,
        printedBy,
        templateId,
        isReprint: isReprint || !!existingPrint,
        originalPrintId: originalPrintId || existingPrint?.id,
        printCount: existingPrint ? existingPrint.printCount + 1 : 1,
        printMethod: printMethod || 'PRINT',
        notes,
      }
    })

    return NextResponse.json(printLog, { status: 201 })
  } catch (error) {
    console.error('Error logging receipt print:', error)
    return NextResponse.json({ error: 'Failed to log receipt print' }, { status: 500 })
  }
}

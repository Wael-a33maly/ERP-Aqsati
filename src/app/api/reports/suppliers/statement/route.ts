import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - تقرير كشف حساب مورد
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId') || ''
    const companyId = searchParams.get('companyId') || ''
    const fromDate = searchParams.get('fromDate') || ''
    const toDate = searchParams.get('toDate') || ''

    if (!supplierId) {
      return NextResponse.json(
        { success: false, error: 'يجب تحديد المورد' },
        { status: 400 }
      )
    }

    // جلب بيانات المورد
    const supplier = await db.supplier.findUnique({
      where: { id: supplierId },
      include: {
        Company: { select: { id: true, name: true, currency: true } }
      }
    })

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: 'المورد غير موجود' },
        { status: 404 }
      )
    }

    // بناء شروط البحث
    const dateFilter: any = {}
    if (fromDate) dateFilter.gte = new Date(fromDate)
    if (toDate) dateFilter.lte = new Date(toDate)

    const transactionWhere: any = {
      supplierId,
      companyId: companyId || supplier.companyId
    }

    if (fromDate || toDate) {
      transactionWhere.transactionDate = dateFilter
    }

    // جلب الحركات
    const transactions = await db.supplierTransaction.findMany({
      where: transactionWhere,
      orderBy: { transactionDate: 'asc' }
    })

    // حساب الإجماليات
    const totalDebit = transactions.reduce((sum, t) => sum + t.debit, 0)
    const totalCredit = transactions.reduce((sum, t) => sum + t.credit, 0)
    const currentBalance = supplier.currentBalance

    // تقرير أعمار الديون
    const today = new Date()
    const agingBuckets = {
      current: 0,       // 0-30 يوم
      days30: 0,        // 31-60 يوم
      days60: 0,        // 61-90 يوم
      days90: 0,        // أكثر من 90 يوم
      total: 0
    }

    // جلب الفواتير غير المدفوعة بالكامل
    const unpaidInvoices = await db.purchaseInvoice.findMany({
      where: {
        supplierId,
        status: { in: ['approved', 'partial'] },
        remainingAmount: { gt: 0 }
      },
      orderBy: { invoiceDate: 'asc' }
    })

    for (const invoice of unpaidInvoices) {
      const daysDiff = Math.floor((today.getTime() - new Date(invoice.invoiceDate).getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff <= 30) {
        agingBuckets.current += invoice.remainingAmount
      } else if (daysDiff <= 60) {
        agingBuckets.days30 += invoice.remainingAmount
      } else if (daysDiff <= 90) {
        agingBuckets.days60 += invoice.remainingAmount
      } else {
        agingBuckets.days90 += invoice.remainingAmount
      }
      agingBuckets.total += invoice.remainingAmount
    }

    // ملخص الفواتير
    const invoicesSummary = await db.purchaseInvoice.aggregate({
      where: {
        supplierId,
        status: 'approved',
        ...(fromDate || toDate ? { invoiceDate: dateFilter } : {})
      },
      _count: true,
      _sum: {
        total: true,
        paidAmount: true,
        remainingAmount: true
      }
    })

    // ملخص المرتجعات
    const returnsSummary = await db.purchaseReturn.aggregate({
      where: {
        supplierId,
        status: 'approved',
        ...(fromDate || toDate ? { returnDate: dateFilter } : {})
      },
      _count: true,
      _sum: {
        total: true
      }
    })

    // ملخص الدفعات
    const paymentsSummary = await db.supplierPayment.aggregate({
      where: {
        supplierId,
        status: 'completed',
        ...(fromDate || toDate ? { paymentDate: dateFilter } : {})
      },
      _count: true,
      _sum: {
        amount: true
      }
    })

    const report = {
      supplier: {
        id: supplier.id,
        code: supplier.supplierCode,
        name: supplier.name,
        nameAr: supplier.nameAr,
        phone: supplier.phone,
        email: supplier.email,
        creditLimit: supplier.creditLimit,
        currentBalance: supplier.currentBalance,
        balanceType: supplier.balanceType,
        paymentTerms: supplier.paymentTerms,
        currency: supplier.currency
      },
      company: supplier.Company,
      period: {
        from: fromDate || null,
        to: toDate || null
      },
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.transactionType,
        number: t.transactionNumber,
        date: t.transactionDate,
        debit: t.debit,
        credit: t.credit,
        balance: t.balance,
        notes: t.notes,
        referenceType: t.referenceType,
        referenceId: t.referenceId
      })),
      summary: {
        totalDebit,
        totalCredit,
        currentBalance,
        balance: currentBalance > 0 ? (supplier.balanceType === 'CREDIT' ? 'دائن' : 'مدين') : 'متوازن'
      },
      invoices: {
        count: invoicesSummary._count,
        total: invoicesSummary._sum.total || 0,
        paid: invoicesSummary._sum.paidAmount || 0,
        remaining: invoicesSummary._sum.remainingAmount || 0
      },
      returns: {
        count: returnsSummary._count,
        total: returnsSummary._sum.total || 0
      },
      payments: {
        count: paymentsSummary._count,
        total: paymentsSummary._sum.amount || 0
      },
      aging: agingBuckets
    }

    return NextResponse.json({
      success: true,
      data: report
    })
  } catch (error) {
    console.error('Error generating supplier statement:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء كشف حساب المورد' },
      { status: 500 }
    )
  }
}

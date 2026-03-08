import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - متابعة التحصيلات من جميع الشركات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // month, week, today

    // تحديد نطاق التاريخ
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setMonth(now.getMonth() - 1)
    }

    // إحصائيات التحصيلات لكل شركة
    const companies = await db.company.findMany({
      where: { active: true },
      include: {
        Subscription: {
          include: { SubscriptionPlan: true }
        },
        _count: {
          select: {
            Customer: true,
            Invoice: true,
            Payment: true,
            User: true
          }
        }
      }
    })

    // جلب المدفوعات لكل شركة
    const companyCollections = await Promise.all(
      companies.map(async (company) => {
        const payments = await db.payment.findMany({
          where: {
            companyId: company.id,
            paymentDate: { gte: startDate }
          },
          select: { amount: true, method: true }
        })

        const invoices = await db.invoice.findMany({
          where: {
            companyId: company.id,
            invoiceDate: { gte: startDate }
          },
          select: { total: true, remainingAmount: true, status: true }
        })

        const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
        const totalSales = invoices.reduce((sum, i) => sum + (i.total || 0), 0)
        const pendingAmount = invoices.reduce((sum, i) => sum + (i.remainingAmount || 0), 0)
        const collectionRate = totalSales > 0 ? Math.round((totalCollected / totalSales) * 100) : 0

        // تصنيف حسب طريقة الدفع
        const byMethod: Record<string, number> = {}
        payments.forEach(p => {
          byMethod[p.method] = (byMethod[p.method] || 0) + (p.amount || 0)
        })

        return {
          id: company.id,
          name: company.name,
          nameAr: company.nameAr,
          code: company.code,
          subscriptionStatus: company.subscriptionStatus,
          plan: company.Subscription?.SubscriptionPlan?.nameAr || 'بدون خطة',
          collected: totalCollected,
          sales: totalSales,
          pending: pendingAmount,
          collectionRate,
          byMethod,
          counts: {
            customers: company._count.Customer,
            invoices: company._count.Invoice,
            payments: company._count.Payment,
            users: company._count.User
          }
        }
      })
    )

    // إجماليات النظام
    const totals = {
      totalCollected: companyCollections.reduce((sum, c) => sum + c.collected, 0),
      totalSales: companyCollections.reduce((sum, c) => sum + c.sales, 0),
      totalPending: companyCollections.reduce((sum, c) => sum + c.pending, 0),
      totalCompanies: companies.length,
      activeCompanies: companies.filter(c => c.subscriptionStatus === 'active').length,
      trialCompanies: companies.filter(c => c.subscriptionStatus === 'trial').length,
      expiredCompanies: companies.filter(c => c.subscriptionStatus === 'expired' || c.subscriptionStatus === 'cancelled').length
    }

    // ترتيب حسب أعلى تحصيل
    companyCollections.sort((a, b) => b.collected - a.collected)

    return NextResponse.json({
      success: true,
      data: {
        period,
        startDate,
        endDate: now,
        totals,
        companies: companyCollections
      }
    })
  } catch (error) {
    console.error('Collections stats error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

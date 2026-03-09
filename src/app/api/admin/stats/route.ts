import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// إحصائيات السوبر أدمن
export async function GET(request: NextRequest) {
  try {
    // إحصائيات عامة
    const [
      totalCompanies,
      activeCompanies,
      totalUsers,
      totalCustomers,
      totalInvoices,
      totalRevenue
    ] = await Promise.all([
      db.company.count(),
      db.company.count({ where: { active: true } }),
      db.user.count(),
      db.customer.count(),
      db.invoice.count(),
      db.payment.aggregate({ _sum: { amount: true } })
    ])

    // إحصائيات الاشتراكات
    const subscriptions = await db.subscription.findMany({
      include: {
        SubscriptionPlan: true,
        Company: { select: { id: true, name: true, nameAr: true, email: true, active: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length
    const trialSubscriptions = subscriptions.filter(s => s.status === 'trial').length
    const expiredSubscriptions = subscriptions.filter(s => s.status === 'expired' || s.status === 'cancelled').length

    // إحصائيات الخطط
    const planStats = await db.subscriptionPlan.findMany({
      include: {
        _count: { select: { Subscription: true } }
      }
    })

    // الشركات مع تفاصيل الاشتراك
    const companies = await db.company.findMany({
      include: {
        User: { 
          where: { role: 'COMPANY_ADMIN' },
          select: { id: true, name: true, email: true, phone: true }
        },
        Branch: { select: { id: true, name: true } },
        Subscription: {
          include: { SubscriptionPlan: true }
        },
        _count: {
          select: {
            User: true,
            Customer: true,
            Product: true,
            Branch: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // جلب عدد الفواتير لكل شركة
    const companiesWithInvoices = await Promise.all(
      companies.map(async (company) => {
        const invoiceCount = await db.invoice.count({
          where: { companyId: company.id }
        })
        return { id: company.id, invoiceCount }
      })
    )

    // آخر المدفوعات
    const recentPayments = await db.paymentTransaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        Subscription: {
          include: { Company: { select: { name: true } } }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalCompanies,
          activeCompanies,
          inactiveCompanies: totalCompanies - activeCompanies,
          totalUsers,
          totalCustomers,
          totalInvoices,
          totalRevenue: totalRevenue._sum.amount || 0,
          activeSubscriptions,
          trialSubscriptions,
          expiredSubscriptions
        },
        planStats: planStats.map(p => ({
          id: p.id,
          name: p.name,
          nameAr: p.nameAr,
          price: p.price,
          subscribers: p._count.Subscription
        })),
        companies: companies.map(c => {
          const invoiceData = companiesWithInvoices.find(i => i.id === c.id)
          return {
            id: c.id,
            name: c.name,
            nameAr: c.nameAr,
            code: c.code,
            email: c.email,
            phone: c.phone,
            active: c.active,
            subscriptionStatus: c.subscriptionStatus,
            createdAt: c.createdAt,
            admin: c.User[0] || null,
            subscription: c.Subscription ? {
              planName: c.Subscription.SubscriptionPlan?.nameAr || c.Subscription.SubscriptionPlan?.name,
              status: c.Subscription.status,
              endDate: c.Subscription.endDate,
              finalPrice: c.Subscription.finalPrice
            } : null,
            counts: {
              users: c._count.User,
              customers: c._count.Customer,
              invoices: invoiceData?.invoiceCount || 0,
              products: c._count.Product,
              branches: c._count.Branch
            }
          }
        }),
        recentPayments: recentPayments.map(p => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          paymentMethod: p.paymentMethod,
          createdAt: p.createdAt,
          companyName: p.Subscription?.Company?.name
        }))
      }
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

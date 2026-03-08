import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// تخزين مؤقت للإحصائيات (60 ثانية)
let cachedStats: { data: any; companyId: string; timestamp: number } | null = null
const CACHE_TTL = 60 * 1000 // 60 ثانية

export async function GET(request: NextRequest) {
  try {
    // جلب معلومات المستخدم من cookies
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('erp_user')
    
    let companyId: string | null = null
    let isSuperAdmin = false
    
    if (userCookie) {
      try {
        const userData = JSON.parse(userCookie.value)
        companyId = userData.companyId || null
        isSuperAdmin = userData.role === 'SUPER_ADMIN' && !userData.isImpersonating
      } catch (e) {
        // في حالة فشل تحليل البيانات
      }
    }

    // التحقق من التخزين المؤقت (فقط للسوبر أدمن بدون فلترة)
    const now = Date.now()
    if (isSuperAdmin && !companyId && cachedStats && (now - cachedStats.timestamp) < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        cached: true,
        ...cachedStats.data,
      })
    }

    // بناء شروط الفلترة
    const companyFilter = companyId ? { companyId } : {}
    const customerCompanyFilter = companyId ? { companyId } : {}
    const invoiceCompanyFilter = companyId ? { companyId } : {}
    const paymentCompanyFilter = companyId ? { companyId } : {}

    // تنفيذ جميع الاستعلامات بالتوازي لتحسين الأداء
    const [
      usersCount,
      companiesCount,
      customersCount,
      productsCount,
      branchesCount,
      zonesCount,
      warehousesCount,
      invoicesCount,
      paymentsCount,
      salesAggregation,
      paymentsAggregation,
      pendingAggregation,
      recentInvoicesRaw,
      recentPaymentsRaw,
    ] = await Promise.all([
      // عد المستخدمين (فلترة حسب الشركة)
      db.user.count({ where: companyFilter }),
      
      // عد الشركات (فقط للسوبر أدمن)
      isSuperAdmin ? db.company.count() : Promise.resolve(companyId ? 1 : 0),
      
      // عد العملاء
      db.customer.count({ where: customerCompanyFilter }),
      
      // عد المنتجات
      db.product.count({ where: companyFilter }),
      
      // عد الفروع
      db.branch.count({ where: companyFilter }),
      
      // عد المناطق
      db.zone.count({ where: companyFilter }),
      
      // عد المخازن
      db.warehouse.count({ where: companyFilter }),
      
      // عد الفواتير
      db.invoice.count({ where: invoiceCompanyFilter }),
      
      // عد المدفوعات
      db.payment.count({ where: paymentCompanyFilter }),
      
      // مجموع المبيعات
      db.invoice.aggregate({
        _sum: { total: true },
        where: invoiceCompanyFilter,
      }),
      
      // مجموع المدفوعات
      db.payment.aggregate({
        _sum: { amount: true },
        where: paymentCompanyFilter,
      }),
      
      // المستحقات المعلقة
      db.invoice.aggregate({
        _sum: { remainingAmount: true },
        where: {
          ...invoiceCompanyFilter,
          OR: [
            { status: 'pending' },
            { status: 'partial' },
          ],
        },
      }),
      
      // آخر 5 فواتير
      db.invoice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: invoiceCompanyFilter,
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          status: true,
          customerId: true,
        },
      }),
      
      // آخر 5 مدفوعات
      db.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: paymentCompanyFilter,
        select: {
          id: true,
          paymentNumber: true,
          amount: true,
          method: true,
          customerId: true,
        },
      }),
    ])

    // تجميع معرفات العملاء لجلب أسمائهم
    const customerIds = new Set<string>()
    recentInvoicesRaw.forEach((inv: any) => {
      if (inv.customerId) customerIds.add(inv.customerId)
    })
    recentPaymentsRaw.forEach((pay: any) => {
      if (pay.customerId) customerIds.add(pay.customerId)
    })

    // جلب أسماء العملاء المطلوبة فقط
    const customers = customerIds.size > 0 
      ? await db.customer.findMany({
          where: { id: { in: Array.from(customerIds) } },
          select: { id: true, name: true },
        })
      : []

    // إنشاء خريطة للعملاء
    const customerMap = new Map(customers.map((c: any) => [c.id, c.name]))

    // إضافة أسماء العملاء للفواتير والمدفوعات
    const recentInvoices = recentInvoicesRaw.map((inv: any) => ({
      ...inv,
      customer: { name: customerMap.get(inv.customerId) || 'غير محدد' },
    }))

    const recentPayments = recentPaymentsRaw.map((pay: any) => ({
      ...pay,
      customer: { name: customerMap.get(pay.customerId) || 'غير محدد' },
    }))

    // حساب الإحصائيات المالية
    const totalSales = salesAggregation._sum.total || 0
    const totalPaid = paymentsAggregation._sum.amount || 0
    const pendingAmount = pendingAggregation._sum.remainingAmount || 0

    const responseData = {
      data: {
        stats: {
          users: usersCount,
          companies: companiesCount,
          customers: customersCount,
          products: productsCount,
          invoices: invoicesCount,
          payments: paymentsCount,
          branches: branchesCount,
          zones: zonesCount,
          warehouses: warehousesCount,
          totalSales,
          totalPaid,
          pendingAmount,
        },
        recentInvoices,
        recentPayments,
        companyId, // إضافة companyId لمعرفة الفلترة
        isSuperAdmin,
      },
    }

    // تحديث التخزين المؤقت (فقط للسوبر أدمن بدون فلترة)
    if (isSuperAdmin && !companyId) {
      cachedStats = { data: responseData, companyId: '', timestamp: now }
    }

    return NextResponse.json({
      success: true,
      cached: false,
      ...responseData,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في تحميل الإحصائيات' },
      { status: 500 }
    )
  }
}

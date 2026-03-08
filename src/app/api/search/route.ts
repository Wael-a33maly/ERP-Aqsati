import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { applyRateLimit } from '@/lib/rate-limit'

// GET - البحث الموحد
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'search')
    if (rateLimitResponse) return rateLimitResponse

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || searchParams.get('query')
    const types = searchParams.get('types')?.split(',') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'يرجى إدخال حرفين على الأقل للبحث',
      })
    }

    const results: any[] = []
    const companyId = user.companyId
    const branchId = user.branchId

    // تحديد الأنواع للبحث فيها
    const searchTypes = types || ['customer', 'product', 'invoice', 'payment', 'contract']

    // البحث في العملاء
    if (searchTypes.includes('customer')) {
      const customers = await db.customer.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { code: { contains: query } },
            { phone: { contains: query } },
            { nationalId: { contains: query } },
          ],
          ...(companyId && { companyId }),
          active: true,
        },
        take: 10,
      })

      results.push(...customers.map(c => ({
        type: 'customer',
        id: c.id,
        title: c.name,
        subtitle: `${c.code} - ${c.phone || 'لا يوجد هاتف'}`,
        link: `/?section=customers&customer=${c.id}`,
        icon: 'user',
      })))
    }

    // البحث في المنتجات
    if (searchTypes.includes('product')) {
      const products = await db.product.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { sku: { contains: query } },
            { barcode: { contains: query } },
          ],
          ...(companyId && { companyId }),
          active: true,
        },
        take: 10,
      })

      results.push(...products.map(p => ({
        type: 'product',
        id: p.id,
        title: p.name,
        subtitle: `${p.sku} - ${p.sellPrice} ر.س`,
        link: `/?section=products&product=${p.id}`,
        icon: 'package',
      })))
    }

    // البحث في الفواتير
    if (searchTypes.includes('invoice')) {
      const invoices = await db.invoice.findMany({
        where: {
          OR: [
            { invoiceNumber: { contains: query } },
            { notes: { contains: query } },
          ],
          ...(companyId && { companyId }),
          ...(branchId && { branchId }),
        },
        include: {
          Customer: { select: { name: true } },
        },
        take: 10,
      })

      results.push(...invoices.map(inv => ({
        type: 'invoice',
        id: inv.id,
        title: inv.invoiceNumber,
        subtitle: `${inv.Customer?.name || ''} - ${inv.total} ر.س`,
        link: `/?section=invoices&invoice=${inv.id}`,
        icon: 'file-text',
      })))
    }

    // البحث في المدفوعات
    if (searchTypes.includes('payment')) {
      const payments = await db.payment.findMany({
        where: {
          OR: [
            { paymentNumber: { contains: query } },
            { reference: { contains: query } },
          ],
          ...(companyId && { companyId }),
          ...(branchId && { branchId }),
        },
        include: {
          Customer: { select: { name: true } },
        },
        take: 10,
      })

      results.push(...payments.map(p => ({
        type: 'payment',
        id: p.id,
        title: p.paymentNumber,
        subtitle: `${p.Customer?.name || ''} - ${p.amount} ر.س`,
        link: `/?section=payments`,
        icon: 'credit-card',
      })))
    }

    // البحث في عقود الأقساط
    if (searchTypes.includes('contract')) {
      const contracts = await db.installmentContract.findMany({
        where: {
          OR: [
            { contractNumber: { contains: query } },
          ],
        },
        include: {
          Customer: { select: { name: true } },
        },
        take: 10,
      })

      results.push(...contracts.map(c => ({
        type: 'contract',
        id: c.id,
        title: c.contractNumber,
        subtitle: `${c.Customer?.name || ''} - ${c.totalAmount} ر.س`,
        link: `/?section=installments&contract=${c.id}`,
        icon: 'file-signature',
      })))
    }

    // ترتيب النتائج حسب الصلة
    const sortedResults = results.sort((a, b) => {
      const aStarts = a.title.toLowerCase().startsWith(query.toLowerCase()) ? 0 : 1
      const bStarts = b.title.toLowerCase().startsWith(query.toLowerCase()) ? 0 : 1
      return aStarts - bStarts
    }).slice(0, limit)

    return NextResponse.json({
      success: true,
      data: sortedResults,
      query,
      total: sortedResults.length,
    })
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في البحث' },
      { status: 500 }
    )
  }
}

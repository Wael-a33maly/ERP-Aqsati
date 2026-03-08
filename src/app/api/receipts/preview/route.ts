import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - معاينة الإيصالات حسب الفلاتر
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // الفلاتر الأساسية
    const branchId = searchParams.get('branchId')
    const agentId = searchParams.get('agentId')
    const customerId = searchParams.get('customerId')
    const customerCodeFrom = searchParams.get('customerCodeFrom')
    const customerCodeTo = searchParams.get('customerCodeTo')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const companyId = searchParams.get('companyId')
    
    // بناء الاستعلام
    const whereClause: any = {}
    
    // فلترة حسب الشركة
    if (companyId) {
      whereClause.companyId = companyId
    }
    
    // فلترة حسب الفرع
    if (branchId) {
      whereClause.branchId = branchId
    }
    
    // فلترة حسب المندوب
    if (agentId) {
      whereClause.agentId = agentId
    }
    
    // فلترة حسب العميل
    if (customerId) {
      whereClause.customerId = customerId
    }
    
    // فلترة حسب التاريخ
    if (dateFrom || dateTo) {
      whereClause.invoiceDate = {}
      if (dateFrom) {
        whereClause.invoiceDate.gte = new Date(dateFrom)
      }
      if (dateTo) {
        whereClause.invoiceDate.lte = new Date(dateTo)
      }
    }
    
    // جلب الفواتير الأقساط مع البيانات المرتبطة
    const invoices = await db.invoice.findMany({
      where: {
        ...whereClause,
        type: 'INSTALLMENT'
      },
      include: {
        customer: {
          include: {
            zone: true,
            agent: true
          }
        },
        branch: {
          include: {
            company: true
          }
        },
        agent: true,
        items: {
          include: {
            product: true
          }
        },
        installmentContract: {
          include: {
            installments: {
              orderBy: { dueDate: 'asc' }
            }
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // حد أقصى للأداء
    })
    
    // فلترة حسب نطاق كود العميل
    let filteredInvoices = invoices
    if (customerCodeFrom || customerCodeTo) {
      filteredInvoices = invoices.filter((inv: any) => {
        const code = inv.customer?.code || ''
        if (customerCodeFrom && customerCodeTo) {
          return code >= customerCodeFrom && code <= customerCodeTo
        }
        if (customerCodeFrom) {
          return code >= customerCodeFrom
        }
        if (customerCodeTo) {
          return code <= customerCodeTo
        }
        return true
      })
    }
    
    // تجهيز البيانات للمعاينة
    const receipts = filteredInvoices.map((invoice: any) => {
      // الحصول على الشركة من الفرع
      const company = invoice.branch?.company
      
      // الحصول على الأقساط من عقد التقسيط
      const installments = invoice.installmentContract?.installments || []
      
      // حساب المدفوعات
      const totalPaid = invoice.payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0
      const remainingAmount = invoice.total - totalPaid
      
      // حساب الأقساط
      const paidInstallments = installments.filter((i: any) => i.status === 'PAID').length
      const totalInstallments = installments.length
      
      // القسط الحالي (أول قسط غير مدفوع)
      const currentInstallment = installments.find((i: any) => i.status !== 'PAID')
      
      // حساب المتبقي بعد القسط الحالي
      const previousPaidInstallments = installments.filter((i: any) => i.status === 'PAID') || []
      const previousPaidAmount = previousPaidInstallments.reduce((sum: number, i: any) => sum + (i.amount || 0), 0)
      const downPayment = invoice.installmentContract?.downPayment || 0
      const remainingAfterCurrent = invoice.total - downPayment - previousPaidAmount - (currentInstallment?.amount || 0)
      
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
        total: invoice.total,
        paidAmount: totalPaid,
        remainingAmount: remainingAmount,
        
        // بيانات العميل
        customer: {
          id: invoice.customer?.id,
          code: invoice.customer?.code,
          name: invoice.customer?.name,
          nameAr: invoice.customer?.nameAr,
          phone: invoice.customer?.phone,
          phone2: invoice.customer?.phone2,
          address: invoice.customer?.address,
          nationalId: invoice.customer?.nationalId,
          zone: invoice.customer?.zone?.nameAr || invoice.customer?.zone?.name
        },
        
        // بيانات الفرع والشركة
        branch: {
          id: invoice.branch?.id,
          name: invoice.branch?.name,
          nameAr: invoice.branch?.nameAr,
          phone: invoice.branch?.phone
        },
        company: {
          id: company?.id,
          name: company?.name,
          nameAr: company?.nameAr,
          phone: company?.phone,
          logo: company?.logo
        },
        
        // بيانات المندوب
        agent: invoice.agent ? {
          id: invoice.agent.id,
          name: invoice.agent.name,
          nameAr: invoice.agent.nameAr,
          phone: invoice.agent.phone
        } : null,
        
        // بيانات الأقساط
        installments: {
          total: totalInstallments,
          paid: paidInstallments,
          current: currentInstallment ? {
            number: installments.indexOf(currentInstallment) + 1,
            amount: currentInstallment.amount,
            dueDate: currentInstallment.dueDate
          } : null,
          remainingAfterCurrent: remainingAfterCurrent
        },
        
        // المنتجات
        items: invoice.items?.map((item: any) => ({
          name: item.product?.nameAr || item.product?.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        })) || [],
        
        // المقدم
        downPayment: downPayment
      }
    })
    
    return NextResponse.json({
      success: true,
      data: receipts,
      meta: {
        total: receipts.length,
        filters: {
          branchId,
          agentId,
          customerId,
          customerCodeFrom,
          customerCodeTo,
          dateFrom,
          dateTo
        }
      }
    })
    
  } catch (error) {
    console.error('Error fetching receipts:', error)
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء جلب البيانات'
    }, { status: 500 })
  }
}

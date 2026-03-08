import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calculateAndCreateCommission } from '@/lib/utils/commission'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { customer: { name: { contains: search } } }
      ]
    }
    if (status) {
      where.status = status
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Customer: { select: { id: true, name: true, phone: true, address: true } },
          Branch: { select: { id: true, name: true } },
          User: { select: { id: true, name: true } },
          InvoiceItem: { 
            include: { 
              Product: { select: { id: true, name: true, sku: true, salesCommission: true, salesCommissionType: true } } 
            } 
          },
          InstallmentContract: {
            include: {
              Installment: {
                orderBy: { installmentNumber: 'asc' }
              }
            }
          }
        }
      }),
      db.invoice.count({ where })
    ])

    // تحويل البيانات لإضافة installments من العقد
    const invoicesWithInstallments = invoices.map(inv => ({
      ...inv,
      customer: inv.Customer,
      branch: inv.Branch,
      agent: inv.User,
      items: inv.InvoiceItem,
      installmentContract: inv.InstallmentContract,
      installments: inv.InstallmentContract?.Installment || []
    }))

    return NextResponse.json({
      success: true,
      data: invoicesWithInstallments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ success: false, error: 'فشل في جلب الفواتير' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // الحصول على بيانات العميل لاستخراج companyId
    const customer = await db.customer.findUnique({
      where: { id: data.customerId },
      select: { companyId: true, branchId: true }
    })
    
    if (!customer) {
      return NextResponse.json({ success: false, error: 'العميل غير موجود' }, { status: 400 })
    }
    
    // توليد رقم فاتورة جديد بالتنسيق الصحيح: INV-YYYY-NNNNNN
    const year = new Date().getFullYear()
    const prefixPattern = `INV-${year}-`

    const lastInvoice = await db.invoice.findFirst({
      where: {
        invoiceNumber: { startsWith: prefixPattern }
      },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true }
    })

    let sequence = 1
    if (lastInvoice) {
      // استخراج الرقم التسلسلي من رقم الفاتورة (INV-2024-000001 → 1)
      const parts = lastInvoice.invoiceNumber.split('-')
      if (parts.length === 3) {
        const lastSequence = parseInt(parts[2], 10)
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1
        }
      }
    }

    const invoiceNumber = `INV-${year}-${String(sequence).padStart(6, '0')}`

    // حساب القيم
    const subtotal = data.items?.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0) || 0
    const discount = data.discount || 0
    const taxRate = data.taxRate || 15
    const taxAmount = Math.round((subtotal - discount) * taxRate / 100)
    const total = subtotal - discount + taxAmount

    // إنشاء الفاتورة مع الأصناف
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        companyId: customer.companyId,
        customerId: data.customerId,
        branchId: data.branchId || customer.branchId,
        agentId: data.agentId,
        type: data.type || 'CASH',
        invoiceDate: new Date(),
        subtotal,
        discount,
        taxRate,
        taxAmount,
        total,
        paidAmount: data.paidAmount || 0,
        remainingAmount: total - (data.paidAmount || 0),
        status: 'pending',
        items: {
          create: data.items?.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice
          })) || []
        }
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, salesCommission: true, salesCommissionType: true } }
          }
        },
        customer: { select: { companyId: true, branchId: true } }
      }
    })

    // حساب عمولة المندوب على المبيعات (إن وجد)
    if (data.agentId && invoice.customer) {
      try {
        let totalCommission = 0
        const totalQuantity = data.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
        
        // حساب العمولة لكل منتج له عمولة محددة
        for (const item of invoice.items) {
          if (item.product?.salesCommission && item.product.salesCommission > 0) {
            // المنتج له عمولة محددة
            if (item.product.salesCommissionType === 'PERCENTAGE') {
              totalCommission += (item.total * item.product.salesCommission / 100)
            } else {
              // مبلغ ثابت على كل قطعة
              totalCommission += (item.product.salesCommission * item.quantity)
            }
          }
        }
        
        // إذا لم يكن هناك عمولات محددة للمنتجات، نستخدم سياسة العمولة العامة
        if (totalCommission === 0) {
          // البحث عن سياسة العمولة
          const policy = await db.commissionPolicy.findFirst({
            where: {
              companyId: invoice.customer.companyId,
              OR: [
                { agentId: data.agentId },
                { branchId: data.branchId || invoice.customer.branchId, agentId: null },
                { branchId: null, agentId: null }
              ],
              type: { in: ['SALES', 'BOTH'] },
              active: true
            },
            orderBy: [
              { agentId: 'desc' },
              { branchId: 'desc' }
            ]
          })
          
          if (policy) {
            const baseAmount = policy.perItem ? totalQuantity : total
            await calculateAndCreateCommission({
              companyId: invoice.customer.companyId,
              branchId: data.branchId || invoice.customer.branchId,
              agentId: data.agentId,
              type: 'SALES',
              amount: baseAmount,
              referenceType: 'INVOICE',
              referenceId: invoice.id
            })
          }
        } else {
          // إنشاء عمولة بالقيمة المحسوبة من المنتجات
          const policy = await db.commissionPolicy.findFirst({
            where: {
              companyId: invoice.customer.companyId,
              OR: [
                { agentId: data.agentId },
                { branchId: data.branchId || invoice.customer.branchId, agentId: null },
                { branchId: null, agentId: null }
              ],
              type: { in: ['SALES', 'BOTH'] },
              active: true
            },
            orderBy: [
              { agentId: 'desc' },
              { branchId: 'desc' }
            ]
          })
          
          await db.agentCommission.create({
            data: {
              agentId: data.agentId,
              policyId: policy?.id || null,
              type: 'SALES',
              referenceType: 'INVOICE',
              referenceId: invoice.id,
              amount: totalCommission,
              status: 'pending'
            }
          })
        }
      } catch (commissionError) {
        // لا نريد فشل إنشاء الفاتورة إذا فشل حساب العمولة
        console.error('Commission calculation failed:', commissionError)
      }
    }

    // حفظ الأقساط إذا كانت الفاتورة مقسطة
    if (data.type === 'INSTALLMENT' && data.installments && data.installments.length > 0) {
      try {
        // توليد رقم عقد جديد بالتنسيق الصحيح: CNT-YYYY-NNNNNN
        const contractYear = new Date().getFullYear()
        const contractPrefix = `CNT-${contractYear}-`

        const lastContract = await db.installmentContract.findFirst({
          where: {
            contractNumber: { startsWith: contractPrefix }
          },
          orderBy: { contractNumber: 'desc' },
          select: { contractNumber: true }
        })

        let contractSequence = 1
        if (lastContract) {
          const parts = lastContract.contractNumber.split('-')
          if (parts.length === 3) {
            const lastSequence = parseInt(parts[2], 10)
            if (!isNaN(lastSequence)) {
              contractSequence = lastSequence + 1
            }
          }
        }

        const contractNumber = `CNT-${contractYear}-${String(contractSequence).padStart(6, '0')}`

        // حساب تاريخ نهاية العقد
        const lastInstallment = data.installments[data.installments.length - 1]
        const endDate = lastInstallment ? new Date(lastInstallment.dueDate) : null

        // إنشاء عقد التقسيط
        const contract = await db.installmentContract.create({
          data: {
            invoiceId: invoice.id,
            customerId: data.customerId,
            agentId: data.agentId,
            contractNumber,
            totalAmount: total,
            downPayment: data.paidAmount || 0,
            financedAmount: total - (data.paidAmount || 0),
            numberOfPayments: data.installments.length,
            paymentFrequency: 'MONTHLY',
            startDate: data.installments[0]?.dueDate ? new Date(data.installments[0].dueDate) : new Date(),
            endDate,
            status: 'active'
          }
        })

        // إنشاء الأقساط
        for (const inst of data.installments) {
          await db.installment.create({
            data: {
              contractId: contract.id,
              installmentNumber: inst.number,
              dueDate: new Date(inst.dueDate),
              amount: inst.amount,
              paidAmount: 0,
              remainingAmount: inst.amount,
              status: 'pending'
            }
          })
        }
      } catch (installmentError) {
        console.error('Installment creation failed:', installmentError)
        // لا نريد فشل إنشاء الفاتورة إذا فشل حفظ الأقساط
      }
    }

    return NextResponse.json({ success: true, data: invoice })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ success: false, error: 'فشل في إنشاء الفاتورة' }, { status: 500 })
  }
}

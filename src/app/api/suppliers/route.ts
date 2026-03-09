import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - جلب جميع الموردين
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const companyId = searchParams.get('companyId') || ''

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (companyId) {
      where.companyId = companyId
    }
    
    if (search) {
      where.OR = [
        { supplierCode: { contains: search } },
        { name: { contains: search } },
        { nameAr: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } }
      ]
    }

    const [suppliers, total] = await Promise.all([
      db.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              PurchaseInvoice: true,
              PurchaseReturn: true,
              SupplierPayment: true
            }
          }
        }
      }),
      db.supplier.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: suppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في جلب الموردين' },
      { status: 500 }
    )
  }
}

// POST - إنشاء مورد جديد
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // التحقق من البيانات المطلوبة
    if (!data.companyId || !data.name) {
      return NextResponse.json(
        { success: false, error: 'البيانات غير مكتملة' },
        { status: 400 }
      )
    }

    // توليد كود المورد
    const year = new Date().getFullYear()
    const prefix = `SUP-${year}-`
    
    const lastSupplier = await db.supplier.findFirst({
      where: {
        companyId: data.companyId,
        supplierCode: { startsWith: prefix }
      },
      orderBy: { supplierCode: 'desc' }
    })

    let sequence = 1
    if (lastSupplier) {
      const parts = lastSupplier.supplierCode.split('-')
      if (parts.length === 3) {
        sequence = parseInt(parts[2]) + 1
      }
    }

    const supplierCode = `${prefix}${String(sequence).padStart(5, '0')}`

    // إنشاء المورد
    const supplier = await db.supplier.create({
      data: {
        supplierCode,
        companyId: data.companyId,
        name: data.name,
        nameAr: data.nameAr,
        phone: data.phone,
        phone2: data.phone2,
        email: data.email,
        address: data.address,
        city: data.city,
        taxNumber: data.taxNumber,
        commercialReg: data.commercialReg,
        creditLimit: data.creditLimit || 0,
        currentBalance: data.openingBalance || 0,
        balanceType: data.balanceType || 'CREDIT',
        paymentTerms: data.paymentTerms || 0,
        currency: data.currency || 'EGP',
        notes: data.notes,
        active: data.active !== false
      }
    })

    // إنشاء قيد رصيد أول المدة إذا وجد
    if (data.hasOpeningBalance && data.openingBalance > 0) {
      const transactionNumber = `OPN-${year}-${String(sequence).padStart(6, '0')}`
      
      await db.supplierTransaction.create({
        data: {
          companyId: data.companyId,
          supplierId: supplier.id,
          transactionType: 'OPENING',
          transactionNumber,
          transactionDate: new Date(),
          debit: data.balanceType === 'DEBIT' ? data.openingBalance : 0,
          credit: data.balanceType === 'CREDIT' ? data.openingBalance : 0,
          balance: data.openingBalance,
          notes: 'رصيد أول المدة'
        }
      })
    }

    return NextResponse.json({ success: true, data: supplier })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء المورد' },
      { status: 500 }
    )
  }
}

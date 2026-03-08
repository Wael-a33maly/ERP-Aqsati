import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - جلب جميع العملاء
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const companyId = searchParams.get('companyId')
    const branchId = searchParams.get('branchId')
    const governorateId = searchParams.get('governorateId')
    const cityId = searchParams.get('cityId')
    const areaId = searchParams.get('areaId')
    const active = searchParams.get('active')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { code: { contains: search } },
          { phone: { contains: search } },
        ]
      }),
      ...(companyId && { companyId }),
      ...(branchId && { branchId }),
      ...(governorateId && { governorateId }),
      ...(cityId && { cityId }),
      ...(areaId && { areaId }),
      ...(active !== null && { active: active === 'true' })
    }

    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Company: {
            select: { id: true, name: true }
          },
          Branch: {
            select: { id: true, name: true }
          },
          Zone: {
            select: { id: true, name: true, nameAr: true }
          },
          User: {
            select: { id: true, name: true }
          }
        }
      }),
      db.customer.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - إنشاء عميل جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      companyId, branchId, name, code, phone, phone2, address, nationalId, 
      creditLimit, notes, governorateId, cityId, areaId, agentId,
      openingBalance 
    } = body

    // التحقق من وجود الشركة
    const company = await db.company.findUnique({
      where: { id: companyId }
    })

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'الشركة غير موجودة' },
        { status: 400 }
      )
    }

    // التحقق من عدم تكرار الكود في نفس الشركة
    const existingCustomer = await db.customer.findFirst({
      where: { companyId, code }
    })

    if (existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'كود العميل موجود مسبقاً في هذه الشركة' },
        { status: 400 }
      )
    }

    // إنشاء العميل
    const customer = await db.customer.create({
      data: {
        companyId,
        branchId: branchId || null,
        name,
        nameAr: name,
        code,
        phone,
        phone2,
        address,
        nationalId,
        creditLimit: creditLimit || 0,
        balance: openingBalance?.total || 0,
        notes,
        governorateId: governorateId || null,
        cityId: cityId || null,
        areaId: areaId || null,
        agentId: agentId || null,
        active: true
      },
      include: {
        Company: {
          select: { id: true, name: true }
        },
        Branch: {
          select: { id: true, name: true }
        },
        Zone: {
          select: { id: true, name: true, nameAr: true }
        },
        User: {
          select: { id: true, name: true }
        }
      }
    })

    // معالجة الرصيد الافتتاحي
    if (openingBalance && openingBalance.items && openingBalance.items.length > 0) {
      // إنشاء فاتورة رصيد افتتاحي
      const invoiceNumber = `OB-${Date.now()}`
      const invoice = await db.invoice.create({
        data: {
          companyId,
          branchId: branchId || null,
          customerId: customer.id,
          agentId: agentId || null,
          invoiceNumber,
          invoiceDate: new Date(),
          type: 'OPENING_BALANCE',
          status: 'partial',
          subtotal: openingBalance.total,
          discount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: openingBalance.total,
          paidAmount: 0,
          remainingAmount: openingBalance.total,
          notes: 'رصيد افتتاحي'
        }
      })

      // إنشاء عقد أقساط للرصيد الافتتاحي
      const contractNumber = `OBC-${Date.now()}`
      const contract = await db.installmentContract.create({
        data: {
          invoiceId: invoice.id,
          customerId: customer.id,
          agentId: agentId || null,
          contractNumber,
          contractDate: new Date(),
          totalAmount: openingBalance.total,
          downPayment: 0,
          financedAmount: openingBalance.total,
          numberOfPayments: openingBalance.items.length,
          paymentFrequency: 'CUSTOM',
          interestRate: 0,
          interestAmount: 0,
          startDate: new Date(),
          status: 'active',
          notes: 'عقد أقساط رصيد افتتاحي'
        }
      })

      // إنشاء الأقساط
      for (let i = 0; i < openingBalance.items.length; i++) {
        const item = openingBalance.items[i]
        await db.installment.create({
          data: {
            contractId: contract.id,
            installmentNumber: i + 1,
            dueDate: new Date(item.date),
            amount: item.amount,
            paidAmount: 0,
            remainingAmount: item.amount,
            status: 'pending',
            notes: item.goodsNotes || null
          }
        })
      }
    }

    return NextResponse.json({ success: true, data: customer })
  } catch (error: any) {
    console.error('Customer creation error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

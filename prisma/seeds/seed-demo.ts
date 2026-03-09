import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 بدء إضافة البيانات التجريبية...')

  // 1. إنشاء شركة
  const company = await prisma.company.create({
    data: {
      name: 'شركة الأقساط التجريبية',
      nameAr: 'شركة الأقساط التجريبية',
      code: 'DEMO-001',
      email: 'info@demo-company.com',
      phone: '01012345678',
      address: 'القاهرة - مصر',
      taxNumber: '123456789',
      currency: 'EGP',
      subscriptionStatus: 'active',
      planType: 'premium',
      active: true,
    },
  })
  console.log('✅ تم إنشاء الشركة:', company.name)

  // 2. إنشاء فروع
  const branches = await Promise.all([
    prisma.branch.create({
      data: {
        companyId: company.id,
        name: 'الفرع الرئيسي',
        nameAr: 'الفرع الرئيسي',
        code: 'BR-001',
        address: 'القاهرة - وسط البلد',
        phone: '01011111111',
        isMain: true,
        active: true,
      },
    }),
    prisma.branch.create({
      data: {
        companyId: company.id,
        name: 'فرع الإسكندرية',
        nameAr: 'فرع الإسكندرية',
        code: 'BR-002',
        address: 'الإسكندرية - سموحة',
        phone: '01022222222',
        isMain: false,
        active: true,
      },
    }),
    prisma.branch.create({
      data: {
        companyId: company.id,
        name: 'فرع الجيزة',
        nameAr: 'فرع الجيزة',
        code: 'BR-003',
        address: 'الجيزة - الدقي',
        phone: '01033333333',
        isMain: false,
        active: true,
      },
    }),
  ])
  console.log('✅ تم إنشاء', branches.length, 'فروع')

  // 3. إنشاء المستخدمين
  const hashedPassword = await bcrypt.hash('demo123456', 10)
  
  const users = await Promise.all([
    // مدير الشركة
    prisma.user.create({
      data: {
        companyId: company.id,
        email: 'company-admin@demo.com',
        name: 'أحمد محمد - مدير الشركة',
        phone: '01111111111',
        password: hashedPassword,
        role: 'COMPANY_ADMIN',
        active: true,
      },
    }),
    // مدير فرع
    prisma.user.create({
      data: {
        companyId: company.id,
        branchId: branches[0].id,
        email: 'branch-manager@demo.com',
        name: 'محمد علي - مدير الفرع',
        phone: '01112222222',
        password: hashedPassword,
        role: 'BRANCH_MANAGER',
        active: true,
      },
    }),
    // مندوبين
    prisma.user.create({
      data: {
        companyId: company.id,
        branchId: branches[0].id,
        email: 'agent1@demo.com',
        name: 'سعيد أحمد - مندوب',
        phone: '01113333333',
        password: hashedPassword,
        role: 'AGENT',
        active: true,
      },
    }),
    prisma.user.create({
      data: {
        companyId: company.id,
        branchId: branches[1].id,
        email: 'agent2@demo.com',
        name: 'كريم محمود - مندوب',
        phone: '01114444444',
        password: hashedPassword,
        role: 'AGENT',
        active: true,
      },
    }),
    // محصلين
    prisma.user.create({
      data: {
        companyId: company.id,
        branchId: branches[0].id,
        email: 'collector1@demo.com',
        name: 'عبدالله سالم - محصل',
        phone: '01115555555',
        password: hashedPassword,
        role: 'COLLECTOR',
        active: true,
      },
    }),
    prisma.user.create({
      data: {
        companyId: company.id,
        branchId: branches[1].id,
        email: 'collector2@demo.com',
        name: 'فهد ناصر - محصل',
        phone: '01116666666',
        password: hashedPassword,
        role: 'COLLECTOR',
        active: true,
      },
    }),
  ])
  console.log('✅ تم إنشاء', users.length, 'مستخدمين')

  // 4. إنشاء محافظات ومدن ومناطق
  const governorate = await prisma.governorate.create({
    data: {
      companyId: company.id,
      name: 'القاهرة',
      nameAr: 'القاهرة',
      code: 'CAI',
      active: true,
    },
  })

  const city = await prisma.city.create({
    data: {
      companyId: company.id,
      governorateId: governorate.id,
      name: 'القاهرة',
      nameAr: 'القاهرة',
      code: 'CAI-01',
      active: true,
    },
  })

  const areas = await Promise.all([
    prisma.area.create({
      data: {
        companyId: company.id,
        cityId: city.id,
        name: 'وسط البلد',
        nameAr: 'وسط البلد',
        code: 'AREA-001',
        active: true,
      },
    }),
    prisma.area.create({
      data: {
        companyId: company.id,
        cityId: city.id,
        name: 'المهندسين',
        nameAr: 'المهندسين',
        code: 'AREA-002',
        active: true,
      },
    }),
    prisma.area.create({
      data: {
        companyId: company.id,
        cityId: city.id,
        name: 'مدينة نصر',
        nameAr: 'مدينة نصر',
        code: 'AREA-003',
        active: true,
      },
    }),
  ])

  const zones = await Promise.all([
    prisma.zone.create({
      data: {
        companyId: company.id,
        branchId: branches[0].id,
        name: 'منطقة 1 - وسط البلد',
        nameAr: 'منطقة 1 - وسط البلد',
        code: 'ZONE-001',
        active: true,
      },
    }),
    prisma.zone.create({
      data: {
        companyId: company.id,
        branchId: branches[0].id,
        name: 'منطقة 2 - المهندسين',
        nameAr: 'منطقة 2 - المهندسين',
        code: 'ZONE-002',
        active: true,
      },
    }),
    prisma.zone.create({
      data: {
        companyId: company.id,
        branchId: branches[1].id,
        name: 'منطقة 3 - الإسكندرية',
        nameAr: 'منطقة 3 - الإسكندرية',
        code: 'ZONE-003',
        active: true,
      },
    }),
  ])
  console.log('✅ تم إنشاء المناطق الجغرافية')

  // 5. إنشاء العملاء (20 عميل)
  const customerNames = [
    'محمد أحمد', 'أحمد علي', 'سعيد محمود', 'كريم حسن', 'عبدالله سالم',
    'فاطمة محمد', 'سارة أحمد', 'نورا علي', 'هدى محمود', 'مريم حسن',
    'علي عبدالله', 'خالد سعيد', 'عمرو كريم', 'حسن محمد', 'يوسف أحمد',
    'سمير علي', 'رامز محمود', 'أشرف حسن', 'طارق سالم', 'محمود عبدالله'
  ]
  
  const customers = await Promise.all(
    customerNames.map((name, i) =>
      prisma.customer.create({
        data: {
          companyId: company.id,
          branchId: branches[i % 3].id,
          zoneId: zones[i % 3].id,
          areaId: areas[i % 3].id,
          governorateId: governorate.id,
          cityId: city.id,
          agentId: users[2 + (i % 2)].id, // مندوبين
          code: `CUST-${String(i + 1).padStart(4, '0')}`,
          name: name,
          phone: `012${String(i).padStart(8, '0')}`,
          phone2: `015${String(i).padStart(8, '0')}`,
          address: `عنوان العميل ${i + 1} - ${areas[i % 3].name}`,
          nationalId: `3${String(i).padStart(13, '0')}`,
          creditLimit: 50000,
          balance: 0,
          active: true,
        },
      })
    )
  )
  console.log('✅ تم إنشاء', customers.length, 'عميل')

  // 6. إنشاء منتجات
  const products = await Promise.all([
    prisma.product.create({
      data: {
        companyId: company.id,
        sku: 'PROD-001',
        name: 'لابتوب HP ProBook',
        nameAr: 'لابتوب HP ProBook',
        unit: 'piece',
        costPrice: 15000,
        sellPrice: 20000,
        active: true,
      },
    }),
    prisma.product.create({
      data: {
        companyId: company.id,
        sku: 'PROD-002',
        name: 'لابتوب Dell Inspiron',
        nameAr: 'لابتوب Dell Inspiron',
        unit: 'piece',
        costPrice: 18000,
        sellPrice: 25000,
        active: true,
      },
    }),
    prisma.product.create({
      data: {
        companyId: company.id,
        sku: 'PROD-003',
        name: 'جوال Samsung Galaxy S24',
        nameAr: 'جوال Samsung Galaxy S24',
        unit: 'piece',
        costPrice: 20000,
        sellPrice: 28000,
        active: true,
      },
    }),
    prisma.product.create({
      data: {
        companyId: company.id,
        sku: 'PROD-004',
        name: 'جوال iPhone 15',
        nameAr: 'جوال iPhone 15',
        unit: 'piece',
        costPrice: 35000,
        sellPrice: 45000,
        active: true,
      },
    }),
    prisma.product.create({
      data: {
        companyId: company.id,
        sku: 'PROD-005',
        name: 'تلفزيون Samsung 55 بوصة',
        nameAr: 'تلفزيون Samsung 55 بوصة',
        unit: 'piece',
        costPrice: 12000,
        sellPrice: 16000,
        active: true,
      },
    }),
  ])
  console.log('✅ تم إنشاء', products.length, 'منتج')

  // 7. إنشاء فواتير وعقود أقساط
  const today = new Date()
  const installmentTypes = [
    { status: 'paid', paidPercent: 100, delay: -60 },      // مدفوعة بالكامل
    { status: 'paid', paidPercent: 100, delay: -30 },      // مدفوعة بالكامل
    { status: 'unpaid', paidPercent: 0, delay: 10 },       // غير مدفوعة (مستقبلية)
    { status: 'unpaid', paidPercent: 0, delay: 15 },       // غير مدفوعة (مستقبلية)
    { status: 'unpaid', paidPercent: 0, delay: 20 },       // غير مدفوعة (مستقبلية)
    { status: 'partial', paidPercent: 50, delay: -10 },    // مدفوعة جزئياً
    { status: 'partial', paidPercent: 30, delay: -5 },     // مدفوعة جزئياً
    { status: 'overdue', paidPercent: 0, delay: -30 },     // متأخرة
    { status: 'overdue', paidPercent: 25, delay: -45 },    // متأخرة مع دفع جزئي
    { status: 'overdue', paidPercent: 0, delay: -60 },     // متأخرة كثيراً
    { status: 'cancelled', paidPercent: 0, delay: 0 },     // ملغاة
    { status: 'cancelled', paidPercent: 0, delay: 0 },     // ملغاة
  ]

  let invoiceCounter = 1
  let contractCounter = 1

  for (let i = 0; i < 12; i++) {
    const customer = customers[i]
    const product = products[i % products.length]
    const branch = branches[i % 3]
    const agent = users[2 + (i % 2)]
    const type = installmentTypes[i]

    const totalAmount = product.sellPrice + (i * 1000) // تنويع الأسعار
    const downPayment = totalAmount * 0.2 // 20% دفعة مقدمة
    const financedAmount = totalAmount - downPayment
    const numberOfPayments = 6 + (i % 6) // من 6 إلى 12 قسط
    const installmentAmount = Math.ceil(financedAmount / numberOfPayments)

    // إنشاء الفاتورة
    const invoice = await prisma.invoice.create({
      data: {
        companyId: company.id,
        branchId: branch.id,
        customerId: customer.id,
        agentId: agent.id,
        invoiceNumber: `INV-${String(invoiceCounter++).padStart(5, '0')}`,
        invoiceDate: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000), // قبل 90 يوم
        dueDate: new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000),
        type: 'INSTALLMENT',
        status: 'confirmed',
        subtotal: totalAmount,
        discount: 0,
        taxRate: 0,
        taxAmount: 0,
        total: totalAmount,
        paidAmount: type.status === 'paid' ? totalAmount : type.paidPercent > 0 ? totalAmount * type.paidPercent / 100 : 0,
        remainingAmount: type.status === 'paid' ? 0 : totalAmount - (type.paidPercent > 0 ? totalAmount * type.paidPercent / 100 : 0),
      },
    })

    // إنشاء عقد الأقساط
    const contract = await prisma.installmentContract.create({
      data: {
        invoiceId: invoice.id,
        customerId: customer.id,
        agentId: agent.id,
        contractNumber: `CNT-${String(contractCounter++).padStart(5, '0')}`,
        contractDate: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
        totalAmount: totalAmount,
        downPayment: downPayment,
        financedAmount: financedAmount,
        numberOfPayments: numberOfPayments,
        paymentFrequency: 'MONTHLY',
        interestRate: 0,
        interestAmount: 0,
        startDate: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000),
        status: type.status === 'cancelled' ? 'cancelled' : 'active',
      },
    })

    // إنشاء الأقساط
    for (let j = 0; j < numberOfPayments; j++) {
      const dueDate = new Date(today.getTime() + (type.delay + j * 30) * 24 * 60 * 60 * 1000)
      const isPaid = type.status === 'paid' || (type.paidPercent > 0 && j < Math.floor(numberOfPayments * type.paidPercent / 100))
      const isCancelled = type.status === 'cancelled'
      
      await prisma.installment.create({
        data: {
          contractId: contract.id,
          installmentNumber: j + 1,
          dueDate: dueDate,
          amount: installmentAmount,
          paidAmount: isPaid ? installmentAmount : 0,
          remainingAmount: isPaid ? 0 : installmentAmount,
          status: isCancelled ? 'cancelled' : isPaid ? 'paid' : 'pending',
          paidDate: isPaid ? new Date(dueDate.getTime() - 5 * 24 * 60 * 60 * 1000) : null,
        },
      })
    }
  }
  console.log('✅ تم إنشاء الفواتير والعقود والأقساط')

  // 8. إحصائيات
  const installmentsCount = await prisma.installment.count()
  const contractsCount = await prisma.installmentContract.count()
  
  console.log('\n📊 ملخص البيانات:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`🏢 الشركة: ${company.name}`)
  console.log(`📍 الفروع: ${branches.length}`)
  console.log(`👥 المستخدمين: ${users.length}`)
  console.log(`👤 العملاء: ${customers.length}`)
  console.log(`📦 المنتجات: ${products.length}`)
  console.log(`📄 العقود: ${contractsCount}`)
  console.log(`💰 الأقساط: ${installmentsCount}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n✅ تم إضافة البيانات التجريبية بنجاح!')
  
  console.log('\n🔑 بيانات الدخول:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('مدير الشركة: company-admin@demo.com / demo123456')
  console.log('مدير الفرع: branch-manager@demo.com / demo123456')
  console.log('مندوب: agent1@demo.com / demo123456')
  console.log('محصل: collector1@demo.com / demo123456')
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 بدء إضافة البيانات التجريبية...');

  // حذف البيانات القديمة
  console.log('🗑️ حذف البيانات القديمة...');
  await prisma.installmentPayment.deleteMany({});
  await prisma.installment.deleteMany({});
  await prisma.installmentContract.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.productCategory.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.area.deleteMany({});
  await prisma.city.deleteMany({});
  await prisma.governorate.deleteMany({});
  await prisma.zone.deleteMany({});
  await prisma.warehouse.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.branch.deleteMany({});
  await prisma.company.deleteMany({});

  // إنشاء خطة اشتراك
  console.log('📦 إنشاء خطة الاشتراك...');
  const plan = await prisma.subscriptionPlan.upsert({
    where: { code: 'PREMIUM' },
    update: {},
    create: {
      name: 'Premium Plan',
      nameAr: 'الباقة المميزة',
      code: 'PREMIUM',
      description: 'Full featured plan for growing businesses',
      descriptionAr: 'باقة متكاملة للأعمال المتنامية',
      price: 299,
      currency: 'EGP',
      billingCycle: 'MONTHLY',
      trialDays: 14,
      isPopular: true,
      isDefault: false,
      active: true,
      sortOrder: 1,
    },
  });

  // إنشاء الشركة
  console.log('🏢 إنشاء الشركة...');
  const company = await prisma.company.create({
    data: {
      name: 'مؤسسة الأمل للأجهزة الكهربائية',
      nameAr: 'مؤسسة الأمل للأجهزة الكهربائية',
      code: 'ALAML-001',
      email: 'info@alaml-eg.com',
      phone: '01012345678',
      address: 'شارع الجيش، مدينة نصر، القاهرة',
      taxNumber: '123456789',
      discountEnabled: true,
      taxRate: 14,
      currency: 'EGP',
      subscriptionStatus: 'active',
      planType: 'premium',
      active: true,
    },
  });

  // إنشاء اشتراك للشركة
  console.log('💳 إنشاء الاشتراك...');
  await prisma.subscription.create({
    data: {
      companyId: company.id,
      planId: plan.id,
      status: 'active',
      billingCycle: 'MONTHLY',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      originalPrice: 299,
      discountPercent: 0,
      finalPrice: 299,
      currency: 'EGP',
      autoRenew: true,
    },
  });

  // إنشاء الفرع الرئيسي
  console.log('🏪 إنشاء الفروع...');
  const mainBranch = await prisma.branch.create({
    data: {
      companyId: company.id,
      name: 'الفرع الرئيسي - مدينة نصر',
      nameAr: 'الفرع الرئيسي - مدينة نصر',
      code: 'BR001',
      address: 'شارع الجيش، مدينة نصر، القاهرة',
      phone: '01012345678',
      isMain: true,
      active: true,
    },
  });

  const branch2 = await prisma.branch.create({
    data: {
      companyId: company.id,
      name: 'فرع المعادي',
      nameAr: 'فرع المعادي',
      code: 'BR002',
      address: 'شارع المصري، المعادي، القاهرة',
      phone: '01098765432',
      isMain: false,
      active: true,
    },
  });

  // إنشاء المستخدمين
  console.log('👥 إنشاء المستخدمين...');
  const hashedPassword = await bcrypt.hash('123456', 10);

  const adminUser = await prisma.user.create({
    data: {
      companyId: company.id,
      branchId: mainBranch.id,
      email: 'admin@alaml-eg.com',
      password: hashedPassword,
      name: 'أحمد محمد علي',
      nameAr: 'أحمد محمد علي',
      phone: '01011111111',
      role: 'ADMIN',
      active: true,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      companyId: company.id,
      branchId: mainBranch.id,
      email: 'manager@alaml-eg.com',
      password: hashedPassword,
      name: 'محمد عبدالله',
      nameAr: 'محمد عبدالله',
      phone: '01022222222',
      role: 'MANAGER',
      active: true,
    },
  });

  const agentUser = await prisma.user.create({
    data: {
      companyId: company.id,
      branchId: mainBranch.id,
      email: 'agent@alaml-eg.com',
      password: hashedPassword,
      name: 'خالد إبراهيم',
      nameAr: 'خالد إبراهيم',
      phone: '01033333333',
      role: 'AGENT',
      active: true,
    },
  });

  const accountantUser = await prisma.user.create({
    data: {
      companyId: company.id,
      branchId: mainBranch.id,
      email: 'accountant@alaml-eg.com',
      password: hashedPassword,
      name: 'سارة أحمد',
      nameAr: 'سارة أحمد',
      phone: '01044444444',
      role: 'ACCOUNTANT',
      active: true,
    },
  });

  // إنشاء المحافظات والمدن
  console.log('🗺️ إنشاء المناطق الجغرافية...');
  const governorate = await prisma.governorate.create({
    data: {
      companyId: company.id,
      name: 'القاهرة',
      nameAr: 'القاهرة',
      code: 'CAI',
      active: true,
    },
  });

  const city = await prisma.city.create({
    data: {
      companyId: company.id,
      governorateId: governorate.id,
      name: 'مدينة نصر',
      nameAr: 'مدينة نصر',
      code: 'NASR',
      active: true,
    },
  });

  const area = await prisma.area.create({
    data: {
      companyId: company.id,
      cityId: city.id,
      name: 'منطقة الأمل',
      nameAr: 'منطقة الأمل',
      code: 'AREA001',
      active: true,
    },
  });

  const zone = await prisma.zone.create({
    data: {
      companyId: company.id,
      branchId: mainBranch.id,
      name: 'منطقة التوزيع الأولى',
      nameAr: 'منطقة التوزيع الأولى',
      code: 'ZONE001',
      description: 'تشمل مدينة نصر وحدائق القبة',
      active: true,
    },
  });

  // إنشاء المخزن
  console.log('📦 إنشاء المخازن...');
  const warehouse = await prisma.warehouse.create({
    data: {
      companyId: company.id,
      branchId: mainBranch.id,
      name: 'المخزن الرئيسي',
      nameAr: 'المخزن الرئيسي',
      code: 'WH001',
      address: 'شارع التسعين، مدينة نصر',
      isMain: true,
      active: true,
    },
  });

  // إنشاء فئات المنتجات
  console.log('🏷️ إنشاء فئات المنتجات...');
  const categoryTV = await prisma.productCategory.create({
    data: {
      companyId: company.id,
      name: 'تلفزيونات',
      nameAr: 'تلفزيونات',
      code: 'CAT-TV',
      active: true,
    },
  });

  const categoryWasher = await prisma.productCategory.create({
    data: {
      companyId: company.id,
      name: 'غسالات',
      nameAr: 'غسالات',
      code: 'CAT-WASH',
      active: true,
    },
  });

  const categoryFridge = await prisma.productCategory.create({
    data: {
      companyId: company.id,
      name: 'ثلاجات',
      nameAr: 'ثلاجات',
      code: 'CAT-FRIDGE',
      active: true,
    },
  });

  const categoryAC = await prisma.productCategory.create({
    data: {
      companyId: company.id,
      name: 'تكييفات',
      nameAr: 'تكييفات',
      code: 'CAT-AC',
      active: true,
    },
  });

  // إنشاء المنتجات
  console.log('🛒 إنشاء المنتجات...');
  const products = await Promise.all([
    prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: categoryTV.id,
        sku: 'TV-001',
        name: 'تلفزيون سامسونج 55 بوصة سمارت',
        nameAr: 'تلفزيون سامسونج 55 بوصة سمارت',
        description: 'تلفزيون سمارت 4K مع تقنية HDR',
        unit: 'piece',
        costPrice: 12000,
        sellPrice: 16500,
        minPrice: 15000,
        barcode: '8801643556789',
        salesCommission: 2,
        salesCommissionType: 'PERCENTAGE',
        active: true,
      },
    }),
    prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: categoryTV.id,
        sku: 'TV-002',
        name: 'تلفزيون ال جي 43 بوصة سمارت',
        nameAr: 'تلفزيون ال جي 43 بوصة سمارت',
        description: 'تلفزيون سمارت فول HD',
        unit: 'piece',
        costPrice: 8000,
        sellPrice: 11000,
        minPrice: 10000,
        barcode: '8801643556790',
        salesCommission: 2,
        salesCommissionType: 'PERCENTAGE',
        active: true,
      },
    }),
    prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: categoryWasher.id,
        sku: 'WASH-001',
        name: 'غسالة سامسونج 10 كيلو أوتوماتيك',
        nameAr: 'غسالة سامسونج 10 كيلو أوتوماتيك',
        description: 'غسالة أوتوماتيك مع تقنية EcoBubble',
        unit: 'piece',
        costPrice: 15000,
        sellPrice: 21000,
        minPrice: 19500,
        barcode: '8801643556791',
        salesCommission: 2.5,
        salesCommissionType: 'PERCENTAGE',
        active: true,
      },
    }),
    prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: categoryWasher.id,
        sku: 'WASH-002',
        name: 'غسالة ويرلبول 8 كيلو',
        nameAr: 'غسالة ويرلبول 8 كيلو',
        description: 'غسالة أوتوماتيك مع تقنية第六感',
        unit: 'piece',
        costPrice: 10000,
        sellPrice: 14000,
        minPrice: 13000,
        barcode: '8801643556792',
        salesCommission: 2,
        salesCommissionType: 'PERCENTAGE',
        active: true,
      },
    }),
    prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: categoryFridge.id,
        sku: 'FRIDGE-001',
        name: 'ثلاجة شارب 18 قدم نو فروست',
        nameAr: 'ثلاجة شارب 18 قدم نو فروست',
        description: 'ثلاجة نو فروست مع نظام تبريد متعدد',
        unit: 'piece',
        costPrice: 13000,
        sellPrice: 18000,
        minPrice: 17000,
        barcode: '8801643556793',
        salesCommission: 2,
        salesCommissionType: 'PERCENTAGE',
        active: true,
      },
    }),
    prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: categoryFridge.id,
        sku: 'FRIDGE-002',
        name: 'ثلاجة ال جي 14 قدم',
        nameAr: 'ثلاجة ال جي 14 قدم',
        description: 'ثلاجة بتقنية Smart Inverter',
        unit: 'piece',
        costPrice: 9000,
        sellPrice: 12500,
        minPrice: 11500,
        barcode: '8801643556794',
        salesCommission: 2,
        salesCommissionType: 'PERCENTAGE',
        active: true,
      },
    }),
    prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: categoryAC.id,
        sku: 'AC-001',
        name: 'تكييف شارب 1.5 حصان سبليت',
        nameAr: 'تكييف شارب 1.5 حصان سبليت',
        description: 'تكييف سبليت مع تقنة البلازما',
        unit: 'piece',
        costPrice: 11000,
        sellPrice: 15500,
        minPrice: 14500,
        barcode: '8801643556795',
        salesCommission: 2.5,
        salesCommissionType: 'PERCENTAGE',
        active: true,
      },
    }),
    prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: categoryAC.id,
        sku: 'AC-002',
        name: 'تكييف كريير 2 حصان سبليت',
        nameAr: 'تكييف كريير 2 حصان سبليت',
        description: 'تكييف سبليت انفرتر موفر للطاقة',
        unit: 'piece',
        costPrice: 15000,
        sellPrice: 21000,
        minPrice: 19500,
        barcode: '8801643556796',
        salesCommission: 3,
        salesCommissionType: 'PERCENTAGE',
        active: true,
      },
    }),
  ]);

  // إنشاء المخزون للمنتجات
  console.log('📦 إنشاء المخزون...');
  for (const product of products) {
    await prisma.inventory.create({
      data: {
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: Math.floor(Math.random() * 50) + 10,
        reservedQuantity: 0,
        minQuantity: 5,
        maxQuantity: 100,
        avgCost: product.costPrice,
        totalCost: product.costPrice * 20,
      },
    });
  }

  // إنشاء العملاء
  console.log('👥 إنشاء العملاء...');
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        companyId: company.id,
        branchId: mainBranch.id,
        governorateId: governorate.id,
        cityId: city.id,
        areaId: area.id,
        zoneId: zone.id,
        agentId: agentUser.id,
        code: 'CUST001',
        name: 'محمد السيد أحمد',
        nameAr: 'محمد السيد أحمد',
        phone: '01234567890',
        phone2: '01123456789',
        address: 'شارع عباس العقاد، مدينة نصر',
        nationalId: '29501011234567',
        creditLimit: 50000,
        balance: 15000,
        notes: 'عميل مميز - سجل سداد جيد',
        active: true,
      },
    }),
    prisma.customer.create({
      data: {
        companyId: company.id,
        branchId: mainBranch.id,
        governorateId: governorate.id,
        cityId: city.id,
        areaId: area.id,
        zoneId: zone.id,
        agentId: agentUser.id,
        code: 'CUST002',
        name: 'أحمد علي محمود',
        nameAr: 'أحمد علي محمود',
        phone: '01298765432',
        address: 'شارع الطيران، مدينة نصر',
        nationalId: '29805102345678',
        creditLimit: 30000,
        balance: 8500,
        notes: 'عميل جديد',
        active: true,
      },
    }),
    prisma.customer.create({
      data: {
        companyId: company.id,
        branchId: mainBranch.id,
        governorateId: governorate.id,
        cityId: city.id,
        areaId: area.id,
        zoneId: zone.id,
        agentId: agentUser.id,
        code: 'CUST003',
        name: 'فاطمة حسن محمد',
        nameAr: 'فاطمة حسن محمد',
        phone: '01187654321',
        phone2: '01023456789',
        address: 'شارع الياسمين، مدينة نصر',
        nationalId: '29203033456789',
        creditLimit: 40000,
        balance: 0,
        notes: 'عميلة مميزة - تسدد في الموعد',
        active: true,
      },
    }),
  ]);

  // إنشاء فواتير مع عقود أقساط
  console.log('📄 إنشاء الفواتير والأقساط...');
  
  // فاتورة 1 - تلفزيون سامسونج بالتقسيط
  const invoice1 = await prisma.invoice.create({
    data: {
      companyId: company.id,
      branchId: mainBranch.id,
      customerId: customers[0].id,
      agentId: agentUser.id,
      invoiceNumber: 'INV-2025-001',
      invoiceDate: new Date('2025-01-15'),
      dueDate: new Date('2025-02-15'),
      type: 'INSTALLMENT',
      status: 'partial',
      subtotal: 16500,
      discount: 500,
      taxRate: 14,
      taxAmount: 2240,
      total: 18240,
      paidAmount: 5000,
      remainingAmount: 13240,
      notes: 'فاتورة تلفزيون بالتقسيط على 6 أشهر',
    },
  });

  // إنشاء عقد الأقساط للفاتورة 1
  const contract1 = await prisma.installmentContract.create({
    data: {
      invoiceId: invoice1.id,
      customerId: customers[0].id,
      agentId: agentUser.id,
      contractNumber: 'CONT-2025-001',
      contractDate: new Date('2025-01-15'),
      totalAmount: 18240,
      downPayment: 5000,
      financedAmount: 13240,
      numberOfPayments: 6,
      paymentFrequency: 'MONTHLY',
      interestRate: 5,
      interestAmount: 662,
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-07-01'),
      status: 'active',
      notes: 'عقد تقسيط تلفزيون سامسونج',
    },
  });

  // إنشاء الأقساط للعقد 1
  const installmentAmount = (13240 + 662) / 6;
  for (let i = 1; i <= 6; i++) {
    const dueDate = new Date(2025, 1 + i, 1); // بداية من فبراير
    const isPaid = i <= 2; // أول قسطين مدفوعين
    await prisma.installment.create({
      data: {
        contractId: contract1.id,
        installmentNumber: i,
        dueDate: dueDate,
        amount: Math.round(installmentAmount * 100) / 100,
        paidAmount: isPaid ? Math.round(installmentAmount * 100) / 100 : 0,
        remainingAmount: isPaid ? 0 : Math.round(installmentAmount * 100) / 100,
        status: isPaid ? 'paid' : 'pending',
        paidDate: isPaid ? new Date(2025, 1 + i - 1, 15) : null,
      },
    });
  }

  // فاتورة 2 - غسالة بالتقسيط
  const invoice2 = await prisma.invoice.create({
    data: {
      companyId: company.id,
      branchId: mainBranch.id,
      customerId: customers[1].id,
      agentId: agentUser.id,
      invoiceNumber: 'INV-2025-002',
      invoiceDate: new Date('2025-02-01'),
      dueDate: new Date('2025-03-01'),
      type: 'INSTALLMENT',
      status: 'partial',
      subtotal: 21000,
      discount: 1000,
      taxRate: 14,
      taxAmount: 2800,
      total: 22800,
      paidAmount: 8000,
      remainingAmount: 14800,
      notes: 'فاتورة غسالة بالتقسيط على 12 شهر',
    },
  });

  const contract2 = await prisma.installmentContract.create({
    data: {
      invoiceId: invoice2.id,
      customerId: customers[1].id,
      agentId: agentUser.id,
      contractNumber: 'CONT-2025-002',
      contractDate: new Date('2025-02-01'),
      totalAmount: 22800,
      downPayment: 8000,
      financedAmount: 14800,
      numberOfPayments: 12,
      paymentFrequency: 'MONTHLY',
      interestRate: 8,
      interestAmount: 1184,
      startDate: new Date('2025-03-01'),
      endDate: new Date('2026-02-01'),
      status: 'active',
      notes: 'عقد تقسيط غسالة سامسونج',
    },
  });

  // إنشاء الأقساط للعقد 2
  const installmentAmount2 = (14800 + 1184) / 12;
  for (let i = 1; i <= 12; i++) {
    const dueDate = new Date(2025, 2 + i, 1); // بداية من مارس
    const isPaid = i <= 1; // أول قسط مدفوع
    await prisma.installment.create({
      data: {
        contractId: contract2.id,
        installmentNumber: i,
        dueDate: dueDate,
        amount: Math.round(installmentAmount2 * 100) / 100,
        paidAmount: isPaid ? Math.round(installmentAmount2 * 100) / 100 : 0,
        remainingAmount: isPaid ? 0 : Math.round(installmentAmount2 * 100) / 100,
        status: isPaid ? 'paid' : 'pending',
        paidDate: isPaid ? new Date(2025, 2 + i - 1, 10) : null,
      },
    });
  }

  // فاتورة 3 - ثلاجة نقداً
  const invoice3 = await prisma.invoice.create({
    data: {
      companyId: company.id,
      branchId: mainBranch.id,
      customerId: customers[2].id,
      agentId: agentUser.id,
      invoiceNumber: 'INV-2025-003',
      invoiceDate: new Date('2025-02-10'),
      type: 'CASH',
      status: 'paid',
      subtotal: 18000,
      discount: 1000,
      taxRate: 14,
      taxAmount: 2380,
      total: 19380,
      paidAmount: 19380,
      remainingAmount: 0,
      notes: 'فاتورة ثلاجة نقداً',
    },
  });

  // إنشاء عقد أقساط فارغ للفاتورة النقدية (للتوافق)
  // لا ننشئ عقد للفواتير النقدية

  // فاتورة 4 - تكييف بالتقسيط
  const invoice4 = await prisma.invoice.create({
    data: {
      companyId: company.id,
      branchId: mainBranch.id,
      customerId: customers[0].id,
      agentId: agentUser.id,
      invoiceNumber: 'INV-2025-004',
      invoiceDate: new Date('2025-02-15'),
      dueDate: new Date('2025-03-15'),
      type: 'INSTALLMENT',
      status: 'pending',
      subtotal: 21000,
      discount: 0,
      taxRate: 14,
      taxAmount: 2940,
      total: 23940,
      paidAmount: 3000,
      remainingAmount: 20940,
      notes: 'فاتورة تكييف بالتقسيط على 10 أشهر',
    },
  });

  const contract4 = await prisma.installmentContract.create({
    data: {
      invoiceId: invoice4.id,
      customerId: customers[0].id,
      agentId: agentUser.id,
      contractNumber: 'CONT-2025-004',
      contractDate: new Date('2025-02-15'),
      totalAmount: 23940,
      downPayment: 3000,
      financedAmount: 20940,
      numberOfPayments: 10,
      paymentFrequency: 'MONTHLY',
      interestRate: 6,
      interestAmount: 1256.4,
      startDate: new Date('2025-03-15'),
      endDate: new Date('2026-01-15'),
      status: 'active',
      notes: 'عقد تقسيط تكييف كريير',
    },
  });

  // إنشاء الأقساط للعقد 4
  const installmentAmount4 = (20940 + 1256.4) / 10;
  for (let i = 1; i <= 10; i++) {
    const dueDate = new Date(2025, 2 + i, 15); // بداية من مارس
    const isLate = i === 1; // أول قسط متأخر
    await prisma.installment.create({
      data: {
        contractId: contract4.id,
        installmentNumber: i,
        dueDate: dueDate,
        amount: Math.round(installmentAmount4 * 100) / 100,
        paidAmount: 0,
        remainingAmount: Math.round(installmentAmount4 * 100) / 100,
        status: isLate ? 'late' : 'pending',
        lateFee: isLate ? 50 : 0,
      },
    });
  }

  // إضافة بعض المدفوعات
  console.log('💰 إنشاء المدفوعات...');
  
  await prisma.payment.create({
    data: {
      companyId: company.id,
      branchId: mainBranch.id,
      invoiceId: invoice1.id,
      customerId: customers[0].id,
      agentId: agentUser.id,
      paymentNumber: 'PAY-2025-001',
      paymentDate: new Date('2025-01-15'),
      method: 'CASH',
      amount: 5000,
      notes: 'مقدم عقد تلفزيون سامسونج',
      status: 'completed',
    },
  });

  await prisma.payment.create({
    data: {
      companyId: company.id,
      branchId: mainBranch.id,
      invoiceId: invoice1.id,
      customerId: customers[0].id,
      agentId: agentUser.id,
      paymentNumber: 'PAY-2025-002',
      paymentDate: new Date('2025-02-15'),
      method: 'CASH',
      amount: 2317,
      notes: 'القسط الأول - تلفزيون سامسونج',
      status: 'completed',
    },
  });

  await prisma.payment.create({
    data: {
      companyId: company.id,
      branchId: mainBranch.id,
      invoiceId: invoice1.id,
      customerId: customers[0].id,
      agentId: agentUser.id,
      paymentNumber: 'PAY-2025-003',
      paymentDate: new Date('2025-03-15'),
      method: 'BANK_TRANSFER',
      amount: 2317,
      notes: 'القسط الثاني - تلفزيون سامسونج',
      status: 'completed',
    },
  });

  await prisma.payment.create({
    data: {
      companyId: company.id,
      branchId: mainBranch.id,
      invoiceId: invoice2.id,
      customerId: customers[1].id,
      agentId: agentUser.id,
      paymentNumber: 'PAY-2025-004',
      paymentDate: new Date('2025-02-01'),
      method: 'CASH',
      amount: 8000,
      notes: 'مقدم عقد غسالة سامسونج',
      status: 'completed',
    },
  });

  await prisma.payment.create({
    data: {
      companyId: company.id,
      branchId: mainBranch.id,
      invoiceId: invoice2.id,
      customerId: customers[1].id,
      agentId: agentUser.id,
      paymentNumber: 'PAY-2025-005',
      paymentDate: new Date('2025-03-10'),
      method: 'CASH',
      amount: 1332,
      notes: 'القسط الأول - غسالة سامسونج',
      status: 'completed',
    },
  });

  await prisma.payment.create({
    data: {
      companyId: company.id,
      branchId: mainBranch.id,
      invoiceId: invoice3.id,
      customerId: customers[2].id,
      agentId: agentUser.id,
      paymentNumber: 'PAY-2025-006',
      paymentDate: new Date('2025-02-10'),
      method: 'CASH',
      amount: 19380,
      notes: 'دفع نقدي - ثلاجة شارب',
      status: 'completed',
    },
  });

  await prisma.payment.create({
    data: {
      companyId: company.id,
      branchId: mainBranch.id,
      invoiceId: invoice4.id,
      customerId: customers[0].id,
      agentId: agentUser.id,
      paymentNumber: 'PAY-2025-007',
      paymentDate: new Date('2025-02-15'),
      method: 'CASH',
      amount: 3000,
      notes: 'مقدم عقد تكييف كريير',
      status: 'completed',
    },
  });

  console.log('\n✅ تم إضافة البيانات التجريبية بنجاح!');
  console.log('\n📋 بيانات المستخدمين:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 مدير النظام:');
  console.log('   البريد: admin@alaml-eg.com');
  console.log('   كلمة المرور: 123456');
  console.log('   الدور: ADMIN');
  console.log('');
  console.log('👤 المدير:');
  console.log('   البريد: manager@alaml-eg.com');
  console.log('   كلمة المرور: 123456');
  console.log('   الدور: MANAGER');
  console.log('');
  console.log('👤 المندوب:');
  console.log('   البريد: agent@alaml-eg.com');
  console.log('   كلمة المرور: 123456');
  console.log('   الدور: AGENT');
  console.log('');
  console.log('👤 المحاسب:');
  console.log('   البريد: accountant@alaml-eg.com');
  console.log('   كلمة المرور: 123456');
  console.log('   الدور: ACCOUNTANT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ خطأ في إضافة البيانات:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

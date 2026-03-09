import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const now = new Date()

async function main() {
  console.log('🌱 بدء إضافة البيانات التجريبية...')
  
  const password = await bcrypt.hash('123456', 10)
  
  // ============================================
  // 1. حذف البيانات القديمة (ترتيب الحذف مهم)
  // ============================================
  console.log('🗑️ تنظيف البيانات القديمة...')
  
  // حذف الجداول التابعة أولاً
  await prisma.paymentTransaction.deleteMany()
  await prisma.featureUsage.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.planFeature.deleteMany()
  await prisma.subscriptionPlan.deleteMany()
  await prisma.impersonationSession.deleteMany()
  await prisma.installmentPayment.deleteMany()
  await prisma.installment.deleteMany()
  await prisma.installmentContract.deleteMany()
  await prisma.invoiceItem.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.returnItem.deleteMany()
  await prisma.return.deleteMany()
  await prisma.inventoryMovement.deleteMany()
  await prisma.inventory.deleteMany()
  await prisma.costLayer.deleteMany()
  await prisma.inventoryValuation.deleteMany()
  await prisma.inventoryTransferItem.deleteMany()
  await prisma.inventoryTransfer.deleteMany()
  await prisma.purchaseInvoiceItem.deleteMany()
  await prisma.purchaseReturnItem.deleteMany()
  await prisma.purchaseReturn.deleteMany()
  await prisma.purchaseInvoice.deleteMany()
  await prisma.supplierPayment.deleteMany()
  await prisma.supplierTransaction.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.product.deleteMany()
  await prisma.productCategory.deleteMany()
  await prisma.warehouse.deleteMany()
  await prisma.zone.deleteMany()
  await prisma.area.deleteMany()
  await prisma.city.deleteMany()
  await prisma.governorate.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.agentCommission.deleteMany()
  await prisma.agentLocation.deleteMany()
  await prisma.commissionPolicy.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.user.deleteMany()
  await prisma.companyPaymentGateway.deleteMany()
  await prisma.printTemplate.deleteMany()
  await prisma.reportTemplate.deleteMany()
  await prisma.branch.deleteMany()
  await prisma.company.deleteMany()
  
  console.log('✅ تم تنظيف البيانات القديمة')
  
  // ============================================
  // 2. إنشاء شركة واحدة تجريبية شاملة
  // ============================================
  const company = await prisma.company.create({
    data: {
      id: 'company-demo',
      name: 'شركة الأقساط للحلول المتكاملة',
      nameAr: 'شركة الأقساط للحلول المتكاملة',
      code: 'AQSATI-001',
      email: 'info@aqsati.com',
      phone: '05012345678',
      address: 'القاهرة - مدينة نصر - شارع Hassan',
      taxNumber: '300123456789003',
      taxRate: 14,
      currency: 'EGP',
      active: true,
      subscriptionStatus: 'active',
      planType: 'enterprise',
      updatedAt: now,
    }
  })
  console.log('✅ الشركة التجريبية:', company.name)

  // ============================================
  // 3. الفروع (3 فروع)
  // ============================================
  const branches = await Promise.all([
    prisma.branch.create({
      data: {
        id: 'branch-main',
        name: 'الفرع الرئيسي - مدينة نصر',
        nameAr: 'الفرع الرئيسي - مدينة نصر',
        code: 'BR-001',
        companyId: company.id,
        address: 'القاهرة - مدينة نصر',
        phone: '0224156789',
        isMain: true,
        active: true,
        updatedAt: now,
      }
    }),
    prisma.branch.create({
      data: {
        id: 'branch-maadi',
        name: 'فرع المعادي',
        nameAr: 'فرع المعادي',
        code: 'BR-002',
        companyId: company.id,
        address: 'القاهرة - المعادي',
        phone: '0225167890',
        isMain: false,
        active: true,
        updatedAt: now,
      }
    }),
    prisma.branch.create({
      data: {
        id: 'branch-alex',
        name: 'فرع الإسكندرية',
        nameAr: 'فرع الإسكندرية',
        code: 'BR-003',
        companyId: company.id,
        address: 'الإسكندرية - سموحة',
        phone: '0345678901',
        isMain: false,
        active: true,
        updatedAt: now,
      }
    })
  ])
  console.log('✅ الفروع:', branches.length)

  const mainBranch = branches[0]

  // ============================================
  // 4. المستخدمين
  // ============================================
  // Super Admin
  await prisma.user.create({
    data: {
      id: 'user-super-admin',
      name: 'مدير النظام',
      nameAr: 'مدير النظام',
      email: 'admin@aqsati.com',
      password,
      role: 'SUPER_ADMIN',
      active: true,
      updatedAt: now,
    }
  })

  // مدير الشركة
  await prisma.user.create({
    data: {
      id: 'user-company-admin',
      name: 'أحمد محمد علي',
      nameAr: 'أحمد محمد علي',
      email: 'company@aqsati.com',
      password,
      role: 'COMPANY_ADMIN',
      companyId: company.id,
      active: true,
      updatedAt: now,
    }
  })

  // المندوبين
  const agents = await Promise.all([
    prisma.user.create({
      data: {
        id: 'user-agent-1',
        name: 'خالد سعيد',
        nameAr: 'خالد سعيد',
        email: 'agent1@aqsati.com',
        password,
        phone: '01011111111',
        role: 'AGENT',
        companyId: company.id,
        branchId: mainBranch.id,
        active: true,
        updatedAt: now,
      }
    }),
    prisma.user.create({
      data: {
        id: 'user-agent-2',
        name: 'عبدالله فهد',
        nameAr: 'عبدالله فهد',
        email: 'agent2@aqsati.com',
        password,
        phone: '01022222222',
        role: 'AGENT',
        companyId: company.id,
        branchId: branches[1].id,
        active: true,
        updatedAt: now,
      }
    }),
    prisma.user.create({
      data: {
        id: 'user-agent-3',
        name: 'محمد سامي',
        nameAr: 'محمد سامي',
        email: 'agent3@aqsati.com',
        password,
        phone: '01033333333',
        role: 'AGENT',
        companyId: company.id,
        branchId: branches[2].id,
        active: true,
        updatedAt: now,
      }
    })
  ])

  // المحصلين
  const collectors = await Promise.all([
    prisma.user.create({
      data: {
        id: 'user-collector-1',
        name: 'سيد أحمد',
        nameAr: 'سيد أحمد',
        email: 'collector1@aqsati.com',
        password,
        phone: '01044444444',
        role: 'COLLECTOR',
        companyId: company.id,
        branchId: mainBranch.id,
        active: true,
        updatedAt: now,
      }
    }),
    prisma.user.create({
      data: {
        id: 'user-collector-2',
        name: 'محمود حسن',
        nameAr: 'محمود حسن',
        email: 'collector2@aqsati.com',
        password,
        phone: '01055555555',
        role: 'COLLECTOR',
        companyId: company.id,
        branchId: branches[1].id,
        active: true,
        updatedAt: now,
      }
    })
  ])
  console.log('✅ المستخدمين: 1 سوبر أدمن + 1 مدير شركة + 3 مندوبين + 2 محصلين')

  // ============================================
  // 5. المحافظات والمدن والمناطق
  // ============================================
  const governorates = await Promise.all([
    prisma.governorate.create({
      data: {
        id: 'gov-cairo',
        name: 'القاهرة',
        nameAr: 'القاهرة',
        code: 'GOV-CAI',
        companyId: company.id,
        active: true,
        updatedAt: now,
      }
    }),
    prisma.governorate.create({
      data: {
        id: 'gov-giza',
        name: 'الجيزة',
        nameAr: 'الجيزة',
        code: 'GOV-GIZ',
        companyId: company.id,
        active: true,
        updatedAt: now,
      }
    }),
    prisma.governorate.create({
      data: {
        id: 'gov-alex',
        name: 'الإسكندرية',
        nameAr: 'الإسكندرية',
        code: 'GOV-ALX',
        companyId: company.id,
        active: true,
        updatedAt: now,
      }
    })
  ])

  const cities = await Promise.all([
    // مدن القاهرة
    prisma.city.create({
      data: {
        id: 'city-nasr',
        name: 'مدينة نصر',
        nameAr: 'مدينة نصر',
        code: 'CIT-NASR',
        companyId: company.id,
        governorateId: governorates[0].id,
        active: true,
        updatedAt: now,
      }
    }),
    prisma.city.create({
      data: {
        id: 'city-maadi',
        name: 'المعادي',
        nameAr: 'المعادي',
        code: 'CIT-MAAD',
        companyId: company.id,
        governorateId: governorates[0].id,
        active: true,
        updatedAt: now,
      }
    }),
    prisma.city.create({
      data: {
        id: 'city-heliopolis',
        name: 'مصر الجديدة',
        nameAr: 'مصر الجديدة',
        code: 'CIT-HELIO',
        companyId: company.id,
        governorateId: governorates[0].id,
        active: true,
        updatedAt: now,
      }
    }),
    // مدن الجيزة
    prisma.city.create({
      data: {
        id: 'city-dokki',
        name: 'الدقي',
        nameAr: 'الدقي',
        code: 'CIT-DOKK',
        companyId: company.id,
        governorateId: governorates[1].id,
        active: true,
        updatedAt: now,
      }
    }),
    prisma.city.create({
      data: {
        id: 'city-haram',
        name: 'حدائق الأهرام',
        nameAr: 'حدائق الأهرام',
        code: 'CIT-HARA',
        companyId: company.id,
        governorateId: governorates[1].id,
        active: true,
        updatedAt: now,
      }
    }),
    // مدن الإسكندرية
    prisma.city.create({
      data: {
        id: 'city-smouha',
        name: 'سموحة',
        nameAr: 'سموحة',
        code: 'CIT-SMOU',
        companyId: company.id,
        governorateId: governorates[2].id,
        active: true,
        updatedAt: now,
      }
    }),
  ])

  const areas = await Promise.all([
    // مناطق مدينة نصر
    prisma.area.create({
      data: {
        id: 'area-nasr-1',
        name: 'العبور',
        nameAr: 'العبور',
        code: 'AR-ELAB',
        companyId: company.id,
        cityId: cities[0].id,
        active: true,
        updatedAt: now,
      }
    }),
    prisma.area.create({
      data: {
        id: 'area-nasr-2',
        name: 'المروج',
        nameAr: 'المروج',
        code: 'AR-MORO',
        companyId: company.id,
        cityId: cities[0].id,
        active: true,
        updatedAt: now,
      }
    }),
    // مناطق المعادي
    prisma.area.create({
      data: {
        id: 'area-maadi-1',
        name: 'المعادي الجديدة',
        nameAr: 'المعادي الجديدة',
        code: 'AR-MAAD-N',
        companyId: company.id,
        cityId: cities[1].id,
        active: true,
        updatedAt: now,
      }
    }),
    // مناطق مصر الجديدة
    prisma.area.create({
      data: {
        id: 'area-helio-1',
        name: 'روكسي',
        nameAr: 'روكسي',
        code: 'AR-ROXY',
        companyId: company.id,
        cityId: cities[2].id,
        active: true,
        updatedAt: now,
      }
    }),
    prisma.area.create({
      data: {
        id: 'area-helio-2',
        name: 'الكوربة',
        nameAr: 'الكوربة',
        code: 'AR-KORB',
        companyId: company.id,
        cityId: cities[2].id,
        active: true,
        updatedAt: now,
      }
    }),
    // مناطق الدقي
    prisma.area.create({
      data: {
        id: 'area-dokki-1',
        name: 'الدقي الجديد',
        nameAr: 'الدقي الجديد',
        code: 'AR-DOKK-N',
        companyId: company.id,
        cityId: cities[3].id,
        active: true,
        updatedAt: now,
      }
    }),
    // مناطق سموحة
    prisma.area.create({
      data: {
        id: 'area-smouha-1',
        name: 'سموحة الجديدة',
        nameAr: 'سموحة الجديدة',
        code: 'AR-SMOU-N',
        companyId: company.id,
        cityId: cities[5].id,
        active: true,
        updatedAt: now,
      }
    }),
  ])
  console.log('✅ المحافظات:', governorates.length, '| المدن:', cities.length, '| المناطق:', areas.length)

  // ============================================
  // 6. المناطق (Zones)
  // ============================================
  const zones = await Promise.all([
    prisma.zone.create({
      data: {
        id: 'zone-1',
        name: 'منطقة مدينة نصر',
        nameAr: 'منطقة مدينة نصر',
        code: 'ZN-NASR',
        companyId: company.id,
        branchId: mainBranch.id,
        active: true,
        updatedAt: now,
      }
    }),
    prisma.zone.create({
      data: {
        id: 'zone-2',
        name: 'منطقة المعادي',
        nameAr: 'منطقة المعادي',
        code: 'ZN-MAAD',
        companyId: company.id,
        branchId: branches[1].id,
        active: true,
        updatedAt: now,
      }
    }),
    prisma.zone.create({
      data: {
        id: 'zone-3',
        name: 'منطقة الإسكندرية',
        nameAr: 'منطقة الإسكندرية',
        code: 'ZN-ALEX',
        companyId: company.id,
        branchId: branches[2].id,
        active: true,
        updatedAt: now,
      }
    })
  ])
  console.log('✅ المناطق:', zones.length)

  // ============================================
  // 7. تصنيفات المنتجات
  // ============================================
  // التصنيفات الرئيسية
  const catElectronics = await prisma.productCategory.create({
    data: {
      id: 'cat-electronics',
      name: 'إلكترونيات',
      nameAr: 'إلكترونيات',
      code: 'CAT-ELEC',
      companyId: company.id,
      active: true,
      updatedAt: now,
    }
  })

  const catAppliances = await prisma.productCategory.create({
    data: {
      id: 'cat-appliances',
      name: 'أجهزة منزلية',
      nameAr: 'أجهزة منزلية',
      code: 'CAT-APPL',
      companyId: company.id,
      active: true,
      updatedAt: now,
    }
  })

  const catFurniture = await prisma.productCategory.create({
    data: {
      id: 'cat-furniture',
      name: 'أثاث',
      nameAr: 'أثاث',
      code: 'CAT-FURN',
      companyId: company.id,
      active: true,
      updatedAt: now,
    }
  })

  const catMobiles = await prisma.productCategory.create({
    data: {
      id: 'cat-mobiles',
      name: 'هواتف ذكية',
      nameAr: 'هواتف ذكية',
      code: 'CAT-MOBI',
      companyId: company.id,
      parentId: catElectronics.id,
      active: true,
      updatedAt: now,
    }
  })

  const catLaptops = await prisma.productCategory.create({
    data: {
      id: 'cat-laptops',
      name: 'لابتوب وأجهزة كمبيوتر',
      nameAr: 'لابتوب وأجهزة كمبيوتر',
      code: 'CAT-LAPT',
      companyId: company.id,
      parentId: catElectronics.id,
      active: true,
      updatedAt: now,
    }
  })

  const catTVs = await prisma.productCategory.create({
    data: {
      id: 'cat-tvs',
      name: 'تلفزيونات',
      nameAr: 'تلفزيونات',
      code: 'CAT-TV',
      companyId: company.id,
      parentId: catElectronics.id,
      active: true,
      updatedAt: now,
    }
  })

  const catKitchen = await prisma.productCategory.create({
    data: {
      id: 'cat-kitchen',
      name: 'أجهزة المطبخ',
      nameAr: 'أجهزة المطبخ',
      code: 'CAT-KITC',
      companyId: company.id,
      parentId: catAppliances.id,
      active: true,
      updatedAt: now,
    }
  })

  const catWashing = await prisma.productCategory.create({
    data: {
      id: 'cat-washing',
      name: 'غسالات ومجففات',
      nameAr: 'غسالات ومجففات',
      code: 'CAT-WASH',
      companyId: company.id,
      parentId: catAppliances.id,
      active: true,
      updatedAt: now,
    }
  })
  console.log('✅ التصنيفات: 8 تصنيفات')

  // ============================================
  // 8. المنتجات (30 منتج)
  // ============================================
  const products = [
    // هواتف ذكية
    { id: 'prod-1', sku: 'PRD-001', name: 'iPhone 15 Pro Max 256GB', categoryId: catMobiles.id, costPrice: 45000, sellPrice: 52000 },
    { id: 'prod-2', sku: 'PRD-002', name: 'iPhone 15 Pro 128GB', categoryId: catMobiles.id, costPrice: 38000, sellPrice: 45000 },
    { id: 'prod-3', sku: 'PRD-003', name: 'Samsung Galaxy S24 Ultra 256GB', categoryId: catMobiles.id, costPrice: 42000, sellPrice: 49000 },
    { id: 'prod-4', sku: 'PRD-004', name: 'Samsung Galaxy A54 128GB', categoryId: catMobiles.id, costPrice: 12000, sellPrice: 15000 },
    { id: 'prod-5', sku: 'PRD-005', name: 'Xiaomi 14 Pro 256GB', categoryId: catMobiles.id, costPrice: 25000, sellPrice: 30000 },
    
    // لابتوب
    { id: 'prod-6', sku: 'PRD-006', name: 'MacBook Air M3 13" 256GB', categoryId: catLaptops.id, costPrice: 55000, sellPrice: 65000 },
    { id: 'prod-7', sku: 'PRD-007', name: 'MacBook Pro M3 14" 512GB', categoryId: catLaptops.id, costPrice: 85000, sellPrice: 98000 },
    { id: 'prod-8', sku: 'PRD-008', name: 'HP ProBook 450 G10', categoryId: catLaptops.id, costPrice: 28000, sellPrice: 35000 },
    { id: 'prod-9', sku: 'PRD-009', name: 'Dell Inspiron 15 3530', categoryId: catLaptops.id, costPrice: 22000, sellPrice: 27000 },
    { id: 'prod-10', sku: 'PRD-010', name: 'Lenovo ThinkPad E16', categoryId: catLaptops.id, costPrice: 25000, sellPrice: 32000 },
    
    // تلفزيونات
    { id: 'prod-11', sku: 'PRD-011', name: 'Samsung Smart TV 55" 4K', categoryId: catTVs.id, costPrice: 18000, sellPrice: 22000 },
    { id: 'prod-12', sku: 'PRD-012', name: 'LG Smart TV 65" 4K OLED', categoryId: catTVs.id, costPrice: 35000, sellPrice: 42000 },
    { id: 'prod-13', sku: 'PRD-013', name: 'Sony Smart TV 50" 4K', categoryId: catTVs.id, costPrice: 20000, sellPrice: 25000 },
    { id: 'prod-14', sku: 'PRD-014', name: 'TCL Smart TV 43" 4K', categoryId: catTVs.id, costPrice: 8000, sellPrice: 10000 },
    
    // أجهزة المطبخ
    { id: 'prod-15', sku: 'PRD-015', name: 'ثلاجة سامسونج 18 قدم No Frost', categoryId: catKitchen.id, costPrice: 18000, sellPrice: 23000 },
    { id: 'prod-16', sku: 'PRD-016', name: 'ثلاجة LG 17 قدم Inverter', categoryId: catKitchen.id, costPrice: 16000, sellPrice: 20000 },
    { id: 'prod-17', sku: 'PRD-017', name: 'بوتاجاز يونيون 5 شعلة', categoryId: catKitchen.id, costPrice: 4500, sellPrice: 6000 },
    { id: 'prod-18', sku: 'PRD-018', name: 'ميكروويف شارب 30 لتر', categoryId: catKitchen.id, costPrice: 3500, sellPrice: 4500 },
    { id: 'prod-19', sku: 'PRD-019', name: 'مكنسة كهربائية سامسونج', categoryId: catKitchen.id, costPrice: 3000, sellPrice: 4000 },
    
    // غسالات
    { id: 'prod-20', sku: 'PRD-020', name: 'غسالة سامسونج 10 كيلو', categoryId: catWashing.id, costPrice: 15000, sellPrice: 19000 },
    { id: 'prod-21', sku: 'PRD-021', name: 'غسالة LG 8 كيلو Inverter', categoryId: catWashing.id, costPrice: 12000, sellPrice: 16000 },
    { id: 'prod-22', sku: 'PRD-022', name: 'غسالة وايت ويل 7 كيلو', categoryId: catWashing.id, costPrice: 6000, sellPrice: 8000 },
    { id: 'prod-23', sku: 'PRD-023', name: 'مجفف سامسونج 9 كيلو', categoryId: catWashing.id, costPrice: 14000, sellPrice: 18000 },
    
    // أثاث
    { id: 'prod-24', sku: 'PRD-024', name: 'غرفة نوم خشب زان كاملة', categoryId: catFurniture.id, costPrice: 25000, sellPrice: 35000 },
    { id: 'prod-25', sku: 'PRD-025', name: 'سفرة 8 أشخاص مودرن', categoryId: catFurniture.id, costPrice: 12000, sellPrice: 18000 },
    { id: 'prod-26', sku: 'PRD-026', name: 'أنتريه 3 قطع جلد', categoryId: catFurniture.id, costPrice: 20000, sellPrice: 28000 },
    { id: 'prod-27', sku: 'PRD-027', name: 'كنبة مودرن 3 مقاعد', categoryId: catFurniture.id, costPrice: 8000, sellPrice: 12000 },
    { id: 'prod-28', sku: 'PRD-028', name: 'دولاب ملابس 3 أبواب', categoryId: catFurniture.id, costPrice: 7000, sellPrice: 10000 },
    { id: 'prod-29', sku: 'PRD-029', name: 'سرير خشب MDF مع مرتبة', categoryId: catFurniture.id, costPrice: 5000, sellPrice: 7500 },
    { id: 'prod-30', sku: 'PRD-030', name: 'مكتب كمبيوتر خشب', categoryId: catFurniture.id, costPrice: 2500, sellPrice: 3500 },
  ]

  for (const p of products) {
    await prisma.product.create({
      data: {
        ...p,
        nameAr: p.name,
        companyId: company.id,
        unit: 'piece',
        active: true,
        updatedAt: now,
      }
    })
  }
  console.log('✅ المنتجات:', products.length)

  // ============================================
  // 9. العملاء (15 عميل)
  // ============================================
  const customers = [
    { id: 'cust-1', code: 'CUST-001', name: 'محمد أحمد حسن', phone: '01211111111', zoneId: zones[0].id, areaId: areas[0].id, governorateId: governorates[0].id, cityId: cities[0].id },
    { id: 'cust-2', code: 'CUST-002', name: 'علي محمود سعيد', phone: '01222222222', zoneId: zones[0].id, areaId: areas[1].id, governorateId: governorates[0].id, cityId: cities[0].id },
    { id: 'cust-3', code: 'CUST-003', name: 'خالد عبدالله', phone: '01233333333', zoneId: zones[0].id, areaId: areas[2].id, governorateId: governorates[0].id, cityId: cities[1].id },
    { id: 'cust-4', code: 'CUST-004', name: 'فهد محمد علي', phone: '01244444444', zoneId: zones[0].id, areaId: areas[3].id, governorateId: governorates[0].id, cityId: cities[2].id },
    { id: 'cust-5', code: 'CUST-005', name: 'سعود أحمد', phone: '01255555555', zoneId: zones[0].id, areaId: areas[4].id, governorateId: governorates[0].id, cityId: cities[2].id },
    { id: 'cust-6', code: 'CUST-006', name: 'عبدالرحمن سعيد', phone: '01266666666', zoneId: zones[1].id, areaId: areas[5].id, governorateId: governorates[1].id, cityId: cities[3].id },
    { id: 'cust-7', code: 'CUST-007', name: 'ياسر محمد', phone: '01277777777', zoneId: zones[1].id, areaId: areas[5].id, governorateId: governorates[1].id, cityId: cities[3].id },
    { id: 'cust-8', code: 'CUST-008', name: 'إبراهيم حسن', phone: '01288888888', zoneId: zones[1].id, areaId: areas[5].id, governorateId: governorates[1].id, cityId: cities[4].id },
    { id: 'cust-9', code: 'CUST-009', name: 'مصطفى علي', phone: '01299999999', zoneId: zones[2].id, areaId: areas[6].id, governorateId: governorates[2].id, cityId: cities[5].id },
    { id: 'cust-10', code: 'CUST-010', name: 'أحمد سالم', phone: '01210101010', zoneId: zones[2].id, areaId: areas[6].id, governorateId: governorates[2].id, cityId: cities[5].id },
    { id: 'cust-11', code: 'CUST-011', name: 'محمود السيد', phone: '01211111112', zoneId: zones[0].id, areaId: areas[0].id, governorateId: governorates[0].id, cityId: cities[0].id },
    { id: 'cust-12', code: 'CUST-012', name: 'سامي عبدالعزيز', phone: '01212121212', zoneId: zones[0].id, areaId: areas[1].id, governorateId: governorates[0].id, cityId: cities[0].id },
    { id: 'cust-13', code: 'CUST-013', name: 'طارق إبراهيم', phone: '01213131313', zoneId: zones[1].id, areaId: areas[2].id, governorateId: governorates[0].id, cityId: cities[1].id },
    { id: 'cust-14', code: 'CUST-014', name: 'كريم فتحي', phone: '01214141414', zoneId: zones[1].id, areaId: areas[5].id, governorateId: governorates[1].id, cityId: cities[3].id },
    { id: 'cust-15', code: 'CUST-015', name: 'هاني عبدالحميد', phone: '01215151515', zoneId: zones[2].id, areaId: areas[6].id, governorateId: governorates[2].id, cityId: cities[5].id },
  ]

  for (const c of customers) {
    await prisma.customer.create({
      data: {
        ...c,
        nameAr: c.name,
        companyId: company.id,
        branchId: zones.find(z => z.id === c.zoneId)?.branchId || mainBranch.id,
        creditLimit: 50000,
        active: true,
        updatedAt: now,
      }
    })
  }
  console.log('✅ العملاء:', customers.length)

  // ============================================
  // 10. المخازن
  // ============================================
  const warehouses = await Promise.all([
    prisma.warehouse.create({
      data: {
        id: 'wh-main',
        name: 'المخزن الرئيسي - مدينة نصر',
        nameAr: 'المخزن الرئيسي - مدينة نصر',
        code: 'WH-001',
        companyId: company.id,
        branchId: mainBranch.id,
        address: 'القاهرة - مدينة نصر - المنطقة الصناعية',
        isMain: true,
        active: true,
        updatedAt: now,
      }
    }),
    prisma.warehouse.create({
      data: {
        id: 'wh-maadi',
        name: 'مخزن المعادي',
        nameAr: 'مخزن المعادي',
        code: 'WH-002',
        companyId: company.id,
        branchId: branches[1].id,
        address: 'القاهرة - المعادي',
        isMain: false,
        active: true,
        updatedAt: now,
      }
    }),
    prisma.warehouse.create({
      data: {
        id: 'wh-alex',
        name: 'مخزن الإسكندرية',
        nameAr: 'مخزن الإسكندرية',
        code: 'WH-003',
        companyId: company.id,
        branchId: branches[2].id,
        address: 'الإسكندرية - سموحة',
        isMain: false,
        active: true,
        updatedAt: now,
      }
    })
  ])
  console.log('✅ المخازن:', warehouses.length)

  // ============================================
  // 11. الموردين
  // ============================================
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        id: 'supp-1',
        name: 'شركة سمسونج مصر',
        nameAr: 'شركة سمسونج مصر',
        supplierCode: 'SUP-001',
        companyId: company.id,
        phone: '0222678901',
        email: 'info@samsung-egypt.com',
        address: 'القاهرة - العباسية',
        taxNumber: '100123456789001',
        currentBalance: 0,
        active: true,
        updatedAt: now,
      }
    }),
    prisma.supplier.create({
      data: {
        id: 'supp-2',
        name: 'شركة أبل للتجارة',
        nameAr: 'شركة أبل للتجارة',
        supplierCode: 'SUP-002',
        companyId: company.id,
        phone: '0222789012',
        email: 'sales@apple-egypt.com',
        address: 'القاهرة - مدينة نصر',
        taxNumber: '100234567890002',
        currentBalance: 0,
        active: true,
        updatedAt: now,
      }
    }),
    prisma.supplier.create({
      data: {
        id: 'supp-3',
        name: 'شركة LG مصر',
        nameAr: 'شركة LG مصر',
        supplierCode: 'SUP-003',
        companyId: company.id,
        phone: '0222890123',
        email: 'info@lg-egypt.com',
        address: 'القاهرة - المعادي',
        taxNumber: '100345678900003',
        currentBalance: 0,
        active: true,
        updatedAt: now,
      }
    })
  ])
  console.log('✅ الموردين:', suppliers.length)

  // ============================================
  // 12. الفواتير والمدفوعات (فواتير متنوعة)
  // ============================================
  const invoiceData = [
    // فواتير نقدي
    { customerIndex: 0, products: [{ prodIndex: 0, qty: 1 }], type: 'CASH', status: 'paid', downPayment: 52000 },
    { customerIndex: 1, products: [{ prodIndex: 2, qty: 1 }], type: 'CASH', status: 'paid', downPayment: 49000 },
    { customerIndex: 2, products: [{ prodIndex: 14, qty: 1 }], type: 'CASH', status: 'paid', downPayment: 23000 },
    
    // فواتير تقسيط (مختلف الحالات)
    { customerIndex: 3, products: [{ prodIndex: 6, qty: 1 }], type: 'INSTALLMENT', status: 'partial', downPayment: 20000, installments: 12 },
    { customerIndex: 4, products: [{ prodIndex: 10, qty: 1 }], type: 'INSTALLMENT', status: 'pending', downPayment: 5000, installments: 6 },
    { customerIndex: 5, products: [{ prodIndex: 19, qty: 1 }], type: 'INSTALLMENT', status: 'partial', downPayment: 4000, installments: 8 },
    { customerIndex: 6, products: [{ prodIndex: 23, qty: 1 }], type: 'INSTALLMENT', status: 'pending', downPayment: 10000, installments: 10 },
    { customerIndex: 7, products: [{ prodIndex: 0, qty: 1 }, { prodIndex: 1, qty: 1 }], type: 'INSTALLMENT', status: 'partial', downPayment: 30000, installments: 18 },
    { customerIndex: 8, products: [{ prodIndex: 25, qty: 1 }], type: 'INSTALLMENT', status: 'pending', downPayment: 5000, installments: 12 },
    { customerIndex: 9, products: [{ prodIndex: 15, qty: 1 }], type: 'INSTALLMENT', status: 'partial', downPayment: 5000, installments: 6 },
    
    // فواتير آجل
    { customerIndex: 10, products: [{ prodIndex: 3, qty: 2 }], type: 'CREDIT', status: 'partial', downPayment: 10000 },
    { customerIndex: 11, products: [{ prodIndex: 20, qty: 1 }], type: 'CREDIT', status: 'pending', downPayment: 0 },
    { customerIndex: 12, products: [{ prodIndex: 27, qty: 1 }], type: 'CREDIT', status: 'paid', downPayment: 12000 },
    { customerIndex: 13, products: [{ prodIndex: 8, qty: 1 }], type: 'CREDIT', status: 'pending', downPayment: 0 },
    { customerIndex: 14, products: [{ prodIndex: 11, qty: 1 }], type: 'INSTALLMENT', status: 'pending', downPayment: 10000, installments: 8 },
  ]

  let invoiceCount = 0
  let paymentCount = 0
  let totalSales = 0
  let totalPaid = 0

  for (let i = 0; i < invoiceData.length; i++) {
    const invData = invoiceData[i]
    const customer = customers[invData.customerIndex]
    const agent = agents[i % agents.length]
    
    // حساب إجمالي الفاتورة
    let subtotal = 0
    const items: any[] = []
    for (const item of invData.products) {
      const product = products[item.prodIndex]
      const itemTotal = product.sellPrice * item.qty
      subtotal += itemTotal
      items.push({
        productId: product.id,
        quantity: item.qty,
        unitPrice: product.sellPrice,
        total: itemTotal
      })
    }
    
    const discount = 0
    const taxAmount = Math.round(subtotal * 0.14) // 14% ضريبة
    const total = subtotal + taxAmount
    const downPayment = invData.downPayment || 0
    const remainingAmount = total - downPayment
    
    totalSales += total
    totalPaid += downPayment
    
    // إنشاء الفاتورة
    const invoice = await prisma.invoice.create({
      data: {
        id: `inv-${i + 1}`,
        invoiceNumber: `INV-${String(i + 1).padStart(4, '0')}`,
        companyId: company.id,
        branchId: agent.branchId || mainBranch.id,
        customerId: customer.id,
        agentId: agent.id,
        type: invData.type,
        status: invData.status,
        subtotal,
        discount,
        taxRate: 14,
        taxAmount,
        total,
        paidAmount: downPayment,
        remainingAmount,
        invoiceDate: new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)), // فواتير بتواريخ مختلفة
        updatedAt: now,
      }
    })
    
    // إضافة أصناف الفاتورة
    for (const item of items) {
      await prisma.invoiceItem.create({
        data: {
          ...item,
          invoiceId: invoice.id,
        }
      })
    }
    
    // إنشاء عقد تقسيط إذا كان تقسيط
    if (invData.type === 'INSTALLMENT' && invData.installments) {
      const financedAmount = remainingAmount
      const installmentAmount = Math.ceil(financedAmount / invData.installments)
      
      const contract = await prisma.installmentContract.create({
        data: {
          id: `contract-${i + 1}`,
          invoiceId: invoice.id,
          customerId: customer.id,
          agentId: agent.id,
          contractNumber: `CTR-${String(i + 1).padStart(4, '0')}`,
          contractDate: invoice.invoiceDate,
          totalAmount: total,
          downPayment,
          financedAmount,
          numberOfPayments: invData.installments,
          paymentFrequency: 'MONTHLY',
          startDate: invoice.invoiceDate,
          status: 'active',
        }
      })
      
      // إنشاء الأقساط
      for (let j = 0; j < invData.installments; j++) {
        const dueDate = new Date(invoice.invoiceDate)
        dueDate.setMonth(dueDate.getMonth() + j + 1)
        
        const isPaid = invData.status === 'paid' || (invData.status === 'partial' && j < 2)
        const paidAmount = isPaid ? installmentAmount : 0
        
        await prisma.installment.create({
          data: {
            id: `inst-${invoiceCount}-${j}`,
            contractId: contract.id,
            installmentNumber: j + 1,
            dueDate,
            amount: j === invData.installments! - 1 ? financedAmount - (installmentAmount * (invData.installments! - 1)) : installmentAmount,
            paidAmount,
            remainingAmount: installmentAmount - paidAmount,
            status: isPaid ? 'paid' : 'pending',
            paidDate: isPaid ? dueDate : null,
          }
        })
        
        if (isPaid) {
          totalPaid += installmentAmount
        }
      }
    }
    
    // إنشاء دفعة المقدم
    if (downPayment > 0) {
      await prisma.payment.create({
        data: {
          id: `pay-${paymentCount + 1}`,
          paymentNumber: `PAY-${String(paymentCount + 1).padStart(4, '0')}`,
          companyId: company.id,
          branchId: agent.branchId || mainBranch.id,
          customerId: customer.id,
          invoiceId: invoice.id,
          agentId: collectors[i % collectors.length].id,
          method: i % 3 === 0 ? 'CASH' : i % 3 === 1 ? 'BANK' : 'VODAFONE_CASH',
          amount: downPayment,
          status: 'completed',
          paymentDate: invoice.invoiceDate,
          updatedAt: now,
        }
      })
      paymentCount++
    }
    
    invoiceCount++
  }
  console.log('✅ الفواتير:', invoiceCount, '| المدفوعات:', paymentCount)

  // ============================================
  // 13. بوابات الدفع
  // ============================================
  await prisma.companyPaymentGateway.create({
    data: {
      id: 'gw-fawry',
      companyId: company.id,
      gatewayType: 'fawry',
      name: 'فوري',
      nameAr: 'فوري',
      merchantId: 'test_merchant_fawry',
      merchantSecret: 'test_secret_fawry',
      isActive: true,
      isDefault: true,
      isLive: false,
      feesPercent: 1.5,
      feesFixed: 2,
      updatedAt: now,
    }
  })

  await prisma.companyPaymentGateway.create({
    data: {
      id: 'gw-vodafone',
      companyId: company.id,
      gatewayType: 'vodafone_cash',
      name: 'فودافون كاش',
      nameAr: 'فودافون كاش',
      walletNumber: '01012345678',
      isActive: true,
      isDefault: false,
      isLive: false,
      feesPercent: 1,
      updatedAt: now,
    }
  })

  await prisma.companyPaymentGateway.create({
    data: {
      id: 'gw-instapay',
      companyId: company.id,
      gatewayType: 'instapay',
      name: 'InstaPay',
      nameAr: 'انستاباي',
      apiKey: 'test_api_key',
      isActive: true,
      isDefault: false,
      isLive: false,
      feesPercent: 0.5,
      updatedAt: now,
    }
  })

  await prisma.companyPaymentGateway.create({
    data: {
      id: 'gw-meeza',
      companyId: company.id,
      gatewayType: 'meeza',
      name: 'ميزة',
      nameAr: 'ميزة',
      merchantId: 'test_meeza_merchant',
      isActive: true,
      isDefault: false,
      isLive: false,
      feesPercent: 0.75,
      updatedAt: now,
    }
  })
  console.log('✅ بوابات الدفع: 4 بوابات')

  // ============================================
  // 14. خطط الاشتراك
  // ============================================
  const plans = await Promise.all([
    prisma.subscriptionPlan.create({
      data: {
        id: 'plan-starter',
        name: 'Starter',
        nameAr: 'البداية',
        code: 'STARTER',
        description: 'Perfect for small businesses',
        descriptionAr: 'مثالي للشركات الصغيرة',
        price: 199,
        currency: 'EGP',
        billingCycle: 'MONTHLY',
        trialDays: 14,
        isDefault: true,
        active: true,
      }
    }),
    prisma.subscriptionPlan.create({
      data: {
        id: 'plan-professional',
        name: 'Professional',
        nameAr: 'الاحترافي',
        code: 'PROFESSIONAL',
        description: 'For growing businesses',
        descriptionAr: 'للشركات النامية',
        price: 499,
        currency: 'EGP',
        billingCycle: 'MONTHLY',
        trialDays: 14,
        isPopular: true,
        active: true,
      }
    }),
    prisma.subscriptionPlan.create({
      data: {
        id: 'plan-enterprise',
        name: 'Enterprise',
        nameAr: 'المؤسسي',
        code: 'ENTERPRISE',
        description: 'For large organizations',
        descriptionAr: 'للمؤسسات الكبيرة',
        price: 999,
        currency: 'EGP',
        billingCycle: 'MONTHLY',
        trialDays: 30,
        active: true,
      }
    })
  ])

  // إضافة ميزات الخطط
  const planFeatures = [
    // Starter features
    { planId: 'plan-starter', featureKey: 'branches', featureName: 'Branches', featureNameAr: 'الفروع', category: 'organization', categoryAr: 'المؤسسة', enabled: true, limitValue: 2 },
    { planId: 'plan-starter', featureKey: 'users', featureName: 'Users', featureNameAr: 'المستخدمين', category: 'organization', categoryAr: 'المؤسسة', enabled: true, limitValue: 5 },
    { planId: 'plan-starter', featureKey: 'customers', featureName: 'Customers', featureNameAr: 'العملاء', category: 'customers', categoryAr: 'العملاء', enabled: true, limitValue: 500 },
    { planId: 'plan-starter', featureKey: 'products', featureName: 'Products', featureNameAr: 'المنتجات', category: 'inventory', categoryAr: 'المخزون', enabled: true, limitValue: 200 },
    { planId: 'plan-starter', featureKey: 'invoices', featureName: 'Monthly Invoices', featureNameAr: 'الفواتير الشهرية', category: 'billing', categoryAr: 'الفواتير', enabled: true, limitValue: 100 },
    { planId: 'plan-starter', featureKey: 'payment_gateways', featureName: 'Payment Gateways', featureNameAr: 'بوابات الدفع', category: 'payments', categoryAr: 'المدفوعات', enabled: true, limitValue: 2 },
    
    // Professional features
    { planId: 'plan-professional', featureKey: 'branches', featureName: 'Branches', featureNameAr: 'الفروع', category: 'organization', categoryAr: 'المؤسسة', enabled: true, limitValue: 10 },
    { planId: 'plan-professional', featureKey: 'users', featureName: 'Users', featureNameAr: 'المستخدمين', category: 'organization', categoryAr: 'المؤسسة', enabled: true, limitValue: 25 },
    { planId: 'plan-professional', featureKey: 'customers', featureName: 'Customers', featureNameAr: 'العملاء', category: 'customers', categoryAr: 'العملاء', enabled: true, limitValue: 5000 },
    { planId: 'plan-professional', featureKey: 'products', featureName: 'Products', featureNameAr: 'المنتجات', category: 'inventory', categoryAr: 'المخزون', enabled: true, limitValue: 2000 },
    { planId: 'plan-professional', featureKey: 'invoices', featureName: 'Monthly Invoices', featureNameAr: 'الفواتير الشهرية', category: 'billing', categoryAr: 'الفواتير', enabled: true, limitValue: 1000 },
    { planId: 'plan-professional', featureKey: 'payment_gateways', featureName: 'Payment Gateways', featureNameAr: 'بوابات الدفع', category: 'payments', categoryAr: 'المدفوعات', enabled: true, limitValue: 5 },
    { planId: 'plan-professional', featureKey: 'reports', featureName: 'Advanced Reports', featureNameAr: 'تقارير متقدمة', category: 'reports', categoryAr: 'التقارير', enabled: true },
    { planId: 'plan-professional', featureKey: 'api_access', featureName: 'API Access', featureNameAr: 'الوصول للـ API', category: 'integrations', categoryAr: 'التكاملات', enabled: true },
    
    // Enterprise features
    { planId: 'plan-enterprise', featureKey: 'branches', featureName: 'Branches', featureNameAr: 'الفروع', category: 'organization', categoryAr: 'المؤسسة', enabled: true, limitValue: -1 }, // unlimited
    { planId: 'plan-enterprise', featureKey: 'users', featureName: 'Users', featureNameAr: 'المستخدمين', category: 'organization', categoryAr: 'المؤسسة', enabled: true, limitValue: -1 },
    { planId: 'plan-enterprise', featureKey: 'customers', featureName: 'Customers', featureNameAr: 'العملاء', category: 'customers', categoryAr: 'العملاء', enabled: true, limitValue: -1 },
    { planId: 'plan-enterprise', featureKey: 'products', featureName: 'Products', featureNameAr: 'المنتجات', category: 'inventory', categoryAr: 'المخزون', enabled: true, limitValue: -1 },
    { planId: 'plan-enterprise', featureKey: 'invoices', featureName: 'Monthly Invoices', featureNameAr: 'الفواتير الشهرية', category: 'billing', categoryAr: 'الفواتير', enabled: true, limitValue: -1 },
    { planId: 'plan-enterprise', featureKey: 'payment_gateways', featureName: 'Payment Gateways', featureNameAr: 'بوابات الدفع', category: 'payments', categoryAr: 'المدفوعات', enabled: true, limitValue: -1 },
    { planId: 'plan-enterprise', featureKey: 'reports', featureName: 'Advanced Reports', featureNameAr: 'تقارير متقدمة', category: 'reports', categoryAr: 'التقارير', enabled: true },
    { planId: 'plan-enterprise', featureKey: 'api_access', featureName: 'API Access', featureNameAr: 'الوصول للـ API', category: 'integrations', categoryAr: 'التكاملات', enabled: true },
    { planId: 'plan-enterprise', featureKey: 'white_label', featureName: 'White Label', featureNameAr: 'العلامة البيضاء', category: 'customization', categoryAr: 'التخصيص', enabled: true },
    { planId: 'plan-enterprise', featureKey: 'priority_support', featureName: 'Priority Support', featureNameAr: 'دعم أولوية', category: 'support', categoryAr: 'الدعم', enabled: true },
  ]

  for (const feature of planFeatures) {
    await prisma.planFeature.create({
      data: {
        ...feature,
        sortOrder: 0,
      }
    })
  }

  // إنشاء اشتراك للشركة
  const startDate = new Date()
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + 1)

  await prisma.subscription.create({
    data: {
      id: 'sub-demo',
      companyId: company.id,
      planId: 'plan-enterprise',
      status: 'active',
      billingCycle: 'MONTHLY',
      startDate,
      endDate,
      originalPrice: 999,
      discountPercent: 100, // مجاني للعرض
      finalPrice: 0,
      currency: 'EGP',
      autoRenew: true,
    }
  })
  console.log('✅ خطط الاشتراك:', plans.length, '| ميزات الخطط:', planFeatures.length)

  // ============================================
  // 15. قوالب الطباعة الافتراضية
  // ============================================
  await prisma.printTemplate.create({
    data: {
      id: 'template-invoice',
      companyId: company.id,
      name: 'قالب الفاتورة الافتراضي',
      nameAr: 'قالب الفاتورة الافتراضي',
      type: 'INVOICE',
      content: '{{company_name}}\n{{invoice_number}}\n{{customer_name}}\n{{total}}',
      paperSize: 'A4',
      orientation: 'portrait',
      isDefault: true,
      active: true,
      updatedAt: now,
    }
  })

  await prisma.printTemplate.create({
    data: {
      id: 'template-receipt',
      companyId: company.id,
      name: 'قالب الإيصال الافتراضي',
      nameAr: 'قالب الإيصال الافتراضي',
      type: 'RECEIPT',
      content: '{{company_name}}\nإيصال رقم: {{receipt_number}}\n{{amount}}',
      paperSize: 'A4_THIRD',
      orientation: 'portrait',
      isDefault: true,
      active: true,
      updatedAt: now,
    }
  })
  console.log('✅ قوالب الطباعة: 2')

  // ============================================
  // الإحصائيات النهائية
  // ============================================
  console.log('\n🎉 تم إضافة البيانات التجريبية بنجاح!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 ملخص البيانات:')
  console.log(`   - الشركات: 1`)
  console.log(`   - الفروع: ${branches.length}`)
  console.log(`   - المستخدمين: 7`)
  console.log(`   - العملاء: ${customers.length}`)
  console.log(`   - المنتجات: ${products.length}`)
  console.log(`   - الفواتير: ${invoiceCount}`)
  console.log(`   - المدفوعات: ${paymentCount}`)
  console.log(`   - إجمالي المبيعات: ${totalSales.toLocaleString()} ج.م`)
  console.log(`   - إجمالي المحصل: ${totalPaid.toLocaleString()} ج.م`)
  console.log(`   - بوابات الدفع: 4`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n📋 معلومات الدخول:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👤 مدير النظام: admin@aqsati.com / 123456')
  console.log('👤 مدير الشركة: company@aqsati.com / 123456')
  console.log('👤 مندوب: agent1@aqsati.com / 123456')
  console.log('👤 محصل: collector1@aqsati.com / 123456')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

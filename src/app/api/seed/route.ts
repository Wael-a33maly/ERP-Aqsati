import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// API لإضافة بيانات تجريبية محسنة وشاملة
export async function POST(request: NextRequest) {
  try {
    const superAdminPassword = 'WEGSMs@1983'
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10)
    
    let addedCounts = {
      companies: 0,
      branches: 0,
      users: 0,
      zones: 0,
      categories: 0,
      products: 0,
      warehouses: 0,
      customers: 0,
      invoices: 0,
      payments: 0,
      governorates: 0,
      cities: 0,
      areas: 0,
      installmentContracts: 0,
      installments: 0,
      commissionPolicies: 0,
      agentCommissions: 0,
      returns: 0,
      notifications: 0,
      agentLocations: 0,
      auditLogs: 0,
      printTemplates: 0,
      receiptTemplateCategories: 0,
      globalReceiptTemplates: 0,
    }

    // ============== 1. الشركات ==============
    let company1 = await db.company.findFirst({ where: { code: 'CMP-0001' } })
    if (!company1) {
      company1 = await db.company.create({
        data: {
          name: 'شركة الأمل للتجارة',
          nameAr: 'شركة الأمل للتجارة',
          code: 'CMP-0001',
          email: 'info@alamal.com',
          phone: '0501234567',
          address: 'الرياض - حي العليا',
          taxNumber: '300123456789003',
          taxRate: 15,
          currency: 'SAR',
          active: true,
        }
      })
      addedCounts.companies++
    }

    let company2 = await db.company.findFirst({ where: { code: 'CMP-0002' } })
    if (!company2) {
      company2 = await db.company.create({
        data: {
          name: 'مؤسسة النور',
          nameAr: 'مؤسسة النور',
          code: 'CMP-0002',
          email: 'info@alnoor.com',
          phone: '0559876543',
          address: 'جدة - حي الروضة',
          taxNumber: '300987654321003',
          taxRate: 15,
          currency: 'SAR',
          active: true,
        }
      })
      addedCounts.companies++
    }

    // ============== 2. الفروع ==============
    let branch1 = await db.branch.findFirst({ where: { code: 'BR-0001' } })
    if (!branch1) {
      branch1 = await db.branch.create({
        data: {
          name: 'الفرع الرئيسي - الرياض',
          nameAr: 'الفرع الرئيسي - الرياض',
          code: 'BR-0001',
          companyId: company1.id,
          address: 'الرياض - حي العليا - شارع الملك فهد',
          phone: '0111234567',
          isMain: true,
          active: true,
        }
      })
      addedCounts.branches++
    }

    let branch2 = await db.branch.findFirst({ where: { code: 'BR-0002' } })
    if (!branch2) {
      branch2 = await db.branch.create({
        data: {
          name: 'فرع جدة',
          nameAr: 'فرع جدة',
          code: 'BR-0002',
          companyId: company1.id,
          address: 'جدة - حي الروضة',
          phone: '0129876543',
          isMain: false,
          active: true,
        }
      })
      addedCounts.branches++
    }

    let branch3 = await db.branch.findFirst({ where: { code: 'BR-0003' } })
    if (!branch3) {
      branch3 = await db.branch.create({
        data: {
          name: 'الفرع الرئيسي - الدمام',
          nameAr: 'الفرع الرئيسي - الدمام',
          code: 'BR-0003',
          companyId: company2.id,
          address: 'الدمام - حي الفيصلية',
          phone: '0138765432',
          isMain: true,
          active: true,
        }
      })
      addedCounts.branches++
    }

    // فروع إضافية
    const additionalBranches = [
      { name: 'فرع مكة المكرمة', code: 'BR-0004', address: 'مكة المكرمة - حي العزيزية', phone: '0125551234' },
      { name: 'فرع المدينة المنورة', code: 'BR-0005', address: 'المدينة المنورة - حي قباء', phone: '0148234567' },
      { name: 'فرع الخبر', code: 'BR-0006', address: 'الخبر - حي اليرموك', phone: '0138987654' },
    ]

    for (const branchData of additionalBranches) {
      const existing = await db.branch.findFirst({ where: { code: branchData.code } })
      if (!existing) {
        await db.branch.create({
          data: {
            name: branchData.name,
            nameAr: branchData.name,
            code: branchData.code,
            companyId: company1.id,
            address: branchData.address,
            phone: branchData.phone,
            isMain: false,
            active: true,
          }
        })
        addedCounts.branches++
      }
    }

    // ============== 3. المحافظات والمدن والمناطق ==============
    let gov1 = await db.governorate.findFirst({ where: { code: 'GOV-001' } })
    if (!gov1) {
      gov1 = await db.governorate.create({
        data: { name: 'الرياض', nameAr: 'الرياض', code: 'GOV-001', companyId: company1.id, active: true }
      })
      addedCounts.governorates++
    }
    let gov2 = await db.governorate.findFirst({ where: { code: 'GOV-002' } })
    if (!gov2) {
      gov2 = await db.governorate.create({
        data: { name: 'جدة', nameAr: 'جدة', code: 'GOV-002', companyId: company1.id, active: true }
      })
      addedCounts.governorates++
    }
    let gov3 = await db.governorate.findFirst({ where: { code: 'GOV-003' } })
    if (!gov3) {
      gov3 = await db.governorate.create({
        data: { name: 'الدمام', nameAr: 'الدمام', code: 'GOV-003', companyId: company1.id, active: true }
      })
      addedCounts.governorates++
    }
    let gov4 = await db.governorate.findFirst({ where: { code: 'GOV-004' } })
    if (!gov4) {
      gov4 = await db.governorate.create({
        data: { name: 'مكة المكرمة', nameAr: 'مكة المكرمة', code: 'GOV-004', companyId: company1.id, active: true }
      })
      addedCounts.governorates++
    }
    let gov5 = await db.governorate.findFirst({ where: { code: 'GOV-005' } })
    if (!gov5) {
      gov5 = await db.governorate.create({
        data: { name: 'المدينة المنورة', nameAr: 'المدينة المنورة', code: 'GOV-005', companyId: company1.id, active: true }
      })
      addedCounts.governorates++
    }

    // المدن
    const citiesData = [
      { name: 'وسط الرياض', code: 'CIT-001', governorateId: gov1.id },
      { name: 'شمال الرياض', code: 'CIT-002', governorateId: gov1.id },
      { name: 'جنوب الرياض', code: 'CIT-003', governorateId: gov1.id },
      { name: 'شرق الرياض', code: 'CIT-004', governorateId: gov1.id },
      { name: 'غرب الرياض', code: 'CIT-005', governorateId: gov1.id },
      { name: 'وسط جدة', code: 'CIT-006', governorateId: gov2.id },
      { name: 'شمال جدة', code: 'CIT-007', governorateId: gov2.id },
      { name: 'جنوب جدة', code: 'CIT-008', governorateId: gov2.id },
      { name: 'الدمام الوسطى', code: 'CIT-009', governorateId: gov3.id },
      { name: 'الدمام الشمالية', code: 'CIT-010', governorateId: gov3.id },
      { name: 'مكة المكرمة', code: 'CIT-011', governorateId: gov4.id },
      { name: 'المدينة المنورة', code: 'CIT-012', governorateId: gov5.id },
    ]

    const cities: any = {}
    for (const cityData of citiesData) {
      let city = await db.city.findFirst({ where: { code: cityData.code } })
      if (!city) {
        city = await db.city.create({
          data: { name: cityData.name, nameAr: cityData.name, code: cityData.code, companyId: company1.id, governorateId: cityData.governorateId, active: true }
        })
        addedCounts.cities++
      }
      cities[cityData.code] = city
    }

    // المناطق
    const areasData = [
      // الرياض
      { name: 'حي العليا', code: 'ARE-001', cityCode: 'CIT-001' },
      { name: 'حي السليمانية', code: 'ARE-002', cityCode: 'CIT-001' },
      { name: 'حي الورود', code: 'ARE-003', cityCode: 'CIT-002' },
      { name: 'حي الياسمين', code: 'ARE-004', cityCode: 'CIT-002' },
      { name: 'حي السودان', code: 'ARE-005', cityCode: 'CIT-003' },
      { name: 'حي الشميسي', code: 'ARE-006', cityCode: 'CIT-003' },
      { name: 'حي الروضة', code: 'ARE-007', cityCode: 'CIT-004' },
      { name: 'حي النسيم', code: 'ARE-008', cityCode: 'CIT-004' },
      { name: 'حي الملز', code: 'ARE-009', cityCode: 'CIT-005' },
      { name: 'حي الربوة', code: 'ARE-010', cityCode: 'CIT-005' },
      // جدة
      { name: 'حي الحمراء', code: 'ARE-011', cityCode: 'CIT-006' },
      { name: 'حي البلد', code: 'ARE-012', cityCode: 'CIT-006' },
      { name: 'حي الصفا', code: 'ARE-013', cityCode: 'CIT-007' },
      { name: 'حي المروة', code: 'ARE-014', cityCode: 'CIT-007' },
      { name: 'حي الفيصلية', code: 'ARE-015', cityCode: 'CIT-008' },
      { name: 'حي السلامة', code: 'ARE-016', cityCode: 'CIT-008' },
      // الدمام
      { name: 'حي الفيصلية الدمام', code: 'ARE-017', cityCode: 'CIT-009' },
      { name: 'حي الشاطئ', code: 'ARE-018', cityCode: 'CIT-009' },
      { name: 'حي اليرموك', code: 'ARE-019', cityCode: 'CIT-010' },
      { name: 'حي النخيل', code: 'ARE-020', cityCode: 'CIT-010' },
      // مكة والمدينة
      { name: 'حي العزيزية', code: 'ARE-021', cityCode: 'CIT-011' },
      { name: 'حي الشوقية', code: 'ARE-022', cityCode: 'CIT-011' },
      { name: 'حي قباء', code: 'ARE-023', cityCode: 'CIT-012' },
      { name: 'حي العوالي', code: 'ARE-024', cityCode: 'CIT-012' },
    ]

    const areas: any = {}
    for (const areaData of areasData) {
      const existing = await db.area.findFirst({ where: { code: areaData.code } })
      if (!existing) {
        const area = await db.area.create({
          data: { name: areaData.name, nameAr: areaData.name, code: areaData.code, companyId: company1.id, cityId: cities[areaData.cityCode].id, active: true }
        })
        areas[areaData.code] = area
        addedCounts.areas++
      }
    }

    // ============== 4. المستخدمين ==============
    let superAdmin = await db.user.findFirst({ where: { email: 'a33maly@gmail.com' } })
    if (!superAdmin) {
      superAdmin = await db.user.create({
        data: {
          name: 'مدير النظام',
          nameAr: 'مدير النظام',
          email: 'a33maly@gmail.com',
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          active: true,
        }
      })
      addedCounts.users++
    }

    let companyAdmin = await db.user.findFirst({ where: { email: 'ahmed@alamal.com' } })
    if (!companyAdmin) {
      companyAdmin = await db.user.create({
        data: {
          name: 'أحمد محمد',
          nameAr: 'أحمد محمد',
          email: 'ahmed@alamal.com',
          password: hashedPassword,
          role: 'COMPANY_ADMIN',
          companyId: company1.id,
          active: true,
        }
      })
      addedCounts.users++
    }

    let branchManager = await db.user.findFirst({ where: { email: 'manager@alamal.com' } })
    if (!branchManager) {
      branchManager = await db.user.create({
        data: {
          name: 'محمد علي',
          nameAr: 'محمد علي',
          email: 'manager@alamal.com',
          password: hashedPassword,
          role: 'BRANCH_MANAGER',
          companyId: company1.id,
          branchId: branch1.id,
          active: true,
        }
      })
      addedCounts.users++
    }

    let agent1 = await db.user.findFirst({ where: { email: 'khalid@alamal.com' } })
    if (!agent1) {
      agent1 = await db.user.create({
        data: {
          name: 'خالد سعيد',
          nameAr: 'خالد سعيد',
          email: 'khalid@alamal.com',
          password: hashedPassword,
          phone: '0501111111',
          role: 'AGENT',
          companyId: company1.id,
          branchId: branch1.id,
          active: true,
        }
      })
      addedCounts.users++
    }

    let agent2 = await db.user.findFirst({ where: { email: 'abdullah@alamal.com' } })
    if (!agent2) {
      agent2 = await db.user.create({
        data: {
          name: 'عبدالله فهد',
          nameAr: 'عبدالله فهد',
          email: 'abdullah@alamal.com',
          password: hashedPassword,
          phone: '0502222222',
          role: 'AGENT',
          companyId: company1.id,
          branchId: branch2.id,
          active: true,
        }
      })
      addedCounts.users++
    }

    let collector = await db.user.findFirst({ where: { email: 'saud@alamal.com' } })
    if (!collector) {
      collector = await db.user.create({
        data: {
          name: 'سعود محمد',
          nameAr: 'سعود محمد',
          email: 'saud@alamal.com',
          password: hashedPassword,
          phone: '0503333333',
          role: 'COLLECTOR',
          companyId: company1.id,
          branchId: branch1.id,
          active: true,
        }
      })
      addedCounts.users++
    }

    // مناديب إضافيين
    const agentsData = [
      { name: 'فهد عبدالله', email: 'fahad@alamal.com', phone: '0504444444', branchId: branch1.id },
      { name: 'ناصر سالم', email: 'nasser@alamal.com', phone: '0505555555', branchId: branch1.id },
      { name: 'محمد أحمد', email: 'mohammed@alamal.com', phone: '0506666666', branchId: branch2.id },
      { name: 'سعيد علي', email: 'saeed@alamal.com', phone: '0507777777', branchId: branch2.id },
      { name: 'عمر خالد', email: 'omar@alamal.com', phone: '0508888888', branchId: branch1.id },
      { name: 'راشد سلطان', email: 'rashed@alamal.com', phone: '0509999999', branchId: branch1.id },
      { name: 'ماجد عبدالرحمن', email: 'majed@alamal.com', phone: '0511111111', branchId: branch2.id },
      { name: 'سلمان حمد', email: 'salman@alamal.com', phone: '0512222222', branchId: branch2.id },
    ]

    const agents: any[] = [agent1, agent2]
    for (const agentData of agentsData) {
      let existingAgent = await db.user.findFirst({ where: { email: agentData.email } })
      if (!existingAgent) {
        existingAgent = await db.user.create({
          data: {
            name: agentData.name,
            nameAr: agentData.name,
            email: agentData.email,
            password: hashedPassword,
            phone: agentData.phone,
            role: 'AGENT',
            companyId: company1.id,
            branchId: agentData.branchId,
            active: true,
          }
        })
        addedCounts.users++
      }
      agents.push(existingAgent)
    }

    // محصلين إضافيين
    const collectorsData = [
      { name: 'عبدالعزيز محمد', email: 'abdulaziz@alamal.com', phone: '0513333333', branchId: branch1.id },
      { name: 'طارق أحمد', email: 'tarek@alamal.com', phone: '0514444444', branchId: branch2.id },
    ]

    for (const collData of collectorsData) {
      const existing = await db.user.findFirst({ where: { email: collData.email } })
      if (!existing) {
        await db.user.create({
          data: {
            name: collData.name,
            nameAr: collData.name,
            email: collData.email,
            password: hashedPassword,
            phone: collData.phone,
            role: 'COLLECTOR',
            companyId: company1.id,
            branchId: collData.branchId,
            active: true,
          }
        })
        addedCounts.users++
      }
    }

    // ============== 5. المناطق الجغرافية ==============
    let zone1 = await db.zone.findFirst({ where: { code: 'ZN-0001' } })
    if (!zone1) {
      zone1 = await db.zone.create({
        data: {
          name: 'حي العليا',
          nameAr: 'حي العليا',
          code: 'ZN-0001',
          companyId: company1.id,
          branchId: branch1.id,
          description: 'منطقة حي العليا - الرياض',
          active: true,
        }
      })
      addedCounts.zones++
    }

    let zone2 = await db.zone.findFirst({ where: { code: 'ZN-0002' } })
    if (!zone2) {
      zone2 = await db.zone.create({
        data: {
          name: 'حي النسيم',
          nameAr: 'حي النسيم',
          code: 'ZN-0002',
          companyId: company1.id,
          branchId: branch1.id,
          description: 'منطقة حي النسيم - الرياض',
          active: true,
        }
      })
      addedCounts.zones++
    }

    let zone3 = await db.zone.findFirst({ where: { code: 'ZN-0003' } })
    if (!zone3) {
      zone3 = await db.zone.create({
        data: {
          name: 'حي الروضة - جدة',
          nameAr: 'حي الروضة - جدة',
          code: 'ZN-0003',
          companyId: company1.id,
          branchId: branch2.id,
          description: 'منطقة حي الروضة - جدة',
          active: true,
        }
      })
      addedCounts.zones++
    }

    // مناطق إضافية
    const zonesData = [
      { name: 'حي الملز', code: 'ZN-0004', branchId: branch1.id, description: 'منطقة حي الملز - الرياض' },
      { name: 'حي السليمانية', code: 'ZN-0005', branchId: branch1.id, description: 'منطقة حي السليمانية - الرياض' },
      { name: 'حي الحمراء', code: 'ZN-0006', branchId: branch2.id, description: 'منطقة حي الحمراء - جدة' },
      { name: 'حي الصفا', code: 'ZN-0007', branchId: branch2.id, description: 'منطقة حي الصفا - جدة' },
    ]

    const zones: any[] = [zone1, zone2, zone3]
    for (const zoneData of zonesData) {
      let existing = await db.zone.findFirst({ where: { code: zoneData.code } })
      if (!existing) {
        existing = await db.zone.create({
          data: {
            name: zoneData.name,
            nameAr: zoneData.name,
            code: zoneData.code,
            companyId: company1.id,
            branchId: zoneData.branchId,
            description: zoneData.description,
            active: true,
          }
        })
        addedCounts.zones++
      }
      zones.push(existing)
    }

    // ربط المندوبين بالمناطق
    try {
      await db.zone.update({
        where: { id: zone1.id },
        data: { agents: { connect: [{ id: agent1.id }, { id: agents[2].id }] } }
      })
      await db.zone.update({
        where: { id: zone2.id },
        data: { agents: { connect: [{ id: agent1.id }, { id: agents[4].id }] } }
      })
      await db.zone.update({
        where: { id: zone3.id },
        data: { agents: { connect: [{ id: agent2.id }, { id: agents[6].id }] } }
      })
    } catch (e) {}

    // ============== 6. التصنيفات الهرمية ==============
    let catElectronics = await db.productCategory.findFirst({ where: { code: 'CAT-ELEC' } })
    if (!catElectronics) {
      catElectronics = await db.productCategory.create({
        data: { name: 'إلكترونيات', nameAr: 'إلكترونيات', code: 'CAT-ELEC', companyId: company1.id, active: true }
      })
      addedCounts.categories++
    }

    let catAppliances = await db.productCategory.findFirst({ where: { code: 'CAT-APPL' } })
    if (!catAppliances) {
      catAppliances = await db.productCategory.create({
        data: { name: 'أجهزة منزلية', nameAr: 'أجهزة منزلية', code: 'CAT-APPL', companyId: company1.id, active: true }
      })
      addedCounts.categories++
    }

    let catFurniture = await db.productCategory.findFirst({ where: { code: 'CAT-FURN' } })
    if (!catFurniture) {
      catFurniture = await db.productCategory.create({
        data: { name: 'أثاث', nameAr: 'أثاث', code: 'CAT-FURN', companyId: company1.id, active: true }
      })
      addedCounts.categories++
    }

    // تصنيفات فرعية للإلكترونيات
    let catPhones = await db.productCategory.findFirst({ where: { code: 'CAT-PHONE' } })
    if (!catPhones) {
      catPhones = await db.productCategory.create({
        data: { name: 'هواتف ذكية', nameAr: 'هواتف ذكية', code: 'CAT-PHONE', companyId: company1.id, parentId: catElectronics.id, active: true }
      })
      addedCounts.categories++
    }

    let catLaptops = await db.productCategory.findFirst({ where: { code: 'CAT-LAPTOP' } })
    if (!catLaptops) {
      catLaptops = await db.productCategory.create({
        data: { name: 'لابتوب', nameAr: 'لابتوب', code: 'CAT-LAPTOP', companyId: company1.id, parentId: catElectronics.id, active: true }
      })
      addedCounts.categories++
    }

    let catTVs = await db.productCategory.findFirst({ where: { code: 'CAT-TV' } })
    if (!catTVs) {
      catTVs = await db.productCategory.create({
        data: { name: 'تلفزيونات', nameAr: 'تلفزيونات', code: 'CAT-TV', companyId: company1.id, parentId: catElectronics.id, active: true }
      })
      addedCounts.categories++
    }

    let catTablets = await db.productCategory.findFirst({ where: { code: 'CAT-TABLET' } })
    if (!catTablets) {
      catTablets = await db.productCategory.create({
        data: { name: 'أجهزة لوحية', nameAr: 'أجهزة لوحية', code: 'CAT-TABLET', companyId: company1.id, parentId: catElectronics.id, active: true }
      })
      addedCounts.categories++
    }

    let catAccessories = await db.productCategory.findFirst({ where: { code: 'CAT-ACC' } })
    if (!catAccessories) {
      catAccessories = await db.productCategory.create({
        data: { name: 'إكسسوارات', nameAr: 'إكسسوارات', code: 'CAT-ACC', companyId: company1.id, parentId: catElectronics.id, active: true }
      })
      addedCounts.categories++
    }

    // تصنيفات فرعية للأجهزة المنزلية
    let catWashers = await db.productCategory.findFirst({ where: { code: 'CAT-WASH' } })
    if (!catWashers) {
      catWashers = await db.productCategory.create({
        data: { name: 'غسالات', nameAr: 'غسالات', code: 'CAT-WASH', companyId: company1.id, parentId: catAppliances.id, active: true }
      })
      addedCounts.categories++
    }

    let catFridges = await db.productCategory.findFirst({ where: { code: 'CAT-FRIDGE' } })
    if (!catFridges) {
      catFridges = await db.productCategory.create({
        data: { name: 'ثلاجات', nameAr: 'ثلاجات', code: 'CAT-FRIDGE', companyId: company1.id, parentId: catAppliances.id, active: true }
      })
      addedCounts.categories++
    }

    let catACs = await db.productCategory.findFirst({ where: { code: 'CAT-AC' } })
    if (!catACs) {
      catACs = await db.productCategory.create({
        data: { name: 'تكييفات', nameAr: 'تكييفات', code: 'CAT-AC', companyId: company1.id, parentId: catAppliances.id, active: true }
      })
      addedCounts.categories++
    }

    let catOvens = await db.productCategory.findFirst({ where: { code: 'CAT-OVEN' } })
    if (!catOvens) {
      catOvens = await db.productCategory.create({
        data: { name: 'أفران', nameAr: 'أفران', code: 'CAT-OVEN', companyId: company1.id, parentId: catAppliances.id, active: true }
      })
      addedCounts.categories++
    }

    // تصنيفات فرعية للأثاث
    let catSofas = await db.productCategory.findFirst({ where: { code: 'CAT-SOFA' } })
    if (!catSofas) {
      catSofas = await db.productCategory.create({
        data: { name: 'كنب', nameAr: 'كنب', code: 'CAT-SOFA', companyId: company1.id, parentId: catFurniture.id, active: true }
      })
      addedCounts.categories++
    }

    let catTables = await db.productCategory.findFirst({ where: { code: 'CAT-TABLE' } })
    if (!catTables) {
      catTables = await db.productCategory.create({
        data: { name: 'طاولات', nameAr: 'طاولات', code: 'CAT-TABLE', companyId: company1.id, parentId: catFurniture.id, active: true }
      })
      addedCounts.categories++
    }

    let catBeds = await db.productCategory.findFirst({ where: { code: 'CAT-BED' } })
    if (!catBeds) {
      catBeds = await db.productCategory.create({
        data: { name: 'أسرة', nameAr: 'أسرة', code: 'CAT-BED', companyId: company1.id, parentId: catFurniture.id, active: true }
      })
      addedCounts.categories++
    }

    let catWardrobes = await db.productCategory.findFirst({ where: { code: 'CAT-WARDROBE' } })
    if (!catWardrobes) {
      catWardrobes = await db.productCategory.create({
        data: { name: 'دواليب', nameAr: 'دواليب', code: 'CAT-WARDROBE', companyId: company1.id, parentId: catFurniture.id, active: true }
      })
      addedCounts.categories++
    }

    // تصنيفات فرعية من المستوى الثالث (تحت هواتف ذكية)
    let catIPhones = await db.productCategory.findFirst({ where: { code: 'CAT-IPHONE' } })
    if (!catIPhones) {
      catIPhones = await db.productCategory.create({
        data: { name: 'آيفون', nameAr: 'آيفون', code: 'CAT-IPHONE', companyId: company1.id, parentId: catPhones.id, active: true }
      })
      addedCounts.categories++
    }

    let catSamsung = await db.productCategory.findFirst({ where: { code: 'CAT-SAMSUNG' } })
    if (!catSamsung) {
      catSamsung = await db.productCategory.create({
        data: { name: 'سامسونج', nameAr: 'سامسونج', code: 'CAT-SAMSUNG', companyId: company1.id, parentId: catPhones.id, active: true }
      })
      addedCounts.categories++
    }

    let catHuawei = await db.productCategory.findFirst({ where: { code: 'CAT-HUAWEI' } })
    if (!catHuawei) {
      catHuawei = await db.productCategory.create({
        data: { name: 'هواوي', nameAr: 'هواوي', code: 'CAT-HUAWEI', companyId: company1.id, parentId: catPhones.id, active: true }
      })
      addedCounts.categories++
    }

    let catXiaomi = await db.productCategory.findFirst({ where: { code: 'CAT-XIAOMI' } })
    if (!catXiaomi) {
      catXiaomi = await db.productCategory.create({
        data: { name: 'شاومي', nameAr: 'شاومي', code: 'CAT-XIAOMI', companyId: company1.id, parentId: catPhones.id, active: true }
      })
      addedCounts.categories++
    }

    // ============== 7. المنتجات ==============
    const productsData = [
      // لابتوب
      { sku: 'PRD-0001', name: 'لابتوب HP ProBook 450', categoryId: catLaptops.id, costPrice: 2500, sellPrice: 3200, minPrice: 3000, barcode: '6291101234567', salesCommission: 3 },
      { sku: 'PRD-0013', name: 'لابتوب ديل Inspiron 15', categoryId: catLaptops.id, costPrice: 2200, sellPrice: 2900, minPrice: 2700, barcode: '6291101234568', salesCommission: 3 },
      { sku: 'PRD-0018', name: 'لابتوب HP Pavilion', categoryId: catLaptops.id, costPrice: 2800, sellPrice: 3500, minPrice: 3300, barcode: '6291101234569', salesCommission: 3 },
      { sku: 'PRD-0021', name: 'لابتوب Asus VivoBook', categoryId: catLaptops.id, costPrice: 2000, sellPrice: 2600, minPrice: 2400, barcode: '6291101234570', salesCommission: 3 },
      { sku: 'PRD-0022', name: 'لابتوب Lenovo ThinkPad', categoryId: catLaptops.id, costPrice: 3500, sellPrice: 4300, minPrice: 4100, barcode: '6291101234571', salesCommission: 3 },
      
      // آيفون
      { sku: 'PRD-0002', name: 'آيفون 15 برو 256GB', categoryId: catIPhones.id, costPrice: 4000, sellPrice: 5200, minPrice: 4900, barcode: '194253456789', salesCommission: 2.5 },
      { sku: 'PRD-0011', name: 'آيفون 15 برو ماكس 512GB', categoryId: catIPhones.id, costPrice: 4800, sellPrice: 6200, minPrice: 5900, barcode: '194253456790', salesCommission: 2.5 },
      { sku: 'PRD-0016', name: 'آيفون 14 برو 128GB', categoryId: catIPhones.id, costPrice: 3500, sellPrice: 4500, minPrice: 4200, barcode: '194253456791', salesCommission: 2.5 },
      { sku: 'PRD-0023', name: 'آيفون 15 128GB', categoryId: catIPhones.id, costPrice: 3200, sellPrice: 4100, minPrice: 3900, barcode: '194253456792', salesCommission: 2.5 },
      { sku: 'PRD-0024', name: 'آيفون 13 128GB', categoryId: catIPhones.id, costPrice: 2500, sellPrice: 3200, minPrice: 3000, barcode: '194253456793', salesCommission: 2.5 },
      { sku: 'PRD-0025', name: 'آيفون SE 2022', categoryId: catIPhones.id, costPrice: 1800, sellPrice: 2400, minPrice: 2200, barcode: '194253456794', salesCommission: 2.5 },
      
      // سامسونج
      { sku: 'PRD-0003', name: 'سامسونج جالاكسي S24 Ultra', categoryId: catSamsung.id, costPrice: 4500, sellPrice: 5800, minPrice: 5500, barcode: '8806095123456', salesCommission: 2.5 },
      { sku: 'PRD-0012', name: 'سامسونج جالاكسي A54', categoryId: catSamsung.id, costPrice: 1200, sellPrice: 1600, minPrice: 1500, barcode: '8806095123457', salesCommission: 2 },
      { sku: 'PRD-0017', name: 'سامسونج جالاكسي A34', categoryId: catSamsung.id, costPrice: 900, sellPrice: 1200, minPrice: 1100, barcode: '8806095123458', salesCommission: 2 },
      { sku: 'PRD-0026', name: 'سامسونج جالاكسي S24+', categoryId: catSamsung.id, costPrice: 3800, sellPrice: 4800, minPrice: 4500, barcode: '8806095123459', salesCommission: 2.5 },
      { sku: 'PRD-0027', name: 'سامسونج جالاكسي A14', categoryId: catSamsung.id, costPrice: 600, sellPrice: 850, minPrice: 800, barcode: '8806095123460', salesCommission: 2 },
      { sku: 'PRD-0028', name: 'سامسونج جالاكسي Z Fold5', categoryId: catSamsung.id, costPrice: 5500, sellPrice: 7000, minPrice: 6700, barcode: '8806095123461', salesCommission: 2.5 },
      
      // هواوي وشاومي
      { sku: 'PRD-0029', name: 'هواوي Mate 60 Pro', categoryId: catHuawei.id, costPrice: 3200, sellPrice: 4100, minPrice: 3900, barcode: '8806095123462', salesCommission: 2.5 },
      { sku: 'PRD-0030', name: 'شاومي Redmi Note 13', categoryId: catXiaomi.id, costPrice: 700, sellPrice: 950, minPrice: 900, barcode: '8806095123463', salesCommission: 2 },
      { sku: 'PRD-0031', name: 'شاومي 14 Pro', categoryId: catXiaomi.id, costPrice: 2800, sellPrice: 3600, minPrice: 3400, barcode: '8806095123464', salesCommission: 2.5 },
      
      // تلفزيونات
      { sku: 'PRD-0010', name: 'تلفزيون سوني 55 بوصة 4K', categoryId: catTVs.id, costPrice: 2800, sellPrice: 3600, minPrice: 3400, barcode: '4548736012345', salesCommission: 2 },
      { sku: 'PRD-0032', name: 'تلفزيون سامسونج 65 بوصة QLED', categoryId: catTVs.id, costPrice: 4500, sellPrice: 5800, minPrice: 5500, barcode: '4548736012346', salesCommission: 2 },
      { sku: 'PRD-0033', name: 'تلفزيون LG 50 بوصة 4K', categoryId: catTVs.id, costPrice: 2200, sellPrice: 2900, minPrice: 2700, barcode: '4548736012347', salesCommission: 2 },
      { sku: 'PRD-0034', name: 'تلفزيون TCL 43 بوصة', categoryId: catTVs.id, costPrice: 1200, sellPrice: 1600, minPrice: 1500, barcode: '4548736012348', salesCommission: 2 },
      
      // أجهزة لوحية
      { sku: 'PRD-0035', name: 'آيباد برو 12.9 بوصة', categoryId: catTablets.id, costPrice: 3800, sellPrice: 4800, minPrice: 4500, barcode: '4548736012349', salesCommission: 2.5 },
      { sku: 'PRD-0036', name: 'آيباد الهواء 256GB', categoryId: catTablets.id, costPrice: 2200, sellPrice: 2800, minPrice: 2600, barcode: '4548736012350', salesCommission: 2 },
      { sku: 'PRD-0037', name: 'سامسونج جالاكسي تاب S9', categoryId: catTablets.id, costPrice: 2800, sellPrice: 3600, minPrice: 3400, barcode: '4548736012351', salesCommission: 2 },
      
      // إكسسوارات
      { sku: 'PRD-0038', name: 'سماعات آبل AirPods Pro 2', categoryId: catAccessories.id, costPrice: 700, sellPrice: 1000, minPrice: 900, barcode: '4548736012352', salesCommission: 3 },
      { sku: 'PRD-0039', name: 'سماعات سامسونج Buds2 Pro', categoryId: catAccessories.id, costPrice: 450, sellPrice: 650, minPrice: 600, barcode: '4548736012353', salesCommission: 3 },
      { sku: 'PRD-0040', name: 'ساعة آبل Series 9', categoryId: catAccessories.id, costPrice: 1500, sellPrice: 2000, minPrice: 1900, barcode: '4548736012354', salesCommission: 3 },
      { sku: 'PRD-0041', name: 'شاحن لاسلكي سامسونج', categoryId: catAccessories.id, costPrice: 120, sellPrice: 180, minPrice: 160, barcode: '4548736012355', salesCommission: 5 },
      
      // غسالات
      { sku: 'PRD-0004', name: 'غسالة سامسونج 10 كيلو', categoryId: catWashers.id, costPrice: 1800, sellPrice: 2400, minPrice: 2200, barcode: '8806095234567', salesCommission: 2 },
      { sku: 'PRD-0014', name: 'غسالة LG 8 كيلو', categoryId: catWashers.id, costPrice: 1500, sellPrice: 2000, minPrice: 1800, barcode: '8806095234568', salesCommission: 2 },
      { sku: 'PRD-0019', name: 'غسالة ويرلبول 12 كيلو', categoryId: catWashers.id, costPrice: 2200, sellPrice: 2800, minPrice: 2600, barcode: '8806095234569', salesCommission: 2 },
      { sku: 'PRD-0042', name: 'غسالة سامسونج ناشفة 9 كيلو', categoryId: catWashers.id, costPrice: 2800, sellPrice: 3600, minPrice: 3400, barcode: '8806095234570', salesCommission: 2 },
      { sku: 'PRD-0043', name: 'غسالة بوش 7 كيلو', categoryId: catWashers.id, costPrice: 2000, sellPrice: 2600, minPrice: 2400, barcode: '8806095234571', salesCommission: 2 },
      
      // ثلاجات
      { sku: 'PRD-0005', name: 'ثلاجة LG نوفروست 18 قدم', categoryId: catFridges.id, costPrice: 2200, sellPrice: 2900, minPrice: 2700, barcode: '8801234567890', salesCommission: 2 },
      { sku: 'PRD-0015', name: 'ثلاجة سامسونج دبل 25 قدم', categoryId: catFridges.id, costPrice: 2800, sellPrice: 3600, minPrice: 3400, barcode: '8801234567891', salesCommission: 2 },
      { sku: 'PRD-0044', name: 'ثلاجة شارب دبل 18 قدم', categoryId: catFridges.id, costPrice: 3200, sellPrice: 4100, minPrice: 3900, barcode: '8801234567892', salesCommission: 2 },
      { sku: 'PRD-0045', name: 'فريزر أفقى 14 قدم', categoryId: catFridges.id, costPrice: 1500, sellPrice: 2000, minPrice: 1800, barcode: '8801234567893', salesCommission: 2 },
      { sku: 'PRD-0046', name: 'ثلاجة هيونداي 16 قدم', categoryId: catFridges.id, costPrice: 1800, sellPrice: 2400, minPrice: 2200, barcode: '8801234567894', salesCommission: 2 },
      
      // تكييفات
      { sku: 'PRD-0006', name: 'تكييف شارب 1.5 حصان', categoryId: catACs.id, costPrice: 1200, sellPrice: 1600, minPrice: 1500, barcode: '6921234567890', salesCommission: 1.5 },
      { sku: 'PRD-0047', name: 'تكييف LG 2 حصان إنفرتر', categoryId: catACs.id, costPrice: 2000, sellPrice: 2600, minPrice: 2400, barcode: '6921234567891', salesCommission: 1.5 },
      { sku: 'PRD-0048', name: 'تكييف جنرال 1 حصان', categoryId: catACs.id, costPrice: 900, sellPrice: 1200, minPrice: 1100, barcode: '6921234567892', salesCommission: 1.5 },
      { sku: 'PRD-0049', name: 'تكييف كريير 2.5 حصان', categoryId: catACs.id, costPrice: 2800, sellPrice: 3600, minPrice: 3400, barcode: '6921234567893', salesCommission: 1.5 },
      
      // أفران
      { sku: 'PRD-0050', name: 'فرن غاز يونيون 60 سم', categoryId: catOvens.id, costPrice: 800, sellPrice: 1100, minPrice: 1000, barcode: '6921234567894', salesCommission: 2 },
      { sku: 'PRD-0051', name: 'ميكروويف سامسونج 30 لتر', categoryId: catOvens.id, costPrice: 600, sellPrice: 850, minPrice: 800, barcode: '6921234567895', salesCommission: 2 },
      
      // كنب
      { sku: 'PRD-0007', name: 'كنبة مودرن 3 مقاعد', categoryId: catSofas.id, costPrice: 1500, sellPrice: 2200, minPrice: 2000, salesCommission: 3 },
      { sku: 'PRD-0052', name: 'كنبة كلاسيك 4 مقاعد', categoryId: catSofas.id, costPrice: 2800, sellPrice: 3800, minPrice: 3500, salesCommission: 3 },
      { sku: 'PRD-0053', name: 'صالون 7 قطع مودرن', categoryId: catSofas.id, costPrice: 5000, sellPrice: 7000, minPrice: 6500, salesCommission: 4 },
      { sku: 'PRD-0054', name: 'كرسي استرخاء', categoryId: catSofas.id, costPrice: 600, sellPrice: 900, minPrice: 850, salesCommission: 3 },
      
      // طاولات
      { sku: 'PRD-0008', name: 'طاولة سفرة 6 كراسي', categoryId: catTables.id, costPrice: 1800, sellPrice: 2500, minPrice: 2300, salesCommission: 3 },
      { sku: 'PRD-0055', name: 'طاولة قهوة خشب', categoryId: catTables.id, costPrice: 300, sellPrice: 450, minPrice: 400, salesCommission: 4 },
      { sku: 'PRD-0056', name: 'طاولة سفرة 8 كراسي', categoryId: catTables.id, costPrice: 2500, sellPrice: 3400, minPrice: 3200, salesCommission: 3 },
      
      // أسرة
      { sku: 'PRD-0009', name: 'سرير خشب كينج', categoryId: catBeds.id, costPrice: 3000, sellPrice: 4000, minPrice: 3800, salesCommission: 4 },
      { sku: 'PRD-0057', name: 'سرير خشب كوين', categoryId: catBeds.id, costPrice: 2200, sellPrice: 3000, minPrice: 2800, salesCommission: 4 },
      { sku: 'PRD-0058', name: 'غرفة نوم كاملة', categoryId: catBeds.id, costPrice: 8000, sellPrice: 11000, minPrice: 10000, salesCommission: 4 },
      { sku: 'PRD-0059', name: 'سرير أطفال', categoryId: catBeds.id, costPrice: 800, sellPrice: 1200, minPrice: 1100, salesCommission: 4 },
      
      // دواليب
      { sku: 'PRD-0060', name: 'دولاب خشب 3 أبواب', categoryId: catWardrobes.id, costPrice: 2500, sellPrice: 3500, minPrice: 3300, salesCommission: 3 },
      { sku: 'PRD-0061', name: 'دولاب خشب 2 أبواب', categoryId: catWardrobes.id, costPrice: 1800, sellPrice: 2500, minPrice: 2300, salesCommission: 3 },
    ]

    const products: any[] = []
    for (const pData of productsData) {
      let product = await db.product.findFirst({ where: { sku: pData.sku } })
      if (!product) {
        product = await db.product.create({
          data: {
            name: pData.name,
            nameAr: pData.name,
            sku: pData.sku,
            companyId: company1.id,
            categoryId: pData.categoryId,
            description: pData.name,
            unit: 'piece',
            costPrice: pData.costPrice,
            sellPrice: pData.sellPrice,
            minPrice: pData.minPrice,
            barcode: pData.barcode || null,
            salesCommission: pData.salesCommission || 0,
            salesCommissionType: 'PERCENTAGE',
            active: true,
          }
        })
        addedCounts.products++
      }
      products.push(product)
    }

    // ============== 8. المخازن ==============
    let warehouse1 = await db.warehouse.findFirst({ where: { code: 'WH-0001' } })
    if (!warehouse1) {
      warehouse1 = await db.warehouse.create({
        data: {
          name: 'المخزن الرئيسي - الرياض',
          nameAr: 'المخزن الرئيسي - الرياض',
          code: 'WH-0001',
          companyId: company1.id,
          branchId: branch1.id,
          address: 'الرياض - المنطقة الصناعية',
          isMain: true,
          active: true,
        }
      })
      addedCounts.warehouses++
    }

    let warehouse2 = await db.warehouse.findFirst({ where: { code: 'WH-0002' } })
    if (!warehouse2) {
      warehouse2 = await db.warehouse.create({
        data: {
          name: 'مخزن جدة',
          nameAr: 'مخزن جدة',
          code: 'WH-0002',
          companyId: company1.id,
          branchId: branch2.id,
          address: 'جدة - المنطقة الصناعية',
          isMain: false,
          active: true,
        }
      })
      addedCounts.warehouses++
    }

    let warehouse3 = await db.warehouse.findFirst({ where: { code: 'WH-0003' } })
    if (!warehouse3) {
      warehouse3 = await db.warehouse.create({
        data: {
          name: 'مخزن الدمام',
          nameAr: 'مخزن الدمام',
          code: 'WH-0003',
          companyId: company1.id,
          branchId: branch3.id,
          address: 'الدمام - المنطقة الصناعية',
          isMain: false,
          active: true,
        }
      })
      addedCounts.warehouses++
    }

    // ============== 9. المخزون ==============
    for (const product of products) {
      const existingInv1 = await db.inventory.findFirst({ where: { productId: product.id, warehouseId: warehouse1.id } })
      if (!existingInv1) {
        await db.inventory.create({
          data: {
            productId: product.id,
            warehouseId: warehouse1.id,
            quantity: Math.floor(Math.random() * 80) + 20,
            minQuantity: 5,
            maxQuantity: 150,
          }
        })
      }
      const existingInv2 = await db.inventory.findFirst({ where: { productId: product.id, warehouseId: warehouse2.id } })
      if (!existingInv2) {
        await db.inventory.create({
          data: {
            productId: product.id,
            warehouseId: warehouse2.id,
            quantity: Math.floor(Math.random() * 50) + 10,
            minQuantity: 3,
            maxQuantity: 100,
          }
        })
      }
      const existingInv3 = await db.inventory.findFirst({ where: { productId: product.id, warehouseId: warehouse3.id } })
      if (!existingInv3) {
        await db.inventory.create({
          data: {
            productId: product.id,
            warehouseId: warehouse3.id,
            quantity: Math.floor(Math.random() * 30) + 5,
            minQuantity: 3,
            maxQuantity: 50,
          }
        })
      }
    }

    // ============== 10. العملاء ==============
    const customersData = [
      // عملاء الرياض - حي العليا
      { code: 'CUST-0001', name: 'محمد عبدالله الشمري', zoneId: zone1.id, agentId: agent1.id, branchId: branch1.id, phone: '0551234567', creditLimit: 50000, governorateId: gov1.id, cityId: cities['CIT-001'].id },
      { code: 'CUST-0002', name: 'فهد سعد القحطاني', zoneId: zone1.id, agentId: agent1.id, branchId: branch1.id, phone: '0552345678', creditLimit: 30000, governorateId: gov1.id, cityId: cities['CIT-001'].id },
      { code: 'CUST-0009', name: 'عبدالله سالم المالكي', zoneId: zone1.id, agentId: agent1.id, branchId: branch1.id, phone: '0557890123', creditLimit: 45000, governorateId: gov1.id, cityId: cities['CIT-001'].id },
      { code: 'CUST-0012', name: 'خالد عبدالعزيز الشهري', zoneId: zone1.id, agentId: agent1.id, branchId: branch1.id, phone: '0560123456', creditLimit: 28000, governorateId: gov1.id, cityId: cities['CIT-001'].id },
      { code: 'CUST-0015', name: 'صالح محمد العمري', zoneId: zone1.id, agentId: agent1.id, branchId: branch1.id, phone: '0562345678', creditLimit: 35000, governorateId: gov1.id, cityId: cities['CIT-001'].id },
      
      // عملاء الرياض - حي النسيم
      { code: 'CUST-0003', name: 'عبدالرحمن محمد العتيبي', zoneId: zone2.id, agentId: agent1.id, branchId: branch1.id, phone: '0553456789', creditLimit: 20000, governorateId: gov1.id, cityId: cities['CIT-004'].id },
      { code: 'CUST-0004', name: 'سلطان خالد الدوسري', zoneId: zone2.id, agentId: agent1.id, branchId: branch1.id, phone: '0554567890', creditLimit: 40000, governorateId: gov1.id, cityId: cities['CIT-004'].id },
      { code: 'CUST-0010', name: 'سعود ناصر السبيعي', zoneId: zone2.id, agentId: agent1.id, branchId: branch1.id, phone: '0558901234', creditLimit: 55000, governorateId: gov1.id, cityId: cities['CIT-004'].id },
      { code: 'CUST-0013', name: 'مؤسسة النور للتجارة', zoneId: zone2.id, agentId: agent1.id, branchId: branch1.id, phone: '0114567890', creditLimit: 150000, governorateId: gov1.id, cityId: cities['CIT-004'].id },
      
      // عملاء جدة
      { code: 'CUST-0005', name: 'أحمد علي الغامدي', zoneId: zone3.id, agentId: agent2.id, branchId: branch2.id, phone: '0555678901', creditLimit: 35000, governorateId: gov2.id, cityId: cities['CIT-006'].id },
      { code: 'CUST-0006', name: 'يوسف إبراهيم الحربي', zoneId: zone3.id, agentId: agent2.id, branchId: branch2.id, phone: '0556789012', creditLimit: 25000, governorateId: gov2.id, cityId: cities['CIT-006'].id },
      { code: 'CUST-0011', name: 'محمد فهد المطيري', zoneId: zone3.id, agentId: agent2.id, branchId: branch2.id, phone: '0559012345', creditLimit: 38000, governorateId: gov2.id, cityId: cities['CIT-006'].id },
      { code: 'CUST-0014', name: 'علي حسن الزهراني', zoneId: zone3.id, agentId: agent2.id, branchId: branch2.id, phone: '0561234567', creditLimit: 42000, governorateId: gov2.id, cityId: cities['CIT-007'].id },
      
      // مؤسسات وشركات
      { code: 'CUST-0007', name: 'مؤسسة الفجر التجارية', zoneId: zone1.id, agentId: agent1.id, branchId: branch1.id, phone: '0112345678', creditLimit: 100000, governorateId: gov1.id, cityId: cities['CIT-001'].id },
      { code: 'CUST-0008', name: 'شركة النجاح للمقاولات', zoneId: zone2.id, agentId: agent1.id, branchId: branch1.id, phone: '0113456789', creditLimit: 200000, governorateId: gov1.id, cityId: cities['CIT-002'].id },
      
      // عملاء إضافيون
      { code: 'CUST-0016', name: 'راشد محمد العنزي', zoneId: zone1.id, agentId: agents[2].id, branchId: branch1.id, phone: '0563456789', creditLimit: 32000, governorateId: gov1.id, cityId: cities['CIT-002'].id },
      { code: 'CUST-0017', name: 'ماجد سعود الحربي', zoneId: zone2.id, agentId: agents[2].id, branchId: branch1.id, phone: '0564567890', creditLimit: 28000, governorateId: gov1.id, cityId: cities['CIT-003'].id },
      { code: 'CUST-0018', name: 'تركي فهد العمري', zoneId: zone3.id, agentId: agents[4].id, branchId: branch2.id, phone: '0565678901', creditLimit: 45000, governorateId: gov2.id, cityId: cities['CIT-007'].id },
      { code: 'CUST-0019', name: 'نواف سلطان الدوسري', zoneId: zone1.id, agentId: agents[4].id, branchId: branch1.id, phone: '0566789012', creditLimit: 38000, governorateId: gov1.id, cityId: cities['CIT-005'].id },
      { code: 'CUST-0020', name: 'بندر عبدالله الشمري', zoneId: zone2.id, agentId: agents[6].id, branchId: branch1.id, phone: '0567890123', creditLimit: 52000, governorateId: gov1.id, cityId: cities['CIT-002'].id },
      { code: 'CUST-0021', name: 'فيصل سعد القحطاني', zoneId: zone3.id, agentId: agents[6].id, branchId: branch2.id, phone: '0568901234', creditLimit: 41000, governorateId: gov2.id, cityId: cities['CIT-008'].id },
      { code: 'CUST-0022', name: 'عبدالعزيز محمد العتيبي', zoneId: zone1.id, agentId: agents[7].id, branchId: branch1.id, phone: '0569012345', creditLimit: 35000, governorateId: gov1.id, cityId: cities['CIT-001'].id },
      { code: 'CUST-0023', name: 'سلمان خالد الغامدي', zoneId: zone2.id, agentId: agents[7].id, branchId: branch1.id, phone: '0570123456', creditLimit: 48000, governorateId: gov1.id, cityId: cities['CIT-004'].id },
      { code: 'CUST-0024', name: 'مؤسسة الأمل للتجارة', zoneId: zone3.id, agentId: agents[8].id, branchId: branch2.id, phone: '0123456789', creditLimit: 180000, governorateId: gov2.id, cityId: cities['CIT-006'].id },
      { code: 'CUST-0025', name: 'شركة الخليج للإلكترونيات', zoneId: zone1.id, agentId: agents[8].id, branchId: branch1.id, phone: '0119876543', creditLimit: 250000, governorateId: gov1.id, cityId: cities['CIT-001'].id },
    ]

    const customers: any[] = []
    for (const custData of customersData) {
      let customer = await db.customer.findFirst({ where: { code: custData.code } })
      if (!customer) {
        customer = await db.customer.create({
          data: {
            name: custData.name,
            nameAr: custData.name,
            code: custData.code,
            companyId: company1.id,
            branchId: custData.branchId,
            zoneId: custData.zoneId,
            governorateId: custData.governorateId,
            cityId: custData.cityId,
            agentId: custData.agentId,
            phone: custData.phone,
            creditLimit: custData.creditLimit,
            balance: 0,
            active: true,
          }
        })
        addedCounts.customers++
      }
      customers.push(customer)
    }

    // ============== 11. فواتير نقدية ==============
    const existingInvoicesCount = await db.invoice.count({ where: { type: 'CASH' } })
    const invoices: any[] = []
    
    if (existingInvoicesCount < 25) {
      for (let i = existingInvoicesCount; i < 25; i++) {
        const customer = customers[i % customers.length]
        const product1 = products[i % products.length]
        const product2 = products[(i + 5) % products.length]
        
        const quantity1 = Math.floor(Math.random() * 3) + 1
        const quantity2 = Math.floor(Math.random() * 2) + 1
        
        const subtotal = (product1.sellPrice * quantity1) + (product2.sellPrice * quantity2)
        const discount = Math.random() > 0.7 ? Math.floor(subtotal * 0.05) : 0
        const taxRate = 15
        const taxAmount = Math.round((subtotal - discount) * taxRate / 100)
        const total = subtotal - discount + taxAmount
        
        const paidAmount = Math.random() > 0.3 ? total : (Math.random() > 0.5 ? total * 0.5 : 0)
        const status = paidAmount === total ? 'paid' : paidAmount > 0 ? 'partial' : 'pending'
        
        const invoice = await db.invoice.create({
          data: {
            invoiceNumber: `INV-${String(i + 1).padStart(6, '0')}`,
            companyId: company1.id,
            branchId: customer.branchId,
            customerId: customer.id,
            agentId: customer.agentId,
            invoiceDate: new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000)),
            dueDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)),
            type: 'CASH',
            status,
            subtotal,
            discount,
            taxRate,
            taxAmount,
            total,
            paidAmount,
            remainingAmount: total - paidAmount,
            items: {
              create: [
                {
                  productId: product1.id,
                  description: product1.name,
                  quantity: quantity1,
                  unitPrice: product1.sellPrice,
                  total: product1.sellPrice * quantity1,
                },
                {
                  productId: product2.id,
                  description: product2.name,
                  quantity: quantity2,
                  unitPrice: product2.sellPrice,
                  total: product2.sellPrice * quantity2,
                }
              ]
            }
          }
        })
        invoices.push(invoice)
        addedCounts.invoices++
      }
    }

    // ============== 12. فواتير أقساط مع عقود ==============
    const installmentInvoicesData = [
      { customerIndex: 0, productIndex: 1, downPayment: 1000, months: 6, amount: 700 },
      { customerIndex: 1, productIndex: 4, downPayment: 500, months: 12, amount: 200 },
      { customerIndex: 2, productIndex: 9, downPayment: 1500, months: 8, amount: 300 },
      { customerIndex: 3, productIndex: 0, downPayment: 800, months: 10, amount: 280 },
      { customerIndex: 4, productIndex: 3, downPayment: 600, months: 6, amount: 320 },
      { customerIndex: 5, productIndex: 10, downPayment: 1200, months: 10, amount: 520 },
      { customerIndex: 6, productIndex: 6, downPayment: 500, months: 12, amount: 150 },
      { customerIndex: 7, productIndex: 5, downPayment: 400, months: 8, amount: 160 },
      { customerIndex: 8, productIndex: 11, downPayment: 300, months: 6, amount: 230 },
      { customerIndex: 9, productIndex: 14, downPayment: 800, months: 12, amount: 250 },
      { customerIndex: 10, productIndex: 2, downPayment: 1000, months: 6, amount: 650 },
      { customerIndex: 11, productIndex: 7, downPayment: 600, months: 10, amount: 200 },
      { customerIndex: 12, productIndex: 13, downPayment: 400, months: 6, amount: 280 },
      { customerIndex: 13, productIndex: 12, downPayment: 700, months: 8, amount: 280 },
      { customerIndex: 14, productIndex: 16, downPayment: 900, months: 6, amount: 600 },
      { customerIndex: 15, productIndex: 20, downPayment: 1500, months: 12, amount: 350 },
      { customerIndex: 16, productIndex: 25, downPayment: 2000, months: 10, amount: 400 },
      { customerIndex: 17, productIndex: 30, downPayment: 800, months: 6, amount: 280 },
      { customerIndex: 18, productIndex: 35, downPayment: 1200, months: 8, amount: 350 },
      { customerIndex: 19, productIndex: 40, downPayment: 1000, months: 6, amount: 300 },
      { customerIndex: 20, productIndex: 45, downPayment: 600, months: 8, amount: 200 },
      { customerIndex: 21, productIndex: 50, downPayment: 500, months: 6, amount: 180 },
    ]

    for (let i = 0; i < installmentInvoicesData.length; i++) {
      const invData = installmentInvoicesData[i]
      const customer = customers[invData.customerIndex % customers.length]
      const product = products[invData.productIndex % products.length]
      
      const existingInstallmentInvoice = await db.invoice.findFirst({ 
        where: { invoiceNumber: `INV-INST-${String(i + 1).padStart(4, '0')}` } 
      })
      
      if (!existingInstallmentInvoice) {
        const subtotal = product.sellPrice
        const discount = 0
        const taxRate = 15
        const taxAmount = Math.round((subtotal - discount) * taxRate / 100)
        const total = subtotal - discount + taxAmount
        const remaining = total - invData.downPayment

        const invoice = await db.invoice.create({
          data: {
            invoiceNumber: `INV-INST-${String(i + 1).padStart(4, '0')}`,
            companyId: company1.id,
            branchId: customer.branchId,
            customerId: customer.id,
            agentId: customer.agentId,
            invoiceDate: new Date(Date.now() - (i * 14 * 24 * 60 * 60 * 1000)),
            dueDate: new Date(Date.now() + (invData.months * 30 * 24 * 60 * 60 * 1000)),
            type: 'INSTALLMENT',
            status: 'partial',
            subtotal,
            discount,
            taxRate,
            taxAmount,
            total,
            paidAmount: invData.downPayment,
            remainingAmount: remaining,
            items: {
              create: [
                {
                  productId: product.id,
                  description: product.name,
                  quantity: 1,
                  unitPrice: product.sellPrice,
                  total: product.sellPrice,
                }
              ]
            }
          }
        })
        addedCounts.invoices++

        const contractNumber = `CONT-${String(i + 1).padStart(6, '0')}`
        const startDate = new Date()
        const endDate = new Date()
        endDate.setMonth(endDate.getMonth() + invData.months)

        const contract = await db.installmentContract.create({
          data: {
            invoiceId: invoice.id,
            customerId: customer.id,
            agentId: customer.agentId,
            contractNumber,
            contractDate: new Date(),
            totalAmount: total,
            downPayment: invData.downPayment,
            financedAmount: remaining,
            numberOfPayments: invData.months,
            paymentFrequency: 'MONTHLY',
            interestRate: 0,
            interestAmount: 0,
            startDate,
            endDate,
            status: 'active',
          }
        })
        addedCounts.installmentContracts++

        // إنشاء الأقساط
        for (let j = 1; j <= invData.months; j++) {
          const dueDate = new Date()
          dueDate.setMonth(dueDate.getMonth() + j)
          
          const installmentAmount = j === invData.months 
            ? remaining - (invData.amount * (invData.months - 1))
            : invData.amount

          const isPaid = j <= 2 // أول قسطين مدفوعين

          await db.installment.create({
            data: {
              contractId: contract.id,
              installmentNumber: j,
              dueDate,
              amount: installmentAmount,
              paidAmount: isPaid ? installmentAmount : 0,
              remainingAmount: isPaid ? 0 : installmentAmount,
              status: isPaid ? 'paid' : 'pending',
              paidDate: isPaid ? new Date(dueDate.getTime() - 5 * 24 * 60 * 60 * 1000) : null,
            }
          })
          addedCounts.installments++
        }
      }
    }

    // ============== 13. المدفوعات ==============
    const existingPaymentsCount = await db.payment.count()
    if (existingPaymentsCount < 20) {
      const allInvoices = await db.invoice.findMany({ take: 20 })
      for (let i = existingPaymentsCount; i < Math.min(20, allInvoices.length); i++) {
        const invoice = allInvoices[i]
        if (invoice && invoice.paidAmount > 0) {
          const paymentMethods = ['CASH', 'BANK', 'CHECK', 'MOBILE']
          await db.payment.create({
            data: {
              paymentNumber: `PAY-${String(i + 1).padStart(6, '0')}`,
              companyId: company1.id,
              branchId: invoice.branchId,
              invoiceId: invoice.id,
              customerId: invoice.customerId,
              agentId: collector.id,
              paymentDate: invoice.invoiceDate,
              method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)] as 'CASH' | 'BANK' | 'CHECK' | 'MOBILE',
              amount: invoice.paidAmount,
              status: 'completed',
            }
          })
          addedCounts.payments++
        }
      }
    }

    // ============== 14. المرتجعات ==============
    const existingReturnsCount = await db.return.count()
    if (existingReturnsCount < 5) {
      const allInvoices = await db.invoice.findMany({ take: 10 })
      for (let i = 0; i < 5; i++) {
        const invoice = allInvoices[i]
        if (invoice) {
          const customer = customers.find(c => c.id === invoice.customerId) || customers[0]
          const product = products[i % products.length]
          
          await db.return.create({
            data: {
              returnNumber: `RET-${String(i + 1).padStart(6, '0')}`,
              companyId: company1.id,
              branchId: invoice.branchId,
              invoiceId: invoice.id,
              customerId: customer.id,
              agentId: customer.agentId,
              returnDate: new Date(Date.now() - (i * 5 * 24 * 60 * 60 * 1000)),
              type: 'SALES_RETURN',
              reason: i % 2 === 0 ? 'عيب في المنتج' : 'طلب العميل',
              status: 'approved',
              subtotal: product.sellPrice,
              taxAmount: Math.round(product.sellPrice * 0.15),
              total: product.sellPrice * 1.15,
              items: {
                create: [
                  {
                    productId: product.id,
                    description: product.name,
                    quantity: 1,
                    unitPrice: product.sellPrice,
                    taxAmount: Math.round(product.sellPrice * 0.15),
                    total: product.sellPrice * 1.15,
                    restocked: true,
                  }
                ]
              }
            }
          })
          addedCounts.returns++
        }
      }
    }

    // ============== 15. سياسات العمولات ==============
    const existingPolicies = await db.commissionPolicy.count()
    if (existingPolicies < 5) {
      await db.commissionPolicy.create({
        data: {
          name: 'عمولة التحصيل الأساسية',
          nameAr: 'عمولة التحصيل الأساسية',
          companyId: company1.id,
          branchId: branch1.id,
          type: 'COLLECTION',
          calculationType: 'PERCENTAGE',
          value: 1.5,
          active: true,
        }
      })
      addedCounts.commissionPolicies++

      await db.commissionPolicy.create({
        data: {
          name: 'عمولة المبيعات الأساسية',
          nameAr: 'عمولة المبيعات الأساسية',
          companyId: company1.id,
          branchId: branch1.id,
          type: 'SALES',
          calculationType: 'PERCENTAGE',
          value: 2,
          active: true,
        }
      })
      addedCounts.commissionPolicies++

      await db.commissionPolicy.create({
        data: {
          name: 'عمولة تحصيل متأخر',
          nameAr: 'عمولة تحصيل متأخر',
          companyId: company1.id,
          branchId: branch1.id,
          type: 'COLLECTION',
          calculationType: 'PERCENTAGE',
          value: 2.5,
          minAmount: 1000,
          active: true,
        }
      })
      addedCounts.commissionPolicies++

      await db.commissionPolicy.create({
        data: {
          name: 'عمولة مبيعات أجهزة منزلية',
          nameAr: 'عمولة مبيعات أجهزة منزلية',
          companyId: company1.id,
          branchId: branch2.id,
          type: 'SALES',
          calculationType: 'PERCENTAGE',
          value: 3,
          active: true,
        }
      })
      addedCounts.commissionPolicies++

      await db.commissionPolicy.create({
        data: {
          name: 'عمولة ثابتة للمندوبين',
          nameAr: 'عمولة ثابتة للمندوبين',
          companyId: company1.id,
          branchId: branch1.id,
          type: 'SALES',
          calculationType: 'FIXED',
          value: 50,
          perItem: true,
          active: true,
        }
      })
      addedCounts.commissionPolicies++
    }

    // ============== 16. عمولات المندوبين ==============
    const existingAgentCommissions = await db.agentCommission.count()
    if (existingAgentCommissions < 10) {
      const policy = await db.commissionPolicy.findFirst()
      if (policy) {
        for (let i = 0; i < 10; i++) {
          const agent = agents[i % agents.length]
          await db.agentCommission.create({
            data: {
              agentId: agent.id,
              policyId: policy.id,
              type: i % 2 === 0 ? 'SALES' : 'COLLECTION',
              referenceType: 'INVOICE',
              referenceId: `INV-${String(i + 1).padStart(6, '0')}`,
              amount: Math.floor(Math.random() * 500) + 100,
              status: i % 3 === 0 ? 'paid' : 'pending',
              paidDate: i % 3 === 0 ? new Date() : null,
            }
          })
          addedCounts.agentCommissions++
        }
      }
    }

    // ============== 17. مواقع المندوبين ==============
    const existingLocations = await db.agentLocation.count()
    if (existingLocations < 10) {
      for (let i = 0; i < 10; i++) {
        const agent = agents[i % agents.length]
        await db.agentLocation.create({
          data: {
            agentId: agent.id,
            latitude: 24.7136 + (Math.random() * 0.1 - 0.05),
            longitude: 46.6753 + (Math.random() * 0.1 - 0.05),
            accuracy: Math.random() * 50 + 10,
            speed: Math.random() * 60,
            battery: Math.random() * 100,
            isOnline: Math.random() > 0.3,
          }
        })
        addedCounts.agentLocations++
      }
    }

    // ============== 18. الإشعارات ==============
    const existingNotifications = await db.notification.count()
    if (existingNotifications < 15) {
      const notificationTypes = ['payment', 'invoice', 'customer', 'system', 'alert']
      const notificationTitles = [
        'تم استلام دفعة جديدة',
        'فاتورة جديدة تم إنشاؤها',
        'عميل جديد مسجل',
        'تنبيه النظام',
        'قسط مستحق قريباً',
        'تم تحصيل قسط',
        'مخزون منخفض',
        'طلب مرتجع جديد',
      ]
      
      for (let i = 0; i < 15; i++) {
        await db.notification.create({
          data: {
            userId: superAdmin.id,
            title: notificationTitles[i % notificationTitles.length],
            message: `تفاصيل الإشعار رقم ${i + 1}`,
            type: notificationTypes[i % notificationTypes.length],
            isRead: i % 3 === 0,
            link: i % 2 === 0 ? `/dashboard/invoices/${i + 1}` : null,
          }
        })
        addedCounts.notifications++
      }
    }

    // ============== 19. سجلات التدقيق ==============
    const existingAuditLogs = await db.auditLog.count()
    if (existingAuditLogs < 20) {
      const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT']
      const entityTypes = ['Invoice', 'Customer', 'Product', 'Payment', 'User']
      
      for (let i = 0; i < 20; i++) {
        await db.auditLog.create({
          data: {
            companyId: company1.id,
            branchId: branch1.id,
            userId: i % 2 === 0 ? superAdmin.id : agent1.id,
            action: actions[i % actions.length],
            entityType: entityTypes[i % entityTypes.length],
            entityId: `ENT-${String(i + 1).padStart(6, '0')}`,
            oldData: i % 2 === 0 ? JSON.stringify({ field: 'old value' }) : null,
            newData: JSON.stringify({ field: 'new value' }),
            ipAddress: `192.168.1.${i + 1}`,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          }
        })
        addedCounts.auditLogs++
      }
    }

    // ============== 20. قوالب الطباعة ==============
    const existingPrintTemplates = await db.printTemplate.count()
    if (existingPrintTemplates < 3) {
      await db.printTemplate.create({
        data: {
          companyId: company1.id,
          name: 'قالب فاتورة افتراضي',
          nameAr: 'قالب فاتورة افتراضي',
          type: 'INVOICE',
          content: '<html><body>{{content}}</body></html>',
          paperSize: 'A4',
          orientation: 'portrait',
          isDefault: true,
          active: true,
        }
      })
      addedCounts.printTemplates++

      await db.printTemplate.create({
        data: {
          companyId: company1.id,
          name: 'قالب عقد أقساط',
          nameAr: 'قالب عقد أقساط',
          type: 'CONTRACT',
          content: '<html><body>{{content}}</body></html>',
          paperSize: 'A4',
          orientation: 'portrait',
          isDefault: true,
          active: true,
        }
      })
      addedCounts.printTemplates++

      await db.printTemplate.create({
        data: {
          companyId: company1.id,
          name: 'قالب إيصال تحصيل',
          nameAr: 'قالب إيصال تحصيل',
          type: 'RECEIPT',
          content: '<html><body>{{content}}</body></html>',
          paperSize: 'A5',
          orientation: 'portrait',
          isDefault: true,
          active: true,
        }
      })
      addedCounts.printTemplates++
    }

    // ============== 21. فئات قوالب الإيصالات ==============
    const existingCategories = await db.receiptTemplateCategory.count()
    if (existingCategories < 4) {
      await db.receiptTemplateCategory.create({
        data: {
          name: 'فواتير',
          nameAr: 'فواتير',
          code: 'CAT-INV',
          icon: 'file-text',
          sortOrder: 1,
          active: true,
        }
      })
      addedCounts.receiptTemplateCategories++

      await db.receiptTemplateCategory.create({
        data: {
          name: 'عقود',
          nameAr: 'عقود',
          code: 'CAT-CONT',
          icon: 'file-contract',
          sortOrder: 2,
          active: true,
        }
      })
      addedCounts.receiptTemplateCategories++

      await db.receiptTemplateCategory.create({
        data: {
          name: 'إيصالات',
          nameAr: 'إيصالات',
          code: 'CAT-RECEIPT',
          icon: 'receipt',
          sortOrder: 3,
          active: true,
        }
      })
      addedCounts.receiptTemplateCategories++

      await db.receiptTemplateCategory.create({
        data: {
          name: 'تقارير',
          nameAr: 'تقارير',
          code: 'CAT-REPORT',
          icon: 'chart-bar',
          sortOrder: 4,
          active: true,
        }
      })
      addedCounts.receiptTemplateCategories++
    }

    // ============== 22. قوالب الإيصالات العامة ==============
    const existingGlobalTemplates = await db.globalReceiptTemplate.count()
    if (existingGlobalTemplates < 5) {
      const invCategory = await db.receiptTemplateCategory.findFirst({ where: { code: 'CAT-INV' } })
      const receiptCategory = await db.receiptTemplateCategory.findFirst({ where: { code: 'CAT-RECEIPT' } })
      
      await db.globalReceiptTemplate.create({
        data: {
          categoryId: invCategory?.id,
          name: 'فاتورة بسيطة',
          nameAr: 'فاتورة بسيطة',
          code: 'TPL-SIMPLE-INV',
          description: 'Simple invoice template',
          templateJson: '{"type":"simple"}',
          isFree: true,
          templateType: 'standard',
          paperSize: 'A4_THIRD',
          active: true,
        }
      })
      addedCounts.globalReceiptTemplates++

      await db.globalReceiptTemplate.create({
        data: {
          categoryId: invCategory?.id,
          name: 'فاتورة تفصيلية',
          nameAr: 'فاتورة تفصيلية',
          code: 'TPL-DETAIL-INV',
          description: 'Detailed invoice template',
          templateJson: '{"type":"detailed"}',
          isFree: true,
          templateType: 'standard',
          paperSize: 'A4',
          active: true,
        }
      })
      addedCounts.globalReceiptTemplates++

      await db.globalReceiptTemplate.create({
        data: {
          categoryId: receiptCategory?.id,
          name: 'إيصال تحصيل',
          nameAr: 'إيصال تحصيل',
          code: 'TPL-COLLECTION',
          description: 'Collection receipt template',
          templateJson: '{"type":"collection"}',
          isFree: true,
          templateType: 'standard',
          paperSize: 'A4_THIRD',
          active: true,
        }
      })
      addedCounts.globalReceiptTemplates++

      await db.globalReceiptTemplate.create({
        data: {
          categoryId: receiptCategory?.id,
          name: 'إيصال مخصص',
          nameAr: 'إيصال مخصص',
          code: 'TPL-CUSTOM',
          description: 'Custom receipt template',
          templateJson: '{"type":"custom"}',
          isFree: false,
          price: 100,
          templateType: 'premium',
          paperSize: 'A5',
          active: true,
        }
      })
      addedCounts.globalReceiptTemplates++

      await db.globalReceiptTemplate.create({
        data: {
          categoryId: invCategory?.id,
          name: 'فاتورة احترافية',
          nameAr: 'فاتورة احترافية',
          code: 'TPL-PRO-INV',
          description: 'Professional invoice template',
          templateJson: '{"type":"professional"}',
          isFree: false,
          price: 200,
          templateType: 'premium',
          paperSize: 'A4',
          isFeatured: true,
          active: true,
        }
      })
      addedCounts.globalReceiptTemplates++
    }

    return NextResponse.json({
      success: true,
      message: 'تم إضافة البيانات التجريبية بنجاح',
      addedCounts,
      totalAdded: Object.values(addedCounts).reduce((a, b) => a + b, 0),
      summary: {
        companies: addedCounts.companies,
        branches: addedCounts.branches,
        users: addedCounts.users,
        products: addedCounts.products,
        customers: addedCounts.customers,
        invoices: addedCounts.invoices,
        installments: addedCounts.installments,
        returns: addedCounts.returns,
        payments: addedCounts.payments,
      }
    })
  } catch (error: any) {
    console.error('Error seeding data:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ أثناء إضافة البيانات' },
      { status: 500 }
    )
  }
}

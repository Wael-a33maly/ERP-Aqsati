/**
 * Seed Service
 * خدمة البيانات التجريبية
 */

import { seedRepository } from '@/repositories/seed.repository'
import type { SeedCounts } from '@/models/seed.model'
import { createEmptySeedCounts } from '@/models/seed.model'

export const seedService = {
  async seedDatabase(): Promise<SeedCounts> {
    const counts = createEmptySeedCounts()
    const hashedPassword = await seedRepository.hashPassword()

    // ============== 1. الشركات ==============
    let company1 = await seedRepository.findCompanyByCode('CMP-0001')
    if (!company1) {
      company1 = await seedRepository.createCompany({
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
      })
      counts.companies++
    }

    let company2 = await seedRepository.findCompanyByCode('CMP-0002')
    if (!company2) {
      company2 = await seedRepository.createCompany({
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
      })
      counts.companies++
    }

    // ============== 2. الفروع ==============
    let branch1 = await seedRepository.findBranchByCode('BR-0001')
    if (!branch1) {
      branch1 = await seedRepository.createBranch({
        name: 'الفرع الرئيسي - الرياض',
        nameAr: 'الفرع الرئيسي - الرياض',
        code: 'BR-0001',
        companyId: company1.id,
        address: 'الرياض - حي العليا - شارع الملك فهد',
        phone: '0111234567',
        isMain: true,
        active: true,
      })
      counts.branches++
    }

    let branch2 = await seedRepository.findBranchByCode('BR-0002')
    if (!branch2) {
      branch2 = await seedRepository.createBranch({
        name: 'فرع جدة',
        nameAr: 'فرع جدة',
        code: 'BR-0002',
        companyId: company1.id,
        address: 'جدة - حي الروضة',
        phone: '0129876543',
        isMain: false,
        active: true,
      })
      counts.branches++
    }

    let branch3 = await seedRepository.findBranchByCode('BR-0003')
    if (!branch3) {
      branch3 = await seedRepository.createBranch({
        name: 'الفرع الرئيسي - الدمام',
        nameAr: 'الفرع الرئيسي - الدمام',
        code: 'BR-0003',
        companyId: company2.id,
        address: 'الدمام - حي الفيصلية',
        phone: '0138765432',
        isMain: true,
        active: true,
      })
      counts.branches++
    }

    // فروع إضافية
    const additionalBranches = [
      { name: 'فرع مكة المكرمة', code: 'BR-0004', address: 'مكة المكرمة - حي العزيزية', phone: '0125551234' },
      { name: 'فرع المدينة المنورة', code: 'BR-0005', address: 'المدينة المنورة - حي قباء', phone: '0148234567' },
      { name: 'فرع الخبر', code: 'BR-0006', address: 'الخبر - حي اليرموك', phone: '0138987654' },
    ]

    for (const branchData of additionalBranches) {
      const existing = await seedRepository.findBranchByCode(branchData.code)
      if (!existing) {
        await seedRepository.createBranch({
          name: branchData.name,
          nameAr: branchData.name,
          code: branchData.code,
          companyId: company1.id,
          address: branchData.address,
          phone: branchData.phone,
          isMain: false,
          active: true,
        })
        counts.branches++
      }
    }

    // ============== 3. المحافظات والمدن والمناطق ==============
    const governorates = [
      { name: 'الرياض', code: 'GOV-001' },
      { name: 'جدة', code: 'GOV-002' },
      { name: 'الدمام', code: 'GOV-003' },
      { name: 'مكة المكرمة', code: 'GOV-004' },
      { name: 'المدينة المنورة', code: 'GOV-005' },
    ]

    const createdGovs: Record<string, any> = {}
    for (const gov of governorates) {
      let existing = await seedRepository.findGovernorateByCode(gov.code)
      if (!existing) {
        existing = await seedRepository.createGovernorate({
          name: gov.name,
          nameAr: gov.name,
          code: gov.code,
          companyId: company1.id,
          active: true
        })
        counts.governorates++
      }
      createdGovs[gov.code] = existing
    }

    // المدن
    const citiesData = [
      { name: 'وسط الرياض', code: 'CIT-001', governorateId: createdGovs['GOV-001'].id },
      { name: 'شمال الرياض', code: 'CIT-002', governorateId: createdGovs['GOV-001'].id },
      { name: 'جنوب الرياض', code: 'CIT-003', governorateId: createdGovs['GOV-001'].id },
      { name: 'شرق الرياض', code: 'CIT-004', governorateId: createdGovs['GOV-001'].id },
      { name: 'غرب الرياض', code: 'CIT-005', governorateId: createdGovs['GOV-001'].id },
      { name: 'وسط جدة', code: 'CIT-006', governorateId: createdGovs['GOV-002'].id },
      { name: 'شمال جدة', code: 'CIT-007', governorateId: createdGovs['GOV-002'].id },
      { name: 'جنوب جدة', code: 'CIT-008', governorateId: createdGovs['GOV-002'].id },
      { name: 'الدمام الوسطى', code: 'CIT-009', governorateId: createdGovs['GOV-003'].id },
      { name: 'الدمام الشمالية', code: 'CIT-010', governorateId: createdGovs['GOV-003'].id },
      { name: 'مكة المكرمة', code: 'CIT-011', governorateId: createdGovs['GOV-004'].id },
      { name: 'المدينة المنورة', code: 'CIT-012', governorateId: createdGovs['GOV-005'].id },
    ]

    const createdCities: Record<string, any> = {}
    for (const cityData of citiesData) {
      let city = await seedRepository.findCityByCode(cityData.code)
      if (!city) {
        city = await seedRepository.createCity({
          name: cityData.name,
          nameAr: cityData.name,
          code: cityData.code,
          companyId: company1.id,
          governorateId: cityData.governorateId,
          active: true
        })
        counts.cities++
      }
      createdCities[cityData.code] = city
    }

    // المناطق
    const areasData = [
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
      { name: 'حي الحمراء', code: 'ARE-011', cityCode: 'CIT-006' },
      { name: 'حي البلد', code: 'ARE-012', cityCode: 'CIT-006' },
      { name: 'حي الصفا', code: 'ARE-013', cityCode: 'CIT-007' },
      { name: 'حي المروة', code: 'ARE-014', cityCode: 'CIT-007' },
      { name: 'حي الفيصلية', code: 'ARE-015', cityCode: 'CIT-008' },
      { name: 'حي السلامة', code: 'ARE-016', cityCode: 'CIT-008' },
      { name: 'حي الفيصلية الدمام', code: 'ARE-017', cityCode: 'CIT-009' },
      { name: 'حي الشاطئ', code: 'ARE-018', cityCode: 'CIT-009' },
      { name: 'حي اليرموك', code: 'ARE-019', cityCode: 'CIT-010' },
      { name: 'حي النخيل', code: 'ARE-020', cityCode: 'CIT-010' },
      { name: 'حي العزيزية', code: 'ARE-021', cityCode: 'CIT-011' },
      { name: 'حي الشوقية', code: 'ARE-022', cityCode: 'CIT-011' },
      { name: 'حي قباء', code: 'ARE-023', cityCode: 'CIT-012' },
      { name: 'حي العوالي', code: 'ARE-024', cityCode: 'CIT-012' },
    ]

    for (const areaData of areasData) {
      const existing = await seedRepository.findAreaByCode(areaData.code)
      if (!existing) {
        await seedRepository.createArea({
          name: areaData.name,
          nameAr: areaData.name,
          code: areaData.code,
          companyId: company1.id,
          cityId: createdCities[areaData.cityCode].id,
          active: true
        })
        counts.areas++
      }
    }

    // ============== 4. المستخدمين ==============
    let superAdmin = await seedRepository.findUserByEmail('a33maly@gmail.com')
    if (!superAdmin) {
      superAdmin = await seedRepository.createUser({
        name: 'مدير النظام',
        nameAr: 'مدير النظام',
        email: 'a33maly@gmail.com',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        active: true,
      })
      counts.users++
    }

    let companyAdmin = await seedRepository.findUserByEmail('ahmed@alamal.com')
    if (!companyAdmin) {
      companyAdmin = await seedRepository.createUser({
        name: 'أحمد محمد',
        nameAr: 'أحمد محمد',
        email: 'ahmed@alamal.com',
        password: hashedPassword,
        role: 'COMPANY_ADMIN',
        companyId: company1.id,
        active: true,
      })
      counts.users++
    }

    let branchManager = await seedRepository.findUserByEmail('manager@alamal.com')
    if (!branchManager) {
      branchManager = await seedRepository.createUser({
        name: 'محمد علي',
        nameAr: 'محمد علي',
        email: 'manager@alamal.com',
        password: hashedPassword,
        role: 'BRANCH_MANAGER',
        companyId: company1.id,
        branchId: branch1.id,
        active: true,
      })
      counts.users++
    }

    let agent1 = await seedRepository.findUserByEmail('khalid@alamal.com')
    if (!agent1) {
      agent1 = await seedRepository.createUser({
        name: 'خالد سعيد',
        nameAr: 'خالد سعيد',
        email: 'khalid@alamal.com',
        password: hashedPassword,
        phone: '0501111111',
        role: 'AGENT',
        companyId: company1.id,
        branchId: branch1.id,
        active: true,
      })
      counts.users++
    }

    let agent2 = await seedRepository.findUserByEmail('abdullah@alamal.com')
    if (!agent2) {
      agent2 = await seedRepository.createUser({
        name: 'عبدالله فهد',
        nameAr: 'عبدالله فهد',
        email: 'abdullah@alamal.com',
        password: hashedPassword,
        phone: '0502222222',
        role: 'AGENT',
        companyId: company1.id,
        branchId: branch2.id,
        active: true,
      })
      counts.users++
    }

    let collector = await seedRepository.findUserByEmail('saud@alamal.com')
    if (!collector) {
      collector = await seedRepository.createUser({
        name: 'سعود محمد',
        nameAr: 'سعود محمد',
        email: 'saud@alamal.com',
        password: hashedPassword,
        phone: '0503333333',
        role: 'COLLECTOR',
        companyId: company1.id,
        branchId: branch1.id,
        active: true,
      })
      counts.users++
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
      let existingAgent = await seedRepository.findUserByEmail(agentData.email)
      if (!existingAgent) {
        existingAgent = await seedRepository.createUser({
          name: agentData.name,
          nameAr: agentData.name,
          email: agentData.email,
          password: hashedPassword,
          phone: agentData.phone,
          role: 'AGENT',
          companyId: company1.id,
          branchId: agentData.branchId,
          active: true,
        })
        counts.users++
      }
      agents.push(existingAgent)
    }

    // ============== 5. المناطق الجغرافية ==============
    const zonesData = [
      { name: 'حي العليا', code: 'ZN-0001', branchId: branch1.id, description: 'منطقة حي العليا - الرياض' },
      { name: 'حي النسيم', code: 'ZN-0002', branchId: branch1.id, description: 'منطقة حي النسيم - الرياض' },
      { name: 'حي الروضة - جدة', code: 'ZN-0003', branchId: branch2.id, description: 'منطقة حي الروضة - جدة' },
      { name: 'حي الملز', code: 'ZN-0004', branchId: branch1.id, description: 'منطقة حي الملز - الرياض' },
      { name: 'حي السليمانية', code: 'ZN-0005', branchId: branch1.id, description: 'منطقة حي السليمانية - الرياض' },
      { name: 'حي الحمراء', code: 'ZN-0006', branchId: branch2.id, description: 'منطقة حي الحمراء - جدة' },
      { name: 'حي الصفا', code: 'ZN-0007', branchId: branch2.id, description: 'منطقة حي الصفا - جدة' },
    ]

    const zones: any[] = []
    for (const zoneData of zonesData) {
      let existing = await seedRepository.findZoneByCode(zoneData.code)
      if (!existing) {
        existing = await seedRepository.createZone({
          name: zoneData.name,
          nameAr: zoneData.name,
          code: zoneData.code,
          companyId: company1.id,
          branchId: zoneData.branchId,
          description: zoneData.description,
          active: true,
        })
        counts.zones++
      }
      zones.push(existing)
    }

    // ============== 6. التصنيفات الهرمية ==============
    // التصنيفات الرئيسية
    const categoriesData = [
      { name: 'إلكترونيات', nameAr: 'إلكترونيات', code: 'CAT-001' },
      { name: 'أجهزة منزلية', nameAr: 'أجهزة منزلية', code: 'CAT-002' },
      { name: 'أثاث', nameAr: 'أثاث', code: 'CAT-003' },
      { name: 'ملابس', nameAr: 'ملابس', code: 'CAT-004' },
    ]

    const categories: any[] = []
    for (const catData of categoriesData) {
      let existing = await seedRepository.findCategoryByCode(catData.code)
      if (!existing) {
        existing = await seedRepository.createCategory({
          name: catData.name,
          nameAr: catData.nameAr,
          code: catData.code,
          companyId: company1.id,
          active: true,
        })
        counts.categories++
      }
      categories.push(existing)
    }

    // ============== 7. المنتجات ==============
    const productsData = [
      { sku: 'PRD-001', name: 'هاتف ذكي', nameAr: 'هاتف ذكي', costPrice: 1500, sellPrice: 2000, categoryId: categories[0]?.id },
      { sku: 'PRD-002', name: 'لابتوب', nameAr: 'لابتوب', costPrice: 3000, sellPrice: 4000, categoryId: categories[0]?.id },
      { sku: 'PRD-003', name: 'تلفزيون 55 بوصة', nameAr: 'تلفزيون 55 بوصة', costPrice: 2500, sellPrice: 3200, categoryId: categories[1]?.id },
      { sku: 'PRD-004', name: 'غسالة أوتوماتيك', nameAr: 'غسالة أوتوماتيك', costPrice: 2000, sellPrice: 2800, categoryId: categories[1]?.id },
      { sku: 'PRD-005', name: 'ثلاجة', nameAr: 'ثلاجة', costPrice: 2200, sellPrice: 3000, categoryId: categories[1]?.id },
      { sku: 'PRD-006', name: 'كنبة ثلاثية', nameAr: 'كنبة ثلاثية', costPrice: 1500, sellPrice: 2200, categoryId: categories[2]?.id },
      { sku: 'PRD-007', name: 'سرير خشب', nameAr: 'سرير خشب', costPrice: 1200, sellPrice: 1800, categoryId: categories[2]?.id },
      { sku: 'PRD-008', name: 'طاولة سفرة', nameAr: 'طاولة سفرة', costPrice: 800, sellPrice: 1200, categoryId: categories[2]?.id },
      { sku: 'PRD-009', name: 'بدلة رجالي', nameAr: 'بدلة رجالي', costPrice: 400, sellPrice: 700, categoryId: categories[3]?.id },
      { sku: 'PRD-010', name: 'فستان نسائي', nameAr: 'فستان نسائي', costPrice: 300, sellPrice: 550, categoryId: categories[3]?.id },
    ]

    const products: any[] = []
    for (const prodData of productsData) {
      let existing = await seedRepository.findProductBySku(prodData.sku)
      if (!existing && prodData.categoryId) {
        existing = await seedRepository.createProduct({
          sku: prodData.sku,
          name: prodData.name,
          nameAr: prodData.nameAr,
          costPrice: prodData.costPrice,
          sellPrice: prodData.sellPrice,
          categoryId: prodData.categoryId,
          companyId: company1.id,
          unit: 'PIECE',
          active: true,
        })
        counts.products++
      }
      products.push(existing)
    }

    // ============== 8. العملاء ==============
    const customersData = [
      { name: 'محمد أحمد', phone: '0501234567', zoneId: zones[0]?.id, governorateId: createdGovs['GOV-001']?.id },
      { name: 'علي حسن', phone: '0502345678', zoneId: zones[1]?.id, governorateId: createdGovs['GOV-001']?.id },
      { name: 'خالد سعيد', phone: '0503456789', zoneId: zones[2]?.id, governorateId: createdGovs['GOV-002']?.id },
      { name: 'فهد محمد', phone: '0504567890', zoneId: zones[3]?.id, governorateId: createdGovs['GOV-001']?.id },
      { name: 'عبدالله ناصر', phone: '0505678901', zoneId: zones[4]?.id, governorateId: createdGovs['GOV-001']?.id },
      { name: 'سعود عمر', phone: '0506789012', zoneId: zones[5]?.id, governorateId: createdGovs['GOV-002']?.id },
      { name: 'أحمد علي', phone: '0507890123', zoneId: zones[6]?.id, governorateId: createdGovs['GOV-002']?.id },
      { name: 'ماجد خالد', phone: '0508901234', zoneId: zones[0]?.id, governorateId: createdGovs['GOV-001']?.id },
      { name: 'راشد سلطان', phone: '0509012345', zoneId: zones[1]?.id, governorateId: createdGovs['GOV-001']?.id },
      { name: 'ناصر حمود', phone: '0510123456', zoneId: zones[2]?.id, governorateId: createdGovs['GOV-002']?.id },
    ]

    const customers: any[] = []
    for (const custData of customersData) {
      const year = new Date().getFullYear()
      const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
      const customerCode = `CUS-${year}-${random}`

      let existing = await seedRepository.findCustomerByCode(customerCode)
      if (!existing && custData.zoneId && custData.governorateId) {
        existing = await seedRepository.createCustomer({
          name: custData.name,
          nameAr: custData.name,
          code: customerCode,
          phone: custData.phone,
          zoneId: custData.zoneId,
          governorateId: custData.governorateId,
          companyId: company1.id,
          branchId: branch1.id,
          agentId: agent1.id,
          creditLimit: 10000,
          active: true,
        })
        counts.customers++
      }
      if (existing) customers.push(existing)
    }

    // ============== 9. الفواتير ==============
    const invoicesData = [
      { customerIndex: 0, totalAmount: 5000, type: 'CASH' },
      { customerIndex: 1, totalAmount: 7500, type: 'INSTALLMENT' },
      { customerIndex: 2, totalAmount: 3000, type: 'CASH' },
      { customerIndex: 3, totalAmount: 10000, type: 'INSTALLMENT' },
      { customerIndex: 4, totalAmount: 4500, type: 'CASH' },
    ]

    const invoices: any[] = []
    for (let i = 0; i < invoicesData.length; i++) {
      const invData = invoicesData[i]
      const customer = customers[invData.customerIndex]
      if (!customer) continue

      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(i + 1).padStart(6, '0')}`
      let existing = await seedRepository.findInvoiceByNumber(invoiceNumber)
      if (!existing) {
        existing = await seedRepository.createInvoice({
          invoiceNumber,
          customerId: customer.id,
          companyId: company1.id,
          branchId: branch1.id,
          agentId: agent1.id,
          total: invData.totalAmount,
          paidAmount: invData.type === 'CASH' ? invData.totalAmount : 0,
          remainingAmount: invData.type === 'CASH' ? 0 : invData.totalAmount,
          subtotal: invData.totalAmount,
          status: invData.type === 'CASH' ? 'PAID' : 'PENDING',
          type: invData.type,
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        counts.invoices++
      }
      invoices.push(existing)
    }

    // ============== 10. المدفوعات ==============
    for (const invoice of invoices) {
      if (invoice && invoice.status === 'PAID') {
        const paymentNumber = `PAY-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
        await seedRepository.createPayment({
          paymentNumber,
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          companyId: company1.id,
          branchId: branch1.id,
          amount: invoice.total,
          method: 'CASH',
          status: 'completed',
          paymentDate: new Date(),
          agentId: agent1.id,
        })
        counts.payments++
      }
    }

    // ============== 11. سياسات العمولات ==============
    const commissionPolicy = await seedRepository.findCommissionPolicyByName('سياسة العمولات الافتراضية', company1.id)
    if (!commissionPolicy) {
      await seedRepository.createCommissionPolicy({
        name: 'سياسة العمولات الافتراضية',
        nameAr: 'سياسة العمولات الافتراضية',
        companyId: company1.id,
        type: 'BOTH',
        calculationType: 'PERCENTAGE',
        value: 2.5,
        minAmount: 50,
        maxAmount: 5000,
        active: true,
      })
      counts.commissionPolicies++
    }

    // ============== 12. المخازن ==============
    let warehouse1 = await seedRepository.findWarehouseByCode('WH-0001')
    if (!warehouse1) {
      warehouse1 = await seedRepository.createWarehouse({
        name: 'المخزن الرئيسي - الرياض',
        nameAr: 'المخزن الرئيسي - الرياض',
        code: 'WH-0001',
        companyId: company1.id,
        branchId: branch1.id,
        address: 'الرياض - المنطقة الصناعية',
        isMain: true,
        active: true,
      })
      counts.warehouses++
    }

    let warehouse2 = await seedRepository.findWarehouseByCode('WH-0002')
    if (!warehouse2) {
      warehouse2 = await seedRepository.createWarehouse({
        name: 'مخزن جدة',
        nameAr: 'مخزن جدة',
        code: 'WH-0002',
        companyId: company1.id,
        branchId: branch2.id,
        address: 'جدة - المنطقة الصناعية',
        isMain: false,
        active: true,
      })
      counts.warehouses++
    }

    let warehouse3 = await seedRepository.findWarehouseByCode('WH-0003')
    if (!warehouse3) {
      warehouse3 = await seedRepository.createWarehouse({
        name: 'مخزن الدمام',
        nameAr: 'مخزن الدمام',
        code: 'WH-0003',
        companyId: company1.id,
        branchId: branch3.id,
        address: 'الدمام - المنطقة الصناعية',
        isMain: false,
        active: true,
      })
      counts.warehouses++
    }

    return counts
  }
}

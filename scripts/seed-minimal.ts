import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const now = new Date()

async function main() {
  console.log('🌱 بدء إضافة البيانات التجريبية المحدودة...')
  
  const password = await bcrypt.hash('123456', 10)
  
  // ============================================
  // 1. حذف البيانات القديمة
  // ============================================
  console.log('🗑️ تنظيف البيانات القديمة...')
  
  const tables = [
    'paymentTransaction', 'featureUsage', 'subscription', 'planFeature', 'subscriptionPlan',
    'impersonationSession', 'installmentPayment', 'installment', 'installmentContract',
    'invoiceItem', 'payment', 'invoice', 'returnItem', 'return',
    'inventoryMovement', 'inventory', 'inventoryTransferItem', 'inventoryTransfer',
    'purchaseInvoiceItem', 'purchaseReturnItem', 'purchaseReturn', 'purchaseInvoice',
    'supplierPayment', 'supplierTransaction', 'supplier', 'product', 'productCategory',
    'warehouse', 'zone', 'area', 'city', 'governorate', 'customer',
    'agentCommission', 'agentLocation', 'commissionPolicy', 'notification',
    'user', 'companyPaymentGateway', 'printTemplate', 'reportTemplate', 'branch', 'company'
  ]
  
  for (const table of tables) {
    try {
      await (prisma as any)[table].deleteMany()
    } catch (e) {}
  }
  
  console.log('✅ تم التنظيف')
  
  // ============================================
  // 2. شركة واحدة
  // ============================================
  const company = await prisma.company.create({
    data: {
      id: 'demo-company',
      name: 'شركة أقساطي',
      code: 'DEMO',
      email: 'info@aqsati.com',
      phone: '01012345678',
      address: 'القاهرة - مصر',
      taxNumber: '123456789',
      taxRate: 14,
      currency: 'EGP',
      active: true,
      subscriptionStatus: 'active',
      planType: 'enterprise',
    }
  })
  console.log('✅ الشركة:', company.name)

  // ============================================
  // 3. فرع واحد
  // ============================================
  const branch = await prisma.branch.create({
    data: {
      id: 'demo-branch',
      name: 'الفرع الرئيسي',
      code: 'BR-001',
      companyId: company.id,
      address: 'القاهرة',
      active: true,
    }
  })
  console.log('✅ الفرع:', branch.name)

  // ============================================
  // 4. المستخدمين (3 فقط)
  // ============================================
  const superAdmin = await prisma.user.create({
    data: {
      id: 'user-super-admin',
      name: 'مدير النظام',
      email: 'admin@aqsati.com',
      password,
      phone: '01000000000',
      role: 'SUPER_ADMIN',
      active: true,
    }
  })

  const manager = await prisma.user.create({
    data: {
      id: 'user-manager',
      name: 'أحمد محمد',
      email: 'manager@aqsati.com',
      password,
      phone: '01011111111',
      role: 'COMPANY_ADMIN',
      companyId: company.id,
      branchId: branch.id,
      active: true,
    }
  })

  const agent = await prisma.user.create({
    data: {
      id: 'user-agent',
      name: 'سعيد علي',
      email: 'agent@aqsati.com',
      password,
      phone: '01022222222',
      role: 'AGENT',
      companyId: company.id,
      branchId: branch.id,
      active: true,
    }
  })
  console.log('✅ المستخدمين: 3')

  // ============================================
  // 5. منطقة واحدة
  // ============================================
  const zone = await prisma.zone.create({
    data: {
      id: 'demo-zone',
      name: 'منطقة وسط المدينة',
      code: 'ZN-001',
      companyId: company.id,
      active: true,
    }
  })

  // ============================================
  // 6. مخزن واحد
  // ============================================
  const warehouse = await prisma.warehouse.create({
    data: {
      id: 'demo-warehouse',
      name: 'المخزن الرئيسي',
      code: 'WH-001',
      companyId: company.id,
      branchId: branch.id,
      address: 'القاهرة',
      active: true,
    }
  })
  console.log('✅ المخازن: 1')

  // ============================================
  // 7. تصنيف واحد
  // ============================================
  const category = await prisma.productCategory.create({
    data: {
      id: 'demo-category',
      name: 'إلكترونيات',
      code: 'CAT-001',
      companyId: company.id,
      active: true,
    }
  })

  // ============================================
  // 8. 5 منتجات فقط
  // ============================================
  const products = await Promise.all([
    prisma.product.create({
      data: {
        id: 'prod-1',
        name: 'لابتوب HP',
        sku: 'SKU-001',
        sellPrice: 15000,
        costPrice: 12000,
        categoryId: category.id,
        companyId: company.id,
        active: true,
      }
    }),
    prisma.product.create({
      data: {
        id: 'prod-2',
        name: 'جوال Samsung',
        sku: 'SKU-002',
        sellPrice: 8000,
        costPrice: 6000,
        categoryId: category.id,
        companyId: company.id,
        active: true,
      }
    }),
    prisma.product.create({
      data: {
        id: 'prod-3',
        name: 'تابلت Apple',
        sku: 'SKU-003',
        sellPrice: 12000,
        costPrice: 9000,
        categoryId: category.id,
        companyId: company.id,
        active: true,
      }
    }),
    prisma.product.create({
      data: {
        id: 'prod-4',
        name: 'سماعات Sony',
        sku: 'SKU-004',
        sellPrice: 2000,
        costPrice: 1500,
        categoryId: category.id,
        companyId: company.id,
        active: true,
      }
    }),
    prisma.product.create({
      data: {
        id: 'prod-5',
        name: 'شاشة LG',
        sku: 'SKU-005',
        sellPrice: 5000,
        costPrice: 4000,
        categoryId: category.id,
        companyId: company.id,
        active: true,
      }
    }),
  ])
  console.log('✅ المنتجات: 5')

  // ============================================
  // 9. 5 عملاء فقط
  // ============================================
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        id: 'cust-1',
        name: 'محمد أحمد',
        code: 'CUS-001',
        phone: '01234567890',
        address: 'شارع التحري',
        zoneId: zone.id,
        companyId: company.id,
        active: true,
      }
    }),
    prisma.customer.create({
      data: {
        id: 'cust-2',
        name: 'علي محمود',
        code: 'CUS-002',
        phone: '01234567891',
        address: 'شارع النيل',
        zoneId: zone.id,
        companyId: company.id,
        active: true,
      }
    }),
    prisma.customer.create({
      data: {
        id: 'cust-3',
        name: 'حسن سعيد',
        code: 'CUS-003',
        phone: '01234567892',
        address: 'شارع السلام',
        zoneId: zone.id,
        companyId: company.id,
        active: true,
      }
    }),
    prisma.customer.create({
      data: {
        id: 'cust-4',
        name: 'كريم محمد',
        code: 'CUS-004',
        phone: '01234567893',
        address: 'شارع الأمل',
        zoneId: zone.id,
        companyId: company.id,
        active: true,
      }
    }),
    prisma.customer.create({
      data: {
        id: 'cust-5',
        name: 'عمر حسن',
        code: 'CUS-005',
        phone: '01234567894',
        address: 'شارع النصر',
        zoneId: zone.id,
        companyId: company.id,
        active: true,
      }
    }),
  ])
  console.log('✅ العملاء: 5')

  // ============================================
  // 10. فاتورتين مع أقساط
  // ============================================
  // فاتورة 1 - لابتوب
  const invoice1 = await prisma.invoice.create({
    data: {
      id: 'inv-1',
      invoiceNumber: 'INV-001',
      customerId: customers[0].id,
      companyId: company.id,
      branchId: branch.id,
      agentId: agent.id,
      type: 'sales',
      subtotal: 15000,
      total: 15000,
      status: 'partial',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: 'لابتوب HP - تقسيط 3 شهور',
    }
  })

  await prisma.invoiceItem.create({
    data: {
      invoiceId: invoice1.id,
      productId: products[0].id,
      quantity: 1,
      unitPrice: 15000,
      total: 15000,
    }
  })

  // عقد الأقساط للفاتورة 1
  const contract1 = await prisma.installmentContract.create({
    data: {
      id: 'cont-1',
      contractNumber: 'CON-001',
      customerId: customers[0].id,
      invoiceId: invoice1.id,
      agentId: agent.id,
      totalAmount: 15000,
      downPayment: 3000,
      financedAmount: 12000,
      numberOfPayments: 3,
      paymentFrequency: 'monthly',
      status: 'active',
      startDate: new Date(),
    }
  })

  // 3 أقساط للفاتورة 1
  const dueDate1 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const dueDate2 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
  const dueDate3 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)

  await prisma.installment.createMany({
    data: [
      {
        id: 'inst-1-1',
        contractId: contract1.id,
        installmentNumber: 1,
        amount: 4000,
        dueDate: dueDate1,
        status: 'paid',
        paidAmount: 4000,
        remainingAmount: 0,
        paidDate: new Date(),
      },
      {
        id: 'inst-1-2',
        contractId: contract1.id,
        installmentNumber: 2,
        amount: 4000,
        dueDate: dueDate2,
        status: 'pending',
        paidAmount: 0,
        remainingAmount: 4000,
      },
      {
        id: 'inst-1-3',
        contractId: contract1.id,
        installmentNumber: 3,
        amount: 4000,
        dueDate: dueDate3,
        status: 'pending',
        paidAmount: 0,
        remainingAmount: 4000,
      },
    ]
  })

  // فاتورة 2 - جوال
  const invoice2 = await prisma.invoice.create({
    data: {
      id: 'inv-2',
      invoiceNumber: 'INV-002',
      customerId: customers[1].id,
      companyId: company.id,
      branchId: branch.id,
      agentId: agent.id,
      type: 'sales',
      subtotal: 8000,
      total: 8000,
      status: 'pending',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: 'جوال Samsung - تقسيط 4 شهور',
    }
  })

  await prisma.invoiceItem.create({
    data: {
      invoiceId: invoice2.id,
      productId: products[1].id,
      quantity: 1,
      unitPrice: 8000,
      total: 8000,
    }
  })

  // عقد الأقساط للفاتورة 2
  const contract2 = await prisma.installmentContract.create({
    data: {
      id: 'cont-2',
      contractNumber: 'CON-002',
      customerId: customers[1].id,
      invoiceId: invoice2.id,
      agentId: agent.id,
      totalAmount: 8000,
      downPayment: 1000,
      financedAmount: 7000,
      
      numberOfPayments: 4,
      paymentFrequency: 'monthly',
      status: 'active',
      startDate: new Date(),
    }
  })

  // 4 أقساط للفاتورة 2
  await prisma.installment.createMany({
    data: [
      {
        id: 'inst-2-1',
        contractId: contract2.id,
        installmentNumber: 1,
        amount: 1750,
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // متأخر
        status: 'overdue',
        paidAmount: 0,
        remainingAmount: 1750,
      },
      {
        id: 'inst-2-2',
        contractId: contract2.id,
        installmentNumber: 2,
        amount: 1750,
        dueDate: dueDate2,
        status: 'pending',
        paidAmount: 0,
        remainingAmount: 1750,
      },
      {
        id: 'inst-2-3',
        contractId: contract2.id,
        installmentNumber: 3,
        amount: 1750,
        dueDate: dueDate3,
        status: 'pending',
        paidAmount: 0,
        remainingAmount: 1750,
      },
      {
        id: 'inst-2-4',
        contractId: contract2.id,
        installmentNumber: 4,
        amount: 1750,
        dueDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        status: 'pending',
        paidAmount: 0,
        remainingAmount: 1750,
      },
    ]
  })
  console.log('✅ الفواتير: 2 | العقود: 2 | الأقساط: 7')

  // ============================================
  // 11. دفعتين
  // ============================================
  await prisma.payment.create({
    data: {
      id: 'pay-1',
      paymentNumber: 'PAY-001',
      customerId: customers[0].id,
      invoiceId: invoice1.id,
      companyId: company.id,
      branchId: branch.id,
      amount: 3000,
      method: 'CASH',
      status: 'completed',
      paymentDate: new Date(),
      notes: 'دفعة مقدمة',
    }
  })

  await prisma.payment.create({
    data: {
      id: 'pay-2',
      paymentNumber: 'PAY-002',
      customerId: customers[0].id,
      invoiceId: invoice1.id,
      companyId: company.id,
      branchId: branch.id,
      amount: 4000,
      method: 'CASH',
      status: 'completed',
      paymentDate: new Date(),
      notes: 'القسط الأول',
    }
  })
  console.log('✅ المدفوعات: 2')

  // ============================================
  // 12. مخزون للمنتجات
  // ============================================
  for (const product of products) {
    await prisma.inventory.create({
      data: {
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: 10,
        minQuantity: 2,
        maxQuantity: 50,
      }
    })
  }
  console.log('✅ المخزون: 5 منتجات')

  // ============================================
  // النتيجة النهائية
  // ============================================
  console.log('\n========================================')
  console.log('✅ تم إضافة البيانات التجريبية بنجاح!')
  console.log('========================================')
  console.log('📊 الإحصائيات:')
  console.log('   - شركة: 1')
  console.log('   - فروع: 1')
  console.log('   - مستخدمين: 3')
  console.log('   - عملاء: 5')
  console.log('   - منتجات: 5')
  console.log('   - فواتير: 2')
  console.log('   - عقود أقساط: 2')
  console.log('   - أقساط: 7 (1 مدفوع، 1 متأخر، 5 معلقة)')
  console.log('   - مدفوعات: 2')
  console.log('')
  console.log('👤 بيانات الدخول:')
  console.log('   - مدير النظام: admin@aqsati.com / 123456')
  console.log('   - مدير الشركة: manager@aqsati.com / 123456')
  console.log('   - المندوب: agent@aqsati.com / 123456')
  console.log('========================================')
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function seedDemoCompany() {
  console.log('Starting seed demo company...')

  try {
    // 1. Create Company
    const company = await db.company.create({
      data: {
        id: 'demo-company-1',
        name: 'Demo Trading Company',
        nameAr: 'شركة تجارية تجريبية',
        code: 'DEMO001',
        email: 'info@demo-company.com',
        phone: '+201234567890',
        address: '123 Business Street, Cairo, Egypt',
        taxNumber: '123456789',
        currency: 'EGP',
        taxRate: 15,
        discountEnabled: true,
        subscriptionStatus: 'trial',
        planType: 'premium',
        active: true,
      }
    })
    console.log('✅ Company created:', company.name)

    // 2. Create Main Branch
    const branch = await db.branch.create({
      data: {
        id: 'demo-branch-1',
        companyId: company.id,
        name: 'Main Branch',
        nameAr: 'الفرع الرئيسي',
        code: 'BR001',
        address: '123 Business Street, Cairo',
        phone: '+201234567890',
        isMain: true,
        active: true,
      }
    })
    console.log('✅ Branch created:', branch.name)

    // 3. Create Admin User
    const hashedPassword = await bcrypt.hash('demo123456', 10)
    const adminUser = await db.user.create({
      data: {
        id: 'demo-admin-1',
        companyId: company.id,
        branchId: branch.id,
        email: 'admin@demo.com',
        password: hashedPassword,
        name: 'Admin User',
        nameAr: 'مدير النظام',
        phone: '+201234567891',
        role: 'admin',
        active: true,
      }
    })
    console.log('✅ Admin user created:', adminUser.email)

    // 4. Create Warehouse
    const warehouse = await db.warehouse.create({
      data: {
        id: 'demo-warehouse-1',
        companyId: company.id,
        branchId: branch.id,
        name: 'Main Warehouse',
        nameAr: 'المخزن الرئيسي',
        code: 'WH001',
        address: '123 Business Street, Cairo',
        isMain: true,
        active: true,
      }
    })
    console.log('✅ Warehouse created:', warehouse.name)

    // 5. Create Product Categories
    const categories = await Promise.all([
      db.productCategory.create({
        data: {
          id: 'cat-electronics',
          companyId: company.id,
          name: 'Electronics',
          nameAr: 'إلكترونيات',
          code: 'ELEC',
          active: true,
        }
      }),
      db.productCategory.create({
        data: {
          id: 'cat-clothing',
          companyId: company.id,
          name: 'Clothing',
          nameAr: 'ملابس',
          code: 'CLTH',
          active: true,
        }
      }),
      db.productCategory.create({
        data: {
          id: 'cat-food',
          companyId: company.id,
          name: 'Food & Beverages',
          nameAr: 'أغذية ومشروبات',
          code: 'FOOD',
          active: true,
        }
      }),
    ])
    console.log('✅ Categories created:', categories.length)

    // 6. Create Products
    const products = await Promise.all([
      db.product.create({
        data: {
          id: 'prod-1',
          companyId: company.id,
          categoryId: 'cat-electronics',
          sku: 'ELEC001',
          name: 'Smart Phone',
          nameAr: 'هاتف ذكي',
          description: 'Latest model smartphone',
          unit: 'piece',
          costPrice: 5000,
          sellPrice: 6500,
          barcode: '6281000000001',
          active: true,
        }
      }),
      db.product.create({
        data: {
          id: 'prod-2',
          companyId: company.id,
          categoryId: 'cat-electronics',
          sku: 'ELEC002',
          name: 'Laptop',
          nameAr: 'لابتوب',
          description: 'Business laptop',
          unit: 'piece',
          costPrice: 12000,
          sellPrice: 15000,
          barcode: '6281000000002',
          active: true,
        }
      }),
      db.product.create({
        data: {
          id: 'prod-3',
          companyId: company.id,
          categoryId: 'cat-electronics',
          sku: 'ELEC003',
          name: 'Headphones',
          nameAr: 'سماعات رأس',
          description: 'Wireless headphones',
          unit: 'piece',
          costPrice: 500,
          sellPrice: 800,
          barcode: '6281000000003',
          active: true,
        }
      }),
      db.product.create({
        data: {
          id: 'prod-4',
          companyId: company.id,
          categoryId: 'cat-clothing',
          sku: 'CLTH001',
          name: 'T-Shirt',
          nameAr: 'تي شيرت',
          description: 'Cotton T-Shirt',
          unit: 'piece',
          costPrice: 100,
          sellPrice: 180,
          barcode: '6281000000004',
          active: true,
        }
      }),
      db.product.create({
        data: {
          id: 'prod-5',
          companyId: company.id,
          categoryId: 'cat-clothing',
          sku: 'CLTH002',
          name: 'Jeans',
          nameAr: 'جينز',
          description: 'Denim Jeans',
          unit: 'piece',
          costPrice: 250,
          sellPrice: 400,
          barcode: '6281000000005',
          active: true,
        }
      }),
      db.product.create({
        data: {
          id: 'prod-6',
          companyId: company.id,
          categoryId: 'cat-food',
          sku: 'FOOD001',
          name: 'Rice 5kg',
          nameAr: 'أرز 5 كيلو',
          description: 'White Rice 5kg pack',
          unit: 'pack',
          costPrice: 80,
          sellPrice: 120,
          barcode: '6281000000006',
          active: true,
        }
      }),
      db.product.create({
        data: {
          id: 'prod-7',
          companyId: company.id,
          categoryId: 'cat-food',
          sku: 'FOOD002',
          name: 'Cooking Oil 2L',
          nameAr: 'زيت طعام 2 لتر',
          description: 'Vegetable cooking oil',
          unit: 'bottle',
          costPrice: 60,
          sellPrice: 95,
          barcode: '6281000000007',
          active: true,
        }
      }),
      db.product.create({
        data: {
          id: 'prod-8',
          companyId: company.id,
          categoryId: 'cat-food',
          sku: 'FOOD003',
          name: 'Sugar 2kg',
          nameAr: 'سكر 2 كيلو',
          description: 'White sugar 2kg pack',
          unit: 'pack',
          costPrice: 40,
          sellPrice: 65,
          barcode: '6281000000008',
          active: true,
        }
      }),
    ])
    console.log('✅ Products created:', products.length)

    // 7. Create Inventory for products
    for (const product of products) {
      await db.inventory.create({
        data: {
          productId: product.id,
          warehouseId: warehouse.id,
          quantity: Math.floor(Math.random() * 100) + 50,
          minQuantity: 10,
          avgCost: product.costPrice,
          totalCost: product.costPrice * 50,
        }
      })
    }
    console.log('✅ Inventory created for all products')

    // 8. Create Suppliers
    const suppliers = await Promise.all([
      db.supplier.create({
        data: {
          id: 'sup-1',
          companyId: company.id,
          supplierCode: 'SUP001',
          name: 'Tech Supplier Co.',
          nameAr: 'شركة تكنولوجيا للموردين',
          phone: '+201111111111',
          email: 'info@techsupplier.com',
          address: 'Cairo, Egypt',
          currentBalance: 0,
          active: true,
        }
      }),
      db.supplier.create({
        data: {
          id: 'sup-2',
          companyId: company.id,
          supplierCode: 'SUP002',
          name: 'Fashion Wholesale',
          nameAr: 'جملة الملابس',
          phone: '+201222222222',
          email: 'info@fashionwholesale.com',
          address: 'Alexandria, Egypt',
          currentBalance: 0,
          active: true,
        }
      }),
      db.supplier.create({
        data: {
          id: 'sup-3',
          companyId: company.id,
          supplierCode: 'SUP003',
          name: 'Food Distributors',
          nameAr: 'موزعو الأغذية',
          phone: '+201333333333',
          email: 'info@fooddist.com',
          address: 'Giza, Egypt',
          currentBalance: 0,
          active: true,
        }
      }),
    ])
    console.log('✅ Suppliers created:', suppliers.length)

    // 9. Create Governorates and Cities
    const governorate = await db.governorate.create({
      data: {
        id: 'gov-1',
        companyId: company.id,
        name: 'Cairo',
        nameAr: 'القاهرة',
        code: 'CAI',
        active: true,
      }
    })

    const city = await db.city.create({
      data: {
        id: 'city-1',
        companyId: company.id,
        governorateId: governorate.id,
        name: 'Nasr City',
        nameAr: 'مدينة نصر',
        code: 'NSR',
        active: true,
      }
    })

    const area = await db.area.create({
      data: {
        id: 'area-1',
        companyId: company.id,
        cityId: city.id,
        name: 'Mostafa El-Nahhas',
        nameAr: 'مصطفى النحاس',
        code: 'MNH',
        active: true,
      }
    })
    console.log('✅ Locations created')

    // 10. Create Customers
    const customers = await Promise.all([
      db.customer.create({
        data: {
          id: 'cust-1',
          companyId: company.id,
          branchId: branch.id,
          governorateId: governorate.id,
          cityId: city.id,
          areaId: area.id,
          code: 'CUST001',
          name: 'Ahmed Mohamed',
          nameAr: 'أحمد محمد',
          phone: '+201005551001',
          phone2: '+201005551002',
          address: '25 Mostafa El-Nahhas, Nasr City',
          nationalId: '29501011234567',
          creditLimit: 10000,
          balance: 0,
          active: true,
        }
      }),
      db.customer.create({
        data: {
          id: 'cust-2',
          companyId: company.id,
          branchId: branch.id,
          governorateId: governorate.id,
          cityId: city.id,
          areaId: area.id,
          code: 'CUST002',
          name: 'Sara Ali',
          nameAr: 'سارة علي',
          phone: '+201005552001',
          address: '30 Mostafa El-Nahhas, Nasr City',
          nationalId: '29502022345678',
          creditLimit: 5000,
          balance: 0,
          active: true,
        }
      }),
      db.customer.create({
        data: {
          id: 'cust-3',
          companyId: company.id,
          branchId: branch.id,
          governorateId: governorate.id,
          cityId: city.id,
          areaId: area.id,
          code: 'CUST003',
          name: 'Mahmoud Hassan',
          nameAr: 'محمود حسن',
          phone: '+201005553001',
          address: '35 Mostafa El-Nahhas, Nasr City',
          nationalId: '29503033456789',
          creditLimit: 15000,
          balance: 0,
          active: true,
        }
      }),
      db.customer.create({
        data: {
          id: 'cust-4',
          companyId: company.id,
          branchId: branch.id,
          governorateId: governorate.id,
          cityId: city.id,
          areaId: area.id,
          code: 'CUST004',
          name: 'Fatima Ibrahim',
          nameAr: 'فاطمة إبراهيم',
          phone: '+201005554001',
          address: '40 Mostafa El-Nahhas, Nasr City',
          nationalId: '29504044567890',
          creditLimit: 8000,
          balance: 0,
          active: true,
        }
      }),
      db.customer.create({
        data: {
          id: 'cust-5',
          companyId: company.id,
          branchId: branch.id,
          governorateId: governorate.id,
          cityId: city.id,
          areaId: area.id,
          code: 'CUST005',
          name: 'Omar Youssef',
          nameAr: 'عمر يوسف',
          phone: '+201005555001',
          address: '45 Mostafa El-Nahhas, Nasr City',
          nationalId: '29505055678901',
          creditLimit: 20000,
          balance: 0,
          active: true,
        }
      }),
    ])
    console.log('✅ Customers created:', customers.length)

    // 11. Create Accounting Chart of Accounts (in order for parent-child relationships)
    // First create header accounts
    const assetHeader = await db.account.create({
      data: {
        id: 'acc-assets',
        companyId: company.id,
        code: '1',
        name: 'Assets',
        nameAr: 'الأصول',
        type: 'ASSET',
        isHeader: true,
        active: true,
      }
    })

    const liabilityHeader = await db.account.create({
      data: {
        id: 'acc-liabilities',
        companyId: company.id,
        code: '2',
        name: 'Liabilities',
        nameAr: 'الالتزامات',
        type: 'LIABILITY',
        isHeader: true,
        active: true,
      }
    })

    const equityHeader = await db.account.create({
      data: {
        id: 'acc-equity',
        companyId: company.id,
        code: '3',
        name: 'Equity',
        nameAr: 'حقوق الملكية',
        type: 'EQUITY',
        isHeader: true,
        active: true,
      }
    })

    const revenueHeader = await db.account.create({
      data: {
        id: 'acc-revenue',
        companyId: company.id,
        code: '4',
        name: 'Revenue',
        nameAr: 'الإيرادات',
        type: 'REVENUE',
        isHeader: true,
        active: true,
      }
    })

    const expenseHeader = await db.account.create({
      data: {
        id: 'acc-expenses',
        companyId: company.id,
        code: '5',
        name: 'Expenses',
        nameAr: 'المصروفات',
        type: 'EXPENSE',
        isHeader: true,
        active: true,
      }
    })

    // Then create child accounts
    const childAccounts = await Promise.all([
      // Asset accounts
      db.account.create({
        data: {
          id: 'acc-cash',
          companyId: company.id,
          code: '1.1',
          name: 'Cash',
          nameAr: 'النقدية',
          type: 'ASSET',
          parentId: assetHeader.id,
          isHeader: false,
          balance: 100000,
          active: true,
        }
      }),
      db.account.create({
        data: {
          id: 'acc-bank',
          companyId: company.id,
          code: '1.2',
          name: 'Bank',
          nameAr: 'البنك',
          type: 'ASSET',
          parentId: assetHeader.id,
          isHeader: false,
          balance: 500000,
          active: true,
        }
      }),
      db.account.create({
        data: {
          id: 'acc-receivables',
          companyId: company.id,
          code: '1.3',
          name: 'Accounts Receivable',
          nameAr: 'الذمم المدينة',
          type: 'ASSET',
          parentId: assetHeader.id,
          isHeader: false,
          balance: 0,
          active: true,
        }
      }),
      db.account.create({
        data: {
          id: 'acc-inventory',
          companyId: company.id,
          code: '1.4',
          name: 'Inventory',
          nameAr: 'المخزون',
          type: 'ASSET',
          parentId: assetHeader.id,
          isHeader: false,
          balance: 50000,
          active: true,
        }
      }),

      // Liability accounts
      db.account.create({
        data: {
          id: 'acc-payables',
          companyId: company.id,
          code: '2.1',
          name: 'Accounts Payable',
          nameAr: 'الذمم الدائنة',
          type: 'LIABILITY',
          parentId: liabilityHeader.id,
          isHeader: false,
          balance: 0,
          active: true,
        }
      }),
      db.account.create({
        data: {
          id: 'acc-suppliers',
          companyId: company.id,
          code: '2.2',
          name: 'Suppliers',
          nameAr: 'الموردين',
          type: 'LIABILITY',
          parentId: liabilityHeader.id,
          isHeader: false,
          balance: 0,
          active: true,
        }
      }),

      // Equity accounts
      db.account.create({
        data: {
          id: 'acc-capital',
          companyId: company.id,
          code: '3.1',
          name: 'Capital',
          nameAr: 'رأس المال',
          type: 'EQUITY',
          parentId: equityHeader.id,
          isHeader: false,
          balance: 500000,
          active: true,
        }
      }),
      db.account.create({
        data: {
          id: 'acc-retained',
          companyId: company.id,
          code: '3.2',
          name: 'Retained Earnings',
          nameAr: 'الأرباح المحتجزة',
          type: 'EQUITY',
          parentId: equityHeader.id,
          isHeader: false,
          balance: 0,
          active: true,
        }
      }),

      // Revenue accounts
      db.account.create({
        data: {
          id: 'acc-sales',
          companyId: company.id,
          code: '4.1',
          name: 'Sales',
          nameAr: 'المبيعات',
          type: 'REVENUE',
          parentId: revenueHeader.id,
          isHeader: false,
          balance: 0,
          active: true,
        }
      }),
      db.account.create({
        data: {
          id: 'acc-sales-discount',
          companyId: company.id,
          code: '4.2',
          name: 'Sales Discount',
          nameAr: 'خصم المبيعات',
          type: 'REVENUE',
          parentId: revenueHeader.id,
          isHeader: false,
          balance: 0,
          active: true,
        }
      }),

      // Expense accounts
      db.account.create({
        data: {
          id: 'acc-cogs',
          companyId: company.id,
          code: '5.1',
          name: 'Cost of Goods Sold',
          nameAr: 'تكلفة البضاعة المباعة',
          type: 'EXPENSE',
          parentId: expenseHeader.id,
          isHeader: false,
          balance: 0,
          active: true,
        }
      }),
      db.account.create({
        data: {
          id: 'acc-salaries',
          companyId: company.id,
          code: '5.2',
          name: 'Salaries',
          nameAr: 'المرتبات',
          type: 'EXPENSE',
          parentId: expenseHeader.id,
          isHeader: false,
          balance: 0,
          active: true,
        }
      }),
      db.account.create({
        data: {
          id: 'acc-rent',
          companyId: company.id,
          code: '5.3',
          name: 'Rent',
          nameAr: 'الإيجار',
          type: 'EXPENSE',
          parentId: expenseHeader.id,
          isHeader: false,
          balance: 0,
          active: true,
        }
      }),
      db.account.create({
        data: {
          id: 'acc-utilities',
          companyId: company.id,
          code: '5.4',
          name: 'Utilities',
          nameAr: 'المرافق',
          type: 'EXPENSE',
          parentId: expenseHeader.id,
          isHeader: false,
          balance: 0,
          active: true,
        }
      }),
    ])
    console.log('✅ Chart of Accounts created:', 5 + childAccounts.length) // 5 headers + child accounts

    // 12. Create Invoices for Installments
    const today = new Date()
    const invoices = await Promise.all([
      // Invoice 1 - Smartphone for Ahmed
      db.invoice.create({
        data: {
          id: 'inv-1',
          companyId: company.id,
          branchId: branch.id,
          customerId: 'cust-1',
          invoiceNumber: 'INV-001',
          invoiceDate: new Date(today.getFullYear(), today.getMonth(), 1),
          type: 'sales',
          status: 'confirmed',
          subtotal: 6500,
          discount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: 6500,
          paidAmount: 1300, // Down payment
          remainingAmount: 5200,
          notes: 'Smartphone purchase - Installment plan',
        }
      }),
      // Invoice 2 - Laptop for Sara
      db.invoice.create({
        data: {
          id: 'inv-2',
          companyId: company.id,
          branchId: branch.id,
          customerId: 'cust-2',
          invoiceNumber: 'INV-002',
          invoiceDate: new Date(today.getFullYear(), today.getMonth(), 5),
          type: 'sales',
          status: 'confirmed',
          subtotal: 15000,
          discount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: 15000,
          paidAmount: 3000, // Down payment
          remainingAmount: 12000,
          notes: 'Laptop purchase - Installment plan',
        }
      }),
      // Invoice 3 - Headphones + T-Shirts for Mahmoud
      db.invoice.create({
        data: {
          id: 'inv-3',
          companyId: company.id,
          branchId: branch.id,
          customerId: 'cust-3',
          invoiceNumber: 'INV-003',
          invoiceDate: new Date(today.getFullYear(), today.getMonth(), 10),
          type: 'sales',
          status: 'confirmed',
          subtotal: 2000,
          discount: 0,
          taxRate: 0,
          taxAmount: 0,
          total: 2000,
          paidAmount: 500, // Down payment
          remainingAmount: 1500,
          notes: 'Electronics and clothing - Installment plan',
        }
      }),
    ])
    console.log('✅ Invoices created:', invoices.length)

    // Add Invoice Items
    await Promise.all([
      // Invoice 1 items
      db.invoiceItem.create({
        data: {
          invoiceId: 'inv-1',
          productId: 'prod-1', // Smartphone
          quantity: 1,
          unitPrice: 6500,
          total: 6500,
        }
      }),
      // Invoice 2 items
      db.invoiceItem.create({
        data: {
          invoiceId: 'inv-2',
          productId: 'prod-2', // Laptop
          quantity: 1,
          unitPrice: 15000,
          total: 15000,
        }
      }),
      // Invoice 3 items
      db.invoiceItem.create({
        data: {
          invoiceId: 'inv-3',
          productId: 'prod-3', // Headphones
          quantity: 1,
          unitPrice: 800,
          total: 800,
        }
      }),
      db.invoiceItem.create({
        data: {
          invoiceId: 'inv-3',
          productId: 'prod-4', // T-Shirt
          quantity: 5,
          unitPrice: 180,
          total: 900,
        }
      }),
    ])
    console.log('✅ Invoice items created')

    // 13. Create Installment Contracts
    const contracts = await Promise.all([
      // Contract 1 - Ahmed - 6 months
      db.installmentContract.create({
        data: {
          id: 'contract-1',
          invoiceId: 'inv-1',
          customerId: 'cust-1',
          contractNumber: 'CNT-2024-001',
          contractDate: new Date(today.getFullYear(), today.getMonth(), 1),
          totalAmount: 6500,
          downPayment: 1300,
          financedAmount: 5200,
          numberOfPayments: 6,
          paymentFrequency: 'MONTHLY',
          interestRate: 0,
          interestAmount: 0,
          startDate: new Date(today.getFullYear(), today.getMonth(), 1),
          endDate: new Date(today.getFullYear(), today.getMonth() + 6, 1),
          status: 'active',
          notes: '6 monthly installments for Smartphone',
        }
      }),
      // Contract 2 - Sara - 12 months
      db.installmentContract.create({
        data: {
          id: 'contract-2',
          invoiceId: 'inv-2',
          customerId: 'cust-2',
          contractNumber: 'CNT-2024-002',
          contractDate: new Date(today.getFullYear(), today.getMonth(), 5),
          totalAmount: 15000,
          downPayment: 3000,
          financedAmount: 12000,
          numberOfPayments: 12,
          paymentFrequency: 'MONTHLY',
          interestRate: 5,
          interestAmount: 600,
          startDate: new Date(today.getFullYear(), today.getMonth(), 5),
          endDate: new Date(today.getFullYear(), today.getMonth() + 12, 5),
          status: 'active',
          notes: '12 monthly installments for Laptop with 5% interest',
        }
      }),
      // Contract 3 - Mahmoud - 3 months
      db.installmentContract.create({
        data: {
          id: 'contract-3',
          invoiceId: 'inv-3',
          customerId: 'cust-3',
          contractNumber: 'CNT-2024-003',
          contractDate: new Date(today.getFullYear(), today.getMonth(), 10),
          totalAmount: 2000,
          downPayment: 500,
          financedAmount: 1500,
          numberOfPayments: 3,
          paymentFrequency: 'MONTHLY',
          interestRate: 0,
          interestAmount: 0,
          startDate: new Date(today.getFullYear(), today.getMonth(), 10),
          endDate: new Date(today.getFullYear(), today.getMonth() + 3, 10),
          status: 'active',
          notes: '3 monthly installments for Electronics and clothing',
        }
      }),
    ])
    console.log('✅ Installment contracts created:', contracts.length)

    // 14. Create Installments (Payment Schedule)
    // Contract 1 - 6 installments of 866.67 EGP each
    for (let i = 1; i <= 6; i++) {
      await db.installment.create({
        data: {
          contractId: 'contract-1',
          installmentNumber: i,
          dueDate: new Date(today.getFullYear(), today.getMonth() + i, 1),
          amount: 866.67,
          paidAmount: 0,
          remainingAmount: 866.67,
          status: i === 1 ? 'overdue' : 'pending',
        }
      })
    }

    // Contract 2 - 12 installments of 1050 EGP each (with interest)
    for (let i = 1; i <= 12; i++) {
      await db.installment.create({
        data: {
          contractId: 'contract-2',
          installmentNumber: i,
          dueDate: new Date(today.getFullYear(), today.getMonth() + i, 5),
          amount: 1050,
          paidAmount: 0,
          remainingAmount: 1050,
          status: i === 1 ? 'overdue' : 'pending',
        }
      })
    }

    // Contract 3 - 3 installments of 500 EGP each
    for (let i = 1; i <= 3; i++) {
      await db.installment.create({
        data: {
          contractId: 'contract-3',
          installmentNumber: i,
          dueDate: new Date(today.getFullYear(), today.getMonth() + i, 10),
          amount: 500,
          paidAmount: i === 1 ? 500 : 0,
          remainingAmount: i === 1 ? 0 : 500,
          status: i === 1 ? 'paid' : (i === 2 ? 'overdue' : 'pending'),
          paidDate: i === 1 ? new Date(today.getFullYear(), today.getMonth(), 15) : null,
        }
      })
    }
    console.log('✅ Installments created: 6 + 12 + 3 = 21 installments')

    // 15. Create some Installment Payments
    const installmentPayments = await Promise.all([
      // Payment for contract 1 - first installment (partial)
      db.installmentPayment.create({
        data: {
          installmentId: (await db.installment.findFirst({
            where: { contractId: 'contract-1', installmentNumber: 1 }
          }))!.id,
          paymentDate: new Date(today.getFullYear(), today.getMonth(), 20),
          amount: 400,
          method: 'CASH',
          notes: 'Partial payment for first installment',
        }
      }),
      // Full payment for contract 3 - first installment
      db.installmentPayment.create({
        data: {
          installmentId: (await db.installment.findFirst({
            where: { contractId: 'contract-3', installmentNumber: 1 }
          }))!.id,
          paymentDate: new Date(today.getFullYear(), today.getMonth(), 15),
          amount: 500,
          method: 'BANK_TRANSFER',
          reference: 'TRX-001',
          notes: 'Full payment for first installment',
        }
      }),
    ])

    // Update the paid status for contract 1 first installment
    const contract1Inst1 = await db.installment.findFirst({
      where: { contractId: 'contract-1', installmentNumber: 1 }
    })
    if (contract1Inst1) {
      await db.installment.update({
        where: { id: contract1Inst1.id },
        data: {
          paidAmount: 400,
          remainingAmount: 466.67,
          status: 'partial',
        }
      })
    }

    console.log('✅ Installment payments created:', installmentPayments.length)

    // 16. Update customer balances
    await db.customer.update({
      where: { id: 'cust-1' },
      data: { balance: 5200 - 400 } // financed - partial payment
    })
    await db.customer.update({
      where: { id: 'cust-2' },
      data: { balance: 12600 } // financed with interest
    })
    await db.customer.update({
      where: { id: 'cust-3' },
      data: { balance: 1000 } // financed - first installment paid
    })
    console.log('✅ Customer balances updated')

    console.log('\n🎉 Demo company seed completed successfully!')
    console.log('\n📋 Login Credentials:')
    console.log('   Email: admin@demo.com')
    console.log('   Password: demo123456')
    console.log('\n📊 Installment Data Summary:')
    console.log('   - 3 Installment Contracts')
    console.log('   - 21 Installments (6 + 12 + 3)')
    console.log('   - 2 Payments recorded')
    console.log('   - Contract CNT-2024-001: 1 partial payment (400 of 866.67)')
    console.log('   - Contract CNT-2024-002: No payments yet')
    console.log('   - Contract CNT-2024-003: First installment fully paid')

  } catch (error) {
    console.error('❌ Error seeding demo company:', error)
    throw error
  }
}

// Run the seed
seedDemoCompany()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })

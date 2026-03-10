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

    console.log('\n🎉 Demo company seed completed successfully!')
    console.log('\n📋 Login Credentials:')
    console.log('   Email: admin@demo.com')
    console.log('   Password: demo123456')

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

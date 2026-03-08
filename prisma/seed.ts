import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // إنشاء مستخدم Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@aqsati.com' },
    update: {},
    create: {
      email: 'admin@aqsati.com',
      name: 'Super Admin',
      nameAr: 'مدير النظام',
      password: '$2a$10$YourHashedPasswordHere', // يجب تغييرها
      role: 'SUPER_ADMIN',
      active: true
    }
  })

  console.log('Created super admin:', superAdmin.email)
  
  // إنشاء شركة افتراضية
  const company = await prisma.company.upsert({
    where: { code: 'default' },
    update: {},
    create: {
      name: 'Default Company',
      nameAr: 'الشركة الافتراضية',
      code: 'default',
      active: true
    }
  })
  
  console.log('Created company:', company.name)
  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

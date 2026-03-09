import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const BACKUP_DIR = path.join(process.cwd(), 'backups')

// التحقق من صلاحيات السوبر أدمن
async function checkSuperAdmin() {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('erp_user')
  
  if (!userCookie) {
    return null
  }

  const user = JSON.parse(userCookie.value)
  if (user.role !== 'SUPER_ADMIN') {
    return null
  }

  return user
}

// POST - استعادة نسخة احتياطية
export async function POST(request: NextRequest) {
  const user = await checkSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { filename, confirmDelete } = body

    if (!filename) {
      return NextResponse.json({ error: 'اسم الملف مطلوب' }, { status: 400 })
    }

    const filePath = path.join(BACKUP_DIR, filename)
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
    }

    const content = await readFile(filePath, 'utf-8')
    const backupData = JSON.parse(content)

    if (!backupData.type || !backupData.data) {
      return NextResponse.json({ error: 'ملف نسخة احتياطية غير صالح' }, { status: 400 })
    }

    // تحذير: هذا سيحذف البيانات الحالية
    if (!confirmDelete) {
      return NextResponse.json({ 
        requiresConfirmation: true,
        message: 'سيتم حذف البيانات الحالية قبل الاستعادة. هل أنت متأكد؟',
        backupInfo: {
          type: backupData.type,
          createdAt: backupData.createdAt,
          companyName: backupData.companyName
        }
      })
    }

    // تنفيذ الاستعادة حسب النوع
    if (backupData.type === 'company') {
      // استعادة شركة محددة
      const data = backupData.data

      // التحقق من وجود الشركة أو إنشائها
      let company = await db.company.findUnique({ where: { id: backupData.companyId } })
      
      if (!company && data.company) {
        try {
          company = await db.company.create({ data: data.company })
        } catch (e) {
          // الشركة قد تكون موجودة بالفعل
          company = await db.company.findFirst({ where: { code: data.company.code } })
        }
      }

      if (!company) {
        return NextResponse.json({ error: 'فشل في إنشاء الشركة' }, { status: 500 })
      }

      // استعادة بيانات الشركة
      const companyIdFix = { companyId: company.id }
      
      if (data.branches?.length) {
        for (const b of data.branches) {
          await db.branch.create({ data: { ...b, ...companyIdFix } }).catch(() => {})
        }
      }
      if (data.warehouses?.length) {
        for (const w of data.warehouses) {
          await db.warehouse.create({ data: { ...w, ...companyIdFix } }).catch(() => {})
        }
      }
      if (data.customers?.length) {
        for (const c of data.customers) {
          await db.customer.create({ data: { ...c, ...companyIdFix } }).catch(() => {})
        }
      }
      if (data.products?.length) {
        for (const p of data.products) {
          await db.product.create({ data: { ...p, ...companyIdFix } }).catch(() => {})
        }
      }
      if (data.invoices?.length) {
        for (const i of data.invoices) {
          await db.invoice.create({ data: { ...i, ...companyIdFix } }).catch(() => {})
        }
      }
      if (data.payments?.length) {
        for (const p of data.payments) {
          await db.payment.create({ data: { ...p, ...companyIdFix } }).catch(() => {})
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'تم استعادة النسخة الاحتياطية بنجاح' 
    })
  } catch (error) {
    console.error('Restore error:', error)
    return NextResponse.json({ 
      error: 'حدث خطأ في استعادة النسخة الاحتياطية',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

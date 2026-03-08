import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { writeFile, readFile, unlink, mkdir } from 'fs/promises'
import { existsSync, readdirSync, statSync } from 'fs'
import path from 'path'

const BACKUP_DIR = path.join(process.cwd(), 'backups')

// التأكد من وجود مجلد النسخ الاحتياطية
async function ensureBackupDir() {
  if (!existsSync(BACKUP_DIR)) {
    await mkdir(BACKUP_DIR, { recursive: true })
  }
}

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

// GET - جلب قائمة النسخ الاحتياطية
export async function GET(request: NextRequest) {
  const user = await checkSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  try {
    await ensureBackupDir()
    
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'list') {
      const files = readdirSync(BACKUP_DIR)
        .filter((f) => f.endsWith('.json'))
        .map((f) => {
          const filePath = path.join(BACKUP_DIR, f)
          const stats = statSync(filePath)
          return {
            filename: f,
            size: stats.size,
            createdAt: stats.birthtime,
            type: f.includes('full') ? 'full' : 'company'
          }
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      return NextResponse.json({ success: true, backups: files })
    }

    if (action === 'download') {
      const filename = searchParams.get('file')
      if (!filename) {
        return NextResponse.json({ error: 'اسم الملف مطلوب' }, { status: 400 })
      }

      const filePath = path.join(BACKUP_DIR, filename)
      if (!existsSync(filePath)) {
        return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
      }

      const content = await readFile(filePath, 'utf-8')
      
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 })
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

// POST - إنشاء نسخة احتياطية
export async function POST(request: NextRequest) {
  const user = await checkSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  try {
    await ensureBackupDir()
    
    const body = await request.json()
    const { type, companyId } = body // type: 'full' | 'company'

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    let filename = ''
    let backupData: any = {}

    if (type === 'full') {
      filename = `backup-full-${timestamp}.json`
      
      const [
        companies, users, customers, products, invoices, payments,
        branches, warehouses, zones, subscriptions, plans, settings
      ] = await Promise.all([
        db.company.findMany(),
        db.user.findMany({ select: { password: false } }),
        db.customer.findMany(),
        db.product.findMany(),
        db.invoice.findMany(),
        db.payment.findMany(),
        db.branch.findMany(),
        db.warehouse.findMany(),
        db.zone.findMany(),
        db.subscription.findMany(),
        db.subscriptionPlan.findMany(),
        db.systemSetting.findMany()
      ])

      backupData = {
        type: 'full',
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        data: {
          companies, users, customers, products, invoices, payments,
          branches, warehouses, zones, subscriptions, plans, settings
        }
      }
    } else if (type === 'company' && companyId) {
      const company = await db.company.findUnique({ where: { id: companyId } })
      if (!company) {
        return NextResponse.json({ error: 'الشركة غير موجودة' }, { status: 404 })
      }

      filename = `backup-company-${company.code}-${timestamp}.json`

      const [
        users, customers, products, invoices, payments,
        branches, warehouses, zones, paymentGateways, suppliers,
        purchaseInvoices, subscriptions
      ] = await Promise.all([
        db.user.findMany({ where: { companyId }, select: { password: false } }),
        db.customer.findMany({ where: { companyId } }),
        db.product.findMany({ where: { companyId } }),
        db.invoice.findMany({ where: { companyId } }),
        db.payment.findMany({ where: { companyId } }),
        db.branch.findMany({ where: { companyId } }),
        db.warehouse.findMany({ where: { companyId } }),
        db.zone.findMany({ where: { companyId } }),
        db.companyPaymentGateway.findMany({ where: { companyId } }),
        db.supplier.findMany({ where: { companyId } }),
        db.purchaseInvoice.findMany({ where: { companyId } }),
        db.subscription.findMany({ where: { companyId } })
      ])

      backupData = {
        type: 'company',
        companyId,
        companyName: company.name,
        companyCode: company.code,
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        data: {
          company,
          users, customers, products, invoices, payments,
          branches, warehouses, zones, paymentGateways, suppliers,
          purchaseInvoices, subscriptions
        }
      }
    } else {
      return NextResponse.json({ error: 'نوع النسخة الاحتياطية غير صالح' }, { status: 400 })
    }

    const filePath = path.join(BACKUP_DIR, filename)
    await writeFile(filePath, JSON.stringify(backupData, null, 2), 'utf-8')

    return NextResponse.json({
      success: true,
      filename,
      size: Buffer.byteLength(JSON.stringify(backupData)),
      message: `تم إنشاء النسخة الاحتياطية بنجاح`
    })
  } catch (error) {
    console.error('Backup creation error:', error)
    return NextResponse.json({ error: 'حدث خطأ في إنشاء النسخة الاحتياطية' }, { status: 500 })
  }
}

// DELETE - حذف نسخة احتياطية
export async function DELETE(request: NextRequest) {
  const user = await checkSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('file')

    if (!filename) {
      return NextResponse.json({ error: 'اسم الملف مطلوب' }, { status: 400 })
    }

    const filePath = path.join(BACKUP_DIR, filename)
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 })
    }

    await unlink(filePath)

    return NextResponse.json({ success: true, message: 'تم حذف النسخة الاحتياطية' })
  } catch (error) {
    console.error('Backup deletion error:', error)
    return NextResponse.json({ error: 'حدث خطأ في حذف النسخة الاحتياطية' }, { status: 500 })
  }
}

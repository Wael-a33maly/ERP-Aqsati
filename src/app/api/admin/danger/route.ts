import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

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

// DELETE - مسح جميع البيانات
export async function DELETE(request: NextRequest) {
  const user = await checkSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { scope, companyId, confirmation } = body // scope: 'all' | 'company'

    // التحقق من كلمة التأكيد
    if (confirmation !== 'DELETE_ALL_DATA_CONFIRM') {
      return NextResponse.json({ 
        error: 'كلمة التأكيد غير صحيحة',
        hint: 'اكتب "DELETE_ALL_DATA_CONFIRM" للتأكيد'
      }, { status: 400 })
    }

    if (scope === 'company' && companyId) {
      // مسح بيانات شركة محددة فقط
      await db.$transaction([
        db.payment.deleteMany({ where: { companyId } }),
        db.invoice.deleteMany({ where: { companyId } }),
        db.customer.deleteMany({ where: { companyId } }),
        db.product.deleteMany({ where: { companyId } }),
        db.warehouse.deleteMany({ where: { companyId } }),
        db.zone.deleteMany({ where: { companyId } }),
        db.branch.deleteMany({ where: { companyId } }),
        db.companyPaymentGateway.deleteMany({ where: { companyId } }),
        db.supplier.deleteMany({ where: { companyId } }),
        db.purchaseInvoice.deleteMany({ where: { companyId } }),
        db.purchaseReturn.deleteMany({ where: { companyId } }),
        db.supplierPayment.deleteMany({ where: { companyId } }),
        db.inventoryTransfer.deleteMany({ where: { companyId } }),
        db.costLayer.deleteMany({ where: { companyId } }),
        db.inventoryValuation.deleteMany({ where: { companyId } }),
        db.user.deleteMany({ where: { companyId } }),
        db.subscription.deleteMany({ where: { companyId } }),
        db.company.delete({ where: { id: companyId } })
      ])

      return NextResponse.json({ 
        success: true, 
        message: 'تم حذف بيانات الشركة بنجاح' 
      })
    } else if (scope === 'all') {
      // مسح جميع البيانات - للسوبر أدمن فقط
      await db.$transaction([
        // حذف جميع البيانات المرتبطة أولاً
        db.payment.deleteMany(),
        db.invoice.deleteMany(),
        db.customer.deleteMany(),
        db.product.deleteMany(),
        db.warehouse.deleteMany(),
        db.zone.deleteMany(),
        db.branch.deleteMany(),
        db.companyPaymentGateway.deleteMany(),
        db.supplier.deleteMany(),
        db.purchaseInvoice.deleteMany(),
        db.purchaseReturn.deleteMany(),
        db.supplierPayment.deleteMany(),
        db.supplierTransaction.deleteMany(),
        db.inventoryTransfer.deleteMany(),
        db.costLayer.deleteMany(),
        db.inventoryValuation.deleteMany(),
        db.inventoryMovement.deleteMany(),
        db.inventory.deleteMany(),
        db.user.deleteMany(),
        db.subscription.deleteMany(),
        db.featureUsage.deleteMany(),
        db.paymentTransaction.deleteMany(),
        db.planFeature.deleteMany(),
        db.subscriptionPlan.deleteMany(),
        db.company.deleteMany(),
        db.auditLog.deleteMany(),
        db.notification.deleteMany(),
        db.registrationRequest.deleteMany(),
        // إبقاء الإعدادات الأساسية
      ])

      return NextResponse.json({ 
        success: true, 
        message: 'تم حذف جميع البيانات بنجاح. جاري إعادة تحميل الصفحة...' 
      })
    }

    return NextResponse.json({ error: 'نوع المسح غير صالح' }, { status: 400 })
  } catch (error) {
    console.error('Delete all data error:', error)
    return NextResponse.json({ 
      error: 'حدث خطأ في حذف البيانات',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

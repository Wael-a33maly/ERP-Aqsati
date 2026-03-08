import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { predefinedTemplates } from '@/lib/receipt-templates'

// GET - جلب قوالب الشركة المتاحة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    
    if (!companyId) {
      return NextResponse.json({
        success: false,
        error: 'معرف الشركة مطلوب'
      }, { status: 400 })
    }
    
    // جلب إعدادات المتجر للشركة
    const marketplaceSettings = await db.companyMarketplaceSettings.findUnique({
      where: { companyId }
    })
    
    // جلب القوالب المثبتة للشركة
    const installedTemplates = await db.companyReceiptTemplate.findMany({
      where: { 
        companyId,
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        nameAr: true,
        code: true,
        isDefault: true,
        installedFromMarketplace: true,
        paperSize: true,
        createdAt: true
      }
    })
    
    // تحديد القوالب المتاحة
    const availableTemplates: any[] = []
    
    // 1. إضافة القوالب المجانية (متاحة للجميع)
    const freeTemplates = predefinedTemplates.filter(t => t.isFree)
    freeTemplates.forEach(template => {
      // التحقق إذا كان القالب مثبتاً
      const installed = installedTemplates.find(
        t => t.installedFromMarketplace === template.id || t.code === template.id
      )
      
      availableTemplates.push({
        ...template,
        isInstalled: !!installed,
        installedId: installed?.id,
        isDefault: installed?.isDefault || false,
        owned: true // القوالب المجانية مملوكة دائماً
      })
    })
    
    // 2. إضافة القوالب المدفوعة المثبتة فقط
    const paidTemplates = predefinedTemplates.filter(t => !t.isFree)
    paidTemplates.forEach(template => {
      const installed = installedTemplates.find(
        t => t.installedFromMarketplace === template.id || t.code === template.id
      )
      
      if (installed) {
        // القالب المدفوع مثبت - متاح للاستخدام
        availableTemplates.push({
          ...template,
          isInstalled: true,
          installedId: installed.id,
          isDefault: installed.isDefault,
          owned: true
        })
      }
      // القوالب المدفوعة غير المثبتة لا تظهر في القائمة
    })
    
    // 3. إضافة القوالب المخصصة للشركة (غير من المتجر)
    const customTemplates = installedTemplates.filter(
      t => !t.installedFromMarketplace && !predefinedTemplates.find(p => p.id === t.code)
    )
    
    customTemplates.forEach(template => {
      availableTemplates.push({
        id: template.code,
        name: template.name,
        nameAr: template.nameAr || template.name,
        description: 'قالب مخصص',
        descriptionAr: 'قالب مخصص للشركة',
        category: 'custom',
        isFree: true,
        price: 0,
        rating: 0,
        downloads: 0,
        isInstalled: true,
        installedId: template.id,
        isDefault: template.isDefault,
        owned: true,
        isCustom: true,
        paperSize: template.paperSize,
        createdAt: template.createdAt
      })
    })
    
    // ترتيب القوالب: الافتراضي أولاً، ثم المثبتة، ثم حسب الفئة
    availableTemplates.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1
      if (!a.isDefault && b.isDefault) return 1
      if (a.isInstalled && !b.isInstalled) return -1
      if (!a.isInstalled && b.isInstalled) return 1
      return 0
    })
    
    return NextResponse.json({
      success: true,
      data: availableTemplates,
      meta: {
        total: availableTemplates.length,
        freeCount: freeTemplates.length,
        paidInstalledCount: paidTemplates.filter(t => 
          installedTemplates.some(i => i.installedFromMarketplace === t.id || i.code === t.id)
        ).length,
        customCount: customTemplates.length,
        canInstallPaid: marketplaceSettings?.canInstallPaid ?? false,
        canCreateCustom: marketplaceSettings?.canCreateCustom ?? true
      }
    })
    
  } catch (error) {
    console.error('Error fetching company templates:', error)
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء جلب القوالب'
    }, { status: 500 })
  }
}

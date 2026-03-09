import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// بدء جلسة دخول متخفي
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyId } = body

    console.log('[Impersonate] Request received for company:', companyId)

    // التحقق من وجود الشركة
    const company = await db.company.findUnique({
      where: { id: companyId },
      include: {
        Branch: { 
          orderBy: { isMain: 'desc' }, // الفروع الرئيسية أولاً
          take: 1 
        }
      }
    })

    if (!company) {
      console.log('[Impersonate] Company not found:', companyId)
      return NextResponse.json({ success: false, error: 'الشركة غير موجودة' }, { status: 404 })
    }

    // البحث عن فرع (أي فرع متاح)
    const mainBranch = company.Branch[0]
    
    console.log('[Impersonate] Company found:', company.name, 'Branch:', mainBranch?.name)

    // إرجاع البيانات المطلوبة للدخول المتخفي
    return NextResponse.json({ 
      success: true, 
      session: {
        companyId,
        companyName: company.name,
        branchId: mainBranch?.id,
        branchName: mainBranch?.name
      }
    })
  } catch (error) {
    console.error('[Impersonate] Error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

// إنهاء جلسة الدخول المتخفي
export async function DELETE(request: NextRequest) {
  try {
    console.log('[Impersonate] Exit request received')
    // ببساطة إرجاع نجاح - الفrontend سيتولى مسح localStorage
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Impersonate] Exit error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

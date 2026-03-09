import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// طرق الدفع المتاحة
const paymentMethods = [
  { code: 'FAWRY', name: 'فوري', nameEn: 'Fawry', icon: 'fawry' },
  { code: 'INSTAPAY', name: 'انستا باي', nameEn: 'InstaPay', icon: 'instapay' },
  { code: 'VODAFONE_CASH', name: 'فودافون كاش', nameEn: 'Vodafone Cash', icon: 'vodafone' },
  { code: 'ORANGE_MONEY', name: 'أورنج موني', nameEn: 'Orange Money', icon: 'orange' },
  { code: 'ETISALAT_CASH', name: 'اتصالات كاش', nameEn: 'Etisalat Cash', icon: 'etisalat' },
  { code: 'BANK_TRANSFER', name: 'تحويل بنكي', nameEn: 'Bank Transfer', icon: 'bank' },
  { code: 'CASH', name: 'نقدي', nameEn: 'Cash', icon: 'cash' }
]

// GET - جلب المدفوعات أو طرق الدفع
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'methods') {
      return NextResponse.json({ success: true, data: paymentMethods })
    }

    const companyId = searchParams.get('companyId')
    const subscriptionId = searchParams.get('subscriptionId')

    if (subscriptionId) {
      const payments = await db.paymentTransaction.findMany({
        where: { subscriptionId },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json({ success: true, data: payments })
    }

    if (companyId) {
      const payments = await db.paymentTransaction.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json({ success: true, data: payments })
    }

    // كل المدفوعات (للسوبر أدمن)
    const payments = await db.paymentTransaction.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ success: true, data: payments })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ success: false, error: 'فشل في جلب المدفوعات' }, { status: 500 })
  }
}

// POST - إنشاء عملية دفع جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscriptionId, companyId, amount, paymentMethod, currency = 'EGP' } = body

    // التحقق من الاشتراك
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true }
    })

    if (!subscription) {
      return NextResponse.json({ success: false, error: 'الاشتراك غير موجود' }, { status: 404 })
    }

    // إنشاء رقم مرجعي فريد
    const referenceNumber = generateReferenceNumber(paymentMethod)

    // بيانات الدفع حسب الطريقة
    let paymentData: Record<string, unknown> = {
      subscriptionId,
      companyId: companyId || subscription.companyId,
      amount: amount || subscription.finalPrice,
      currency,
      status: 'pending',
      paymentMethod,
      referenceNumber
    }

    // محاكاة بوابات الدفع المصرية
    switch (paymentMethod) {
      case 'FAWRY':
        // فوري - إنشاء رابط دفع ورقم مرجعي
        paymentData = {
          ...paymentData,
          paymentUrl: `https://www.fawry.com/pay/${referenceNumber}`,
          qrCode: `fawry://pay/${referenceNumber}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 ساعة
          metadata: JSON.stringify({
            merchantCode: 'ERP_SAAS',
            merchantRefNum: referenceNumber,
            paymentMethod: 'PAYATFAWRY'
          })
        }
        break

      case 'INSTAPAY':
        // انستا باي - رابط للدفع
        paymentData = {
          ...paymentData,
          paymentUrl: `https://ipn.instapay.com.sa/pay/${referenceNumber}`,
          metadata: JSON.stringify({
            iban: 'SA0380000000000000000000',
            accountName: 'ERP SAAS'
          })
        }
        break

      case 'VODAFONE_CASH':
        // فودافون كاش - رقم محفظة
        paymentData = {
          ...paymentData,
          metadata: JSON.stringify({
            walletNumber: '01012345678',
            instructions: 'قم بالتحويل على المحفظة ثم أرسل إيصال التحويل'
          })
        }
        break

      case 'ORANGE_MONEY':
        paymentData = {
          ...paymentData,
          metadata: JSON.stringify({
            walletNumber: '01212345678',
            instructions: 'قم بالتحويل على المحفظة ثم أرسل إيصال التحويل'
          })
        }
        break

      case 'ETISALAT_CASH':
        paymentData = {
          ...paymentData,
          metadata: JSON.stringify({
            walletNumber: '01112345678',
            instructions: 'قم بالتحويل على المحفظة ثم أرسل إيصال التحويل'
          })
        }
        break

      case 'BANK_TRANSFER':
        paymentData = {
          ...paymentData,
          metadata: JSON.stringify({
            bankName: 'البنك الأهلي المصري',
            accountNumber: '1234567890123456',
            iban: 'EG3800020001234567890123456',
            accountName: 'ERP SAAS Company',
            instructions: 'قم بالتحويل البنكي وأرسل إيصال التحويل'
          })
        }
        break

      case 'CASH':
        // الدفع النقدي - يحتاج تأكيد من الإدارة
        paymentData = {
          ...paymentData,
          status: 'pending',
          notes: 'الدفع النقدي - في انتظار التأكيد من الإدارة'
        }
        break
    }

    const payment = await db.paymentTransaction.create({ data: paymentData })

    return NextResponse.json({ 
      success: true, 
      data: payment,
      message: getPaymentInstructions(paymentMethod, paymentData.metadata as string, referenceNumber)
    })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ success: false, error: 'فشل في إنشاء عملية الدفع' }, { status: 500 })
  }
}

// PUT - تحديث حالة الدفع (تأكيد الدفع)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, transactionId, notes } = body

    if (action === 'confirm') {
      // تأكيد الدفع
      const payment = await db.paymentTransaction.update({
        where: { id },
        data: {
          status: 'completed',
          transactionId,
          paidAt: new Date(),
          notes
        }
      })

      // تحديث حالة الاشتراك
      await db.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // شهر
        }
      })

      // تحديث حالة الشركة
      await db.company.update({
        where: { id: payment.companyId },
        data: { subscriptionStatus: 'active' }
      })

      return NextResponse.json({ success: true, data: payment, message: 'تم تأكيد الدفع وتفعيل الاشتراك' })
    }

    if (action === 'reject') {
      const payment = await db.paymentTransaction.update({
        where: { id },
        data: {
          status: 'failed',
          notes
        }
      })
      return NextResponse.json({ success: true, data: payment, message: 'تم رفض عملية الدفع' })
    }

    if (action === 'refund') {
      const payment = await db.paymentTransaction.update({
        where: { id },
        data: {
          status: 'refunded',
          notes
        }
      })
      return NextResponse.json({ success: true, data: payment, message: 'تم استرداد المبلغ' })
    }

    // تحديث عادي
    const payment = await db.paymentTransaction.update({
      where: { id },
      data: { ...body, updatedAt: new Date() }
    })

    return NextResponse.json({ success: true, data: payment })
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json({ success: false, error: 'فشل في تحديث عملية الدفع' }, { status: 500 })
  }
}

// توليد رقم مرجعي
function generateReferenceNumber(method: string): string {
  const prefix = method.substring(0, 3).toUpperCase()
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

// تعليمات الدفع
function getPaymentInstructions(method: string, metadata: string | undefined, refNumber: string): string {
  try {
    const data = metadata ? JSON.parse(metadata) : {}
    
    switch (method) {
      case 'FAWRY':
        return `للدفع عبر فوري:\n1. اذهب لأقرب منفذ فوري\n2. اختر "خدمات الدفع الإلكتروني"\n3. أدخل الرقم المرجعي: ${refNumber}\n4. ادفع المبلغ المطلوب\n5. احتفظ بالإيصال`
      
      case 'INSTAPAY':
        return `للدفع عبر انستا باي:\n1. افتح تطبيق انستا باي\n2. اضغط على رابط الدفع المرسل\n3. أكد عملية الدفع\nالرقم المرجعي: ${refNumber}`
      
      case 'VODAFONE_CASH':
        return `للدفع عبر فودافون كاش:\n1. افتح تطبيق أنا فودافون\n2. اختر فودافون كاش\n3. حول المبلغ على الرقم: ${data.walletNumber}\n4. احتفظ بإيصال التحويل\nالرقم المرجعي: ${refNumber}`
      
      case 'ORANGE_MONEY':
        return `للدفع عبر أورنج موني:\n1. افتح تطبيق أورنج\n2. اختر أورنج موني\n3. حول المبلغ على الرقم: ${data.walletNumber}\n4. احتفظ بإيصال التحويل\nالرقم المرجعي: ${refNumber}`
      
      case 'ETISALAT_CASH':
        return `للدفع عبر اتصالات كاش:\n1. افتح تطبيق أنا اتصالات\n2. اختر اتصالات كاش\n3. حول المبلغ على الرقم: ${data.walletNumber}\n4. احتفظ بإيصال التحويل\nالرقم المرجعي: ${refNumber}`
      
      case 'BANK_TRANSFER':
        return `للدفع عبر التحويل البنكي:\nالبنك: ${data.bankName}\nرقم الحساب: ${data.accountNumber}\nIBAN: ${data.iban}\nاسم الحساب: ${data.accountName}\nالرقم المرجعي: ${refNumber}`
      
      default:
        return `الرقم المرجعي: ${refNumber}`
    }
  } catch {
    return `الرقم المرجعي: ${refNumber}`
  }
}

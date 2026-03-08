import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { applyRateLimit } from '@/lib/rate-limit'

// Simple in-memory chat history (per server instance)
const chatHistories = new Map<string, any[]>()

// Predefined responses for the ERP system
const Responses: Record<string, string[]> = {
  greeting: [
    'مرحباً بك في نظام ERP أقساطي! كيف يمكنني مساعدتك اليوم؟',
    'أهلاً وسهلاً! أنا المساعد الذكي، جاهز لخدمتك.',
  ],
  help: [
    `يمكنني مساعدتك في:
• الاستعلام عن الفواتير والمدفوعات
• البحث عن العملاء والمنتجات
• متابعة حالة الأقساط
• إنشاء التقارير
• الإجابة على أسئلتك حول النظام`,
  ],
  invoice: [
    'للاستعلام عن فاتورة، يرجى تزويدي برقم الفاتورة أو اسم العميل.',
    'يمكنك البحث عن الفواتير من خلال رقم الفاتورة أو رقم هاتف العميل.',
  ],
  customer: [
    'للبحث عن عميل، يرجى تزويدي بالاسم أو رقم الهاتف.',
    'يمكنك العثور على العميل من خلال البحث بالاسم أو رقم الاتصال.',
  ],
  payment: [
    'يمكنك متابعة حالة المدفوعات من قسم "المدفوعات" في القائمة الجانبية.',
  ],
  installment: [
    'لمتابعة الأقساط، يمكنك الدخول لقسم "الأقساط" من القائمة الجانبية.',
  ],
  unknown: [
    'عذراً، لم أفهم طلبك. هل يمكنك إعادة صياغته؟',
    'أعتذر، يرجى توضيح طلبك لأتمكن من مساعدتك.',
  ],
}

// Analyze intent from message
function analyzeIntent(message: string): string {
  const lower = message.toLowerCase()
  
  if (/مرحبا|السلام|صباح|مساء|أهلا/.test(lower)) return 'greeting'
  if (/مساعدة|ساعدني|كيف/.test(lower)) return 'help'
  if (/فاتورة|فواتير/.test(lower)) return 'invoice'
  if (/عميل|عملاء/.test(lower)) return 'customer'
  if (/دفعة|مدفوعات|تحصيل|سداد/.test(lower)) return 'payment'
  if (/قسط|أقساط/.test(lower)) return 'installment'
  
  return 'unknown'
}

// Get random response
function getResponse(intent: string): string {
  const responses = Responses[intent] || Responses.unknown
  return responses[Math.floor(Math.random() * responses.length)]
}

// POST - Send message to AI assistant
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const user = await getCurrentUser()
    const userId = user?.id || 'anonymous'

    const body = await request.json()
    const { message, clearHistory } = body

    if (!message) {
      return NextResponse.json({ error: 'الرسالة مطلوبة' }, { status: 400 })
    }

    // Get or create history
    if (!chatHistories.has(userId)) {
      chatHistories.set(userId, [])
    }
    const history = chatHistories.get(userId)!

    if (clearHistory) {
      history.length = 0
    }

    // Add user message to history
    history.push({ role: 'user', content: message, timestamp: new Date() })

    // Analyze and respond
    const intent = analyzeIntent(message)
    const response = getResponse(intent)

    // Add assistant message to history
    history.push({ role: 'assistant', content: response, timestamp: new Date() })

    return NextResponse.json({
      success: true,
      data: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        intent,
      },
      suggestions: [
        'كيف أضيف فاتورة جديدة؟',
        'بحث عن عميل',
        'حالة الأقساط المتأخرة',
        'تقرير المبيعات',
      ],
    })
  } catch (error: any) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في معالجة الرسالة' },
      { status: 500 }
    )
  }
}

// GET - Get chat history
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const userId = user?.id || 'anonymous'

    const history = chatHistories.get(userId) || []

    return NextResponse.json({
      success: true,
      data: {
        history,
        suggestions: [
          'كيف أضيف فاتورة جديدة؟',
          'بحث عن عميل',
          'حالة الأقساط المتأخرة',
          'تقرير المبيعات',
        ],
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'حدث خطأ في جلب المحادثة' },
      { status: 500 }
    )
  }
}

// DELETE - Clear history
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const userId = user?.id || 'anonymous'

    chatHistories.delete(userId)

    return NextResponse.json({
      success: true,
      message: 'تم مسح تاريخ المحادثة',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    )
  }
}

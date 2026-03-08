// نظام الذكاء الاصطناعي للدعم والمساعدة
// AI Support Chatbot

import { VLM } from 'z-ai-web-dev-sdk'

// أنواع الرسائل
interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    intent?: string
    entities?: Record<string, any>
    confidence?: number
  }
}

// سياق المحادثة
interface ChatContext {
  userId?: string
  companyId?: string
  branchId?: string
  userRole?: string
  conversationHistory: ChatMessage[]
  currentIntent?: string
  extractedData?: Record<string, any>
}

// نوايا المستخدم
const UserIntents = {
  GREETING: 'greeting',
  HELP: 'help',
  INVOICE_QUERY: 'invoice_query',
  CUSTOMER_QUERY: 'customer_query',
  PRODUCT_QUERY: 'product_query',
  PAYMENT_STATUS: 'payment_status',
  INSTALLMENT_QUERY: 'installment_query',
  REPORT_REQUEST: 'report_request',
  COMPLAINT: 'complaint',
  UNKNOWN: 'unknown',
} as const

// ردود مسبقة
const PredefinedResponses: Record<string, string[]> = {
  greeting: [
    'مرحباً بك في نظام ERP أقساطي! كيف يمكنني مساعدتك اليوم؟',
    'أهلاً وسهلاً! أنا المساعد الذكي، جاهز لخدمتك.',
    'مرحباً! أنا هنا لمساعدتك في أي استفسار.',
  ],
  help: [
    `يمكنني مساعدتك في:
• الاستعلام عن الفواتير والمدفوعات
• البحث عن العملاء والمنتجات
• متابعة حالة الأقساط
• إنشاء التقارير
• الإجابة على أسئلتك حول النظام

ما الذي تحتاج مساعدة فيه؟`,
  ],
  invoice_query: [
    'للاستعلام عن فاتورة، يرجى تزويدي برقم الفاتورة أو اسم العميل.',
    'يمكنك البحث عن الفواتير من خلال رقم الفاتورة أو رقم هاتف العميل.',
  ],
  customer_query: [
    'للبحث عن عميل، يرجى تزويدي بالاسم أو رقم الهاتف أو كود العميل.',
    'يمكنك العثور على العميل من خلال البحث بالاسم أو رقم الاتصال.',
  ],
  payment_status: [
    'يمكنك متابعة حالة المدفوعات من قسم "المدفوعات" في القائمة الجانبية.',
    'للاستعلام عن حالة دفعة معينة، يرجى تزويدي برقم العملية أو رقم الفاتورة.',
  ],
  installment_query: [
    'لمتابعة الأقساط، يمكنك الدخول لقسم "الأقساط" من القائمة الجانبية.',
    'للاستعلام عن قسط معين، يرجى تزويدي برقم العقد أو اسم العميل.',
  ],
  report_request: [
    `يمكنني مساعدتك في إنشاء تقارير متنوعة:
• تقارير المبيعات
• تقارير التحصيل
• تقارير المخزون
• تقارير العمولات

أي تقرير تريد إنشاؤه؟`,
  ],
  complaint: [
    'أنا آسف لسماع ذلك. يرجى وصف المشكلة بالتفصيل وسأحاول مساعدتك.',
    'شكراً لإبلاغنا. يرجى تزويدي بتفاصيل المشكلة لمساعدتك بشكل أفضل.',
  ],
  unknown: [
    'عذراً، لم أفهم طلبك بشكل واضح. هل يمكنك إعادة صياغته؟',
    'لم أتمكن من فهم سؤالك. هل يمكنك توضيح المزيد؟',
    'أعتذر، يرجى توضيح طلبك لأتمكن من مساعدتك.',
  ],
}

// تحليل نية المستخدم
function analyzeIntent(message: string): { intent: string; confidence: number; entities: Record<string, any> } {
  const lowerMessage = message.toLowerCase()
  
  // كلمات مفتاحية لكل نية
  const intentKeywords: Record<string, { keywords: string[]; entities?: string[] }> = {
    greeting: {
      keywords: ['مرحبا', 'السلام', 'صباح الخير', 'مساء الخير', 'أهلا', 'هاي', 'هلا'],
    },
    help: {
      keywords: ['مساعدة', 'ساعدني', 'كيف', 'ماذا', 'شرح', 'دليل'],
    },
    invoice_query: {
      keywords: ['فاتورة', 'فواتير', 'رقم الفاتورة', 'حالة الفاتورة'],
    },
    customer_query: {
      keywords: ['عميل', 'عملاء', 'بحث عن عميل', 'بيانات العميل'],
    },
    product_query: {
      keywords: ['منتج', 'منتجات', 'سلعة', 'بضاعة', 'مخزون'],
    },
    payment_status: {
      keywords: ['دفعة', 'مدفوعات', 'تحصيل', 'سداد', 'دفع'],
    },
    installment_query: {
      keywords: ['قسط', 'أقساط', 'جدولة', 'قسط شهري', 'عقد'],
    },
    report_request: {
      keywords: ['تقرير', 'تقارير', 'إحصائيات', 'تحليل'],
    },
    complaint: {
      keywords: ['شكوى', 'مشكلة', 'خطأ', 'عطل', 'لا يعمل', 'مشكلة في'],
    },
  }

  let bestMatch = { intent: UserIntents.UNKNOWN, confidence: 0, entities: {} }

  for (const [intent, data] of Object.entries(intentKeywords)) {
    let matchCount = 0
    for (const keyword of data.keywords) {
      if (lowerMessage.includes(keyword)) {
        matchCount++
      }
    }
    
    const confidence = matchCount / data.keywords.length
    if (confidence > bestMatch.confidence) {
      bestMatch = { intent, confidence, entities: {} }
    }
  }

  return bestMatch
}

// استخراج الكيانات من الرسالة
function extractEntities(message: string): Record<string, any> {
  const entities: Record<string, any> = {}

  // استخراج أرقام الهواتف
  const phoneMatch = message.match(/(05\d{8}|5\d{8})/)
  if (phoneMatch) {
    entities.phone = phoneMatch[0]
  }

  // استخراج أرقام الفواتير
  const invoiceMatch = message.match(/INV-\d+/i)
  if (invoiceMatch) {
    entities.invoiceNumber = invoiceMatch[0]
  }

  // استخراج أرقام العقود
  const contractMatch = message.match(/CONT-\d+/i)
  if (contractMatch) {
    entities.contractNumber = contractMatch[0]
  }

  // استخراج المبالغ
  const amountMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:ريال|ر\.س|sar)/i)
  if (amountMatch) {
    entities.amount = parseFloat(amountMatch[1])
  }

  return entities
}

// اختيار رد عشوائي من القائمة
function selectRandomResponse(responses: string[]): string {
  return responses[Math.floor(Math.random() * responses.length)]
}

// معالجة رسالة المستخدم
export async function processMessage(
  message: string,
  context: ChatContext
): Promise<ChatMessage> {
  // تحليل النية
  const { intent, confidence, entities } = analyzeIntent(message)
  const extractedEntities = extractEntities(message)

  // تحديث السياق
  context.currentIntent = intent
  context.extractedData = { ...extractedEntities, ...entities }

  // الحصول على الرد المناسب
  const responses = PredefinedResponses[intent] || PredefinedResponses.unknown
  let response = selectRandomResponse(responses)

  // تخصيص الرد حسب الكيانات المستخرجة
  if (extractedEntities.phone) {
    response += `\n\nلقد حددت رقم الهاتف: ${extractedEntities.phone}`
  }
  if (extractedEntities.invoiceNumber) {
    response += `\n\nرقم الفاتورة: ${extractedEntities.invoiceNumber}`
  }

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: response,
    timestamp: new Date(),
    metadata: {
      intent,
      entities: extractedEntities,
      confidence,
    },
  }
}

// مساعد ذكي متقدم (يستخدم VLM إذا كان متاحاً)
export class AIAssistant {
  private context: ChatContext
  private vlmClient: VLM | null = null

  constructor(context?: Partial<ChatContext>) {
    this.context = {
      conversationHistory: [],
      ...context,
    }

    // محاولة إنشاء عميل VLM
    try {
      if (process.env.VLM_API_KEY) {
        this.vlmClient = new VLM({ apiKey: process.env.VLM_API_KEY })
      }
    } catch (e) {
      console.log('[AI] VLM not available, using rule-based responses')
    }
  }

  // إرسال رسالة للمستخدم
  async sendMessage(message: string): Promise<ChatMessage> {
    // إضافة رسالة المستخدم للتاريخ
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    }
    this.context.conversationHistory.push(userMessage)

    // معالجة الرسالة
    const response = await processMessage(message, this.context)
    this.context.conversationHistory.push(response)

    return response
  }

  // الحصول على تاريخ المحادثة
  getHistory(): ChatMessage[] {
    return this.context.conversationHistory
  }

  // مسح تاريخ المحادثة
  clearHistory(): void {
    this.context.conversationHistory = []
  }

  // الحصول على اقتراحات سريعة
  getQuickSuggestions(): string[] {
    return [
      'كيف أضيف فاتورة جديدة؟',
      'بحث عن عميل',
      'حالة الأقساط المتأخرة',
      'تقرير المبيعات الشهري',
      'كيفية إضافة منتج جديد',
    ]
  }
}

// إنشاء مساعد افتراضي
export const aiAssistant = new AIAssistant()

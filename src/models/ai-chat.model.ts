// ============================================
// AI Chat Model - نموذج الدردشة الذكية
// ============================================

export type ChatRole = 'user' | 'assistant'
export type ChatIntent = 'greeting' | 'help' | 'invoice' | 'customer' | 'payment' | 'installment' | 'unknown'

export interface ChatMessage {
  role: ChatRole
  content: string
  timestamp: Date
}

export interface ChatHistory {
  messages: ChatMessage[]
}

// Input Types
export interface SendChatMessageInput {
  message: string
  clearHistory?: boolean
}

// Response Types
export interface ChatMessageResponse {
  id: string
  role: ChatRole
  content: string
  timestamp: Date
  intent: ChatIntent
}

export interface ChatResponse {
  success: boolean
  data: ChatMessageResponse
  suggestions: string[]
}

export interface ChatHistoryResponse {
  success: boolean
  data: {
    history: ChatMessage[]
    suggestions: string[]
  }
}

// Predefined Responses
export const ChatResponses: Record<ChatIntent, string[]> = {
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

export const DefaultSuggestions = [
  'كيف أضيف فاتورة جديدة؟',
  'بحث عن عميل',
  'حالة الأقساط المتأخرة',
  'تقرير المبيعات',
]

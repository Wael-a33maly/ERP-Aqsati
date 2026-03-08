// ============================================
// AI Chat Service - خدمة الدردشة الذكية
// ============================================

import { aiChatRepository } from '@/repositories/ai-chat.repository'
import { 
  SendChatMessageInput, 
  ChatResponse, 
  ChatHistoryResponse,
  ChatResponses,
  DefaultSuggestions,
  ChatIntent
} from '@/models/ai-chat.model'

export const aiChatService = {
  // إرسال رسالة
  async sendMessage(userId: string, input: SendChatMessageInput): Promise<ChatResponse> {
    // إنشاء تاريخ إذا لم يكن موجوداً
    aiChatRepository.createHistory(userId)

    // مسح التاريخ إذا طُلب
    if (input.clearHistory) {
      aiChatRepository.clearHistory(userId)
    }

    // إضافة رسالة المستخدم للتاريخ
    aiChatRepository.addMessage(userId, {
      role: 'user',
      content: input.message,
      timestamp: new Date(),
    })

    // تحليل الهدف والرد
    const intent = this.analyzeIntent(input.message)
    const response = this.getResponse(intent)

    // إضافة رد المساعد للتاريخ
    aiChatRepository.addMessage(userId, {
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    })

    return {
      success: true,
      data: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        intent,
      },
      suggestions: DefaultSuggestions,
    }
  },

  // جلب تاريخ المحادثة
  async getHistory(userId: string): Promise<ChatHistoryResponse> {
    const history = aiChatRepository.getHistory(userId)

    return {
      success: true,
      data: {
        history,
        suggestions: DefaultSuggestions,
      },
    }
  },

  // مسح تاريخ المحادثة
  async clearHistory(userId: string) {
    aiChatRepository.clearHistory(userId)

    return {
      success: true,
      message: 'تم مسح تاريخ المحادثة',
    }
  },

  // تحليل الهدف من الرسالة
  analyzeIntent(message: string): ChatIntent {
    const lower = message.toLowerCase()

    if (/مرحبا|السلام|صباح|مساء|أهلا/.test(lower)) return 'greeting'
    if (/مساعدة|ساعدني|كيف/.test(lower)) return 'help'
    if (/فاتورة|فواتير/.test(lower)) return 'invoice'
    if (/عميل|عملاء/.test(lower)) return 'customer'
    if (/دفعة|مدفوعات|تحصيل|سداد/.test(lower)) return 'payment'
    if (/قسط|أقساط/.test(lower)) return 'installment'

    return 'unknown'
  },

  // الحصول على رد عشوائي
  getResponse(intent: ChatIntent): string {
    const responses = ChatResponses[intent] || ChatResponses.unknown
    return responses[Math.floor(Math.random() * responses.length)]
  },
}

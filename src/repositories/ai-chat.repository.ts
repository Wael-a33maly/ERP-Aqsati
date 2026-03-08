// ============================================
// AI Chat Repository - مستودع الدردشة الذكية
// ============================================

import { db } from '@/lib/db'
import { ChatMessage } from '@/models/ai-chat.model'

// In-memory storage for chat histories (per server instance)
const chatHistories = new Map<string, ChatMessage[]>()

export const aiChatRepository = {
  // جلب تاريخ المحادثة
  getHistory(userId: string): ChatMessage[] {
    return chatHistories.get(userId) || []
  },

  // إنشاء تاريخ محادثة جديد
  createHistory(userId: string): void {
    if (!chatHistories.has(userId)) {
      chatHistories.set(userId, [])
    }
  },

  // إضافة رسالة للتاريخ
  addMessage(userId: string, message: ChatMessage): void {
    const history = this.getHistory(userId)
    history.push(message)
    chatHistories.set(userId, history)
  },

  // مسح تاريخ المحادثة
  clearHistory(userId: string): void {
    chatHistories.delete(userId)
  },

  // التحقق من وجود تاريخ
  hasHistory(userId: string): boolean {
    return chatHistories.has(userId)
  },
}

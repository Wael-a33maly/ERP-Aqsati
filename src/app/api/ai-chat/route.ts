import { NextRequest, NextResponse } from 'next/server'
import { aiChatController } from '@/controllers/ai-chat.controller'

// POST - إرسال رسالة للمساعد الذكي
export async function POST(request: NextRequest) {
  return aiChatController.sendMessage(request)
}

// GET - جلب تاريخ المحادثة
export async function GET(request: NextRequest) {
  return aiChatController.getHistory(request)
}

// DELETE - مسح تاريخ المحادثة
export async function DELETE(request: NextRequest) {
  return aiChatController.clearHistory(request)
}

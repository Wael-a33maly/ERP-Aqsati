import { NextRequest, NextResponse } from 'next/server'
import { notificationController } from '@/controllers/notification.controller'

// GET - الحصول على إشعارات المستخدم
export async function GET(request: NextRequest) {
  return notificationController.getNotifications(request)
}

// POST - إنشاء إشعار جديد
export async function POST(request: NextRequest) {
  return notificationController.createNotification(request)
}

// PUT - تحديث الإشعارات (تحديد كمقروء)
export async function PUT(request: NextRequest) {
  return notificationController.updateNotifications(request)
}

// DELETE - حذف إشعار
export async function DELETE(request: NextRequest) {
  return notificationController.deleteNotification(request)
}

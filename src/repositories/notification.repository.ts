// ============================================
// Notification Repository - مستودع الإشعارات
// ============================================

import { db } from '@/lib/db'
import { 
  NotificationQueryParams, 
  CreateNotificationInput,
  Notification 
} from '@/models/notification.model'

export const notificationRepository = {
  // الحصول على إشعارات المستخدم
  async findMany(params: NotificationQueryParams): Promise<Notification[]> {
    const where: any = {}
    
    if (params.userId) where.userId = params.userId
    if (params.unreadOnly) where.isRead = false
    if (params.type) where.type = params.type
    if (params.priority) where.priority = params.priority

    return db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params.limit || 50,
    })
  },

  // عدد الإشعارات غير المقروءة
  async countUnread(userId: string): Promise<number> {
    return db.notification.count({
      where: { 
        userId, 
        isRead: false 
      },
    })
  },

  // التحقق من وجود إشعارات عاجلة
  async hasUrgentUnread(userId: string): Promise<boolean> {
    const count = await db.notification.count({
      where: { 
        userId, 
        isRead: false,
        priority: 'urgent'
      },
    })
    return count > 0
  },

  // إنشاء إشعار جديد
  async create(data: CreateNotificationInput): Promise<Notification> {
    return db.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority || 'medium',
        link: data.link || null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    })
  },

  // تحديد إشعارات كمقروءة
  async markAsRead(userId: string, notificationIds: string[]): Promise<number> {
    const result = await db.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
    return result.count
  },

  // تحديد جميع الإشعارات كمقروءة
  async markAllAsRead(userId: string): Promise<number> {
    const result = await db.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
    return result.count
  },

  // حذف إشعار
  async delete(userId: string, id: string): Promise<boolean> {
    const result = await db.notification.deleteMany({
      where: {
        id,
        userId,
      },
    })
    return result.count > 0
  },
}

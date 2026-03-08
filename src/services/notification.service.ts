// ============================================
// Notification Service - خدمة الإشعارات
// ============================================

import { notificationRepository } from '@/repositories/notification.repository'
import { 
  NotificationQueryParams,
  CreateNotificationInput,
  UpdateNotificationInput,
  NotificationListResponse,
  NotificationBadgeResponse
} from '@/models/notification.model'

export const notificationService = {
  // الحصول على إشعارات المستخدم
  async getNotifications(userId: string, params: NotificationQueryParams): Promise<NotificationListResponse> {
    const [notifications, unreadCount] = await Promise.all([
      notificationRepository.findMany({ ...params, userId }),
      notificationRepository.countUnread(userId),
    ])

    return {
      notifications,
      unreadCount,
    }
  },

  // الحصول على عدد الإشعارات غير المقروءة
  async getBadge(userId: string): Promise<NotificationBadgeResponse> {
    const [unreadCount, hasUrgent] = await Promise.all([
      notificationRepository.countUnread(userId),
      notificationRepository.hasUrgentUnread(userId),
    ])

    return {
      unreadCount,
      hasUrgent,
    }
  },

  // إنشاء إشعار جديد
  async createNotification(data: CreateNotificationInput) {
    return notificationRepository.create(data)
  },

  // تحديث الإشعارات (تحديد كمقروء)
  async updateNotifications(userId: string, data: UpdateNotificationInput) {
    if (data.markAllAsRead) {
      const count = await notificationRepository.markAllAsRead(userId)
      return {
        success: true,
        message: 'تم تحديد جميع الإشعارات كمقروءة',
        count,
      }
    }

    if (data.notificationIds && Array.isArray(data.notificationIds)) {
      const count = await notificationRepository.markAsRead(userId, data.notificationIds)
      return {
        success: true,
        message: 'تم تحديد الإشعارات كمقروءة',
        count,
      }
    }

    return {
      success: false,
      message: 'بيانات غير صالحة',
    }
  },

  // حذف إشعار
  async deleteNotification(userId: string, id: string) {
    const deleted = await notificationRepository.delete(userId, id)
    
    if (deleted) {
      return {
        success: true,
        message: 'تم حذف الإشعار',
      }
    }

    return {
      success: false,
      message: 'الإشعار غير موجود',
    }
  },
}

/**
 * Notification Repository
 * مستودع بيانات الإشعارات
 */

import { db } from '@/lib/db'
import type { NotificationQueryParams, NotificationInput } from '@/models/notification.model'

export const notificationRepository = {
  async findNotifications(params: NotificationQueryParams) {
    const { page = 1, limit = 20, userId, type, read } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (userId) where.userId = userId
    if (type) where.type = type
    if (read !== undefined) where.read = read

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      db.notification.count({ where })
    ])

    return { data: notifications, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  },

  async findNotificationById(id: string) {
    return db.notification.findUnique({
      where: { id }
    })
  },

  async createNotification(data: NotificationInput) {
    return db.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        titleAr: data.titleAr,
        message: data.message,
        messageAr: data.messageAr,
        type: data.type,
        link: data.link,
        data: data.data || {},
        read: false
      }
    })
  },

  async markAsRead(id: string) {
    return db.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() }
    })
  },

  async markAllAsRead(userId: string) {
    return db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() }
    })
  },

  async getUnreadCount(userId: string) {
    return db.notification.count({
      where: { userId, read: false }
    })
  },

  async deleteNotification(id: string) {
    return db.notification.delete({
      where: { id }
    })
  },

  async deleteOldNotifications(daysOld: number = 30) {
    const date = new Date()
    date.setDate(date.getDate() - daysOld)

    return db.notification.deleteMany({
      where: {
        createdAt: { lt: date },
        read: true
      }
    })
  }
}

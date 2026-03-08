/**
 * Notification Model
 * نماذج الإشعارات
 */

export interface NotificationQueryParams {
  page?: number
  limit?: number
  userId?: string
  type?: string
  read?: boolean
}

export interface NotificationInput {
  userId: string
  title: string
  titleAr?: string
  message: string
  messageAr?: string
  type: string
  link?: string
  data?: any
}

export interface NotificationBadge {
  unread: number
  total: number
}

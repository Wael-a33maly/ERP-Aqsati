// ============================================
// Notification Model - نموذج الإشعارات
// ============================================

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  isRead: boolean
  readAt: Date | null
  link: string | null
  metadata: string | null
  createdAt: Date
}

export type NotificationType = 
  | 'info'
  | 'warning'
  | 'error'
  | 'success'
  | 'payment'
  | 'installment'
  | 'invoice'
  | 'system'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

// Query Parameters
export interface NotificationQueryParams {
  unreadOnly?: boolean
  limit?: number
  type?: NotificationType
  priority?: NotificationPriority
  userId?: string
}

// Input Types
export interface CreateNotificationInput {
  userId: string
  title: string
  message: string
  type: NotificationType
  priority?: NotificationPriority
  link?: string
  metadata?: Record<string, any>
}

export interface UpdateNotificationInput {
  notificationIds?: string[]
  markAllAsRead?: boolean
}

// Response Types
export interface NotificationListResponse {
  notifications: Notification[]
  unreadCount: number
}

export interface NotificationBadgeResponse {
  unreadCount: number
  hasUrgent: boolean
}

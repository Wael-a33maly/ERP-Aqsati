// نظام الإشعارات الذكية
import { db } from '@/lib/db'

// أنواع الإشعارات
export const NotificationTypes = {
  PAYMENT_RECEIVED: 'payment',
  INVOICE_CREATED: 'invoice',
  CUSTOMER_NEW: 'customer',
  INSTALLMENT_DUE: 'installment_due',
  INSTALLMENT_OVERDUE: 'installment_overdue',
  LOW_STOCK: 'low_stock',
  RETURN_REQUEST: 'return',
  COMMISSION_EARNED: 'commission',
  SYSTEM_ALERT: 'system',
  TASK_ASSIGNED: 'task',
} as const

// أولوية الإشعارات
export const NotificationPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const

// إنشاء إشعار
export async function createNotification(data: {
  userId: string
  title: string
  message: string
  type: string
  priority?: string
  link?: string
  data?: any
}): Promise<void> {
  try {
    await db.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link,
        isRead: false,
      },
    })
  } catch (error) {
    console.error('Create notification error:', error)
  }
}

// إنشاء إشعارات لعدة مستخدمين
export async function notifyUsers(userIds: string[], data: {
  title: string
  message: string
  type: string
  link?: string
}): Promise<void> {
  try {
    await db.notification.createMany({
      data: userIds.map(userId => ({
        id: crypto.randomUUID(),
        userId,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link,
        isRead: false,
      })),
    })
  } catch (error) {
    console.error('Notify users error:', error)
  }
}

// إشعارات الأقساط المستحقة
export async function checkDueInstallments(): Promise<void> {
  try {
    const today = new Date()
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    
    // الأقساط المستحقة خلال 3 أيام
    const dueInstallments = await db.installment.findMany({
      where: {
        status: 'pending',
        dueDate: {
          gte: today,
          lte: threeDaysFromNow,
        },
      },
      include: {
        InstallmentContract: {
          include: {
            Customer: true,
            User: true,
          },
        },
      },
    })
    
    for (const installment of dueInstallments) {
      const contract = installment.InstallmentContract
      const agent = contract.User
      
      if (agent) {
        await createNotification({
          userId: agent.id,
          title: 'قسط مستحق قريباً',
          message: `القسط رقم ${installment.installmentNumber} للعميل ${contract.Customer.name} مستحق في ${installment.dueDate.toLocaleDateString('ar-SA')}`,
          type: NotificationTypes.INSTALLMENT_DUE,
          priority: NotificationPriority.HIGH,
          link: `/installments/${contract.id}`,
        })
      }
    }
    
    // الأقساط المتأخرة
    const overdueInstallments = await db.installment.findMany({
      where: {
        status: 'pending',
        dueDate: {
          lt: today,
        },
      },
      include: {
        InstallmentContract: {
          include: {
            Customer: true,
            User: true,
          },
        },
      },
    })
    
    for (const installment of overdueInstallments) {
      const contract = installment.InstallmentContract
      const agent = contract.User
      
      if (agent) {
        await createNotification({
          userId: agent.id,
          title: 'قسط متأخر',
          message: `القسط رقم ${installment.installmentNumber} للعميل ${contract.Customer.name} متأخر منذ ${installment.dueDate.toLocaleDateString('ar-SA')}`,
          type: NotificationTypes.INSTALLMENT_OVERDUE,
          priority: NotificationPriority.URGENT,
          link: `/installments/${contract.id}`,
        })
      }
    }
  } catch (error) {
    console.error('Check due installments error:', error)
  }
}

// إشعارات انخفاض المخزون
export async function checkLowStock(): Promise<void> {
  try {
    const lowStockItems = await db.inventory.findMany({
      where: {
        quantity: {
          lte: db.inventory.fields.minQuantity,
        },
      },
      include: {
        Product: true,
        Warehouse: true,
      },
    })
    
    // الحصول على المديرين
    const managers = await db.user.findMany({
      where: {
        role: { in: ['COMPANY_ADMIN', 'BRANCH_MANAGER'] },
        active: true,
      },
    })
    
    for (const item of lowStockItems) {
      await notifyUsers(
        managers.map(m => m.id),
        {
          title: 'تنبيه انخفاض المخزون',
          message: `المنتج "${item.Product.name}" في ${item.Warehouse.name} وصل للحد الأدنى (${item.quantity} متبقي)`,
          type: NotificationTypes.LOW_STOCK,
        }
      )
    }
  } catch (error) {
    console.error('Check low stock error:', error)
  }
}

// إشعار استلام دفعة
export async function notifyPaymentReceived(data: {
  customerId: string
  amount: number
  invoiceNumber: string
  agentId?: string
}): Promise<void> {
  try {
    const customer = await db.customer.findUnique({
      where: { id: data.customerId },
    })
    
    if (data.agentId) {
      await createNotification({
        userId: data.agentId,
        title: 'تم استلام دفعة',
        message: `تم استلام دفعة بقيمة ${data.amount} ريال من العميل ${customer?.name} للفاتورة ${data.invoiceNumber}`,
        type: NotificationTypes.PAYMENT_RECEIVED,
        link: `/payments`,
      })
    }
  } catch (error) {
    console.error('Notify payment received error:', error)
  }
}

// إشعار فاتورة جديدة
export async function notifyInvoiceCreated(data: {
  customerId: string
  invoiceNumber: string
  total: number
  agentId?: string
}): Promise<void> {
  try {
    const customer = await db.customer.findUnique({
      where: { id: data.customerId },
    })
    
    if (data.agentId) {
      await createNotification({
        userId: data.agentId,
        title: 'فاتورة جديدة',
        message: `تم إنشاء فاتورة ${data.invoiceNumber} للعميل ${customer?.name} بقيمة ${data.total} ريال`,
        type: NotificationTypes.INVOICE_CREATED,
        link: `/invoices`,
      })
    }
  } catch (error) {
    console.error('Notify invoice created error:', error)
  }
}

// إشعار عميل جديد
export async function notifyNewCustomer(data: {
  customerId: string
  customerName: string
  agentId?: string
}): Promise<void> {
  try {
    if (data.agentId) {
      await createNotification({
        userId: data.agentId,
        title: 'عميل جديد',
        message: `تم إضافة عميل جديد: ${data.customerName}`,
        type: NotificationTypes.CUSTOMER_NEW,
        link: `/customers/${data.customerId}`,
      })
    }
  } catch (error) {
    console.error('Notify new customer error:', error)
  }
}

// إشعار عمولة
export async function notifyCommissionEarned(data: {
  agentId: string
  amount: number
  type: string
}): Promise<void> {
  try {
    await createNotification({
      userId: data.agentId,
      title: 'عمولة جديدة',
      message: `تم احتساب عمولة ${data.type} بقيمة ${data.amount} ريال`,
      type: NotificationTypes.COMMISSION_EARNED,
    })
  } catch (error) {
    console.error('Notify commission error:', error)
  }
}

// الحصول على إشعارات المستخدم
export async function getUserNotifications(userId: string, options?: {
  unreadOnly?: boolean
  limit?: number
}): Promise<any[]> {
  try {
    const notifications = await db.notification.findMany({
      where: {
        userId,
        ...(options?.unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
    })
    
    return notifications
  } catch (error) {
    console.error('Get user notifications error:', error)
    return []
  }
}

// تحديد الإشعار كمقروء
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })
  } catch (error) {
    console.error('Mark notification as read error:', error)
  }
}

// تحديد جميع الإشعارات كمقروءة
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    await db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
  } catch (error) {
    console.error('Mark all notifications as read error:', error)
  }
}

// عدد الإشعارات غير المقروءة
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    return await db.notification.count({
      where: { userId, isRead: false },
    })
  } catch (error) {
    return 0
  }
}

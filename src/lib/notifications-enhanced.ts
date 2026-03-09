// نظام الإشعارات المتكامل
// Unified Notifications System - SMS, Email, Push, In-App

import { db } from '@/lib/db'
import { NotificationType } from '@prisma/client'

// ===================== TYPES =====================
type NotificationChannel = 'in_app' | 'sms' | 'email' | 'push'
type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

interface NotificationPayload {
  userId: string
  title: string
  message: string
  type: string
  priority?: NotificationPriority
  channels?: NotificationChannel[]
  link?: string
  data?: any
  scheduledAt?: Date
}

interface SMSPayload {
  to: string
  message: string
}

interface EmailPayload {
  to: string
  subject: string
  html: string
  text?: string
}

// ===================== CONFIGURATION =====================
const NOTIFICATION_CONFIG = {
  // تفعيل/تعطيل القنوات
  channels: {
    in_app: true,
    sms: true, // يحتاج إعداد Twilio أو مشابه
    email: true, // يحتاج إعداد SMTP
    push: true // يحتاج VAPID keys
  },
  
  // حدود الإشعارات
  limits: {
    smsPerDay: 100,
    emailPerHour: 50
  },
  
  // قوالب الرسائل
  templates: {
    INSTALLMENT_DUE: {
      title: 'قسط مستحق',
      smsTemplate: 'تنبيه: قسطك رقم {installmentNumber} مستحق بتاريخ {dueDate} - أقساطي',
      emailTemplate: 'installment-due'
    },
    INSTALLMENT_OVERDUE: {
      title: 'قسط متأخر',
      smsTemplate: 'تنبيه: قسطك رقم {installmentNumber} متأخر منذ {days} يوم - أقساطي',
      emailTemplate: 'installment-overdue'
    },
    PAYMENT_RECEIVED: {
      title: 'تم استلام دفعة',
      smsTemplate: 'تم استلام دفعة بقيمة {amount} ريال - شكراً لتعاملكم معنا',
      emailTemplate: 'payment-received'
    },
    INVOICE_CREATED: {
      title: 'فاتورة جديدة',
      smsTemplate: 'تم إنشاء فاتورة رقم {invoiceNumber} بقيمة {amount} ريال - أقساطي',
      emailTemplate: 'invoice-created'
    },
    LOW_STOCK: {
      title: 'تنبيه المخزون',
      smsTemplate: 'تنبيه: المنتج {productName} وصل للحد الأدنى ({quantity} متبقي)',
      emailTemplate: 'low-stock'
    }
  }
}

// ===================== MAIN NOTIFICATION FUNCTION =====================
export async function sendNotification(payload: NotificationPayload): Promise<{
  success: boolean
  channels: { channel: NotificationChannel; success: boolean; error?: string }[]
}> {
  const channels = payload.channels || ['in_app']
  const results: { channel: NotificationChannel; success: boolean; error?: string }[] = []
  
  // التحقق من تفعيل القناة
  for (const channel of channels) {
    if (!NOTIFICATION_CONFIG.channels[channel]) {
      results.push({ channel, success: false, error: 'Channel disabled' })
      continue
    }
    
    try {
      switch (channel) {
        case 'in_app':
          await sendInAppNotification(payload)
          results.push({ channel, success: true })
          break
          
        case 'sms':
          const smsResult = await sendSMSNotification(payload)
          results.push({ channel, success: smsResult.success, error: smsResult.error })
          break
          
        case 'email':
          const emailResult = await sendEmailNotification(payload)
          results.push({ channel, success: emailResult.success, error: emailResult.error })
          break
          
        case 'push':
          const pushResult = await sendPushNotification(payload)
          results.push({ channel, success: pushResult.success, error: pushResult.error })
          break
      }
    } catch (error: any) {
      results.push({ channel, success: false, error: error.message })
    }
  }
  
  return {
    success: results.some(r => r.success),
    channels: results
  }
}

// ===================== IN-APP NOTIFICATION =====================
async function sendInAppNotification(payload: NotificationPayload): Promise<void> {
  await db.notification.create({
    data: {
      id: crypto.randomUUID(),
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      priority: payload.priority || 'medium',
      link: payload.link,
      metadata: payload.data ? JSON.stringify(payload.data) : null,
      isRead: false
    }
  })
}

// ===================== SMS NOTIFICATION =====================
async function sendSMSNotification(payload: NotificationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    // الحصول على رقم هاتف المستخدم
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { phone: true, name: true }
    })
    
    if (!user?.phone) {
      return { success: false, error: 'User has no phone number' }
    }
    
    // التحقق من حدود الإرسال
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const sentToday = await db.notification.count({
      where: {
        userId: payload.userId,
        type: payload.type,
        createdAt: { gte: todayStart }
      }
    })
    
    if (sentToday >= NOTIFICATION_CONFIG.limits.smsPerDay) {
      return { success: false, error: 'SMS limit exceeded' }
    }
    
    // إرسال SMS عبر بوابة الرسائل
    // هنا يتم تكامل مع بوابة SMS مثل Twilio أو بوابة محلية
    const smsResult = await sendSMS({
      to: user.phone,
      message: payload.message
    })
    
    return smsResult
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// بوابة SMS - يمكن تكاملها مع Twilio أو بوابة محلية
async function sendSMS(payload: SMSPayload): Promise<{ success: boolean; error?: string }> {
  try {
    // تكامل مع بوابة SMS
    // مثال: Twilio, SMS.to, أو بوابة سعودية محلية
    
    // للتجربة: محاكاة إرسال SMS
    console.log(`[SMS] To: ${payload.to}, Message: ${payload.message}`)
    
    // في الإنتاج:
    // const response = await fetch('https://api.sms-gateway.com/send', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     to: payload.to,
    //     message: payload.message,
    //     api_key: process.env.SMS_API_KEY
    //   })
    // })
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ===================== EMAIL NOTIFICATION =====================
async function sendEmailNotification(payload: NotificationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    // الحصول على بريد المستخدم
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { email: true, name: true }
    })
    
    if (!user?.email) {
      return { success: false, error: 'User has no email' }
    }
    
    // التحقق من حدود الإرسال
    const hourStart = new Date(Date.now() - 60 * 60 * 1000)
    
    const sentLastHour = await db.notification.count({
      where: {
        userId: payload.userId,
        type: payload.type,
        createdAt: { gte: hourStart }
      }
    })
    
    if (sentLastHour >= NOTIFICATION_CONFIG.limits.emailPerHour) {
      return { success: false, error: 'Email limit exceeded' }
    }
    
    // إرسال Email
    const emailResult = await sendEmail({
      to: user.email,
      subject: payload.title,
      html: generateEmailHTML(payload, user.name),
      text: payload.message
    })
    
    return emailResult
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// إرسال بريد إلكتروني
async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  try {
    // تكامل مع خدمة البريد
    // يمكن استخدام: SendGrid, AWS SES, أو SMTP server
    
    // للتجربة: محاكاة إرسال Email
    console.log(`[Email] To: ${payload.to}, Subject: ${payload.subject}`)
    
    // في الإنتاج:
    // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`
    //   },
    //   body: JSON.stringify({
    //     personalizations: [{ to: [{ email: payload.to }] }],
    //     from: { email: 'noreply@erp-aqsati.com', name: 'ERP أقساطي' },
    //     subject: payload.subject,
    //     content: [
    //       { type: 'text/plain', value: payload.text },
    //       { type: 'text/html', value: payload.html }
    //     ]
    //   })
    // })
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// توليد HTML للبريد
function generateEmailHTML(payload: NotificationPayload, userName: string): string {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Noto Sans Arabic', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .title { font-size: 24px; margin: 0 0 10px; }
        .message { color: #666; line-height: 1.8; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin-top: 20px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">${payload.title}</h1>
        </div>
        <div class="content">
          <p>مرحباً ${userName}،</p>
          <p class="message">${payload.message}</p>
          ${payload.link ? `<a href="${payload.link}" class="button">عرض التفاصيل</a>` : ''}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ERP أقساطي - نظام إدارة الموارد</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// ===================== PUSH NOTIFICATION =====================
async function sendPushNotification(payload: NotificationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    // الحصول على اشتراكات Push للمستخدم
    // في الإنتاج، يجب تخزين اشتراكات Push في قاعدة البيانات
    
    // للتجربة: محاكاة إرسال Push
    console.log(`[Push] User: ${payload.userId}, Title: ${payload.title}`)
    
    // في الإنتاج:
    // const subscriptions = await db.pushSubscription.findMany({
    //   where: { userId: payload.userId }
    // })
    // 
    // for (const sub of subscriptions) {
    //   await webpush.sendNotification(sub.subscription, JSON.stringify({
    //     title: payload.title,
    //     body: payload.message,
    //     icon: '/icons/icon-192x192.png',
    //     data: { url: payload.link }
    //   }))
    // }
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ===================== SPECIALIZED NOTIFICATIONS =====================

// إشعارات الأقساط المستحقة
export async function notifyDueInstallments(): Promise<void> {
  const today = new Date()
  const threeDaysFromNow = new Date(today)
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
  
  // الأقساط المستحقة خلال 3 أيام
  const dueInstallments = await db.installment.findMany({
    where: {
      status: 'pending',
      dueDate: { gte: today, lte: threeDaysFromNow }
    },
    include: {
      InstallmentContract: {
        include: { Customer: true, User: true }
      }
    }
  })
  
  for (const installment of dueInstallments) {
    const contract = installment.InstallmentContract
    const agent = contract.User
    
    if (agent) {
      const daysUntilDue = Math.ceil((installment.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      await sendNotification({
        userId: agent.id,
        title: 'قسط مستحق قريباً',
        message: `القسط رقم ${installment.installmentNumber} للعميل ${contract.Customer.name} مستحق خلال ${daysUntilDue} يوم`,
        type: 'INSTALLMENT_DUE',
        priority: 'high',
        channels: ['in_app', 'push'],
        link: `/?section=installments&id=${contract.id}`,
        data: { installmentId: installment.id, contractId: contract.id }
      })
    }
  }
  
  // الأقساط المتأخرة
  const overdueInstallments = await db.installment.findMany({
    where: {
      status: 'pending',
      dueDate: { lt: today }
    },
    include: {
      InstallmentContract: {
        include: { Customer: true, User: true }
      }
    }
  })
  
  for (const installment of overdueInstallments) {
    const contract = installment.InstallmentContract
    const agent = contract.User
    
    if (agent) {
      const daysLate = Math.ceil((today.getTime() - installment.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      
      await sendNotification({
        userId: agent.id,
        title: 'قسط متأخر',
        message: `القسط رقم ${installment.installmentNumber} للعميل ${contract.Customer.name} متأخر ${daysLate} يوم`,
        type: 'INSTALLMENT_OVERDUE',
        priority: 'urgent',
        channels: ['in_app', 'push'],
        link: `/?section=installments&id=${contract.id}`,
        data: { installmentId: installment.id, contractId: contract.id, daysLate }
      })
    }
  }
}

// إشعارات انخفاض المخزون
export async function notifyLowStock(): Promise<void> {
  const lowStockItems = await db.$queryRaw<any[]>`
    SELECT i.*, p.name as productName, w.name as warehouseName
    FROM Inventory i
    JOIN Product p ON i.productId = p.id
    JOIN Warehouse w ON i.warehouseId = w.id
    WHERE i.quantity <= i.minQuantity
  `
  
  if (lowStockItems.length === 0) return
  
  // الحصول على المديرين
  const managers = await db.user.findMany({
    where: {
      role: { in: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'BRANCH_MANAGER'] },
      active: true
    }
  })
  
  for (const item of lowStockItems) {
    for (const manager of managers) {
      await sendNotification({
        userId: manager.id,
        title: 'تنبيه انخفاض المخزون',
        message: `المنتج "${item.productName}" في ${item.warehouseName} وصل للحد الأدنى (${item.quantity} متبقي)`,
        type: 'LOW_STOCK',
        priority: 'high',
        channels: ['in_app'],
        data: { productId: item.productId, warehouseId: item.warehouseId }
      })
    }
  }
}

// إشعار استلام دفعة
export async function notifyPaymentReceived(data: {
  customerId: string
  amount: number
  invoiceNumber?: string
  agentId?: string
}): Promise<void> {
  const customer = await db.customer.findUnique({
    where: { id: data.customerId }
  })
  
  if (data.agentId) {
    await sendNotification({
      userId: data.agentId,
      title: 'تم استلام دفعة',
      message: `تم استلام دفعة بقيمة ${data.amount} ريال من العميل ${customer?.name || 'غير محدد'}${data.invoiceNumber ? ` للفاتورة ${data.invoiceNumber}` : ''}`,
      type: 'PAYMENT_RECEIVED',
      priority: 'medium',
      channels: ['in_app']
    })
  }
}

// إشعار فاتورة جديدة
export async function notifyInvoiceCreated(data: {
  customerId: string
  invoiceNumber: string
  total: number
  agentId?: string
}): Promise<void> {
  const customer = await db.customer.findUnique({
    where: { id: data.customerId }
  })
  
  if (data.agentId) {
    await sendNotification({
      userId: data.agentId,
      title: 'فاتورة جديدة',
      message: `تم إنشاء فاتورة ${data.invoiceNumber} للعميل ${customer?.name || 'غير محدد'} بقيمة ${data.total} ريال`,
      type: 'INVOICE_CREATED',
      priority: 'medium',
      channels: ['in_app']
    })
  }
}

// ===================== QUERY FUNCTIONS =====================

// الحصول على إشعارات المستخدم
export async function getUserNotifications(userId: string, options?: {
  unreadOnly?: boolean
  limit?: number
  types?: string[]
}): Promise<any[]> {
  const where: any = { userId }
  
  if (options?.unreadOnly) where.isRead = false
  if (options?.types && options.types.length > 0) where.type = { in: options.types }
  
  return db.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50
  })
}

// عدد الإشعارات غير المقروءة
export async function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({
    where: { userId, isRead: false }
  })
}

// تحديد الإشعار كمقروء
export async function markAsRead(notificationId: string): Promise<void> {
  await db.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() }
  })
}

// تحديد جميع الإشعارات كمقروءة
export async function markAllAsRead(userId: string): Promise<void> {
  await db.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() }
  })
}

// حذف إشعار
export async function deleteNotification(notificationId: string): Promise<void> {
  await db.notification.delete({
    where: { id: notificationId }
  })
}

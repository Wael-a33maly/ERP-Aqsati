/**
 * Subscription Payments API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { subscriptionController } from '@/controllers/subscription.controller'

// GET - جلب المدفوعات أو طرق الدفع
export async function GET(request: NextRequest) {
  return subscriptionController.getPaymentTransactions(request)
}

// POST - إنشاء عملية دفع جديدة
export async function POST(request: NextRequest) {
  return subscriptionController.createPaymentTransaction(request)
}

// PUT - تحديث حالة الدفع (تأكيد الدفع)
export async function PUT(request: NextRequest) {
  return subscriptionController.updatePaymentTransaction(request)
}

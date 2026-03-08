/**
 * Egyptian Payment API Route
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { egyptianPaymentController } from '@/controllers/egyptian-payment.controller'

// إنشاء دفعة جديدة
export async function POST(request: NextRequest) {
  return egyptianPaymentController.createPayment(request)
}

// التحقق من حالة الدفعة
export async function GET(request: NextRequest) {
  return egyptianPaymentController.checkStatus(request)
}

// استرداد دفعة (Refund)
export async function PUT(request: NextRequest) {
  return egyptianPaymentController.refundPayment(request)
}

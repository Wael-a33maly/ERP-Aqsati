import { NextRequest, NextResponse } from 'next/server'
import { paymentController } from '@/controllers/payment.controller'

// GET - جلب المدفوعات
export async function GET(request: NextRequest) {
  return paymentController.getPayments(request)
}

// POST - إنشاء دفعة
export async function POST(request: NextRequest) {
  return paymentController.createPayment(request)
}

// PUT - تحديث دفعة
export async function PUT(request: NextRequest) {
  return paymentController.updatePayment(request)
}

// DELETE - حذف دفعة
export async function DELETE(request: NextRequest) {
  return paymentController.deletePayment(request)
}

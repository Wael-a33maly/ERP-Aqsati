/**
 * Installment Payments API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { installmentController } from '@/controllers/installment.controller'

// GET - جلب مدفوعات قسط
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return installmentController.getInstallmentPayments(request, { params })
}

// POST - تسجيل دفعة قسط
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return installmentController.recordPayment(request, { params })
}

// DELETE - إلغاء دفعة قسط
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return installmentController.reversePayment(request, { params })
}

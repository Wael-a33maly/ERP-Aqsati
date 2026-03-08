/**
 * Installment Collection API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { installmentController } from '@/controllers/installment.controller'

// POST - تحصيل قسط
export async function POST(request: NextRequest) {
  return installmentController.collectPayment(request)
}

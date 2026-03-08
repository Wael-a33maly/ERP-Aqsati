/**
 * Installments API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { installmentController } from '@/controllers/installment.controller'

// GET - جلب الأقساط
export async function GET(request: NextRequest) {
  return installmentController.getInstallments(request)
}

/**
 * All Installments API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { installmentController } from '@/controllers/installment.controller'

// GET - جلب جميع الأقساط بشكل فردي
export async function GET(request: NextRequest) {
  return installmentController.getAll(request)
}

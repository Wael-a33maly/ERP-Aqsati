/**
 * Installment Contracts API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { contractController } from '@/controllers/installment.controller'

// GET - جلب العقود
export async function GET(request: NextRequest) {
  return contractController.getContracts(request)
}

// POST - إنشاء عقد جديد
export async function POST(request: NextRequest) {
  return contractController.createContract(request)
}

// PUT - تحديث عقد
export async function PUT(request: NextRequest) {
  return contractController.updateContract(request)
}

// DELETE - إلغاء عقد
export async function DELETE(request: NextRequest) {
  return contractController.cancelContract(request)
}

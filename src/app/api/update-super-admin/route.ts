/**
 * Update Super Admin API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { authController } from '@/controllers/auth.controller'

// POST - تحديث بيانات السوبر أدمن
export async function POST(request: NextRequest) {
  return authController.updateSuperAdmin(request)
}

// GET - الحصول على معلومات السوبر أدمن
export async function GET() {
  return authController.getSuperAdminInfo()
}

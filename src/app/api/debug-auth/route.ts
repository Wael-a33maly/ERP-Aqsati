/**
 * Debug Auth API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { authController } from '@/controllers/auth.controller'

// POST - تصحيح المصادقة
export async function POST(request: NextRequest) {
  return authController.debugAuth(request)
}

// GET - معلومات الـ API
export async function GET() {
  return authController.debugAuthInfo()
}

/**
 * Auth Me API Route
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { authController } from '@/controllers/auth.controller'

export async function GET(request: NextRequest) {
  return authController.me(request)
}

/**
 * Health API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { healthController } from '@/controllers/health.controller'

// GET - فحص صحة التطبيق
export async function GET(request: NextRequest) {
  return healthController.check(request)
}

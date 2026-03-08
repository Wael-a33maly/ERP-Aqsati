/**
 * Admin Stats API Route
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { adminController } from '@/controllers/admin.controller'

export async function GET(request: NextRequest) {
  return adminController.getStats(request)
}

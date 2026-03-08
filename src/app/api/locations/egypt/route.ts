/**
 * Egypt Locations API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { egyptLocationsController } from '@/controllers/location.controller'

// GET - جلب المحافظات المصرية المتاحة للاستيراد
export async function GET(request: NextRequest) {
  return egyptLocationsController.getAvailableGovernorates(request)
}

// POST - استيراد محافظة مع مدنها
export async function POST(request: NextRequest) {
  return egyptLocationsController.importGovernorates(request)
}

// DELETE - حذف محافظة مع كل بياناتها التابعة
export async function DELETE(request: NextRequest) {
  return egyptLocationsController.deleteGovernorate(request)
}

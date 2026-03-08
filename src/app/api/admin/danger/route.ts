/**
 * Admin Danger Zone API Route
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { adminController } from '@/controllers/admin.controller'

export async function DELETE(request: NextRequest) {
  return adminController.deleteAllData(request)
}

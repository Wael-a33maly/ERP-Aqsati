/**
 * Admin Impersonate API Route
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { adminController } from '@/controllers/admin.controller'

export async function POST(request: NextRequest) {
  return adminController.startImpersonate(request)
}

export async function DELETE(request: NextRequest) {
  return adminController.stopImpersonate(request)
}

/**
 * Admin Backup API Route
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { adminController } from '@/controllers/admin.controller'

export async function GET(request: NextRequest) {
  return adminController.getBackups(request)
}

export async function POST(request: NextRequest) {
  return adminController.createBackup(request)
}

export async function DELETE(request: NextRequest) {
  return adminController.deleteBackup(request)
}

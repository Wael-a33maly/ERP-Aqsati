import { NextRequest, NextResponse } from 'next/server'
import { auditLogController } from '@/controllers/audit-log.controller'

// GET - الحصول على سجل التدقيق
export async function GET(request: NextRequest) {
  return auditLogController.getAuditLogs(request)
}

// POST - إنشاء سجل تدقيق يدوياً
export async function POST(request: NextRequest) {
  return auditLogController.createAuditLog(request)
}

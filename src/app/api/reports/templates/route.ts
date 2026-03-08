/**
 * Report Templates API Route
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { reportTemplateController } from '@/controllers/report.controller'

export async function GET(request: NextRequest) {
  return reportTemplateController.getTemplates(request)
}

export async function POST(request: NextRequest) {
  return reportTemplateController.createTemplate(request)
}

export async function PUT(request: NextRequest) {
  return reportTemplateController.updateTemplate(request)
}

export async function DELETE(request: NextRequest) {
  return reportTemplateController.deleteTemplate(request)
}

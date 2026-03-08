/**
 * Company Receipt Templates API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { receiptTemplateController } from '@/controllers/receipt-template.controller'

// GET - Get company templates
export async function GET(request: NextRequest) {
  return receiptTemplateController.getTemplates(request)
}

// POST - Create new template
export async function POST(request: NextRequest) {
  return receiptTemplateController.createTemplate(request)
}

// PUT - Update template
export async function PUT(request: NextRequest) {
  return receiptTemplateController.updateTemplate(request)
}

// DELETE - Delete template
export async function DELETE(request: NextRequest) {
  return receiptTemplateController.deleteTemplate(request)
}

/**
 * Company Templates API Route
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { companyTemplatesController } from '@/controllers/receipt-template.controller'

export async function GET(request: NextRequest) {
  return companyTemplatesController.getTemplates(request)
}

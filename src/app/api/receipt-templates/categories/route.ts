/**
 * Receipt Template Categories API Route
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { templateCategoryController } from '@/controllers/receipt-template.controller'

export async function GET(request: NextRequest) {
  return templateCategoryController.getCategories(request)
}

export async function POST(request: NextRequest) {
  return templateCategoryController.createCategory(request)
}

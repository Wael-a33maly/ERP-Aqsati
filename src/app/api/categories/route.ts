/**
 * Category API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { categoryController } from '@/controllers/category.controller'

export async function GET(request: NextRequest) {
  return categoryController.getCategories(request)
}

export async function POST(request: NextRequest) {
  return categoryController.createCategory(request)
}

export async function PUT(request: NextRequest) {
  return categoryController.updateCategory(request)
}

export async function DELETE(request: NextRequest) {
  return categoryController.deleteCategory(request)
}

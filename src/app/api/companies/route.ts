/**
 * Companies API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { companyController } from '@/controllers/company.controller'

// GET - جلب جميع الشركات أو شركة واحدة
export async function GET(request: NextRequest) {
  return companyController.getCompanies(request)
}

// POST - إنشاء شركة جديدة (مدير النظام فقط)
export async function POST(request: NextRequest) {
  return companyController.createCompany(request)
}

// PUT - تحديث شركة
export async function PUT(request: NextRequest) {
  return companyController.updateCompany(request)
}

// DELETE - حذف شركة (مدير النظام فقط)
export async function DELETE(request: NextRequest) {
  return companyController.deleteCompany(request)
}

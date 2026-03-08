/**
 * Company by ID API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { companyController } from '@/controllers/company.controller'

// GET - جلب شركة بالمعرف
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const url = new URL(request.url)
  url.searchParams.set('id', id)
  const newRequest = new Request(url, request) as NextRequest
  return companyController.getCompanies(newRequest)
}

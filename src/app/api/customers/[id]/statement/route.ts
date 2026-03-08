/**
 * Customer Statement API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { customerController } from '@/controllers/customer.controller'

// GET /api/customers/[id]/statement - Get customer statement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return customerController.getCustomerStatement(request, id)
}

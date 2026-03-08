/**
 * Customers [id] API Route - MVC
 */

import { NextRequest } from 'next/server'
import { customerController } from '@/controllers/customer.controller'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return customerController.getCustomerById(request, id)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return customerController.updateCustomer(request, id)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return customerController.deleteCustomer(request, id)
}

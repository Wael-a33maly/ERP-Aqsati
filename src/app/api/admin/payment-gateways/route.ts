/**
 * Admin Payment Gateways API Route
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { adminController } from '@/controllers/admin.controller'

export async function GET(request: NextRequest) {
  return adminController.getPaymentGateways(request)
}

export async function POST(request: NextRequest) {
  return adminController.createPaymentGateway(request)
}

export async function PUT(request: NextRequest) {
  return adminController.updatePaymentGateway(request)
}

export async function PATCH(request: NextRequest) {
  return adminController.togglePaymentGateway(request)
}

export async function DELETE(request: NextRequest) {
  return adminController.deletePaymentGateway(request)
}

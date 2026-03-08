/**
 * Payment Gateways API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { paymentGatewayController } from '@/controllers/payment-gateway.controller'

// GET - Get all payment gateways for a company
export async function GET(request: NextRequest) {
  return paymentGatewayController.getGateways(request)
}

// POST - Create a new payment gateway
export async function POST(request: NextRequest) {
  return paymentGatewayController.createGateway(request)
}

// PUT - Update a payment gateway
export async function PUT(request: NextRequest) {
  return paymentGatewayController.updateGateway(request)
}

// DELETE - Delete a payment gateway
export async function DELETE(request: NextRequest) {
  return paymentGatewayController.deleteGateway(request)
}

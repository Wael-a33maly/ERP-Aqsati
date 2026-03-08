/**
 * Payment Links API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { paymentLinkController } from '@/controllers/payment-link.controller'

export async function GET(request: NextRequest) {
  return paymentLinkController.getPaymentLinks(request)
}

export async function POST(request: NextRequest) {
  return paymentLinkController.createPaymentLink(request)
}

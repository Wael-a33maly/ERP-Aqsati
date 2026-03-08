/**
 * Subscription Status API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { subscriptionController } from '@/controllers/subscription.controller'

export async function GET(request: NextRequest) {
  return subscriptionController.getStatus(request)
}

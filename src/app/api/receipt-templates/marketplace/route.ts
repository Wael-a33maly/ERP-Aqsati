/**
 * Receipt Templates Marketplace API Route
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { marketplaceController } from '@/controllers/receipt-template.controller'

export async function GET(request: NextRequest) {
  return marketplaceController.getTemplates(request)
}

export async function POST(request: NextRequest) {
  return marketplaceController.installTemplate(request)
}

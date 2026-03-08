/**
 * Governorates API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { governorateController } from '@/controllers/location.controller'

export async function GET(request: NextRequest) {
  return governorateController.getAll(request)
}

export async function POST(request: NextRequest) {
  return governorateController.create(request)
}

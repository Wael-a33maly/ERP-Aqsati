/**
 * Areas API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { areaController } from '@/controllers/location.controller'

export async function GET(request: NextRequest) {
  return areaController.getAll(request)
}

export async function POST(request: NextRequest) {
  return areaController.create(request)
}

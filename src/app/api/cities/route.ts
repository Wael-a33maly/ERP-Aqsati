/**
 * Cities API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { cityController } from '@/controllers/location.controller'

export async function GET(request: NextRequest) {
  return cityController.getAll(request)
}

export async function POST(request: NextRequest) {
  return cityController.create(request)
}

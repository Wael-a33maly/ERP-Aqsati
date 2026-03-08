import { NextRequest, NextResponse } from 'next/server'
import { zoneController } from '@/controllers/zone.controller'

// GET - جلب المناطق
export async function GET(request: NextRequest) {
  return zoneController.getZones(request)
}

// POST - إنشاء منطقة
export async function POST(request: NextRequest) {
  return zoneController.createZone(request)
}

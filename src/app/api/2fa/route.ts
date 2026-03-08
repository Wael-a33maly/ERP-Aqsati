import { NextRequest, NextResponse } from 'next/server'
import { twoFactorController } from '@/controllers/two-factor.controller'

// GET - الحصول على حالة 2FA
export async function GET(request: NextRequest) {
  return twoFactorController.getStatus(request)
}

// POST - تفعيل/تعطيل/التحقق من 2FA
export async function POST(request: NextRequest) {
  return twoFactorController.executeAction(request)
}

import { NextRequest, NextResponse } from 'next/server'
import { featureController } from '@/controllers/feature.controller'

// GET - جلب جميع قوالب الميزات أو ميزات شركة معينة
export async function GET(request: NextRequest) {
  return featureController.getFeatures(request)
}

// POST - التحقق من ميزة معينة
export async function POST(request: NextRequest) {
  return featureController.checkFeature(request)
}

// PUT - تحديث استخدام ميزة (للمدير)
export async function PUT(request: NextRequest) {
  return featureController.updateFeatureUsage(request)
}

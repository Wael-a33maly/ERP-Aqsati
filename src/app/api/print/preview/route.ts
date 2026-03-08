import { NextRequest, NextResponse } from 'next/server'
import { printController } from '@/controllers/print.controller'

// GET - معاينة طباعة لمستند واحد
export async function GET(request: NextRequest) {
  return printController.getPreview(request)
}

// POST - معاينة طباعة لمستندات متعددة
export async function POST(request: NextRequest) {
  return printController.getBatchPreview(request)
}

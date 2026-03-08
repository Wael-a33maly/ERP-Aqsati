import { NextRequest, NextResponse } from 'next/server'
import { printController } from '@/controllers/print.controller'

// GET - جلب قوالب الطباعة
export async function GET(request: NextRequest) {
  return printController.getPrintTemplates(request)
}

// POST - إنشاء قالب طباعة جديد
export async function POST(request: NextRequest) {
  return printController.createPrintTemplate(request)
}

// PUT - تحديث قالب طباعة
export async function PUT(request: NextRequest) {
  return printController.updatePrintTemplate(request)
}

// DELETE - حذف قالب طباعة
export async function DELETE(request: NextRequest) {
  return printController.deletePrintTemplate(request)
}

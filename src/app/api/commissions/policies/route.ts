import { NextRequest, NextResponse } from 'next/server'
import { commissionController } from '@/controllers/commission.controller'

// GET - جلب سياسات العمولات
export async function GET(request: NextRequest) {
  return commissionController.getPolicies(request)
}

// POST - إنشاء سياسة عمولة
export async function POST(request: NextRequest) {
  return commissionController.createPolicy(request)
}

// PUT - تحديث سياسة عمولة
export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, ...data } = body
  return commissionController.updatePolicy(id, new NextRequest(request.url, {
    method: 'PUT',
    body: JSON.stringify(data)
  }))
}

// DELETE - حذف سياسة عمولة
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ success: false, error: 'معرف السياسة مطلوب' }, { status: 400 })
  }
  return commissionController.deletePolicy(id)
}

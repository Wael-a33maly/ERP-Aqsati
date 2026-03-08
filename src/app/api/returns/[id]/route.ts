import { NextRequest, NextResponse } from 'next/server'
import { returnsController } from '@/controllers/returns.controller'

// GET - جلب مرتجع بالمعرف
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return returnsController.getReturn(id)
}

// PUT - تحديث مرتجع
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  return returnsController.updateReturn(new NextRequest(request.url, {
    method: 'PUT',
    body: JSON.stringify({ id, ...body })
  }))
}

// DELETE - حذف مرتجع
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return returnsController.deleteReturn(id)
}

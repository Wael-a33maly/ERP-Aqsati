import { NextRequest, NextResponse } from 'next/server'
import { branchController } from '@/controllers/branch.controller'

// GET - جلب فرع بالمعرف
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return branchController.getBranch(id)
}

// PUT - تحديث فرع
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return branchController.updateBranch(id, request)
}

// DELETE - حذف فرع
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return branchController.deleteBranch(id)
}

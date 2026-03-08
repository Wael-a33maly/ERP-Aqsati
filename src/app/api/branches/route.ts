import { NextRequest, NextResponse } from 'next/server'
import { branchController } from '@/controllers/branch.controller'

// GET - جلب الفروع
export async function GET(request: NextRequest) {
  return branchController.getBranches(request)
}

// POST - إنشاء فرع
export async function POST(request: NextRequest) {
  return branchController.createBranch(request)
}

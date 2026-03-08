/**
 * Users [id] API Route
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { userController } from '@/controllers/user.controller'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return userController.getUserById(request, id)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return userController.updateUser(request, id)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return userController.deleteUser(request, id)
}

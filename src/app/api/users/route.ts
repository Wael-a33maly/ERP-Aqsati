/**
 * Users API Route
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { userController } from '@/controllers/user.controller'

export async function GET(request: NextRequest) {
  return userController.getUsers(request)
}

export async function POST(request: NextRequest) {
  return userController.createUser(request)
}

export async function PUT(request: NextRequest) {
  return userController.updateUser(request, '')
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'معرف المستخدم مطلوب' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  return userController.deleteUser(request, id)
}

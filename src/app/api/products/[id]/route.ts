/**
 * Products [id] API Route - MVC
 */

import { NextRequest } from 'next/server'
import { productController } from '@/controllers/product.controller'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return productController.getProductById(request, id)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return productController.updateProduct(request, id)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return productController.deleteProduct(request, id)
}

/**
 * Products API Route - MVC
 */

import { NextRequest } from 'next/server'
import { productController } from '@/controllers/product.controller'

export async function GET(request: NextRequest) {
  return productController.getProducts(request)
}

export async function POST(request: NextRequest) {
  return productController.createProduct(request)
}

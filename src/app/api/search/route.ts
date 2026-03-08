import { NextRequest, NextResponse } from 'next/server'
import { searchController } from '@/controllers/search.controller'

// GET - البحث الموحد
export async function GET(request: NextRequest) {
  return searchController.search(request)
}

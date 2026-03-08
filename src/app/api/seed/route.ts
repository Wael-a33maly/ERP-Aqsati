/**
 * Seed API Routes
 * تم التحويل إلى MVC Architecture
 */

import { NextRequest } from 'next/server'
import { seedController } from '@/controllers/seed.controller'

// POST - إنشاء البيانات التجريبية
export async function POST(request: NextRequest) {
  return seedController.seedDatabase(request)
}

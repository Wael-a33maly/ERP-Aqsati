// ============================================
// Search Controller - متحكم البحث
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { searchService } from '@/services/search.service'
import { getCurrentUser } from '@/lib/auth'
import { applyRateLimit } from '@/lib/rate-limit'

export const searchController = {
  // GET - البحث الموحد
  async search(request: NextRequest) {
    try {
      const rateLimitResponse = await applyRateLimit(request, 'search')
      if (rateLimitResponse) return rateLimitResponse

      const user = await getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
      }

      const { searchParams } = new URL(request.url)
      const query = searchParams.get('q') || searchParams.get('query') || ''
      const types = searchParams.get('types')?.split(',') as any[] || undefined
      const limit = parseInt(searchParams.get('limit') || '50')

      const result = await searchService.search({
        query,
        types,
        limit,
        companyId: user.companyId,
        branchId: user.branchId,
      })

      return NextResponse.json({
        success: true,
        data: result.results,
        query: result.query,
        total: result.total,
      })
    } catch (error: any) {
      console.error('Search error:', error)
      return NextResponse.json(
        { error: 'حدث خطأ في البحث' },
        { status: 500 }
      )
    }
  },
}

// ============================================
// Search Service - خدمة البحث
// ============================================

import { searchRepository } from '@/repositories/search.repository'
import { SearchQueryParams, SearchResponse } from '@/models/search.model'

export const searchService = {
  // بحث موحد
  async search(params: SearchQueryParams): Promise<SearchResponse> {
    if (!params.query || params.query.length < 2) {
      return {
        results: [],
        query: params.query || '',
        total: 0,
      }
    }

    const results = await searchRepository.searchAll(params)

    return {
      results,
      query: params.query,
      total: results.length,
    }
  },
}

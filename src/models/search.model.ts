// ============================================
// Search Model - نموذج البحث
// ============================================

export type SearchType = 'customer' | 'product' | 'invoice' | 'payment' | 'contract'

export interface SearchResult {
  type: SearchType
  id: string
  title: string
  subtitle: string
  link: string
  icon: string
}

// Query Parameters
export interface SearchQueryParams {
  query: string
  types?: SearchType[]
  limit?: number
  companyId?: string
  branchId?: string
}

// Response Type
export interface SearchResponse {
  results: SearchResult[]
  query: string
  total: number
}

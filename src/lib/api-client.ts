import { useAuthStore } from '@/stores/auth-store'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  message: string
  status: number
  code?: string
}

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = '/api'
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    return headers
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type')
    const isJson = contentType?.includes('application/json')

    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized - clear auth state
        useAuthStore.getState().logout()
        if (typeof window !== 'undefined') {
          window.location.href = '/'
        }
        throw new Error('Unauthorized')
      }

      if (isJson) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || 'An error occurred')
      }

      throw new Error(`HTTP error! status: ${response.status}`)
    }

    if (isJson) {
      return response.json()
    }

    return { success: true }
  }

  async get<T = unknown>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    let url = `${this.baseUrl}${endpoint}`
    
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include',
    })

    return this.handleResponse<T>(response)
  }

  async post<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
    })

    return this.handleResponse<T>(response)
  }

  async put<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
    })

    return this.handleResponse<T>(response)
  }

  async patch<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
    })

    return this.handleResponse<T>(response)
  }

  async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include',
    })

    return this.handleResponse<T>(response)
  }

  // File upload
  async upload<T = unknown>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })

    return this.handleResponse<T>(response)
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Convenience exports for specific API endpoints
export const authApi = {
  login: (email: string, password: string) => 
    apiClient.post('/auth/login', { email, password }),
  
  logout: () => 
    apiClient.post('/auth/logout'),
  
  me: () => 
    apiClient.get('/auth/me'),
  
  register: (data: { name: string; email: string; password: string; phone?: string }) => 
    apiClient.post('/auth/register', data),
}

export const companiesApi = {
  list: (params?: { page?: number; limit?: number; search?: string; active?: boolean }) => 
    apiClient.get('/companies', params),
  
  get: (id: string) => 
    apiClient.get(`/companies/${id}`),
  
  create: (data: Record<string, unknown>) => 
    apiClient.post('/companies', data),
  
  update: (id: string, data: Record<string, unknown>) => 
    apiClient.put('/companies', { id, ...data }),
  
  delete: (id: string) => 
    apiClient.delete(`/companies/${id}`),
}

export const branchesApi = {
  list: (params?: { page?: number; limit?: number; search?: string; active?: boolean; companyId?: string }) => 
    apiClient.get('/branches', params),
  
  get: (id: string) => 
    apiClient.get(`/branches/${id}`),
  
  create: (data: Record<string, unknown>) => 
    apiClient.post('/branches', data),
  
  update: (id: string, data: Record<string, unknown>) => 
    apiClient.put('/branches', { id, ...data }),
  
  delete: (id: string) => 
    apiClient.delete(`/branches/${id}`),
}

export const usersApi = {
  list: (params?: { page?: number; limit?: number; search?: string; role?: string; active?: boolean }) => 
    apiClient.get('/users', params),
  
  get: (id: string) => 
    apiClient.get(`/users/${id}`),
  
  create: (data: Record<string, unknown>) => 
    apiClient.post('/users', data),
  
  update: (id: string, data: Record<string, unknown>) => 
    apiClient.put('/users', { id, ...data }),
  
  delete: (id: string) => 
    apiClient.delete(`/users/${id}`),
}

export const customersApi = {
  list: (params?: { page?: number; limit?: number; search?: string; active?: boolean; zoneId?: string; agentId?: string }) => 
    apiClient.get('/customers', params),
  
  get: (id: string) => 
    apiClient.get(`/customers/${id}`),
  
  create: (data: Record<string, unknown>) => 
    apiClient.post('/customers', data),
  
  update: (id: string, data: Record<string, unknown>) => 
    apiClient.put('/customers', { id, ...data }),
  
  delete: (id: string) => 
    apiClient.delete(`/customers/${id}`),
  
  statement: (id: string, params?: { startDate?: string; endDate?: string }) => 
    apiClient.get(`/customers/${id}/statement`, params),
}

export const productsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; active?: boolean; categoryId?: string }) => 
    apiClient.get('/products', params),
  
  get: (id: string) => 
    apiClient.get(`/products/${id}`),
  
  create: (data: Record<string, unknown>) => 
    apiClient.post('/products', data),
  
  update: (id: string, data: Record<string, unknown>) => 
    apiClient.put('/products', { id, ...data }),
  
  delete: (id: string) => 
    apiClient.delete(`/products/${id}`),
}

export const invoicesApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string; customerId?: string; startDate?: string; endDate?: string }) => 
    apiClient.get('/invoices', params),
  
  get: (id: string) => 
    apiClient.get(`/invoices/${id}`),
  
  create: (data: Record<string, unknown>) => 
    apiClient.post('/invoices', data),
  
  update: (id: string, data: Record<string, unknown>) => 
    apiClient.put('/invoices', { id, ...data }),
  
  delete: (id: string) => 
    apiClient.delete(`/invoices/${id}`),
  
  items: {
    list: (invoiceId: string) => 
      apiClient.get(`/invoices/${invoiceId}/items`),
    
    add: (invoiceId: string, data: Record<string, unknown>) => 
      apiClient.post(`/invoices/${invoiceId}/items`, data),
    
    update: (invoiceId: string, itemId: string, data: Record<string, unknown>) => 
      apiClient.put(`/invoices/${invoiceId}/items`, { id: itemId, ...data }),
    
    delete: (invoiceId: string, itemId: string) => 
      apiClient.delete(`/invoices/${invoiceId}/items/${itemId}`),
  },
}

export const paymentsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string; customerId?: string; method?: string; startDate?: string; endDate?: string }) => 
    apiClient.get('/payments', params),
  
  create: (data: Record<string, unknown>) => 
    apiClient.post('/payments', data),
  
  update: (id: string, data: Record<string, unknown>) => 
    apiClient.put('/payments', { id, ...data }),
  
  delete: (id: string) => 
    apiClient.delete(`/payments/${id}`),
}

export const installmentsApi = {
  contracts: {
    list: (params?: { page?: number; limit?: number; search?: string; status?: string; customerId?: string }) => 
      apiClient.get('/installments/contracts', params),
    
    create: (data: Record<string, unknown>) => 
      apiClient.post('/installments/contracts', data),
    
    update: (id: string, data: Record<string, unknown>) => 
      apiClient.put('/installments/contracts', { id, ...data }),
    
    delete: (id: string) => 
      apiClient.delete(`/installments/contracts/${id}`),
  },
  
  list: (params?: { page?: number; limit?: number; status?: string; customerId?: string; overdue?: boolean }) => 
    apiClient.get('/installments', params),
  
  update: (id: string, data: Record<string, unknown>) => 
    apiClient.put('/installments', { id, ...data }),
  
  payments: {
    get: (installmentId: string) => 
      apiClient.get(`/installments/${installmentId}/payments`),
    
    create: (installmentId: string, data: Record<string, unknown>) => 
      apiClient.post(`/installments/${installmentId}/payments`, data),
    
    delete: (installmentId: string, paymentId: string) => 
      apiClient.delete(`/installments/${installmentId}/payments/${paymentId}`),
  },
}

export const returnsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string; customerId?: string }) => 
    apiClient.get('/returns', params),
  
  get: (id: string) => 
    apiClient.get(`/returns/${id}`),
  
  create: (data: Record<string, unknown>) => 
    apiClient.post('/returns', data),
  
  update: (id: string, data: Record<string, unknown>) => 
    apiClient.put('/returns', { id, ...data }),
  
  delete: (id: string) => 
    apiClient.delete(`/returns/${id}`),
  
  approve: (id: string) => 
    apiClient.put(`/returns/${id}`, { status: 'approved' }),
  
  reject: (id: string, reason?: string) => 
    apiClient.put(`/returns/${id}`, { status: 'rejected', reason }),
  
  items: {
    list: (returnId: string) => 
      apiClient.get(`/returns/${returnId}/items`),
    
    add: (returnId: string, data: Record<string, unknown>) => 
      apiClient.post(`/returns/${returnId}/items`, data),
    
    update: (returnId: string, itemId: string, data: Record<string, unknown>) => 
      apiClient.put(`/returns/${returnId}/items`, { id: itemId, ...data }),
    
    delete: (returnId: string, itemId: string) => 
      apiClient.delete(`/returns/${returnId}/items/${itemId}`),
  },
}

export const inventoryApi = {
  list: (params?: { page?: number; limit?: number; search?: string; warehouseId?: string; lowStock?: boolean }) => 
    apiClient.get('/inventory', params),
  
  movements: (params?: { page?: number; limit?: number; type?: string; productId?: string; warehouseId?: string }) => 
    apiClient.get('/inventory/movements', params),
  
  adjust: (data: { productId: string; warehouseId: string; quantity: number; type: string; notes?: string }) => 
    apiClient.post('/inventory/movements', data),
}

export const categoriesApi = {
  list: (params?: { page?: number; limit?: number; search?: string; active?: boolean }) => 
    apiClient.get('/categories', params),
  
  create: (data: Record<string, unknown>) => 
    apiClient.post('/categories', data),
  
  update: (id: string, data: Record<string, unknown>) => 
    apiClient.put('/categories', { id, ...data }),
  
  delete: (id: string) => 
    apiClient.delete(`/categories/${id}`),
}

export const zonesApi = {
  list: (params?: { page?: number; limit?: number; search?: string; active?: boolean }) => 
    apiClient.get('/zones', params),
  
  create: (data: Record<string, unknown>) => 
    apiClient.post('/zones', data),
  
  update: (id: string, data: Record<string, unknown>) => 
    apiClient.put('/zones', { id, ...data }),
  
  delete: (id: string) => 
    apiClient.delete(`/zones/${id}`),
}

export const warehousesApi = {
  list: (params?: { page?: number; limit?: number; search?: string; active?: boolean }) => 
    apiClient.get('/warehouses', params),
  
  create: (data: Record<string, unknown>) => 
    apiClient.post('/warehouses', data),
  
  update: (id: string, data: Record<string, unknown>) => 
    apiClient.put('/warehouses', { id, ...data }),
  
  delete: (id: string) => 
    apiClient.delete(`/warehouses/${id}`),
}

export const commissionsApi = {
  policies: {
    list: (params?: { page?: number; limit?: number; type?: string }) => 
      apiClient.get('/commissions/policies', params),
    
    create: (data: Record<string, unknown>) => 
      apiClient.post('/commissions/policies', data),
    
    update: (id: string, data: Record<string, unknown>) => 
      apiClient.put('/commissions/policies', { id, ...data }),
    
    delete: (id: string) => 
      apiClient.delete(`/commissions/policies/${id}`),
  },
  
  agent: {
    list: (params?: { page?: number; limit?: number; status?: string; agentId?: string }) => 
      apiClient.get('/commissions/agent', params),
    
    summary: (agentId?: string) => 
      apiClient.get('/commissions/agent', { summary: true, agentId }),
    
    markPaid: (ids: string[]) => 
      apiClient.put('/commissions/agent', { action: 'markPaid', ids }),
  },
}

export const reportsApi = {
  templates: {
    list: (params?: { page?: number; limit?: number; type?: string }) => 
      apiClient.get('/reports/templates', params),
    
    create: (data: Record<string, unknown>) => 
      apiClient.post('/reports/templates', data),
    
    update: (id: string, data: Record<string, unknown>) => 
      apiClient.put('/reports/templates', { id, ...data }),
    
    delete: (id: string) => 
      apiClient.delete(`/reports/templates/${id}`),
  },
  
  generate: (data: { type: string; templateId?: string; filters?: Record<string, unknown> }) => 
    apiClient.post('/reports/generate', data),
  
  history: (params?: { page?: number; limit?: number; type?: string }) => 
    apiClient.get('/reports/generate', params),
  
  sales: (params?: { view?: string; startDate?: string; endDate?: string; agentId?: string; branchId?: string }) => 
    apiClient.get('/reports/sales', params),
  
  collection: (params?: { view?: string; startDate?: string; endDate?: string; agentId?: string }) => 
    apiClient.get('/reports/collection', params),
  
  inventory: (params?: { view?: string; warehouseId?: string }) => 
    apiClient.get('/reports/inventory', params),
}

export const printApi = {
  templates: {
    list: (params?: { page?: number; limit?: number; type?: string }) => 
      apiClient.get('/print/templates', params),
    
    create: (data: Record<string, unknown>) => 
      apiClient.post('/print/templates', data),
    
    update: (id: string, data: Record<string, unknown>) => 
      apiClient.put('/print/templates', { id, ...data }),
    
    delete: (id: string) => 
      apiClient.delete(`/print/templates/${id}`),
  },
  
  preview: (data: { documentType: string; documentId: string }) => 
    apiClient.post('/print/preview', data),
  
  jobs: {
    list: (params?: { page?: number; limit?: number; status?: string }) => 
      apiClient.get('/print/jobs', params),
    
    create: (data: { documentType: string; documentIds: string[]; templateId?: string }) => 
      apiClient.post('/print/jobs', data),
  },
}

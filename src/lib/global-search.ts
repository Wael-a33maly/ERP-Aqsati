// نظام البحث الموحد العالمي
// Global Search System with Keyboard Shortcuts

import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// ===================== TYPES =====================
interface SearchResult {
  id: string
  type: string
  title: string
  subtitle?: string
  icon: string
  link: string
  metadata?: any
  score: number
}

interface SearchOptions {
  query: string
  types?: string[]
  limit?: number
  companyId?: string
  branchId?: string
  userId?: string
}

// ===================== MAIN SEARCH FUNCTION =====================
export async function globalSearch(options: SearchOptions): Promise<SearchResult[]> {
  const { query, types, limit = 20, companyId, branchId, userId } = options
  
  if (!query || query.length < 2) {
    return []
  }
  
  const searchQuery = query.toLowerCase().trim()
  const results: SearchResult[] = []
  
  // تحديد الأنواع المراد البحث فيها
  const searchTypes = types || [
    'customer', 'product', 'invoice', 'payment',
    'installment', 'user', 'branch', 'category'
  ]
  
  // البحث المتوازي في جميع الأنواع
  const searchPromises = []
  
  if (searchTypes.includes('customer')) {
    searchPromises.push(searchCustomers(searchQuery, companyId, limit))
  }
  
  if (searchTypes.includes('product')) {
    searchPromises.push(searchProducts(searchQuery, companyId, limit))
  }
  
  if (searchTypes.includes('invoice')) {
    searchPromises.push(searchInvoices(searchQuery, companyId, branchId, limit))
  }
  
  if (searchTypes.includes('payment')) {
    searchPromises.push(searchPayments(searchQuery, companyId, branchId, limit))
  }
  
  if (searchTypes.includes('installment')) {
    searchPromises.push(searchInstallments(searchQuery, companyId, limit))
  }
  
  if (searchTypes.includes('user')) {
    searchPromises.push(searchUsers(searchQuery, companyId, limit))
  }
  
  // تنفيذ جميع عمليات البحث
  const searchResults = await Promise.all(searchPromises)
  
  // دمج النتائج
  searchResults.forEach(typeResults => {
    results.push(...typeResults)
  })
  
  // ترتيب حسب النتيجة
  results.sort((a, b) => b.score - a.score)
  
  // إرجاع أفضل النتائج
  return results.slice(0, limit)
}

// ===================== SEARCH FUNCTIONS =====================

async function searchCustomers(query: string, companyId?: string, limit: number = 5): Promise<SearchResult[]> {
  const where: any = {
    OR: [
      { name: { contains: query } },
      { nameAr: { contains: query } },
      { code: { contains: query } },
      { phone: { contains: query } },
      { nationalId: { contains: query } },
    ]
  }
  
  if (companyId) where.companyId = companyId
  
  const customers = await db.customer.findMany({
    where,
    take: limit,
    select: {
      id: true,
      name: true,
      nameAr: true,
      code: true,
      phone: true,
      balance: true,
      Company: { select: { name: true } }
    }
  })
  
  return customers.map(customer => ({
    id: customer.id,
    type: 'customer',
    title: customer.name || customer.nameAr || 'غير محدد',
    subtitle: `${customer.code} - ${customer.phone || 'لا يوجد هاتف'} - رصيد: ${customer.balance}`,
    icon: 'User',
    link: `/?section=customers&id=${customer.id}`,
    metadata: { code: customer.code, balance: customer.balance },
    score: calculateScore(query, [customer.name, customer.code, customer.phone])
  }))
}

async function searchProducts(query: string, companyId?: string, limit: number = 5): Promise<SearchResult[]> {
  const where: any = {
    OR: [
      { name: { contains: query } },
      { nameAr: { contains: query } },
      { sku: { contains: query } },
      { barcode: { contains: query } },
    ]
  }
  
  if (companyId) where.companyId = companyId
  
  const products = await db.product.findMany({
    where,
    take: limit,
    select: {
      id: true,
      name: true,
      nameAr: true,
      sku: true,
      sellPrice: true,
      barcode: true,
      ProductCategory: { select: { name: true } }
    }
  })
  
  return products.map(product => ({
    id: product.id,
    type: 'product',
    title: product.name || product.nameAr || 'غير محدد',
    subtitle: `${product.sku} - السعر: ${product.sellPrice} ريال ${product.barcode ? `| باركود: ${product.barcode}` : ''}`,
    icon: 'Package',
    link: `/?section=products&id=${product.id}`,
    metadata: { sku: product.sku, price: product.sellPrice },
    score: calculateScore(query, [product.name, product.sku, product.barcode])
  }))
}

async function searchInvoices(query: string, companyId?: string, branchId?: string, limit: number = 5): Promise<SearchResult[]> {
  const where: any = {
    OR: [
      { invoiceNumber: { contains: query } },
      { notes: { contains: query } },
    ]
  }
  
  if (companyId) where.companyId = companyId
  if (branchId) where.branchId = branchId
  
  const invoices = await db.invoice.findMany({
    where,
    take: limit,
    select: {
      id: true,
      invoiceNumber: true,
      total: true,
      status: true,
      type: true,
      createdAt: true,
      Customer: { select: { name: true } }
    }
  })
  
  return invoices.map(invoice => ({
    id: invoice.id,
    type: 'invoice',
    title: `فاتورة ${invoice.invoiceNumber}`,
    subtitle: `${invoice.Customer?.name || 'غير محدد'} - ${invoice.total} ريال - ${invoice.status}`,
    icon: 'Receipt',
    link: `/?section=invoices&id=${invoice.id}`,
    metadata: { invoiceNumber: invoice.invoiceNumber, total: invoice.total, status: invoice.status },
    score: calculateScore(query, [invoice.invoiceNumber])
  }))
}

async function searchPayments(query: string, companyId?: string, branchId?: string, limit: number = 5): Promise<SearchResult[]> {
  const where: any = {
    OR: [
      { paymentNumber: { contains: query } },
      { reference: { contains: query } },
    ]
  }
  
  if (companyId) where.companyId = companyId
  if (branchId) where.branchId = branchId
  
  const payments = await db.payment.findMany({
    where,
    take: limit,
    select: {
      id: true,
      paymentNumber: true,
      amount: true,
      method: true,
      createdAt: true,
      Customer: { select: { name: true } }
    }
  })
  
  return payments.map(payment => ({
    id: payment.id,
    type: 'payment',
    title: `دفعة ${payment.paymentNumber}`,
    subtitle: `${payment.Customer?.name || 'غير محدد'} - ${payment.amount} ريال - ${payment.method}`,
    icon: 'Wallet',
    link: `/?section=payments&id=${payment.id}`,
    metadata: { paymentNumber: payment.paymentNumber, amount: payment.amount },
    score: calculateScore(query, [payment.paymentNumber, payment.reference])
  }))
}

async function searchInstallments(query: string, companyId?: string, limit: number = 5): Promise<SearchResult[]> {
  const contracts = await db.installmentContract.findMany({
    where: {
      OR: [
        { contractNumber: { contains: query } },
      ]
    },
    take: limit,
    select: {
      id: true,
      contractNumber: true,
      totalAmount: true,
      status: true,
      Customer: { select: { name: true } }
    }
  })
  
  return contracts.map(contract => ({
    id: contract.id,
    type: 'installment',
    title: `عقد ${contract.contractNumber}`,
    subtitle: `${contract.Customer?.name || 'غير محدد'} - ${contract.totalAmount} ريال - ${contract.status}`,
    icon: 'CreditCard',
    link: `/?section=installments&id=${contract.id}`,
    metadata: { contractNumber: contract.contractNumber, totalAmount: contract.totalAmount },
    score: calculateScore(query, [contract.contractNumber])
  }))
}

async function searchUsers(query: string, companyId?: string, limit: number = 5): Promise<SearchResult[]> {
  const where: any = {
    OR: [
      { name: { contains: query } },
      { email: { contains: query } },
      { phone: { contains: query } },
    ]
  }
  
  if (companyId) where.companyId = companyId
  
  const users = await db.user.findMany({
    where,
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      Company: { select: { name: true } }
    }
  })
  
  return users.map(user => ({
    id: user.id,
    type: 'user',
    title: user.name || 'غير محدد',
    subtitle: `${user.email} - ${user.role} - ${user.Company?.name || ''}`,
    icon: 'UserCircle',
    link: `/?section=users&id=${user.id}`,
    metadata: { email: user.email, role: user.role },
    score: calculateScore(query, [user.name, user.email, user.phone])
  }))
}

// ===================== HELPERS =====================

function calculateScore(query: string, fields: (string | null | undefined)[]): number {
  let score = 0
  const normalizedQuery = query.toLowerCase()
  
  for (const field of fields) {
    if (!field) continue
    
    const normalizedField = field.toLowerCase()
    
    // تطابق تام
    if (normalizedField === normalizedQuery) {
      score += 100
    }
    // يبدأ بـ
    else if (normalizedField.startsWith(normalizedQuery)) {
      score += 75
    }
    // يحتوي على
    else if (normalizedField.includes(normalizedQuery)) {
      score += 50
    }
  }
  
  return score
}

// ===================== API ROUTE =====================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const types = searchParams.get('types')?.split(',')
    const limit = parseInt(searchParams.get('limit') || '20')
    const companyId = searchParams.get('companyId') || undefined
    const branchId = searchParams.get('branchId') || undefined
    
    const results = await globalSearch({
      query,
      types,
      limit,
      companyId,
      branchId
    })
    
    return NextResponse.json({
      success: true,
      query,
      count: results.length,
      results
    })
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

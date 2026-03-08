/**
 * Seed Model
 * نموذج البيانات التجريبية
 */

export interface SeedCounts {
  companies: number
  branches: number
  users: number
  zones: number
  categories: number
  products: number
  warehouses: number
  customers: number
  invoices: number
  payments: number
  governorates: number
  cities: number
  areas: number
  installmentContracts: number
  installments: number
  commissionPolicies: number
  agentCommissions: number
  returns: number
  notifications: number
  agentLocations: number
  auditLogs: number
  printTemplates: number
  receiptTemplateCategories: number
  globalReceiptTemplates: number
}

export const createEmptySeedCounts = (): SeedCounts => ({
  companies: 0,
  branches: 0,
  users: 0,
  zones: 0,
  categories: 0,
  products: 0,
  warehouses: 0,
  customers: 0,
  invoices: 0,
  payments: 0,
  governorates: 0,
  cities: 0,
  areas: 0,
  installmentContracts: 0,
  installments: 0,
  commissionPolicies: 0,
  agentCommissions: 0,
  returns: 0,
  notifications: 0,
  agentLocations: 0,
  auditLogs: 0,
  printTemplates: 0,
  receiptTemplateCategories: 0,
  globalReceiptTemplates: 0,
})

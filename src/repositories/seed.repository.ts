/**
 * Seed Repository
 * مستودع البيانات التجريبية
 */

import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

const SUPER_ADMIN_PASSWORD = 'WEGSMs@1983'

export const seedRepository = {
  // ==================== Helper Functions ====================
  
  async hashPassword(password: string = SUPER_ADMIN_PASSWORD) {
    return bcrypt.hash(password, 10)
  },

  async findCompanyByCode(code: string) {
    return db.company.findFirst({ where: { code } })
  },

  async createCompany(data: any) {
    return db.company.create({ data })
  },

  async findBranchByCode(code: string) {
    return db.branch.findFirst({ where: { code } })
  },

  async createBranch(data: any) {
    return db.branch.create({ data })
  },

  async findGovernorateByCode(code: string) {
    return db.governorate.findFirst({ where: { code } })
  },

  async createGovernorate(data: any) {
    return db.governorate.create({ data })
  },

  async findCityByCode(code: string) {
    return db.city.findFirst({ where: { code } })
  },

  async createCity(data: any) {
    return db.city.create({ data })
  },

  async findAreaByCode(code: string) {
    return db.area.findFirst({ where: { code } })
  },

  async createArea(data: any) {
    return db.area.create({ data })
  },

  async findUserByEmail(email: string) {
    return db.user.findFirst({ where: { email } })
  },

  async createUser(data: any) {
    return db.user.create({ data })
  },

  async findZoneByCode(code: string) {
    return db.zone.findFirst({ where: { code } })
  },

  async createZone(data: any) {
    return db.zone.create({ data })
  },

  async updateZoneAgents(zoneId: string, agentIds: string[]) {
    return db.zone.update({
      where: { id: zoneId },
      data: { agents: { connect: agentIds.map(id => ({ id })) } }
    })
  },

  async findCategoryByCode(code: string) {
    return db.productCategory.findFirst({ where: { code } })
  },

  async createCategory(data: any) {
    return db.productCategory.create({ data })
  },

  async findProductBySku(sku: string) {
    return db.product.findFirst({ where: { sku } })
  },

  async createProduct(data: any) {
    return db.product.create({ data })
  },

  async findWarehouseByCode(code: string) {
    return db.warehouse.findFirst({ where: { code } })
  },

  async createWarehouse(data: any) {
    return db.warehouse.create({ data })
  },

  async findInventoryItem(productId: string, warehouseId: string) {
    return db.inventory.findFirst({
      where: { productId, warehouseId }
    })
  },

  async createInventory(data: any) {
    return db.inventory.create({ data })
  },

  async findCustomerByCode(code: string) {
    return db.customer.findFirst({ where: { code } })
  },

  async createCustomer(data: any) {
    return db.customer.create({ data })
  },

  async findInvoiceByNumber(invoiceNumber: string) {
    return db.invoice.findFirst({ where: { invoiceNumber } })
  },

  async createInvoice(data: any) {
    return db.invoice.create({ data })
  },

  async createInvoiceItem(data: any) {
    return db.invoiceItem.create({ data })
  },

  async createPayment(data: any) {
    return db.payment.create({ data })
  },

  async findSupplierByCode(code: string) {
    return db.supplier.findFirst({ where: { code } })
  },

  async createSupplier(data: any) {
    return db.supplier.create({ data })
  },

  async createPurchaseInvoice(data: any) {
    return db.purchaseInvoice.create({ data })
  },

  async createPurchaseInvoiceItem(data: any) {
    return db.purchaseInvoiceItem.create({ data })
  },

  async findInstallmentContractByNumber(contractNumber: string) {
    return db.installmentContract.findFirst({ where: { contractNumber } })
  },

  async createInstallmentContract(data: any) {
    return db.installmentContract.create({ data })
  },

  async createInstallment(data: any) {
    return db.installment.create({ data })
  },

  async findCommissionPolicyByName(name: string, companyId: string) {
    return db.commissionPolicy.findFirst({ where: { name, companyId } })
  },

  async createCommissionPolicy(data: any) {
    return db.commissionPolicy.create({ data })
  },

  async createAgentCommission(data: any) {
    return db.agentCommission.create({ data })
  },

  async findReturnByNumber(returnNumber: string) {
    return db.return.findFirst({ where: { returnNumber } })
  },

  async createReturn(data: any) {
    return db.return.create({ data })
  },

  async createReturnItem(data: any) {
    return db.returnItem.create({ data })
  },

  async createNotification(data: any) {
    return db.notification.create({ data })
  },

  async createAgentLocation(data: any) {
    return db.agentLocation.create({ data })
  },

  async createAuditLog(data: any) {
    return db.auditLog.create({ data })
  },

  async findPrintTemplateByCode(code: string) {
    return db.printTemplate.findFirst({ where: { code } })
  },

  async createPrintTemplate(data: any) {
    return db.printTemplate.create({ data })
  },

  async findReceiptTemplateCategoryByCode(code: string) {
    return db.receiptTemplateCategory.findFirst({ where: { code } })
  },

  async createReceiptTemplateCategory(data: any) {
    return db.receiptTemplateCategory.create({ data })
  },

  async createGlobalReceiptTemplate(data: any) {
    return db.globalReceiptTemplate.create({ data })
  },

  async updateInventoryQuantity(productId: string, warehouseId: string, quantity: number) {
    const existing = await db.inventory.findFirst({
      where: { productId, warehouseId }
    })
    
    if (existing) {
      return db.inventory.update({
        where: { id: existing.id },
        data: { quantity }
      })
    }
    
    return null
  }
}

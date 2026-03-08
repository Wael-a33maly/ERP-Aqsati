/**
 * Installment Repository
 * مستودع الأقساط والعقود
 */

import { db } from '@/lib/db'
import {
  InstallmentQueryParams,
  ContractQueryParams,
  CreateContractInput,
  UpdateContractInput,
  CollectPaymentInput,
  CreateInstallmentPaymentInput,
  ContractWithRelations,
} from '@/models/installment.model'
import { Prisma } from '@prisma/client'

// ============ Contract Repository ============

export const contractRepository = {
  /**
   * جلب العقود مع التصفية والصفحات
   */
  async findMany(params: ContractQueryParams) {
    const {
      page = 1,
      limit = 50,
      search,
      companyId,
      customerId,
      agentId,
      status,
      dateFrom,
      dateTo,
      paymentFrequency,
    } = params

    const skip = (page - 1) * limit

    const where: Prisma.InstallmentContractWhereInput = {}

    // Filter by company through invoice relation
    if (companyId) {
      where.Invoice = { companyId }
    }

    if (customerId) where.customerId = customerId
    if (agentId) where.agentId = agentId
    if (status) where.status = status
    if (paymentFrequency) where.paymentFrequency = paymentFrequency

    // Date range filters
    if (dateFrom || dateTo) {
      where.contractDate = {}
      if (dateFrom) where.contractDate.gte = new Date(dateFrom)
      if (dateTo) where.contractDate.lte = new Date(dateTo)
    }

    // Search by contract number or customer name
    if (search) {
      where.OR = [
        { contractNumber: { contains: search, mode: 'insensitive' } },
        { Customer: { name: { contains: search, mode: 'insensitive' } } },
        { Customer: { nameAr: { contains: search, mode: 'insensitive' } } },
        { Customer: { code: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [contracts, total] = await Promise.all([
      db.installmentContract.findMany({
        where,
        skip,
        take: limit,
        include: {
          Invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              invoiceDate: true,
              total: true,
              companyId: true,
              branchId: true,
              Branch: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          Customer: {
            select: {
              id: true,
              code: true,
              name: true,
              nameAr: true,
              phone: true,
              phone2: true,
              balance: true,
            },
          },
          User: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              email: true,
              phone: true,
            },
          },
          Installment: {
            orderBy: { installmentNumber: 'asc' },
            select: {
              id: true,
              installmentNumber: true,
              dueDate: true,
              amount: true,
              paidAmount: true,
              remainingAmount: true,
              status: true,
              lateFee: true,
            },
          },
          _count: {
            select: {
              Installment: true,
            },
          },
        },
        orderBy: {
          contractDate: 'desc',
        },
      }),
      db.installmentContract.count({ where }),
    ])

    return { contracts: contracts as ContractWithRelations[], total }
  },

  /**
   * جلب عقد واحد بالمعرف
   */
  async findById(id: string) {
    return db.installmentContract.findUnique({
      where: { id },
      include: {
        installments: {
          orderBy: { installmentNumber: 'asc' },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
          },
        },
        customer: {
          select: {
            id: true,
            code: true,
            name: true,
            nameAr: true,
          },
        },
      },
    })
  },

  /**
   * إنشاء عقد جديد
   */
  async create(data: Prisma.InstallmentContractCreateInput) {
    return db.installmentContract.create({
      data,
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
          },
        },
        customer: {
          select: {
            id: true,
            code: true,
            name: true,
            nameAr: true,
          },
        },
      },
    })
  },

  /**
   * تحديث عقد
   */
  async update(id: string, data: Prisma.InstallmentContractUpdateInput) {
    return db.installmentContract.update({
      where: { id },
      data,
      include: {
        installments: {
          orderBy: { installmentNumber: 'asc' },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
          },
        },
        customer: {
          select: {
            id: true,
            code: true,
            name: true,
            nameAr: true,
          },
        },
      },
    })
  },

  /**
   * جلب ملخص العقود
   */
  async getSummary(where: Prisma.InstallmentContractWhereInput) {
    const summaryData = await db.installmentContract.aggregate({
      where,
      _sum: {
        totalAmount: true,
        downPayment: true,
        financedAmount: true,
        interestAmount: true,
      },
      _count: {
        id: true,
      },
    })

    const overdueCount = await db.installment.count({
      where: {
        status: 'overdue',
      },
    })

    return {
      totalContracts: summaryData._count.id,
      totalAmount: summaryData._sum.totalAmount || 0,
      totalDownPayments: summaryData._sum.downPayment || 0,
      totalFinanced: summaryData._sum.financedAmount || 0,
      totalInterest: summaryData._sum.interestAmount || 0,
      overdueInstallments: overdueCount,
    }
  },
}

// ============ Installment Repository ============

export const installmentRepository = {
  /**
   * جلب جميع الأقساط
   */
  async findAll(companyId?: string) {
    const where: Prisma.InstallmentWhereInput = {}
    
    if (companyId) {
      where.InstallmentContract = {
        Invoice: { companyId }
      }
    }

    return db.installment.findMany({
      where,
      include: {
        InstallmentContract: {
          include: {
            Customer: {
              include: {
                Zone: true,
                Governorate: true,
                City: true,
              },
            },
            User: {
              select: { id: true, name: true, phone: true },
            },
            Invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                branchId: true,
                companyId: true,
                Branch: { select: { id: true, name: true } },
                Company: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    })
  },

  /**
   * جلب الأقساط مع التصفية
   */
  async findMany(params: InstallmentQueryParams) {
    const { page = 1, limit = 10, search, status, companyId } = params
    const skip = (page - 1) * limit

    const where: Prisma.InstallmentWhereInput = {}

    if (companyId) {
      where.InstallmentContract = {
        Invoice: { companyId }
      }
    }

    if (status) where.status = status

    if (search) {
      where.OR = [
        { InstallmentContract: { contractNumber: { contains: search } } },
        { InstallmentContract: { Customer: { name: { contains: search } } } },
      ]
    }

    const [installments, total] = await Promise.all([
      db.installment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          InstallmentContract: {
            include: {
              Customer: { select: { id: true, name: true, phone: true, companyId: true } },
              Invoice: { select: { id: true, invoiceNumber: true } },
            },
          },
        },
      }),
      db.installment.count({ where }),
    ])

    return { installments, total }
  },

  /**
   * جلب قسط واحد بالمعرف
   */
  async findById(id: string) {
    return db.installment.findUnique({
      where: { id },
      include: {
        InstallmentContract: {
          include: {
            Customer: true,
            Invoice: true,
            User: { select: { id: true, name: true, phone: true } },
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    })
  },

  /**
   * جلب قسط مع مدفوعاته
   */
  async findWithPayments(id: string) {
    return db.installment.findUnique({
      where: { id },
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
            totalAmount: true,
            downPayment: true,
            financedAmount: true,
            numberOfPayments: true,
            status: true,
            customer: {
              select: {
                id: true,
                code: true,
                name: true,
                nameAr: true,
                phone: true,
                phone2: true,
                address: true,
              },
            },
            agent: {
              select: {
                id: true,
                name: true,
                nameAr: true,
              },
            },
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          include: {
            agent: {
              select: {
                id: true,
                name: true,
                nameAr: true,
              },
            },
          },
        },
      },
    })
  },

  /**
   * تحديث قسط
   */
  async update(id: string, data: Prisma.InstallmentUpdateInput) {
    return db.installment.update({
      where: { id },
      data,
    })
  },

  /**
   * جلب أقساط عقد معين
   */
  async findByContractId(contractId: string) {
    return db.installment.findMany({
      where: { contractId },
    })
  },

  /**
   * إنشاء أقساط متعددة
   */
  async createMany(data: Prisma.InstallmentCreateManyInput[]) {
    return db.installment.createMany({
      data,
    })
  },

  /**
   * تحديث حالة الأقساط
   */
  async updateMany(where: Prisma.InstmentWhereInput, data: Prisma.InstallmentUpdateManyMutationInput) {
    return db.installment.updateMany({
      where,
      data,
    })
  },
}

// ============ Installment Payment Repository ============

export const installmentPaymentRepository = {
  /**
   * إنشاء سجل دفعة
   */
  async create(data: Prisma.InstallmentPaymentCreateInput) {
    return db.installmentPayment.create({
      data,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            nameAr: true,
          },
        },
      },
    })
  },

  /**
   * حذف سجل دفعة
   */
  async delete(id: string) {
    return db.installmentPayment.delete({
      where: { id },
    })
  },

  /**
   * جلب دفعات قسط معين
   */
  async findByInstallmentId(installmentId: string) {
    return db.installmentPayment.findMany({
      where: { installmentId },
      orderBy: { paymentDate: 'desc' },
    })
  },
}

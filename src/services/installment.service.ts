/**
 * Installment Service
 * خدمات الأقساط والعقود
 */

import { db } from '@/lib/db'
import {
  contractRepository,
  installmentRepository,
  installmentPaymentRepository,
} from '@/repositories/installment.repository'
import {
  InstallmentQueryParams,
  ContractQueryParams,
  CreateContractInput,
  UpdateContractInput,
  CreateInstallmentPaymentInput,
  ContractWithRelations,
  ContractStats,
  ContractSummary,
} from '@/models/installment.model'
import { generateContractNumber } from '@/lib/utils/invoice-number'
import { Prisma } from '@prisma/client'

// ============ Contract Service ============

export const contractService = {
  /**
   * جلب العقود مع التصفية
   */
  async getContracts(params: ContractQueryParams) {
    const { page = 1, limit = 50 } = params

    const { contracts, total } = await contractRepository.findMany(params)

    // Calculate summary stats for each contract
    const contractsWithStats = contracts.map((contract: ContractWithRelations) => {
      const installments = contract.Installment || []
      const stats = calculateContractStats(installments)

      return {
        ...contract,
        invoice: contract.Invoice,
        customer: contract.Customer,
        agent: contract.User,
        installments: installments,
        stats,
      }
    })

    // Get summary
    const where: Prisma.InstallmentContractWhereInput = {}
    if (params.companyId) {
      where.Invoice = { companyId: params.companyId }
    }

    const summary = await contractRepository.getSummary(where)

    return {
      success: true,
      data: contractsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary,
    }
  },

  /**
   * إنشاء عقد أقساط جديد
   */
  async createContract(data: CreateContractInput) {
    const {
      invoiceId,
      customerId,
      agentId,
      contractDate,
      downPayment,
      numberOfPayments,
      paymentFrequency,
      interestRate = 0,
      startDate,
      notes,
    } = data

    // Validate required fields
    if (!invoiceId || !customerId || !numberOfPayments || !paymentFrequency || !startDate) {
      return {
        success: false,
        error: 'Invoice ID, customer ID, number of payments, payment frequency, and start date are required',
      }
    }

    if (numberOfPayments < 1) {
      return {
        success: false,
        error: 'Number of payments must be at least 1',
      }
    }

    // Check if invoice exists and doesn't already have a contract
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        installmentContract: true,
        customer: true,
      },
    })

    if (!invoice) {
      return {
        success: false,
        error: 'Invoice not found',
      }
    }

    if (invoice.installmentContract) {
      return {
        success: false,
        error: 'Invoice already has an installment contract',
      }
    }

    if (invoice.customerId !== customerId) {
      return {
        success: false,
        error: 'Invoice does not belong to this customer',
      }
    }

    // Verify customer exists
    const customer = await db.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      return {
        success: false,
        error: 'Customer not found',
      }
    }

    // Calculate contract amounts
    const invoiceTotal = invoice.total
    const financedAmount = invoiceTotal - downPayment
    const interestAmount = financedAmount * (interestRate / 100)
    const totalContractAmount = financedAmount + interestAmount
    const paymentAmount = totalContractAmount / numberOfPayments

    // Calculate end date based on frequency
    const contractStartDate = new Date(startDate)
    const contractEndDate = new Date(contractStartDate)

    switch (paymentFrequency) {
      case 'WEEKLY':
        contractEndDate.setDate(contractEndDate.getDate() + numberOfPayments * 7)
        break
      case 'BI_WEEKLY':
        contractEndDate.setDate(contractEndDate.getDate() + numberOfPayments * 14)
        break
      case 'MONTHLY':
      default:
        contractEndDate.setMonth(contractEndDate.getMonth() + numberOfPayments)
        break
    }

    // Generate contract number
    const contractNumber = await generateContractNumber()

    // Create contract with installment schedule in transaction
    const contract = await db.$transaction(async (tx) => {
      // Create installment contract
      const newContract = await tx.installmentContract.create({
        data: {
          invoiceId,
          customerId,
          agentId: agentId || null,
          contractNumber,
          contractDate: contractDate ? new Date(contractDate) : new Date(),
          totalAmount: totalContractAmount,
          downPayment,
          financedAmount,
          numberOfPayments,
          paymentFrequency,
          interestRate,
          interestAmount,
          startDate: contractStartDate,
          endDate: contractEndDate,
          status: 'active',
          notes: notes || null,
        },
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

      // Create installment schedule
      const installments = []
      for (let i = 1; i <= numberOfPayments; i++) {
        const dueDate = new Date(contractStartDate)

        switch (paymentFrequency) {
          case 'WEEKLY':
            dueDate.setDate(dueDate.getDate() + i * 7)
            break
          case 'BI_WEEKLY':
            dueDate.setDate(dueDate.getDate() + i * 14)
            break
          case 'MONTHLY':
          default:
            dueDate.setMonth(dueDate.getMonth() + i)
            break
        }

        installments.push({
          contractId: newContract.id,
          installmentNumber: i,
          dueDate,
          amount: paymentAmount,
          paidAmount: 0,
          remainingAmount: paymentAmount,
          status: 'pending' as const,
        })
      }

      await tx.installment.createMany({
        data: installments,
      })

      // Update invoice type and remaining amount
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          type: 'INSTALLMENT',
          paidAmount: downPayment,
          remainingAmount: financedAmount,
          status: downPayment >= invoiceTotal ? 'paid' : 'partial',
        },
      })

      // Update customer balance
      const newBalance = customer.balance + financedAmount
      await tx.customer.update({
        where: { id: customerId },
        data: { balance: newBalance },
      })

      return newContract
    })

    // Fetch the created contract with installments
    const contractWithInstallments = await contractRepository.findById(contract.id)

    return {
      success: true,
      data: contractWithInstallments,
      message: 'Installment contract created successfully',
    }
  },

  /**
   * تحديث عقد أقساط
   */
  async updateContract(data: UpdateContractInput) {
    const { id, agentId, startDate, notes, status } = data

    if (!id) {
      return {
        success: false,
        error: 'Contract ID is required',
      }
    }

    // Get existing contract
    const existingContract = await db.installmentContract.findUnique({
      where: { id },
      include: {
        installments: true,
        invoice: true,
        customer: true,
      },
    })

    if (!existingContract) {
      return {
        success: false,
        error: 'Contract not found',
      }
    }

    // Build update data
    const updateData: Prisma.InstallmentContractUpdateInput = {}

    if (agentId !== undefined) updateData.agentId = agentId || null
    if (notes !== undefined) updateData.notes = notes

    // Handle status changes
    if (status !== undefined && status !== existingContract.status) {
      // Validate status transitions
      if (existingContract.status === 'cancelled') {
        return {
          success: false,
          error: 'Cannot modify cancelled contract',
        }
      }

      if (existingContract.status === 'completed') {
        return {
          success: false,
          error: 'Cannot modify completed contract',
        }
      }

      updateData.status = status
    }

    // Update contract with transaction for status changes
    const contract = await db.$transaction(async (tx) => {
      const updatedContract = await tx.installmentContract.update({
        where: { id },
        data: updateData,
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

      // Handle cancellation
      if (status === 'cancelled' && existingContract.status !== 'cancelled') {
        // Cancel all pending installments
        await tx.installment.updateMany({
          where: {
            contractId: id,
            status: { in: ['pending', 'partial', 'overdue'] },
          },
          data: { status: 'cancelled' },
        })

        // Reverse customer balance
        const totalRemaining = existingContract.installments
          .filter((i) => i.status !== 'paid')
          .reduce((sum, i) => sum + i.remainingAmount, 0)

        await tx.customer.update({
          where: { id: existingContract.customerId },
          data: {
            balance: { decrement: totalRemaining },
          },
        })

        // Update invoice
        await tx.invoice.update({
          where: { id: existingContract.invoiceId },
          data: {
            status: 'cancelled',
          },
        })
      }

      return updatedContract
    })

    return {
      success: true,
      data: contract,
      message: 'Installment contract updated successfully',
    }
  },

  /**
   * إلغاء عقد أقساط
   */
  async cancelContract(id: string) {
    // Get existing contract
    const existingContract = await db.installmentContract.findUnique({
      where: { id },
      include: {
        installments: true,
        invoice: true,
        customer: true,
      },
    })

    if (!existingContract) {
      return {
        success: false,
        error: 'Contract not found',
      }
    }

    if (existingContract.status === 'cancelled') {
      return {
        success: false,
        error: 'Contract is already cancelled',
      }
    }

    // Check if any installments are paid
    const paidInstallments = existingContract.installments.filter((i) => i.status === 'paid')
    if (paidInstallments.length > 0) {
      return {
        success: false,
        error: 'Cannot cancel contract with paid installments. Please reverse payments first.',
      }
    }

    // Cancel contract with transaction
    await db.$transaction(async (tx) => {
      // Update contract status
      await tx.installmentContract.update({
        where: { id },
        data: { status: 'cancelled' },
      })

      // Cancel all installments
      await tx.installment.updateMany({
        where: { contractId: id },
        data: { status: 'cancelled' },
      })

      // Reverse customer balance
      await tx.customer.update({
        where: { id: existingContract.customerId },
        data: {
          balance: { decrement: existingContract.financedAmount },
        },
      })

      // Update invoice
      await tx.invoice.update({
        where: { id: existingContract.invoiceId },
        data: {
          type: 'CASH',
          status: 'pending',
          paidAmount: 0,
          remainingAmount: existingContract.invoice?.total || 0,
        },
      })
    })

    return {
      success: true,
      message: 'Installment contract cancelled successfully',
    }
  },
}

// ============ Installment Service ============

export const installmentService = {
  /**
   * جلب جميع الأقساط
   */
  async getAll(companyId?: string) {
    const installments = await installmentRepository.findAll(companyId)

    // Transform for frontend compatibility
    const formattedInstallments = installments.map((inst: any) => ({
      ...inst,
      contract: {
        ...inst.InstallmentContract,
        customer: inst.InstallmentContract?.Customer,
        agent: inst.InstallmentContract?.User,
        invoice: inst.InstallmentContract?.Invoice,
      },
    }))

    return {
      success: true,
      data: formattedInstallments,
    }
  },

  /**
   * جلب الأقساط مع التصفية
   */
  async getInstallments(params: InstallmentQueryParams) {
    const { page = 1, limit = 10 } = params

    const { installments, total } = await installmentRepository.findMany(params)

    return {
      success: true,
      data: installments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  /**
   * جلب قسط مع مدفوعاته
   */
  async getInstallmentPayments(id: string) {
    const installment = await installmentRepository.findWithPayments(id)

    if (!installment) {
      return {
        success: false,
        error: 'Installment not found',
      }
    }

    // Calculate late fee if overdue
    let lateFee = 0
    if (
      installment.status !== 'paid' &&
      installment.status !== 'cancelled' &&
      new Date() > installment.dueDate
    ) {
      const daysOverdue = Math.floor(
        (new Date().getTime() - installment.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      const lateFeeRate = 0.001 // 0.1% per day
      lateFee = installment.remainingAmount * lateFeeRate * daysOverdue
    }

    return {
      success: true,
      data: {
        ...installment,
        calculatedLateFee: lateFee,
        totalDue: installment.remainingAmount + lateFee,
      },
    }
  },

  /**
   * تسجيل دفعة قسط
   */
  async recordPayment(id: string, data: CreateInstallmentPaymentInput) {
    const { agentId, paymentDate, amount, method, reference, notes, includeLateFee = false } = data

    // Validate required fields
    if (!amount || amount <= 0) {
      return {
        success: false,
        error: 'Valid payment amount is required',
      }
    }

    if (!method) {
      return {
        success: false,
        error: 'Payment method is required',
      }
    }

    // Get installment with contract details
    const installment = await db.installment.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            customer: true,
            invoice: true,
          },
        },
        payments: true,
      },
    })

    if (!installment) {
      return {
        success: false,
        error: 'Installment not found',
      }
    }

    // Check if installment can accept payments
    if (installment.status === 'paid') {
      return {
        success: false,
        error: 'Installment is already fully paid',
      }
    }

    if (installment.status === 'cancelled') {
      return {
        success: false,
        error: 'Cannot record payment for cancelled installment',
      }
    }

    // Calculate late fee if applicable
    let lateFee = 0
    if (includeLateFee && new Date() > installment.dueDate) {
      const daysOverdue = Math.floor(
        (new Date().getTime() - installment.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      const lateFeeRate = 0.001 // 0.1% per day
      lateFee = installment.remainingAmount * lateFeeRate * daysOverdue
    }

    const totalDue = installment.remainingAmount + lateFee

    // Validate payment amount
    if (amount > totalDue) {
      return {
        success: false,
        error: `Payment amount exceeds total due. Maximum allowed: ${totalDue.toFixed(2)}`,
      }
    }

    // Record payment with transaction
    const result = await db.$transaction(async (tx) => {
      // Create installment payment record
      const payment = await tx.installmentPayment.create({
        data: {
          installmentId: id,
          companyId: installment.companyId,
          agentId: agentId || null,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          amount,
          method,
          reference: reference || null,
          notes: notes || null,
        },
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

      // Update installment status
      const newPaidAmount = installment.paidAmount + amount
      const newRemainingAmount =
        installment.remainingAmount - amount + (includeLateFee ? lateFee : 0)

      let newStatus = installment.status
      if (newRemainingAmount <= 0) {
        newStatus = 'paid'
      } else if (newPaidAmount > 0) {
        newStatus = 'partial'
      }

      await tx.installment.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: Math.max(0, newRemainingAmount),
          status: newStatus,
          paidDate: newStatus === 'paid' ? new Date() : null,
          lateFee: includeLateFee ? { increment: lateFee } : installment.lateFee,
        },
      })

      // Update customer balance
      const customer = installment.contract.customer
      await tx.customer.update({
        where: { id: customer.id },
        data: {
          balance: { decrement: amount },
        },
      })

      // Check if contract is completed
      const allInstallments = await tx.installment.findMany({
        where: { contractId: installment.contractId },
        select: { status: true },
      })

      const allPaid = allInstallments.every((i) => i.status === 'paid')

      if (allPaid) {
        await tx.installmentContract.update({
          where: { id: installment.contractId },
          data: { status: 'completed' },
        })

        await tx.invoice.update({
          where: { id: installment.contract.invoiceId },
          data: {
            status: 'paid',
            paidAmount: installment.contract.totalAmount,
            remainingAmount: 0,
          },
        })
      }

      // Create agent commission if applicable
      if (agentId) {
        const commissionPolicy = await tx.commissionPolicy.findFirst({
          where: {
            companyId: installment.contract.invoice?.companyId,
            OR: [{ agentId }, { agentId: null }],
            type: { in: ['COLLECTION', 'BOTH'] },
            active: true,
          },
        })

        if (commissionPolicy) {
          let commissionAmount = 0

          if (commissionPolicy.calculationType === 'PERCENTAGE') {
            commissionAmount = amount * (commissionPolicy.value / 100)
          } else {
            commissionAmount = commissionPolicy.value
          }

          // Apply min/max if set
          if (commissionPolicy.minAmount && commissionAmount < commissionPolicy.minAmount) {
            commissionAmount = commissionPolicy.minAmount
          }
          if (commissionPolicy.maxAmount && commissionAmount > commissionPolicy.maxAmount) {
            commissionAmount = commissionPolicy.maxAmount
          }

          await tx.agentCommission.create({
            data: {
              companyId: installment.contract.invoice?.companyId || '',
              agentId,
              policyId: commissionPolicy.id,
              type: 'COLLECTION',
              referenceType: 'PAYMENT',
              referenceId: payment.id,
              amount: commissionAmount,
              status: 'pending',
            },
          })
        }
      }

      return payment
    })

    // Fetch updated installment
    const updatedInstallment = await installmentRepository.findById(id)

    return {
      success: true,
      data: {
        payment: result,
        installment: updatedInstallment,
      },
      message: 'Installment payment recorded successfully',
    }
  },

  /**
   * إلغاء دفعة قسط
   */
  async reversePayment(installmentId: string, paymentId: string) {
    // Get installment and payment
    const installment = await db.installment.findUnique({
      where: { id: installmentId },
      include: {
        contract: {
          include: {
            customer: true,
            invoice: true,
          },
        },
        payments: {
          where: { id: paymentId },
        },
      },
    })

    if (!installment) {
      return {
        success: false,
        error: 'Installment not found',
      }
    }

    const payment = installment.payments[0]
    if (!payment) {
      return {
        success: false,
        error: 'Payment not found',
      }
    }

    // Reverse payment with transaction
    await db.$transaction(async (tx) => {
      // Delete the payment record
      await tx.installmentPayment.delete({
        where: { id: paymentId },
      })

      // Update installment status
      const newPaidAmount = installment.paidAmount - payment.amount
      const newRemainingAmount = installment.remainingAmount + payment.amount

      let newStatus = 'pending'
      if (newPaidAmount > 0) {
        newStatus = 'partial'
      }

      // Check if overdue
      if (new Date() > installment.dueDate && newRemainingAmount > 0) {
        newStatus = 'overdue'
      }

      await tx.installment.update({
        where: { id: installmentId },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newStatus,
          paidDate: null,
        },
      })

      // Update customer balance
      await tx.customer.update({
        where: { id: installment.contract.customerId },
        data: {
          balance: { increment: payment.amount },
        },
      })

      // Check if contract needs to be reactivated
      if (installment.contract.status === 'completed') {
        await tx.installmentContract.update({
          where: { id: installment.contractId },
          data: { status: 'active' },
        })

        await tx.invoice.update({
          where: { id: installment.contract.invoiceId },
          data: {
            status: 'partial',
            remainingAmount: payment.amount,
          },
        })
      }

      // Cancel agent commissions
      await tx.agentCommission.updateMany({
        where: {
          referenceType: 'PAYMENT',
          referenceId: paymentId,
        },
        data: { status: 'cancelled' },
      })
    })

    return {
      success: true,
      message: 'Installment payment reversed successfully',
    }
  },

  /**
   * تحصيل قسط
   */
  async collectPayment(data: {
    installmentId: string
    amount: number
    method: string
    notes?: string
    paymentDate?: string
  }) {
    const { installmentId, amount, method, notes, paymentDate } = data

    if (!installmentId || !amount || amount <= 0) {
      return {
        success: false,
        error: 'بيانات غير صحيحة',
      }
    }

    // تاريخ الدفع (الافتراضي اليوم)
    const actualPaymentDate = paymentDate ? new Date(paymentDate) : new Date()

    // جلب القسط مع العلاقات الصحيحة
    const installment = await db.installment.findUnique({
      where: { id: installmentId },
      include: {
        InstallmentContract: {
          include: {
            Customer: true,
            Invoice: true,
          },
        },
      },
    })

    if (!installment) {
      return {
        success: false,
        error: 'القسط غير موجود',
      }
    }

    const contract = installment.InstallmentContract
    if (!contract) {
      return {
        success: false,
        error: 'العقد غير موجود',
      }
    }

    const newPaidAmount = (installment.paidAmount || 0) + amount
    const newRemainingAmount = installment.amount - newPaidAmount
    const isFullyPaid = newRemainingAmount <= 0

    // تحديث القسط
    const updatedInstallment = await db.$transaction(async (tx) => {
      const updated = await tx.installment.update({
        where: { id: installmentId },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: Math.max(0, newRemainingAmount),
          status: isFullyPaid ? 'paid' : 'partial',
          paidDate: isFullyPaid ? actualPaymentDate : installment.paidDate,
          notes: notes ? `${installment.notes || ''}\n${notes}` : installment.notes,
        },
      })

      // إنشاء سجل دفعة
      const paymentNumber = `PAY-${Date.now()}`
      await tx.payment.create({
        data: {
          companyId: contract.Invoice?.companyId || 'default',
          branchId: contract.Invoice?.branchId || null,
          invoiceId: contract.Invoice?.id || null,
          customerId: contract.customerId,
          paymentNumber,
          paymentDate: actualPaymentDate,
          method: method || 'CASH',
          amount: amount,
          status: 'completed',
          notes: `تحصيل قسط رقم ${installment.installmentNumber} - ${contract.contractNumber}`,
        },
      })

      // إنشاء سجل دفعة قسط
      await tx.installmentPayment.create({
        data: {
          installmentId: installment.id,
          agentId: contract.agentId || null,
          paymentDate: actualPaymentDate,
          amount: amount,
          method: method || 'CASH',
          notes: notes || null,
        },
      })

      // تحديث حالة العقد إذا اكتملت جميع الأقساط
      if (isFullyPaid) {
        const allInstallments = await tx.installment.findMany({
          where: { contractId: installment.contractId },
        })

        const allPaid = allInstallments.every((inst) => inst.status === 'paid')

        if (allPaid) {
          await tx.installmentContract.update({
            where: { id: installment.contractId },
            data: { status: 'completed' },
          })

          // تحديث حالة الفاتورة أيضاً
          if (contract.invoiceId) {
            await tx.invoice.update({
              where: { id: contract.invoiceId },
              data: {
                status: 'paid',
                paidAmount: contract.Invoice?.total || 0,
                remainingAmount: 0,
              },
            })
          }
        }
      }

      // تحديث رصيد العميل
      await tx.customer.update({
        where: { id: contract.customerId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      })

      return updated
    })

    return {
      success: true,
      data: updatedInstallment,
      message: isFullyPaid ? 'تم تحصيل القسط بالكامل' : 'تم تسجيل الدفعة الجزئية',
    }
  },
}

// ============ Helper Functions ============

function calculateContractStats(installments: any[]): ContractStats {
  const totalPaid = installments.reduce((sum: number, i: any) => sum + i.paidAmount, 0)
  const totalRemaining = installments.reduce((sum: number, i: any) => sum + i.remainingAmount, 0)
  const paidInstallments = installments.filter((i: any) => i.status === 'paid').length
  const overdueInstallments = installments.filter((i: any) => i.status === 'overdue').length
  const nextDueInstallment = installments.find(
    (i: any) => i.status === 'pending' || i.status === 'overdue'
  )

  return {
    totalPaid,
    totalRemaining,
    paidInstallments,
    pendingInstallments: installments.length - paidInstallments,
    overdueInstallments,
    progressPercentage:
      installments.length > 0 ? (paidInstallments / installments.length) * 100 : 0,
    nextDueDate: nextDueInstallment?.dueDate || null,
    nextDueAmount: nextDueInstallment?.remainingAmount || 0,
  }
}

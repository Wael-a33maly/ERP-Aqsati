// Accounting Repository - مستودع البيانات المحاسبية

import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export class AccountingRepository {
  // ==================== Account Operations ====================

  async createAccount(data: Prisma.AccountCreateInput) {
    return db.account.create({
      data,
      include: {
        Parent: true,
        Children: true,
      },
    });
  }

  async findAccountById(id: string) {
    return db.account.findUnique({
      where: { id },
      include: {
        Parent: true,
        Children: true,
        Company: true,
      },
    });
  }

  async findAccountByCode(companyId: string, code: string) {
    return db.account.findUnique({
      where: {
        companyId_code: { companyId, code },
      },
    });
  }

  async findAccountsByCompany(companyId: string, filters?: {
    accountType?: string;
    parentId?: string | null;
    active?: boolean;
    isLeaf?: boolean;
    search?: string;
  }) {
    const where: Prisma.AccountWhereInput = { companyId };

    if (filters?.accountType) {
      where.accountType = filters.accountType;
    }
    if (filters?.parentId !== undefined) {
      where.parentId = filters.parentId || null;
    }
    if (filters?.active !== undefined) {
      where.active = filters.active;
    }
    if (filters?.isLeaf !== undefined) {
      where.isLeaf = filters.isLeaf;
    }
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { nameAr: { contains: filters.search } },
        { code: { contains: filters.search } },
      ];
    }

    return db.account.findMany({
      where,
      include: {
        Parent: true,
        Children: {
          where: { active: true },
        },
      },
      orderBy: [{ accountType: 'asc' }, { code: 'asc' }],
    });
  }

  async updateAccount(id: string, data: Prisma.AccountUpdateInput) {
    return db.account.update({
      where: { id },
      data,
      include: {
        Parent: true,
        Children: true,
      },
    });
  }

  async deleteAccount(id: string) {
    // Check if account has children
    const children = await db.account.count({
      where: { parentId: id },
    });
    if (children > 0) {
      throw new Error('لا يمكن حذف الحساب لوجود حسابات فرعية');
    }

    // Check if account has journal entries
    const journalLines = await db.journalEntryLine.count({
      where: { accountId: id },
    });
    if (journalLines > 0) {
      throw new Error('لا يمكن حذف الحساب لوجود قيود مرتبطة');
    }

    return db.account.delete({ where: { id } });
  }

  async getAccountTree(companyId: string): Promise<any[]> {
    const accounts = await db.account.findMany({
      where: { companyId, active: true },
      include: {
        Children: {
          where: { active: true },
          include: {
            Children: {
              where: { active: true },
            },
          },
        },
      },
      orderBy: [{ accountType: 'asc' }, { code: 'asc' }],
    });

    // Return only root accounts (no parent)
    return accounts.filter(a => !a.parentId);
  }

  async getAccountBalance(accountId: string, asOfDate?: Date) {
    const whereClause: Prisma.JournalEntryLineWhereInput = {
      accountId,
      JournalEntry: {
        status: 'approved',
      },
    };

    if (asOfDate) {
      whereClause.JournalEntry = {
        ...whereClause.JournalEntry as Prisma.JournalEntryWhereInput,
        entryDate: { lte: asOfDate },
      };
    }

    const result = await db.journalEntryLine.aggregate({
      where: whereClause,
      _sum: {
        debit: true,
        credit: true,
      },
    });

    return {
      totalDebit: result._sum.debit || 0,
      totalCredit: result._sum.credit || 0,
    };
  }

  async getNextAccountCode(companyId: string, parentId?: string): Promise<string> {
    if (parentId) {
      const parent = await db.account.findUnique({
        where: { id: parentId },
      });
      if (!parent) throw new Error('الحساب الأب غير موجود');

      const siblings = await db.account.count({
        where: { parentId, companyId },
      });
      return `${parent.code}${String(siblings + 1).padStart(2, '0')}`;
    } else {
      const count = await db.account.count({
        where: { companyId, parentId: null },
      });
      return String(count + 1).padStart(3, '0');
    }
  }

  // ==================== Fiscal Year Operations ====================

  async createFiscalYear(data: Prisma.FiscalYearCreateInput) {
    return db.fiscalYear.create({
      data,
      include: {
        Company: true,
        Periods: true,
      },
    });
  }

  async findFiscalYearById(id: string) {
    return db.fiscalYear.findUnique({
      where: { id },
      include: {
        Periods: {
          orderBy: { periodNumber: 'asc' },
        },
        JournalEntries: true,
      },
    });
  }

  async findFiscalYearsByCompany(companyId: string) {
    return db.fiscalYear.findMany({
      where: { companyId },
      include: {
        Periods: true,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findCurrentFiscalYear(companyId: string) {
    return db.fiscalYear.findFirst({
      where: { companyId, isCurrent: true },
      include: {
        Periods: {
          orderBy: { periodNumber: 'asc' },
        },
      },
    });
  }

  async updateFiscalYear(id: string, data: Prisma.FiscalYearUpdateInput) {
    return db.fiscalYear.update({
      where: { id },
      data,
      include: {
        Periods: true,
      },
    });
  }

  async setCurrentFiscalYear(companyId: string, fiscalYearId: string) {
    // Unset current for all other fiscal years
    await db.fiscalYear.updateMany({
      where: { companyId, id: { not: fiscalYearId } },
      data: { isCurrent: false },
    });

    // Set current for the specified fiscal year
    return db.fiscalYear.update({
      where: { id: fiscalYearId },
      data: { isCurrent: true },
    });
  }

  // ==================== Accounting Period Operations ====================

  async createAccountingPeriod(data: Prisma.AccountingPeriodCreateInput) {
    return db.accountingPeriod.create({
      data,
      include: {
        FiscalYear: true,
      },
    });
  }

  async findAccountingPeriodById(id: string) {
    return db.accountingPeriod.findUnique({
      where: { id },
      include: {
        FiscalYear: true,
        JournalEntries: true,
      },
    });
  }

  async findPeriodsByFiscalYear(fiscalYearId: string) {
    return db.accountingPeriod.findMany({
      where: { fiscalYearId },
      orderBy: { periodNumber: 'asc' },
    });
  }

  async findPeriodForDate(companyId: string, date: Date) {
    return db.accountingPeriod.findFirst({
      where: {
        companyId,
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });
  }

  async updateAccountingPeriod(id: string, data: Prisma.AccountingPeriodUpdateInput) {
    return db.accountingPeriod.update({
      where: { id },
      data,
    });
  }

  // ==================== Journal Entry Operations ====================

  async createJournalEntry(data: Prisma.JournalEntryCreateInput) {
    return db.journalEntry.create({
      data,
      include: {
        Lines: {
          include: {
            Account: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        Company: true,
        Branch: true,
      },
    });
  }

  async findJournalEntryById(id: string) {
    return db.journalEntry.findUnique({
      where: { id },
      include: {
        Lines: {
          include: {
            Account: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        Company: true,
        Branch: true,
        FiscalYear: true,
        Period: true,
      },
    });
  }

  async findJournalEntriesByCompany(companyId: string, filters?: {
    branchId?: string;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    referenceType?: string;
    referenceId?: string;
    search?: string;
  }) {
    const where: Prisma.JournalEntryWhereInput = { companyId };

    if (filters?.branchId) {
      where.branchId = filters.branchId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.fromDate || filters?.toDate) {
      where.entryDate = {};
      if (filters.fromDate) where.entryDate.gte = filters.fromDate;
      if (filters.toDate) where.entryDate.lte = filters.toDate;
    }
    if (filters?.referenceType) {
      where.referenceType = filters.referenceType;
    }
    if (filters?.referenceId) {
      where.referenceId = filters.referenceId;
    }
    if (filters?.search) {
      where.OR = [
        { entryNumber: { contains: filters.search } },
        { description: { contains: filters.search } },
        { notes: { contains: filters.search } },
      ];
    }

    return db.journalEntry.findMany({
      where,
      include: {
        Lines: {
          include: {
            Account: true,
          },
        },
        Branch: true,
      },
      orderBy: { entryDate: 'desc' },
    });
  }

  async updateJournalEntry(id: string, data: Prisma.JournalEntryUpdateInput) {
    return db.journalEntry.update({
      where: { id },
      data,
      include: {
        Lines: {
          include: {
            Account: true,
          },
        },
      },
    });
  }

  async deleteJournalEntry(id: string) {
    // Delete lines first
    await db.journalEntryLine.deleteMany({
      where: { entryId: id },
    });

    return db.journalEntry.delete({
      where: { id },
    });
  }

  async getNextJournalEntryNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await db.journalEntry.count({
      where: {
        companyId,
        entryNumber: { startsWith: `JE-${year}-` },
      },
    });
    return `JE-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  async approveJournalEntry(id: string, approvedBy: string) {
    return db.journalEntry.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
      },
    });
  }

  async cancelJournalEntry(id: string, cancelledBy: string, reason?: string) {
    return db.journalEntry.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledBy,
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });
  }

  // ==================== Voucher Operations ====================

  async createVoucher(data: Prisma.VoucherCreateInput) {
    return db.voucher.create({
      data,
      include: {
        Lines: {
          include: {
            Account: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        Company: true,
        Branch: true,
      },
    });
  }

  async findVoucherById(id: string) {
    return db.voucher.findUnique({
      where: { id },
      include: {
        Lines: {
          include: {
            Account: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        Company: true,
        Branch: true,
      },
    });
  }

  async findVouchersByCompany(companyId: string, filters?: {
    branchId?: string;
    voucherType?: string;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    paymentMethod?: string;
    search?: string;
  }) {
    const where: Prisma.VoucherWhereInput = { companyId };

    if (filters?.branchId) {
      where.branchId = filters.branchId;
    }
    if (filters?.voucherType) {
      where.voucherType = filters.voucherType;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.fromDate || filters?.toDate) {
      where.voucherDate = {};
      if (filters.fromDate) where.voucherDate.gte = filters.fromDate;
      if (filters.toDate) where.voucherDate.lte = filters.toDate;
    }
    if (filters?.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }
    if (filters?.search) {
      where.OR = [
        { voucherNumber: { contains: filters.search } },
        { description: { contains: filters.search } },
        { notes: { contains: filters.search } },
      ];
    }

    return db.voucher.findMany({
      where,
      include: {
        Lines: {
          include: {
            Account: true,
          },
        },
        Branch: true,
      },
      orderBy: { voucherDate: 'desc' },
    });
  }

  async updateVoucher(id: string, data: Prisma.VoucherUpdateInput) {
    return db.voucher.update({
      where: { id },
      data,
      include: {
        Lines: {
          include: {
            Account: true,
          },
        },
      },
    });
  }

  async deleteVoucher(id: string) {
    // Delete lines first
    await db.voucherLine.deleteMany({
      where: { voucherId: id },
    });

    return db.voucher.delete({
      where: { id },
    });
  }

  async getNextVoucherNumber(companyId: string, voucherType: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = voucherType === 'RECEIPT' ? 'RV' : 
                   voucherType === 'PAYMENT' ? 'PV' : 'TV';
    
    const count = await db.voucher.count({
      where: {
        companyId,
        voucherType,
        voucherNumber: { startsWith: `${prefix}-${year}-` },
      },
    });
    return `${prefix}-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  async approveVoucher(id: string, approvedBy: string) {
    return db.voucher.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
      },
    });
  }

  async cancelVoucher(id: string, cancelledBy: string, reason?: string) {
    return db.voucher.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledBy,
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });
  }

  // ==================== Reporting Operations ====================

  async getTrialBalanceData(companyId: string, asOfDate: Date) {
    const accounts = await db.account.findMany({
      where: {
        companyId,
        active: true,
      },
      include: {
        JournalLines: {
          where: {
            JournalEntry: {
              status: 'approved',
              entryDate: { lte: asOfDate },
            },
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    return accounts.map(account => {
      const totalDebit = account.JournalLines.reduce((sum, line) => sum + (line.debit || 0), 0);
      const totalCredit = account.JournalLines.reduce((sum, line) => sum + (line.credit || 0), 0);
      
      return {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        accountNameAr: account.nameAr,
        accountType: account.accountType,
        openingDebit: account.openingBalance > 0 && account.balanceType === 'DEBIT' ? account.openingBalance : 0,
        openingCredit: account.openingBalance > 0 && account.balanceType === 'CREDIT' ? account.openingBalance : 0,
        periodDebit: totalDebit,
        periodCredit: totalCredit,
        closingDebit: 0,
        closingCredit: 0,
      };
    });
  }

  async getIncomeStatementData(companyId: string, fromDate: Date, toDate: Date) {
    const revenueAccounts = await db.account.findMany({
      where: {
        companyId,
        accountType: 'REVENUE',
        active: true,
      },
      include: {
        JournalLines: {
          where: {
            JournalEntry: {
              status: 'approved',
              entryDate: { gte: fromDate, lte: toDate },
            },
          },
        },
      },
    });

    const expenseAccounts = await db.account.findMany({
      where: {
        companyId,
        accountType: 'EXPENSE',
        active: true,
      },
      include: {
        JournalLines: {
          where: {
            JournalEntry: {
              status: 'approved',
              entryDate: { gte: fromDate, lte: toDate },
            },
          },
        },
      },
    });

    const revenue = revenueAccounts.map(account => ({
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      accountNameAr: account.nameAr,
      amount: account.JournalLines.reduce((sum, line) => sum + (line.credit || 0) - (line.debit || 0), 0),
    }));

    const expenses = expenseAccounts.map(account => ({
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      accountNameAr: account.nameAr,
      amount: account.JournalLines.reduce((sum, line) => sum + (line.debit || 0) - (line.credit || 0), 0),
    }));

    return {
      revenue,
      totalRevenue: revenue.reduce((sum, r) => sum + r.amount, 0),
      expenses,
      totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
    };
  }

  async getBalanceSheetData(companyId: string, asOfDate: Date) {
    const assetAccounts = await db.account.findMany({
      where: {
        companyId,
        accountType: 'ASSET',
        active: true,
      },
      include: {
        JournalLines: {
          where: {
            JournalEntry: {
              status: 'approved',
              entryDate: { lte: asOfDate },
            },
          },
        },
      },
    });

    const liabilityAccounts = await db.account.findMany({
      where: {
        companyId,
        accountType: 'LIABILITY',
        active: true,
      },
      include: {
        JournalLines: {
          where: {
            JournalEntry: {
              status: 'approved',
              entryDate: { lte: asOfDate },
            },
          },
        },
      },
    });

    const equityAccounts = await db.account.findMany({
      where: {
        companyId,
        accountType: 'EQUITY',
        active: true,
      },
      include: {
        JournalLines: {
          where: {
            JournalEntry: {
              status: 'approved',
              entryDate: { lte: asOfDate },
            },
          },
        },
      },
    });

    const calculateBalance = (account: any) => {
      const totalDebit = account.JournalLines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
      const totalCredit = account.JournalLines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0);
      return account.balanceType === 'DEBIT' 
        ? account.openingBalance + totalDebit - totalCredit
        : account.openingBalance + totalCredit - totalDebit;
    };

    const assets = assetAccounts.map(account => ({
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      accountNameAr: account.nameAr,
      amount: calculateBalance(account),
    }));

    const liabilities = liabilityAccounts.map(account => ({
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      accountNameAr: account.nameAr,
      amount: calculateBalance(account),
    }));

    const equity = equityAccounts.map(account => ({
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      accountNameAr: account.nameAr,
      amount: calculateBalance(account),
    }));

    return {
      assets: {
        items: assets,
        total: assets.reduce((sum, a) => sum + a.amount, 0),
      },
      liabilities: {
        items: liabilities,
        total: liabilities.reduce((sum, l) => sum + l.amount, 0),
      },
      equity: {
        items: equity,
        total: equity.reduce((sum, e) => sum + e.amount, 0),
      },
    };
  }
}

export const accountingRepository = new AccountingRepository();

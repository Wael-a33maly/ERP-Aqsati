// Accounting Service - الخدمات المحاسبية

import { accountingRepository } from '@/repositories/accounting.repository';
import { db } from '@/lib/db';
import {
  CreateAccountInput,
  UpdateAccountInput,
  CreateFiscalYearInput,
  UpdateFiscalYearInput,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
  CreateVoucherInput,
  UpdateVoucherInput,
  TrialBalance,
  IncomeStatement,
  BalanceSheet,
  AccountTypeLabels,
  VoucherTypeLabels,
} from '@/models/accounting.model';

export class AccountingService {
  // ==================== Account Services ====================

  async createAccount(companyId: string, data: CreateAccountInput) {
    // Check if code already exists
    const existing = await accountingRepository.findAccountByCode(companyId, data.code);
    if (existing) {
      throw new Error('كود الحساب موجود مسبقاً');
    }

    // Calculate level based on parent
    let level = 1;
    if (data.parentId) {
      const parent = await accountingRepository.findAccountById(data.parentId);
      if (!parent) {
        throw new Error('الحساب الأب غير موجود');
      }
      level = parent.level + 1;

      // Update parent to not be leaf
      await accountingRepository.updateAccount(data.parentId, { isLeaf: false });
    }

    // Determine balance type based on account type
    const balanceType = this.getDefaultBalanceType(data.accountType);

    return accountingRepository.createAccount({
      ...data,
      companyId,
      level,
      balanceType,
      isLeaf: data.isLeaf ?? true,
    });
  }

  async getAccountById(id: string) {
    return accountingRepository.findAccountById(id);
  }

  async getAccountsByCompany(companyId: string, filters?: {
    accountType?: string;
    parentId?: string | null;
    active?: boolean;
    isLeaf?: boolean;
    search?: string;
  }) {
    return accountingRepository.findAccountsByCompany(companyId, filters);
  }

  async getAccountTree(companyId: string) {
    return accountingRepository.getAccountTree(companyId);
  }

  async updateAccount(id: string, data: UpdateAccountInput) {
    const account = await accountingRepository.findAccountById(id);
    if (!account) {
      throw new Error('الحساب غير موجود');
    }

    if (account.isSystem && data.active === false) {
      throw new Error('لا يمكن تعطيل حساب النظام');
    }

    return accountingRepository.updateAccount(id, data);
  }

  async deleteAccount(id: string) {
    return accountingRepository.deleteAccount(id);
  }

  async getNextAccountCode(companyId: string, parentId?: string) {
    return accountingRepository.getNextAccountCode(companyId, parentId);
  }

  async getAccountBalance(accountId: string, asOfDate?: Date) {
    const account = await accountingRepository.findAccountById(accountId);
    if (!account) {
      throw new Error('الحساب غير موجود');
    }

    const balance = await accountingRepository.getAccountBalance(accountId, asOfDate);

    let currentBalance = account.openingBalance;
    if (account.balanceType === 'DEBIT') {
      currentBalance += balance.totalDebit - balance.totalCredit;
    } else {
      currentBalance += balance.totalCredit - balance.totalDebit;
    }

    return {
      openingBalance: account.openingBalance,
      totalDebit: balance.totalDebit,
      totalCredit: balance.totalCredit,
      currentBalance,
      balanceType: account.balanceType,
    };
  }

  private getDefaultBalanceType(accountType: string): 'DEBIT' | 'CREDIT' {
    switch (accountType) {
      case 'ASSET':
      case 'EXPENSE':
        return 'DEBIT';
      case 'LIABILITY':
      case 'EQUITY':
      case 'REVENUE':
        return 'CREDIT';
      default:
        return 'DEBIT';
    }
  }

  // ==================== Fiscal Year Services ====================

  async createFiscalYear(companyId: string, data: CreateFiscalYearInput) {
    // Validate dates
    if (new Date(data.startDate) >= new Date(data.endDate)) {
      throw new Error('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
    }

    // Check for overlapping fiscal years
    const existingYears = await accountingRepository.findFiscalYearsByCompany(companyId);
    const hasOverlap = existingYears.some(year => {
      const start = new Date(year.startDate);
      const end = new Date(year.endDate);
      const newStart = new Date(data.startDate);
      const newEnd = new Date(data.endDate);
      return (newStart <= end && newEnd >= start);
    });

    if (hasOverlap) {
      throw new Error('توجد سنة مالية متداخلة مع هذه الفترة');
    }

    // Create fiscal year
    const fiscalYear = await accountingRepository.createFiscalYear({
      ...data,
      companyId,
    });

    // Auto-create monthly periods
    await this.createMonthlyPeriods(fiscalYear.id, companyId, data.startDate, data.endDate);

    return fiscalYear;
  }

  private async createMonthlyPeriods(fiscalYearId: string, companyId: string, startDate: Date, endDate: Date) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let periodNumber = 1;

    while (start <= end) {
      const periodStart = new Date(start.getFullYear(), start.getMonth(), 1);
      const periodEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0);

      const monthNames = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];

      await accountingRepository.createAccountingPeriod({
        fiscalYearId,
        companyId,
        name: `${monthNames[start.getMonth()]} ${start.getFullYear()}`,
        nameAr: `${monthNames[start.getMonth()]} ${start.getFullYear()}`,
        code: `P${String(periodNumber).padStart(2, '0')}`,
        startDate: periodStart,
        endDate: periodEnd < end ? periodEnd : end,
        periodNumber,
      });

      start.setMonth(start.getMonth() + 1);
      periodNumber++;
    }
  }

  async getFiscalYearById(id: string) {
    return accountingRepository.findFiscalYearById(id);
  }

  async getFiscalYearsByCompany(companyId: string) {
    return accountingRepository.findFiscalYearsByCompany(companyId);
  }

  async getCurrentFiscalYear(companyId: string) {
    return accountingRepository.findCurrentFiscalYear(companyId);
  }

  async updateFiscalYear(id: string, data: UpdateFiscalYearInput) {
    return accountingRepository.updateFiscalYear(id, data);
  }

  async setCurrentFiscalYear(companyId: string, fiscalYearId: string) {
    return accountingRepository.setCurrentFiscalYear(companyId, fiscalYearId);
  }

  async closeFiscalYear(id: string, closedBy: string) {
    const fiscalYear = await accountingRepository.findFiscalYearById(id);
    if (!fiscalYear) {
      throw new Error('السنة المالية غير موجودة');
    }

    if (fiscalYear.status === 'closed') {
      throw new Error('السنة المالية مغلقة بالفعل');
    }

    // Close all periods
    await db.accountingPeriod.updateMany({
      where: { fiscalYearId: id },
      data: { status: 'closed', closedBy, closedAt: new Date() },
    });

    return accountingRepository.updateFiscalYear(id, {
      status: 'closed',
      closedBy,
      closedAt: new Date(),
      isCurrent: false,
    });
  }

  // ==================== Journal Entry Services ====================

  async createJournalEntry(companyId: string, userId: string, data: CreateJournalEntryInput) {
    // Validate entry is balanced
    const totalDebit = data.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`القيد غير متوازن - المدين: ${totalDebit}، الدائن: ${totalCredit}`);
    }

    // Get entry number
    const entryNumber = await accountingRepository.getNextJournalEntryNumber(companyId);

    // Find period for entry date
    let periodId: string | undefined;
    if (data.entryDate) {
      const period = await accountingRepository.findPeriodForDate(companyId, new Date(data.entryDate));
      if (period) {
        periodId = period.id;
      }
    }

    // Get current fiscal year
    let fiscalYearId: string | undefined;
    const fiscalYear = await accountingRepository.getCurrentFiscalYear(companyId);
    if (fiscalYear) {
      fiscalYearId = fiscalYear.id;
    }

    // Create entry with lines
    return accountingRepository.createJournalEntry({
      companyId,
      entryNumber,
      entryDate: data.entryDate || new Date(),
      branchId: data.branchId,
      fiscalYearId,
      periodId,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      description: data.description,
      notes: data.notes,
      status: data.status || 'draft',
      totalDebit,
      totalCredit,
      isBalanced: true,
      isAdjustment: data.isAdjustment || false,
      createdBy: userId,
      Lines: {
        create: data.lines.map((line, index) => ({
          accountId: line.accountId,
          description: line.description,
          debit: line.debit || 0,
          credit: line.credit || 0,
          sortOrder: index,
        })),
      },
    });
  }

  async getJournalEntryById(id: string) {
    return accountingRepository.findJournalEntryById(id);
  }

  async getJournalEntriesByCompany(companyId: string, filters?: {
    branchId?: string;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    referenceType?: string;
    referenceId?: string;
    search?: string;
  }) {
    return accountingRepository.findJournalEntriesByCompany(companyId, filters);
  }

  async updateJournalEntry(id: string, data: UpdateJournalEntryInput) {
    const entry = await accountingRepository.findJournalEntryById(id);
    if (!entry) {
      throw new Error('القيد غير موجود');
    }

    if (entry.status === 'approved') {
      throw new Error('لا يمكن تعديل قيد معتمد');
    }

    // If lines are provided, recalculate totals
    if (data.lines) {
      const totalDebit = data.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
      const totalCredit = data.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error('القيد غير متوازن');
      }

      // Delete existing lines and create new ones
      await db.journalEntryLine.deleteMany({ where: { entryId: id } });

      return accountingRepository.updateJournalEntry(id, {
        ...data,
        totalDebit,
        totalCredit,
        Lines: {
          create: data.lines.map((line, index) => ({
            accountId: line.accountId,
            description: line.description,
            debit: line.debit || 0,
            credit: line.credit || 0,
            sortOrder: index,
          })),
        },
      });
    }

    return accountingRepository.updateJournalEntry(id, data);
  }

  async deleteJournalEntry(id: string) {
    const entry = await accountingRepository.findJournalEntryById(id);
    if (!entry) {
      throw new Error('القيد غير موجود');
    }

    if (entry.status === 'approved') {
      throw new Error('لا يمكن حذف قيد معتمد');
    }

    return accountingRepository.deleteJournalEntry(id);
  }

  async approveJournalEntry(id: string, approvedBy: string) {
    const entry = await accountingRepository.findJournalEntryById(id);
    if (!entry) {
      throw new Error('القيد غير موجود');
    }

    if (entry.status !== 'draft' && entry.status !== 'pending') {
      throw new Error('لا يمكن اعتماد هذا القيد');
    }

    return accountingRepository.approveJournalEntry(id, approvedBy);
  }

  async cancelJournalEntry(id: string, cancelledBy: string, reason?: string) {
    const entry = await accountingRepository.findJournalEntryById(id);
    if (!entry) {
      throw new Error('القيد غير موجود');
    }

    if (entry.status === 'cancelled') {
      throw new Error('القيد ملغي بالفعل');
    }

    return accountingRepository.cancelJournalEntry(id, cancelledBy, reason);
  }

  // ==================== Voucher Services ====================

  async createVoucher(companyId: string, userId: string, data: CreateVoucherInput) {
    // Get voucher number
    const voucherNumber = await accountingRepository.getNextVoucherNumber(companyId, data.voucherType);

    // Calculate amount from lines
    const amount = data.lines.reduce((sum, line) => sum + (line.amount || 0), 0);

    // Create voucher with lines
    return accountingRepository.createVoucher({
      companyId,
      voucherNumber,
      voucherType: data.voucherType,
      voucherDate: data.voucherDate || new Date(),
      branchId: data.branchId,
      amount,
      paymentMethod: data.paymentMethod,
      checkNumber: data.checkNumber,
      checkDate: data.checkDate,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      description: data.description,
      notes: data.notes,
      status: data.status || 'draft',
      createdBy: userId,
      Lines: {
        create: data.lines.map((line, index) => ({
          accountId: line.accountId,
          description: line.description,
          amount: line.amount || 0,
          lineType: line.lineType,
          sortOrder: index,
        })),
      },
    });
  }

  async getVoucherById(id: string) {
    return accountingRepository.findVoucherById(id);
  }

  async getVouchersByCompany(companyId: string, filters?: {
    branchId?: string;
    voucherType?: string;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    paymentMethod?: string;
    search?: string;
  }) {
    return accountingRepository.findVouchersByCompany(companyId, filters);
  }

  async updateVoucher(id: string, data: UpdateVoucherInput) {
    const voucher = await accountingRepository.findVoucherById(id);
    if (!voucher) {
      throw new Error('السند غير موجود');
    }

    if (voucher.status === 'approved') {
      throw new Error('لا يمكن تعديل سند معتمد');
    }

    // If lines are provided, recalculate amount
    if (data.lines) {
      const amount = data.lines.reduce((sum, line) => sum + (line.amount || 0), 0);

      // Delete existing lines and create new ones
      await db.voucherLine.deleteMany({ where: { voucherId: id } });

      return accountingRepository.updateVoucher(id, {
        ...data,
        amount,
        Lines: {
          create: data.lines.map((line, index) => ({
            accountId: line.accountId,
            description: line.description,
            amount: line.amount || 0,
            lineType: line.lineType,
            sortOrder: index,
          })),
        },
      });
    }

    return accountingRepository.updateVoucher(id, data);
  }

  async deleteVoucher(id: string) {
    const voucher = await accountingRepository.findVoucherById(id);
    if (!voucher) {
      throw new Error('السند غير موجود');
    }

    if (voucher.status === 'approved') {
      throw new Error('لا يمكن حذف سند معتمد');
    }

    return accountingRepository.deleteVoucher(id);
  }

  async approveVoucher(id: string, approvedBy: string) {
    const voucher = await accountingRepository.findVoucherById(id);
    if (!voucher) {
      throw new Error('السند غير موجود');
    }

    if (voucher.status !== 'draft') {
      throw new Error('لا يمكن اعتماد هذا السند');
    }

    // Approve voucher
    const approvedVoucher = await accountingRepository.approveVoucher(id, approvedBy);

    // Create journal entry for voucher
    await this.createJournalEntryFromVoucher(voucher, approvedBy);

    return approvedVoucher;
  }

  private async createJournalEntryFromVoucher(voucher: any, userId: string) {
    const lines = voucher.Lines.map((line: any) => {
      if (voucher.voucherType === 'RECEIPT') {
        // سند قبض: النقدية مدين والحساب دائن
        return line.lineType === 'DEBIT' 
          ? { accountId: line.accountId, debit: line.amount, credit: 0 }
          : { accountId: line.accountId, debit: 0, credit: line.amount };
      } else if (voucher.voucherType === 'PAYMENT') {
        // سند صرف: الحساب مدين والنقدية دائنة
        return line.lineType === 'DEBIT'
          ? { accountId: line.accountId, debit: line.amount, credit: 0 }
          : { accountId: line.accountId, debit: 0, credit: line.amount };
      } else {
        // سند تحويل
        return line.lineType === 'DEBIT'
          ? { accountId: line.accountId, debit: line.amount, credit: 0 }
          : { accountId: line.accountId, debit: 0, credit: line.amount };
      }
    });

    const voucherTypeLabel = VoucherTypeLabels[voucher.voucherType]?.ar || voucher.voucherType;

    return this.createJournalEntry(voucher.companyId, userId, {
      branchId: voucher.branchId,
      entryDate: voucher.voucherDate,
      referenceType: 'VOUCHER',
      referenceId: voucher.id,
      description: `${voucherTypeLabel} رقم ${voucher.voucherNumber}`,
      notes: voucher.notes,
      status: 'approved',
      lines,
    });
  }

  async cancelVoucher(id: string, cancelledBy: string, reason?: string) {
    const voucher = await accountingRepository.findVoucherById(id);
    if (!voucher) {
      throw new Error('السند غير موجود');
    }

    if (voucher.status === 'cancelled') {
      throw new Error('السند ملغي بالفعل');
    }

    return accountingRepository.cancelVoucher(id, cancelledBy, reason);
  }

  // ==================== Reporting Services ====================

  async getTrialBalance(companyId: string, asOfDate: Date): Promise<TrialBalance> {
    const data = await accountingRepository.getTrialBalanceData(companyId, asOfDate);

    // Calculate closing balances
    const items = data.map(item => {
      const closingDebit = item.openingDebit + item.periodDebit;
      const closingCredit = item.openingCredit + item.periodCredit;
      return {
        ...item,
        closingDebit: closingDebit > closingCredit ? closingDebit - closingCredit : 0,
        closingCredit: closingCredit > closingDebit ? closingCredit - closingDebit : 0,
      };
    });

    const totalOpeningDebit = items.reduce((sum, item) => sum + item.openingDebit, 0);
    const totalOpeningCredit = items.reduce((sum, item) => sum + item.openingCredit, 0);
    const totalPeriodDebit = items.reduce((sum, item) => sum + item.periodDebit, 0);
    const totalPeriodCredit = items.reduce((sum, item) => sum + item.periodCredit, 0);
    const totalClosingDebit = items.reduce((sum, item) => sum + item.closingDebit, 0);
    const totalClosingCredit = items.reduce((sum, item) => sum + item.closingCredit, 0);

    return {
      companyId,
      asOfDate,
      items,
      totalOpeningDebit,
      totalOpeningCredit,
      totalPeriodDebit,
      totalPeriodCredit,
      totalClosingDebit,
      totalClosingCredit,
      isBalanced: Math.abs(totalClosingDebit - totalClosingCredit) < 0.01,
    };
  }

  async getIncomeStatement(companyId: string, fromDate: Date, toDate: Date): Promise<IncomeStatement> {
    const data = await accountingRepository.getIncomeStatementData(companyId, fromDate, toDate);

    const totalRevenue = data.totalRevenue;
    const totalExpenses = data.totalExpenses;

    // Calculate percentages
    const revenue = data.revenue.map(item => ({
      ...item,
      percentage: totalRevenue > 0 ? (item.amount / totalRevenue) * 100 : 0,
    }));

    const expenses = data.expenses.map(item => ({
      ...item,
      percentage: totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0,
    }));

    return {
      companyId,
      fromDate,
      toDate,
      revenue,
      totalRevenue,
      expenses,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
    };
  }

  async getBalanceSheet(companyId: string, asOfDate: Date): Promise<BalanceSheet> {
    const data = await accountingRepository.getBalanceSheetData(companyId, asOfDate);

    const totalAssets = data.assets.total;
    const totalLiabilities = data.liabilities.total;
    const totalEquity = data.equity.total;

    // Calculate percentages
    const assets = {
      current: data.assets.items.filter((a: any) => a.accountCode.startsWith('1')),
      fixed: data.assets.items.filter((a: any) => a.accountCode.startsWith('2')),
      totalCurrent: 0,
      totalFixed: 0,
      totalAssets,
    };
    assets.totalCurrent = assets.current.reduce((sum, a) => sum + a.amount, 0);
    assets.totalFixed = assets.fixed.reduce((sum, a) => sum + a.amount, 0);

    const liabilities = {
      current: data.liabilities.items.filter((l: any) => l.accountCode.startsWith('3')),
      longTerm: data.liabilities.items.filter((l: any) => l.accountCode.startsWith('4')),
      totalCurrent: 0,
      totalLongTerm: 0,
      totalLiabilities,
    };
    liabilities.totalCurrent = liabilities.current.reduce((sum, l) => sum + l.amount, 0);
    liabilities.totalLongTerm = liabilities.longTerm.reduce((sum, l) => sum + l.amount, 0);

    const equity = {
      items: data.equity.items.map((e: any) => ({
        ...e,
        percentage: totalEquity > 0 ? (e.amount / totalEquity) * 100 : 0,
      })),
      totalEquity,
    };

    return {
      companyId,
      asOfDate,
      assets: {
        current: assets.current.map((a: any) => ({ ...a, percentage: assets.totalAssets > 0 ? (a.amount / assets.totalAssets) * 100 : 0 })),
        fixed: assets.fixed.map((a: any) => ({ ...a, percentage: assets.totalAssets > 0 ? (a.amount / assets.totalAssets) * 100 : 0 })),
        totalCurrent: assets.totalCurrent,
        totalFixed: assets.totalFixed,
        totalAssets,
      },
      liabilities: {
        current: liabilities.current.map((l: any) => ({ ...l, percentage: liabilities.totalLiabilities > 0 ? (l.amount / liabilities.totalLiabilities) * 100 : 0 })),
        longTerm: liabilities.longTerm.map((l: any) => ({ ...l, percentage: liabilities.totalLiabilities > 0 ? (l.amount / liabilities.totalLiabilities) * 100 : 0 })),
        totalCurrent: liabilities.totalCurrent,
        totalLongTerm: liabilities.totalLongTerm,
        totalLiabilities,
      },
      equity: {
        items: equity.items,
        totalEquity,
      },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    };
  }

  // ==================== Seed Default Accounts ====================

  async seedDefaultAccounts(companyId: string) {
    const defaultAccounts = [
      // الأصول - Assets
      { code: '1', name: 'الأصول', nameAr: 'الأصول', accountType: 'ASSET', level: 1, isLeaf: false },
      { code: '11', name: 'الأصول المتداولة', nameAr: 'الأصول المتداولة', accountType: 'ASSET', level: 2, isLeaf: false, parentId: '1' },
      { code: '111', name: 'النقدية والبنوك', nameAr: 'النقدية والبنوك', accountType: 'ASSET', level: 3, isLeaf: false, parentId: '11' },
      { code: '1111', name: 'الصندوق', nameAr: 'الصندوق', accountType: 'ASSET', level: 4, isLeaf: true, parentId: '111' },
      { code: '1112', name: 'البنك', nameAr: 'البنك', accountType: 'ASSET', level: 4, isLeaf: true, parentId: '111' },
      { code: '112', name: 'العملاء', nameAr: 'العملاء', accountType: 'ASSET', level: 3, isLeaf: true, parentId: '11' },
      { code: '113', name: 'المخزون', nameAr: 'المخزون', accountType: 'ASSET', level: 3, isLeaf: true, parentId: '11' },
      { code: '12', name: 'الأصول الثابتة', nameAr: 'الأصول الثابتة', accountType: 'ASSET', level: 2, isLeaf: true, parentId: '1' },

      // الخصوم - Liabilities
      { code: '2', name: 'الخصوم', nameAr: 'الخصوم', accountType: 'LIABILITY', level: 1, isLeaf: false },
      { code: '21', name: 'الخصوم المتداولة', nameAr: 'الخصوم المتداولة', accountType: 'LIABILITY', level: 2, isLeaf: false, parentId: '2' },
      { code: '211', name: 'الموردين', nameAr: 'الموردين', accountType: 'LIABILITY', level: 3, isLeaf: true, parentId: '21' },
      { code: '212', name: 'ذمم أخرى دائنة', nameAr: 'ذمم أخرى دائنة', accountType: 'LIABILITY', level: 3, isLeaf: true, parentId: '21' },
      { code: '22', name: 'الخصوم طويلة الأجل', nameAr: 'الخصوم طويلة الأجل', accountType: 'LIABILITY', level: 2, isLeaf: true, parentId: '2' },

      // حقوق الملكية - Equity
      { code: '3', name: 'حقوق الملكية', nameAr: 'حقوق الملكية', accountType: 'EQUITY', level: 1, isLeaf: false },
      { code: '31', name: 'رأس المال', nameAr: 'رأس المال', accountType: 'EQUITY', level: 2, isLeaf: true, parentId: '3' },
      { code: '32', name: 'الأرباح المحتجزة', nameAr: 'الأرباح المحتجزة', accountType: 'EQUITY', level: 2, isLeaf: true, parentId: '3' },

      // الإيرادات - Revenue
      { code: '4', name: 'الإيرادات', nameAr: 'الإيرادات', accountType: 'REVENUE', level: 1, isLeaf: false },
      { code: '41', name: 'إيرادات المبيعات', nameAr: 'إيرادات المبيعات', accountType: 'REVENUE', level: 2, isLeaf: true, parentId: '4' },
      { code: '42', name: 'إيرادات أخرى', nameAr: 'إيرادات أخرى', accountType: 'REVENUE', level: 2, isLeaf: true, parentId: '4' },

      // المصروفات - Expenses
      { code: '5', name: 'المصروفات', nameAr: 'المصروفات', accountType: 'EXPENSE', level: 1, isLeaf: false },
      { code: '51', name: 'تكلفة المبيعات', nameAr: 'تكلفة المبيعات', accountType: 'EXPENSE', level: 2, isLeaf: true, parentId: '5' },
      { code: '52', name: 'مصروفات التشغيل', nameAr: 'مصروفات التشغيل', accountType: 'EXPENSE', level: 2, isLeaf: false, parentId: '5' },
      { code: '521', name: 'رواتب وأجور', nameAr: 'رواتب وأجور', accountType: 'EXPENSE', level: 3, isLeaf: true, parentId: '52' },
      { code: '522', name: 'إيجارات', nameAr: 'إيجارات', accountType: 'EXPENSE', level: 3, isLeaf: true, parentId: '52' },
      { code: '523', name: 'مرافق', nameAr: 'مرافق', accountType: 'EXPENSE', level: 3, isLeaf: true, parentId: '52' },
    ];

    const createdAccounts: any[] = [];
    const accountMap = new Map<string, string>();

    for (const account of defaultAccounts) {
      let parentId = null;
      if (account.parentId) {
        parentId = accountMap.get(account.parentId as string);
      }

      const balanceType = this.getDefaultBalanceType(account.accountType);
      const created = await accountingRepository.createAccount({
        companyId,
        code: account.code,
        name: account.name,
        nameAr: account.nameAr,
        accountType: account.accountType as any,
        level: account.level,
        isLeaf: account.isLeaf,
        isSystem: true,
        balanceType: balanceType as any,
        parentId: parentId || undefined,
      });

      accountMap.set(account.code, created.id);
      createdAccounts.push(created);
    }

    return createdAccounts;
  }
}

export const accountingService = new AccountingService();

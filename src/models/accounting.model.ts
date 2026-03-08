// Accounting Models - النماذج المحاسبية

import { z } from 'zod';

// ==================== Account Types ====================

export const AccountType = {
  ASSET: 'ASSET',           // أصول
  LIABILITY: 'LIABILITY',   // خصوم
  EQUITY: 'EQUITY',         // حقوق ملكية
  REVENUE: 'REVENUE',       // إيرادات
  EXPENSE: 'EXPENSE',       // مصروفات
} as const;

export const BalanceType = {
  DEBIT: 'DEBIT',   // مدين
  CREDIT: 'CREDIT', // دائن
} as const;

// ==================== Account Schema ====================

export const AccountSchema = z.object({
  id: z.string().optional(),
  companyId: z.string(),
  parentId: z.string().nullable().optional(),
  accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  code: z.string().min(1, 'كود الحساب مطلوب'),
  name: z.string().min(1, 'اسم الحساب مطلوب'),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  level: z.number().default(1),
  isLeaf: z.boolean().default(true),
  isSystem: z.boolean().default(false),
  balanceType: z.enum(['DEBIT', 'CREDIT']).default('DEBIT'),
  openingBalance: z.number().default(0),
  currentBalance: z.number().default(0),
  active: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

export const CreateAccountSchema = AccountSchema.omit({ id: true, currentBalance: true });
export const UpdateAccountSchema = AccountSchema.partial().omit({ id: true, companyId: true });

export type Account = z.infer<typeof AccountSchema>;
export type CreateAccountInput = z.infer<typeof CreateAccountSchema>;
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>;

// ==================== Account Tree Node ====================

export interface AccountTreeNode extends Account {
  children: AccountTreeNode[];
  debitTotal: number;
  creditTotal: number;
  balance: number;
}

// ==================== Fiscal Year Schema ====================

export const FiscalYearSchema = z.object({
  id: z.string().optional(),
  companyId: z.string(),
  name: z.string().min(1, 'اسم السنة المالية مطلوب'),
  nameAr: z.string().optional(),
  code: z.string().min(1, 'كود السنة المالية مطلوب'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.enum(['open', 'closed', 'locked']).default('open'),
  isCurrent: z.boolean().default(false),
  closedBy: z.string().nullable().optional(),
  closedAt: z.coerce.date().nullable().optional(),
  notes: z.string().optional(),
});

export const CreateFiscalYearSchema = FiscalYearSchema.omit({ id: true, closedBy: true, closedAt: true });
export const UpdateFiscalYearSchema = FiscalYearSchema.partial().omit({ id: true, companyId: true });

export type FiscalYear = z.infer<typeof FiscalYearSchema>;
export type CreateFiscalYearInput = z.infer<typeof CreateFiscalYearSchema>;
export type UpdateFiscalYearInput = z.infer<typeof UpdateFiscalYearSchema>;

// ==================== Accounting Period Schema ====================

export const AccountingPeriodSchema = z.object({
  id: z.string().optional(),
  fiscalYearId: z.string(),
  companyId: z.string(),
  name: z.string().min(1, 'اسم الفترة مطلوب'),
  nameAr: z.string().optional(),
  code: z.string().min(1, 'كود الفترة مطلوب'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  periodNumber: z.number().min(1).max(12),
  status: z.enum(['open', 'closed', 'locked']).default('open'),
  closedBy: z.string().nullable().optional(),
  closedAt: z.coerce.date().nullable().optional(),
});

export const CreateAccountingPeriodSchema = AccountingPeriodSchema.omit({ id: true, closedBy: true, closedAt: true });
export const UpdateAccountingPeriodSchema = AccountingPeriodSchema.partial().omit({ id: true, companyId: true, fiscalYearId: true });

export type AccountingPeriod = z.infer<typeof AccountingPeriodSchema>;
export type CreateAccountingPeriodInput = z.infer<typeof CreateAccountingPeriodSchema>;
export type UpdateAccountingPeriodInput = z.infer<typeof UpdateAccountingPeriodSchema>;

// ==================== Journal Entry Schema ====================

export const JournalEntryStatus = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  CANCELLED: 'cancelled',
} as const;

export const JournalEntryLineSchema = z.object({
  id: z.string().optional(),
  entryId: z.string().optional(),
  accountId: z.string().min(1, 'الحساب مطلوب'),
  description: z.string().optional(),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  sortOrder: z.number().default(0),
});

export const JournalEntrySchema = z.object({
  id: z.string().optional(),
  companyId: z.string(),
  branchId: z.string().nullable().optional(),
  fiscalYearId: z.string().nullable().optional(),
  periodId: z.string().nullable().optional(),
  entryNumber: z.string().optional(),
  entryDate: z.coerce.date().default(() => new Date()),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'pending', 'approved', 'cancelled']).default('draft'),
  totalDebit: z.number().default(0),
  totalCredit: z.number().default(0),
  isBalanced: z.boolean().default(true),
  isAdjustment: z.boolean().default(false),
  approvedBy: z.string().nullable().optional(),
  approvedAt: z.coerce.date().nullable().optional(),
  cancelledBy: z.string().nullable().optional(),
  cancelledAt: z.coerce.date().nullable().optional(),
  cancelReason: z.string().optional(),
  createdBy: z.string().optional(),
  lines: z.array(JournalEntryLineSchema).min(2, 'القيد يجب أن يحتوي على سطرين على الأقل'),
});

export const CreateJournalEntrySchema = JournalEntrySchema.omit({ 
  id: true, 
  entryNumber: true, 
  totalDebit: true, 
  totalCredit: true, 
  isBalanced: true,
  approvedBy: true,
  approvedAt: true,
  cancelledBy: true,
  cancelledAt: true,
});

export const UpdateJournalEntrySchema = JournalEntrySchema.partial().omit({ 
  id: true, 
  companyId: true,
  entryNumber: true,
});

export type JournalEntryLine = z.infer<typeof JournalEntryLineSchema>;
export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export type CreateJournalEntryInput = z.infer<typeof CreateJournalEntrySchema>;
export type UpdateJournalEntryInput = z.infer<typeof UpdateJournalEntrySchema>;

// ==================== Voucher Schema ====================

export const VoucherType = {
  RECEIPT: 'RECEIPT',   // سند قبض
  PAYMENT: 'PAYMENT',   // سند صرف
  TRANSFER: 'TRANSFER', // سند تحويل
} as const;

export const PaymentMethod = {
  CASH: 'CASH',         // نقدي
  CHECK: 'CHECK',       // شيك
  TRANSFER: 'TRANSFER', // تحويل بنكي
  CARD: 'CARD',         // بطاقة
} as const;

export const VoucherLineSchema = z.object({
  id: z.string().optional(),
  voucherId: z.string().optional(),
  accountId: z.string().min(1, 'الحساب مطلوب'),
  description: z.string().optional(),
  amount: z.number().min(0).default(0),
  lineType: z.enum(['DEBIT', 'CREDIT']),
  sortOrder: z.number().default(0),
});

export const VoucherSchema = z.object({
  id: z.string().optional(),
  companyId: z.string(),
  branchId: z.string().nullable().optional(),
  voucherType: z.enum(['RECEIPT', 'PAYMENT', 'TRANSFER']),
  voucherNumber: z.string().optional(),
  voucherDate: z.coerce.date().default(() => new Date()),
  amount: z.number().min(0).default(0),
  paymentMethod: z.enum(['CASH', 'CHECK', 'TRANSFER', 'CARD']),
  checkNumber: z.string().optional(),
  checkDate: z.coerce.date().nullable().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'approved', 'cancelled']).default('draft'),
  approvedBy: z.string().nullable().optional(),
  approvedAt: z.coerce.date().nullable().optional(),
  cancelledBy: z.string().nullable().optional(),
  cancelledAt: z.coerce.date().nullable().optional(),
  cancelReason: z.string().optional(),
  createdBy: z.string().optional(),
  lines: z.array(VoucherLineSchema).min(1, 'السند يجب أن يحتوي على سطر واحد على الأقل'),
});

export const CreateVoucherSchema = VoucherSchema.omit({ 
  id: true, 
  voucherNumber: true,
  approvedBy: true,
  approvedAt: true,
  cancelledBy: true,
  cancelledAt: true,
});

export const UpdateVoucherSchema = VoucherSchema.partial().omit({ 
  id: true, 
  companyId: true,
  voucherNumber: true,
});

export type VoucherLine = z.infer<typeof VoucherLineSchema>;
export type Voucher = z.infer<typeof VoucherSchema>;
export type CreateVoucherInput = z.infer<typeof CreateVoucherSchema>;
export type UpdateVoucherInput = z.infer<typeof UpdateVoucherSchema>;

// ==================== Financial Reports ====================

export interface TrialBalanceItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
}

export interface TrialBalance {
  companyId: string;
  asOfDate: Date;
  items: TrialBalanceItem[];
  totalOpeningDebit: number;
  totalOpeningCredit: number;
  totalPeriodDebit: number;
  totalPeriodCredit: number;
  totalClosingDebit: number;
  totalClosingCredit: number;
  isBalanced: boolean;
}

export interface IncomeStatementItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: number;
  percentage?: number;
}

export interface IncomeStatement {
  companyId: string;
  fromDate: Date;
  toDate: Date;
  revenue: IncomeStatementItem[];
  totalRevenue: number;
  expenses: IncomeStatementItem[];
  totalExpenses: number;
  netIncome: number;
}

export interface BalanceSheetItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: number;
  percentage?: number;
}

export interface BalanceSheet {
  companyId: string;
  asOfDate: Date;
  assets: {
    current: BalanceSheetItem[];
    fixed: BalanceSheetItem[];
    totalCurrent: number;
    totalFixed: number;
    totalAssets: number;
  };
  liabilities: {
    current: BalanceSheetItem[];
    longTerm: BalanceSheetItem[];
    totalCurrent: number;
    totalLongTerm: number;
    totalLiabilities: number;
  };
  equity: {
    items: BalanceSheetItem[];
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

export interface CashFlowItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: number;
}

export interface CashFlowStatement {
  companyId: string;
  fromDate: Date;
  toDate: Date;
  operatingActivities: {
    items: CashFlowItem[];
    total: number;
  };
  investingActivities: {
    items: CashFlowItem[];
    total: number;
  };
  financingActivities: {
    items: CashFlowItem[];
    total: number;
  };
  netCashFlow: number;
  openingCash: number;
  closingCash: number;
}

// ==================== Account Type Labels ====================

export const AccountTypeLabels: Record<string, { ar: string; en: string }> = {
  ASSET: { ar: 'أصول', en: 'Assets' },
  LIABILITY: { ar: 'خصوم', en: 'Liabilities' },
  EQUITY: { ar: 'حقوق الملكية', en: 'Equity' },
  REVENUE: { ar: 'إيرادات', en: 'Revenue' },
  EXPENSE: { ar: 'مصروفات', en: 'Expenses' },
};

export const VoucherTypeLabels: Record<string, { ar: string; en: string }> = {
  RECEIPT: { ar: 'سند قبض', en: 'Receipt Voucher' },
  PAYMENT: { ar: 'سند صرف', en: 'Payment Voucher' },
  TRANSFER: { ar: 'سند تحويل', en: 'Transfer Voucher' },
};

export const PaymentMethodLabels: Record<string, { ar: string; en: string }> = {
  CASH: { ar: 'نقدي', en: 'Cash' },
  CHECK: { ar: 'شيك', en: 'Check' },
  TRANSFER: { ar: 'تحويل بنكي', en: 'Bank Transfer' },
  CARD: { ar: 'بطاقة', en: 'Card' },
};

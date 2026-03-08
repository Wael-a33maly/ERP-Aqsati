// Accounting Controller - المتحكم المحاسبي

import { NextRequest, NextResponse } from 'next/server';
import { accountingService } from '@/services/accounting.service';
import { getAuth } from '@/lib/auth';

export class AccountingController {
  // ==================== Account Controllers ====================

  async getAccounts(req: NextRequest) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const { searchParams } = new URL(req.url);
      const filters = {
        accountType: searchParams.get('accountType') || undefined,
        parentId: searchParams.get('parentId') || undefined,
        active: searchParams.get('active') === 'true' ? true : searchParams.get('active') === 'false' ? false : undefined,
        isLeaf: searchParams.get('isLeaf') === 'true' ? true : searchParams.get('isLeaf') === 'false' ? false : undefined,
        search: searchParams.get('search') || undefined,
      };

      const accounts = await accountingService.getAccountsByCompany(auth.companyId, filters);
      return NextResponse.json(accounts);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async getAccountTree(req: NextRequest) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const tree = await accountingService.getAccountTree(auth.companyId);
      return NextResponse.json(tree);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async getAccountById(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const account = await accountingService.getAccountById(params.id);
      if (!account) {
        return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 404 });
      }

      return NextResponse.json(account);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async createAccount(req: NextRequest) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const data = await req.json();
      const account = await accountingService.createAccount(auth.companyId, data);
      return NextResponse.json(account, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async updateAccount(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const data = await req.json();
      const account = await accountingService.updateAccount(params.id, data);
      return NextResponse.json(account);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async deleteAccount(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      await accountingService.deleteAccount(params.id);
      return NextResponse.json({ success: true });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async getAccountBalance(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const { searchParams } = new URL(req.url);
      const asOfDate = searchParams.get('asOfDate') ? new Date(searchParams.get('asOfDate')!) : undefined;

      const balance = await accountingService.getAccountBalance(params.id, asOfDate);
      return NextResponse.json(balance);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async getNextAccountCode(req: NextRequest) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const { searchParams } = new URL(req.url);
      const parentId = searchParams.get('parentId') || undefined;

      const code = await accountingService.getNextAccountCode(auth.companyId, parentId);
      return NextResponse.json({ code });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  // ==================== Fiscal Year Controllers ====================

  async getFiscalYears(req: NextRequest) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const fiscalYears = await accountingService.getFiscalYearsByCompany(auth.companyId);
      return NextResponse.json(fiscalYears);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async getCurrentFiscalYear(req: NextRequest) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const fiscalYear = await accountingService.getCurrentFiscalYear(auth.companyId);
      return NextResponse.json(fiscalYear);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async getFiscalYearById(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const fiscalYear = await accountingService.getFiscalYearById(params.id);
      if (!fiscalYear) {
        return NextResponse.json({ error: 'السنة المالية غير موجودة' }, { status: 404 });
      }

      return NextResponse.json(fiscalYear);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async createFiscalYear(req: NextRequest) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const data = await req.json();
      const fiscalYear = await accountingService.createFiscalYear(auth.companyId, data);
      return NextResponse.json(fiscalYear, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async updateFiscalYear(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const data = await req.json();
      const fiscalYear = await accountingService.updateFiscalYear(params.id, data);
      return NextResponse.json(fiscalYear);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async setCurrentFiscalYear(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const fiscalYear = await accountingService.setCurrentFiscalYear(auth.companyId, params.id);
      return NextResponse.json(fiscalYear);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async closeFiscalYear(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const fiscalYear = await accountingService.closeFiscalYear(params.id, auth.userId);
      return NextResponse.json(fiscalYear);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  // ==================== Journal Entry Controllers ====================

  async getJournalEntries(req: NextRequest) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const { searchParams } = new URL(req.url);
      const filters = {
        branchId: searchParams.get('branchId') || undefined,
        status: searchParams.get('status') || undefined,
        fromDate: searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined,
        toDate: searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined,
        referenceType: searchParams.get('referenceType') || undefined,
        referenceId: searchParams.get('referenceId') || undefined,
        search: searchParams.get('search') || undefined,
      };

      const entries = await accountingService.getJournalEntriesByCompany(auth.companyId, filters);
      return NextResponse.json(entries);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async getJournalEntryById(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const entry = await accountingService.getJournalEntryById(params.id);
      if (!entry) {
        return NextResponse.json({ error: 'القيد غير موجود' }, { status: 404 });
      }

      return NextResponse.json(entry);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async createJournalEntry(req: NextRequest) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const data = await req.json();
      const entry = await accountingService.createJournalEntry(auth.companyId, auth.userId, data);
      return NextResponse.json(entry, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async updateJournalEntry(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const data = await req.json();
      const entry = await accountingService.updateJournalEntry(params.id, data);
      return NextResponse.json(entry);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async deleteJournalEntry(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      await accountingService.deleteJournalEntry(params.id);
      return NextResponse.json({ success: true });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async approveJournalEntry(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const entry = await accountingService.approveJournalEntry(params.id, auth.userId);
      return NextResponse.json(entry);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async cancelJournalEntry(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const data = await req.json();
      const entry = await accountingService.cancelJournalEntry(params.id, auth.userId, data.reason);
      return NextResponse.json(entry);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  // ==================== Voucher Controllers ====================

  async getVouchers(req: NextRequest) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const { searchParams } = new URL(req.url);
      const filters = {
        branchId: searchParams.get('branchId') || undefined,
        voucherType: searchParams.get('voucherType') || undefined,
        status: searchParams.get('status') || undefined,
        fromDate: searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined,
        toDate: searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined,
        paymentMethod: searchParams.get('paymentMethod') || undefined,
        search: searchParams.get('search') || undefined,
      };

      const vouchers = await accountingService.getVouchersByCompany(auth.companyId, filters);
      return NextResponse.json(vouchers);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async getVoucherById(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const voucher = await accountingService.getVoucherById(params.id);
      if (!voucher) {
        return NextResponse.json({ error: 'السند غير موجود' }, { status: 404 });
      }

      return NextResponse.json(voucher);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async createVoucher(req: NextRequest) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const data = await req.json();
      const voucher = await accountingService.createVoucher(auth.companyId, auth.userId, data);
      return NextResponse.json(voucher, { status: 201 });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async updateVoucher(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const data = await req.json();
      const voucher = await accountingService.updateVoucher(params.id, data);
      return NextResponse.json(voucher);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async deleteVoucher(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      await accountingService.deleteVoucher(params.id);
      return NextResponse.json({ success: true });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async approveVoucher(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const voucher = await accountingService.approveVoucher(params.id, auth.userId);
      return NextResponse.json(voucher);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async cancelVoucher(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const data = await req.json();
      const voucher = await accountingService.cancelVoucher(params.id, auth.userId, data.reason);
      return NextResponse.json(voucher);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  // ==================== Report Controllers ====================

  async getTrialBalance(req: NextRequest) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const { searchParams } = new URL(req.url);
      const asOfDate = searchParams.get('asOfDate') ? new Date(searchParams.get('asOfDate')!) : new Date();

      const trialBalance = await accountingService.getTrialBalance(auth.companyId, asOfDate);
      return NextResponse.json(trialBalance);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async getIncomeStatement(req: NextRequest) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const { searchParams } = new URL(req.url);
      const fromDate = searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : new Date(new Date().getFullYear(), 0, 1);
      const toDate = searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : new Date();

      const incomeStatement = await accountingService.getIncomeStatement(auth.companyId, fromDate, toDate);
      return NextResponse.json(incomeStatement);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  async getBalanceSheet(req: NextRequest) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const { searchParams } = new URL(req.url);
      const asOfDate = searchParams.get('asOfDate') ? new Date(searchParams.get('asOfDate')!) : new Date();

      const balanceSheet = await accountingService.getBalanceSheet(auth.companyId, asOfDate);
      return NextResponse.json(balanceSheet);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  // ==================== Seed Controllers ====================

  async seedDefaultAccounts(req: NextRequest) {
    try {
      const auth = await getAuth(req);
      if (!auth?.companyId) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      }

      const accounts = await accountingService.seedDefaultAccounts(auth.companyId);
      return NextResponse.json({ message: 'تم إنشاء الحسابات الافتراضية', count: accounts.length });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }
}

export const accountingController = new AccountingController();

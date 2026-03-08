// Balance Sheet API Route - الميزانية العمومية

import { NextRequest } from 'next/server';
import { accountingController } from '@/controllers/accounting.controller';

export async function GET(req: NextRequest) {
  return accountingController.getBalanceSheet(req);
}

// Income Statement API Route - قائمة الدخل

import { NextRequest } from 'next/server';
import { accountingController } from '@/controllers/accounting.controller';

export async function GET(req: NextRequest) {
  return accountingController.getIncomeStatement(req);
}

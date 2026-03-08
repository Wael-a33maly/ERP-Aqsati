// Trial Balance API Route - ميزان المراجعة

import { NextRequest } from 'next/server';
import { accountingController } from '@/controllers/accounting.controller';

export async function GET(req: NextRequest) {
  return accountingController.getTrialBalance(req);
}

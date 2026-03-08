// Seed Default Accounts API Route

import { NextRequest } from 'next/server';
import { accountingController } from '@/controllers/accounting.controller';

export async function POST(req: NextRequest) {
  return accountingController.seedDefaultAccounts(req);
}

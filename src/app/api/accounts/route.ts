// Accounts API Route - شجرة الحسابات

import { NextRequest } from 'next/server';
import { accountingController } from '@/controllers/accounting.controller';

export async function GET(req: NextRequest) {
  return accountingController.getAccounts(req);
}

export async function POST(req: NextRequest) {
  return accountingController.createAccount(req);
}

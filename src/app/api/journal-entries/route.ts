// Journal Entries API Route - قيود اليومية

import { NextRequest } from 'next/server';
import { accountingController } from '@/controllers/accounting.controller';

export async function GET(req: NextRequest) {
  return accountingController.getJournalEntries(req);
}

export async function POST(req: NextRequest) {
  return accountingController.createJournalEntry(req);
}

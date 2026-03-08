// Journal Entry by ID API Route

import { NextRequest } from 'next/server';
import { accountingController } from '@/controllers/accounting.controller';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return accountingController.getJournalEntryById(req, { params });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return accountingController.updateJournalEntry(req, { params });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return accountingController.deleteJournalEntry(req, { params });
}

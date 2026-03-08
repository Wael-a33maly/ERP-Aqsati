// Fiscal Year by ID API Route

import { NextRequest } from 'next/server';
import { accountingController } from '@/controllers/accounting.controller';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return accountingController.getFiscalYearById(req, { params });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return accountingController.updateFiscalYear(req, { params });
}

// Fiscal Years API Route - السنوات المالية

import { NextRequest } from 'next/server';
import { accountingController } from '@/controllers/accounting.controller';

export async function GET(req: NextRequest) {
  return accountingController.getFiscalYears(req);
}

export async function POST(req: NextRequest) {
  return accountingController.createFiscalYear(req);
}

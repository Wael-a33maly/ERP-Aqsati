// Vouchers API Route - السندات المالية

import { NextRequest } from 'next/server';
import { accountingController } from '@/controllers/accounting.controller';

export async function GET(req: NextRequest) {
  return accountingController.getVouchers(req);
}

export async function POST(req: NextRequest) {
  return accountingController.createVoucher(req);
}

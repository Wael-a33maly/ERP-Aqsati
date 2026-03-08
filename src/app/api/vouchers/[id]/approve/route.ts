// Approve Voucher API Route

import { NextRequest } from 'next/server';
import { accountingController } from '@/controllers/accounting.controller';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return accountingController.approveVoucher(req, { params });
}

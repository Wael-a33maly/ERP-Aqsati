// Voucher by ID API Route

import { NextRequest } from 'next/server';
import { accountingController } from '@/controllers/accounting.controller';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return accountingController.getVoucherById(req, { params });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return accountingController.updateVoucher(req, { params });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return accountingController.deleteVoucher(req, { params });
}

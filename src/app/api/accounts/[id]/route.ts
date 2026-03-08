// Account by ID API Route

import { NextRequest } from 'next/server';
import { accountingController } from '@/controllers/accounting.controller';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return accountingController.getAccountById(req, { params });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return accountingController.updateAccount(req, { params });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return accountingController.deleteAccount(req, { params });
}

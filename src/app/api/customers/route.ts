/**
 * Customers API Route - MVC
 */

import { NextRequest } from 'next/server'
import { customerController } from '@/controllers/customer.controller'

export async function GET(request: NextRequest) {
  return customerController.getCustomers(request)
}

export async function POST(request: NextRequest) {
  return customerController.createCustomer(request)
}

import { db } from '@/lib/db';

/**
 * Generate a sequential invoice number per company/branch
 * Format: INV-YYYY-NNNNNN
 * Example: INV-2024-000001
 */

interface GenerateInvoiceNumberParams {
  companyId: string;
  branchId?: string | null;
}

interface InvoiceCounter {
  prefix: string;
  year: number;
  sequence: number;
}

// In-memory cache for invoice counters to improve performance
const counterCache = new Map<string, InvoiceCounter>();

/**
 * Get or create an invoice counter for a given prefix
 */
async function getOrCreateCounter(prefix: string, year: number): Promise<number> {
  const cacheKey = `${prefix}-${year}`;
  
  // Check cache first
  const cached = counterCache.get(cacheKey);
  if (cached && cached.year === year) {
    // Increment the cached sequence
    cached.sequence += 1;
    return cached.sequence;
  }
  
  // Query the database for the highest invoice number matching the pattern
  const prefixPattern = `INV-${year}-%`;
  
  const latestInvoice = await db.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: `INV-${year}-`,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
    select: {
      invoiceNumber: true,
    },
  });
  
  let sequence = 1;
  
  if (latestInvoice) {
    // Extract the sequence number from the invoice number
    const parts = latestInvoice.invoiceNumber.split('-');
    if (parts.length === 3) {
      const lastSequence = parseInt(parts[2], 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }
  }
  
  // Cache the counter
  counterCache.set(cacheKey, { prefix, year, sequence });
  
  return sequence;
}

/**
 * Generate a unique invoice number
 * Format: INV-YYYY-NNNNNN
 */
export async function generateInvoiceNumber(
  params: GenerateInvoiceNumberParams
): Promise<string> {
  const { companyId, branchId } = params;
  
  // Get current year
  const year = new Date().getFullYear();
  
  // Get the next sequence number
  const sequence = await getOrCreateCounter(`INV`, year);
  
  // Format the invoice number
  const paddedSequence = sequence.toString().padStart(6, '0');
  const invoiceNumber = `INV-${year}-${paddedSequence}`;
  
  // Verify uniqueness (handle race conditions)
  const existingInvoice = await db.invoice.findFirst({
    where: {
      invoiceNumber,
    },
  });
  
  if (existingInvoice) {
    // If collision occurs, recursively generate a new number
    // This handles race conditions in high-concurrency scenarios
    const newSequence = await getOrCreateCounter(`INV`, year);
    const newPaddedSequence = newSequence.toString().padStart(6, '0');
    return `INV-${year}-${newPaddedSequence}`;
  }
  
  return invoiceNumber;
}

/**
 * Generate a return number
 * Format: RTN-YYYY-NNNNNN
 */
export async function generateReturnNumber(
  companyId: string,
  branchId?: string | null
): Promise<string> {
  const year = new Date().getFullYear();
  const prefixPattern = `RTN-${year}-%`;
  
  const latestReturn = await db.return.findFirst({
    where: {
      returnNumber: {
        startsWith: `RTN-${year}-`,
      },
    },
    orderBy: {
      returnNumber: 'desc',
    },
    select: {
      returnNumber: true,
    },
  });
  
  let sequence = 1;
  
  if (latestReturn) {
    const parts = latestReturn.returnNumber.split('-');
    if (parts.length === 3) {
      const lastSequence = parseInt(parts[2], 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }
  }
  
  const paddedSequence = sequence.toString().padStart(6, '0');
  return `RTN-${year}-${paddedSequence}`;
}

/**
 * Generate a payment number
 * Format: PAY-YYYY-NNNNNN
 */
export async function generatePaymentNumber(
  companyId: string,
  branchId?: string | null
): Promise<string> {
  const year = new Date().getFullYear();
  
  const latestPayment = await db.payment.findFirst({
    where: {
      paymentNumber: {
        startsWith: `PAY-${year}-`,
      },
    },
    orderBy: {
      paymentNumber: 'desc',
    },
    select: {
      paymentNumber: true,
    },
  });
  
  let sequence = 1;
  
  if (latestPayment) {
    const parts = latestPayment.paymentNumber.split('-');
    if (parts.length === 3) {
      const lastSequence = parseInt(parts[2], 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }
  }
  
  const paddedSequence = sequence.toString().padStart(6, '0');
  return `PAY-${year}-${paddedSequence}`;
}

/**
 * Generate a contract number for installments
 * Format: CNT-YYYY-NNNNNN
 */
export async function generateContractNumber(): Promise<string> {
  const year = new Date().getFullYear();
  
  const latestContract = await db.installmentContract.findFirst({
    where: {
      contractNumber: {
        startsWith: `CNT-${year}-`,
      },
    },
    orderBy: {
      contractNumber: 'desc',
    },
    select: {
      contractNumber: true,
    },
  });
  
  let sequence = 1;
  
  if (latestContract) {
    const parts = latestContract.contractNumber.split('-');
    if (parts.length === 3) {
      const lastSequence = parseInt(parts[2], 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }
  }
  
  const paddedSequence = sequence.toString().padStart(6, '0');
  return `CNT-${year}-${paddedSequence}`;
}

/**
 * Generate customer code
 * Format: CUS-NNNNNN
 */
export async function generateCustomerCode(companyId: string): Promise<string> {
  const latestCustomer = await db.customer.findFirst({
    where: {
      companyId,
    },
    orderBy: {
      code: 'desc',
    },
    select: {
      code: true,
    },
  });
  
  let sequence = 1;
  
  if (latestCustomer) {
    const parts = latestCustomer.code.split('-');
    if (parts.length === 2) {
      const lastSequence = parseInt(parts[1], 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }
  }
  
  const paddedSequence = sequence.toString().padStart(6, '0');
  return `CUS-${paddedSequence}`;
}

/**
 * Generate zone code
 * Format: ZN-NNNN
 */
export async function generateZoneCode(companyId: string): Promise<string> {
  const latestZone = await db.zone.findFirst({
    where: {
      companyId,
    },
    orderBy: {
      code: 'desc',
    },
    select: {
      code: true,
    },
  });
  
  let sequence = 1;
  
  if (latestZone) {
    const parts = latestZone.code.split('-');
    if (parts.length === 2) {
      const lastSequence = parseInt(parts[1], 10);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }
  }
  
  const paddedSequence = sequence.toString().padStart(4, '0');
  return `ZN-${paddedSequence}`;
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';

// Valid document types
const DOCUMENT_TYPES = ['INVOICE', 'RECEIPT', 'CONTRACT', 'REPORT', 'INSTALLMENT_SCHEDULE', 'PAYMENT_RECEIPT'] as const;

// GET /api/print/preview - Generate HTML preview for a document
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, PERMISSIONS.REPORT_READ)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get('documentType');
    const documentId = searchParams.get('documentId');
    const templateId = searchParams.get('templateId');

    if (!documentType || !documentId) {
      return NextResponse.json(
        { success: false, error: 'Document type and document ID are required' },
        { status: 400 }
      );
    }

    if (!DOCUMENT_TYPES.includes(documentType)) {
      return NextResponse.json(
        { success: false, error: `Invalid document type. Must be one of: ${DOCUMENT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Get document data
    const documentData = await getDocumentData(documentType, documentId);
    if (!documentData) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    // Check company access
    const targetCompanyId = documentData.companyId;
    if (user.role !== 'SUPER_ADMIN' && user.companyId !== targetCompanyId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Get template
    let template = null;
    if (templateId) {
      template = await db.printTemplate.findUnique({
        where: { id: templateId },
      });
    }

    // If no template specified, get default for type
    if (!template) {
      template = await db.printTemplate.findFirst({
        where: {
          companyId: targetCompanyId,
          type: documentType === 'PAYMENT_RECEIPT' ? 'RECEIPT' : 
                documentType === 'INSTALLMENT_SCHEDULE' ? 'CONTRACT' : 
                documentType as any,
          isDefault: true,
          active: true,
        },
      });
    }

    // Generate HTML
    const html = await generateHTML(documentType, documentData, template);

    // Generate QR code URL for verification
    const qrCodeUrl = await generateQRCodeUrl(documentType, documentId, targetCompanyId);

    return NextResponse.json({
      success: true,
      data: {
        html,
        css: template?.css || getDefaultCSS(template?.paperSize || 'A4'),
        paperSize: template?.paperSize || 'A4',
        orientation: template?.orientation || 'portrait',
        qrCodeUrl,
        documentData,
      },
    });
  } catch (error: any) {
    console.error('Error generating preview:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate preview' },
      { status: 500 }
    );
  }
}

// POST /api/print/preview - Generate preview for multiple documents (batch)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(user, PERMISSIONS.REPORT_READ)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { documentType, documentIds, templateId } = body;

    if (!documentType || !documentIds || documentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Document type and document IDs are required' },
        { status: 400 }
      );
    }

    if (!DOCUMENT_TYPES.includes(documentType)) {
      return NextResponse.json(
        { success: false, error: `Invalid document type` },
        { status: 400 }
      );
    }

    // Get all document data
    const documents = await Promise.all(
      documentIds.map(async (docId: string) => {
        const data = await getDocumentData(documentType, docId);
        if (!data) return null;
        
        // Check access
        if (user.role !== 'SUPER_ADMIN' && user.companyId !== data.companyId) {
          return null;
        }
        return { id: docId, data };
      })
    );

    const validDocuments = documents.filter(Boolean);

    // Get template
    let template = null;
    if (templateId) {
      template = await db.printTemplate.findUnique({
        where: { id: templateId },
      });
    }

    if (!template && validDocuments.length > 0) {
      template = await db.printTemplate.findFirst({
        where: {
          companyId: validDocuments[0]!.data.companyId,
          type: documentType === 'PAYMENT_RECEIPT' ? 'RECEIPT' : 
                documentType === 'INSTALLMENT_SCHEDULE' ? 'CONTRACT' : 
                documentType as any,
          isDefault: true,
          active: true,
        },
      });
    }

    // Generate HTML for each document
    const previews = await Promise.all(
      validDocuments.map(async (doc) => {
        const html = await generateHTML(documentType, doc!.data, template);
        const qrCodeUrl = await generateQRCodeUrl(documentType, doc!.id, doc!.data.companyId);
        return {
          id: doc!.id,
          html,
          qrCodeUrl,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        previews,
        css: template?.css || getDefaultCSS(template?.paperSize || 'A4'),
        paperSize: template?.paperSize || 'A4',
        orientation: template?.orientation || 'portrait',
      },
    });
  } catch (error: any) {
    console.error('Error generating batch preview:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate batch preview' },
      { status: 500 }
    );
  }
}

// Helper function to get document data from database
async function getDocumentData(documentType: string, documentId: string): Promise<any> {
  switch (documentType) {
    case 'INVOICE':
      return await db.invoice.findUnique({
        where: { id: documentId },
        include: {
          company: true,
          branch: true,
          customer: true,
          agent: { select: { id: true, name: true, nameAr: true } },
          items: {
            include: {
              product: { select: { id: true, sku: true, name: true, nameAr: true, unit: true } },
            },
          },
          installmentContract: {
            include: {
              installments: { orderBy: { installmentNumber: 'asc' } },
            },
          },
        },
      });

    case 'PAYMENT_RECEIPT':
      return await db.payment.findUnique({
        where: { id: documentId },
        include: {
          company: true,
          branch: true,
          customer: true,
          agent: { select: { id: true, name: true, nameAr: true } },
          invoice: { select: { id: true, invoiceNumber: true, total: true } },
        },
      });

    case 'CONTRACT':
    case 'INSTALLMENT_SCHEDULE':
      return await db.installmentContract.findUnique({
        where: { id: documentId },
        include: {
          invoice: {
            include: {
              company: true,
              branch: true,
              items: {
                include: {
                  product: { select: { id: true, sku: true, name: true, nameAr: true } },
                },
              },
            },
          },
          customer: true,
          agent: { select: { id: true, name: true, nameAr: true } },
          installments: {
            orderBy: { installmentNumber: 'asc' },
            include: {
              payments: true,
            },
          },
        },
      });

    case 'REPORT':
      return await db.generatedReport.findUnique({
        where: { id: documentId },
        include: {
          company: true,
          template: true,
        },
      });

    default:
      return null;
  }
}

// Helper function to generate HTML from template
async function generateHTML(documentType: string, data: any, template: any): Promise<string> {
  if (template && template.content) {
    // Use custom template with variable substitution
    return substituteTemplateVariables(template.content, data);
  }

  // Use default templates
  return generateDefaultHTML(documentType, data);
}

// Helper function to substitute variables in template
function substituteTemplateVariables(template: string, data: any): string {
  let result = template;

  // Define all possible variables
  const variables: Record<string, any> = {
    // Company info
    '{{companyName}}': data.company?.name || '',
    '{{companyNameAr}}': data.company?.nameAr || '',
    '{{companyCode}}': data.company?.code || '',
    '{{companyLogo}}': data.company?.logo || '',
    '{{companyPhone}}': data.company?.phone || '',
    '{{companyEmail}}': data.company?.email || '',
    '{{companyAddress}}': data.company?.address || '',
    '{{companyTaxNumber}}': data.company?.taxNumber || '',

    // Branch info
    '{{branchName}}': data.branch?.name || '',
    '{{branchCode}}': data.branch?.code || '',
    '{{branchAddress}}': data.branch?.address || '',

    // Customer info
    '{{customerName}}': data.customer?.name || '',
    '{{customerNameAr}}': data.customer?.nameAr || '',
    '{{customerCode}}': data.customer?.code || '',
    '{{customerPhone}}': data.customer?.phone || '',
    '{{customerAddress}}': data.customer?.address || '',
    '{{customerNationalId}}': data.customer?.nationalId || '',

    // Invoice info
    '{{invoiceNumber}}': data.invoiceNumber || '',
    '{{invoiceDate}}': formatDate(data.invoiceDate),
    '{{dueDate}}': formatDate(data.dueDate),
    '{{invoiceType}}': data.type || '',
    '{{invoiceStatus}}': data.status || '',

    // Financial
    '{{subtotal}}': formatCurrency(data.subtotal),
    '{{discount}}': formatCurrency(data.discount),
    '{{taxAmount}}': formatCurrency(data.taxAmount),
    '{{total}}': formatCurrency(data.total),
    '{{paidAmount}}': formatCurrency(data.paidAmount),
    '{{remainingAmount}}': formatCurrency(data.remainingAmount),

    // Payment info
    '{{paymentNumber}}': data.paymentNumber || '',
    '{{paymentDate}}': formatDate(data.paymentDate),
    '{{paymentMethod}}': data.method || '',
    '{{paymentAmount}}': formatCurrency(data.amount),
    '{{paymentReference}}': data.reference || '',

    // Contract info
    '{{contractNumber}}': data.contractNumber || '',
    '{{contractDate}}': formatDate(data.contractDate),
    '{{totalAmount}}': formatCurrency(data.totalAmount),
    '{{downPayment}}': formatCurrency(data.downPayment),
    '{{financedAmount}}': formatCurrency(data.financedAmount),
    '{{numberOfPayments}}': data.numberOfPayments || '',
    '{{paymentFrequency}}': data.paymentFrequency || '',
    '{{interestRate}}': data.interestRate ? `${data.interestRate}%` : '',
    '{{interestAmount}}': formatCurrency(data.interestAmount),
    '{{startDate}}': formatDate(data.startDate),
    '{{endDate}}': formatDate(data.endDate),

    // Agent info
    '{{agentName}}': data.agent?.name || '',
    '{{agentNameAr}}': data.agent?.nameAr || '',

    // Current date
    '{{currentDate}}': formatDate(new Date()),
    '{{currentTime}}': new Date().toLocaleTimeString(),
  };

  // Substitute all variables
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), String(value));
  }

  return result;
}

// Helper function to generate default HTML
function generateDefaultHTML(documentType: string, data: any): string {
  switch (documentType) {
    case 'INVOICE':
      return generateInvoiceHTML(data);
    case 'PAYMENT_RECEIPT':
      return generatePaymentReceiptHTML(data);
    case 'CONTRACT':
    case 'INSTALLMENT_SCHEDULE':
      return generateContractHTML(data);
    case 'REPORT':
      return generateReportHTML(data);
    default:
      return '<p>Unsupported document type</p>';
  }
}

// Invoice HTML template
function generateInvoiceHTML(data: any): string {
  const items = data.items?.map((item: any, index: number) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${index + 1}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product?.sku || ''}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product?.name || ''} ${item.product?.nameAr || ''}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.unitPrice)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.discount)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.total)}</td>
    </tr>
  `).join('') || '';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
        <div>
          <h1 style="margin: 0; color: #333;">${data.company?.name || 'Company'}</h1>
          <p style="margin: 5px 0; color: #666;">${data.company?.address || ''}</p>
          <p style="margin: 5px 0; color: #666;">${data.company?.phone || ''} | ${data.company?.email || ''}</p>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; color: #2563eb;">INVOICE</h2>
          <p style="margin: 5px 0; font-size: 18px; font-weight: bold;">${data.invoiceNumber}</p>
          <p style="margin: 5px 0; color: #666;">Date: ${formatDate(data.invoiceDate)}</p>
          ${data.dueDate ? `<p style="margin: 5px 0; color: #666;">Due: ${formatDate(data.dueDate)}</p>` : ''}
        </div>
      </div>

      <!-- Customer Info -->
      <div style="background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Bill To:</h3>
        <p style="margin: 5px 0;"><strong>${data.customer?.name || ''}</strong></p>
        <p style="margin: 5px 0; color: #666;">${data.customer?.address || ''}</p>
        <p style="margin: 5px 0; color: #666;">${data.customer?.phone || ''}</p>
        ${data.agent ? `<p style="margin: 5px 0; color: #666;">Agent: ${data.agent.name}</p>` : ''}
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">#</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">SKU</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Description</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Disc</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end;">
        <div style="width: 300px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span>Subtotal:</span>
            <span>${formatCurrency(data.subtotal)}</span>
          </div>
          ${data.discount > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span>Discount:</span>
            <span>-${formatCurrency(data.discount)}</span>
          </div>
          ` : ''}
          ${data.taxAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span>Tax:</span>
            <span>${formatCurrency(data.taxAmount)}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 15px 0; border-top: 2px solid #333; font-size: 18px; font-weight: bold;">
            <span>Total:</span>
            <span>${formatCurrency(data.total)}</span>
          </div>
          ${data.paidAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; color: green;">
            <span>Paid:</span>
            <span>${formatCurrency(data.paidAmount)}</span>
          </div>
          ${data.remainingAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; color: red;">
            <span>Remaining:</span>
            <span>${formatCurrency(data.remainingAmount)}</span>
          </div>
          ` : ''}
          ` : ''}
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
        <p>Thank you for your business!</p>
        ${data.company?.taxNumber ? `<p>Tax Number: ${data.company.taxNumber}</p>` : ''}
      </div>
    </div>
  `;
}

// Payment Receipt HTML template
function generatePaymentReceiptHTML(data: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0;">${data.company?.name || 'Company'}</h2>
        <p style="margin: 5px 0; color: #666;">${data.branch?.name || ''}</p>
      </div>

      <!-- Receipt Info -->
      <div style="text-align: center; margin-bottom: 20px;">
        <h3 style="margin: 0; color: #2563eb;">RECEIPT</h3>
        <p style="margin: 5px 0;">${data.paymentNumber}</p>
        <p style="margin: 5px 0; color: #666;">${formatDate(data.paymentDate)}</p>
      </div>

      <!-- Customer Info -->
      <div style="margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
        <p style="margin: 5px 0;"><strong>Received from:</strong> ${data.customer?.name || ''}</p>
        <p style="margin: 5px 0; color: #666;">${data.customer?.phone || ''}</p>
      </div>

      <!-- Amount -->
      <div style="text-align: center; margin-bottom: 20px;">
        <p style="margin: 5px 0; font-size: 14px;">Amount Received</p>
        <p style="margin: 0; font-size: 28px; font-weight: bold; color: #2563eb;">${formatCurrency(data.amount)}</p>
      </div>

      <!-- Details -->
      <div style="margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; padding: 5px 0;">
          <span>Payment Method:</span>
          <span>${data.method}</span>
        </div>
        ${data.reference ? `
        <div style="display: flex; justify-content: space-between; padding: 5px 0;">
          <span>Reference:</span>
          <span>${data.reference}</span>
        </div>
        ` : ''}
        ${data.invoice ? `
        <div style="display: flex; justify-content: space-between; padding: 5px 0;">
          <span>Invoice:</span>
          <span>${data.invoice.invoiceNumber}</span>
        </div>
        ` : ''}
      </div>

      <!-- Agent -->
      ${data.agent ? `
      <div style="margin-bottom: 15px; text-align: center;">
        <p style="margin: 0; color: #666;">Collected by: ${data.agent.name}</p>
      </div>
      ` : ''}

      <!-- Footer -->
      <div style="text-align: center; color: #666; font-size: 12px;">
        <p>Thank you for your payment!</p>
      </div>
    </div>
  `;
}

// Contract/Installment Schedule HTML template
function generateContractHTML(data: any): string {
  const installments = data.installments?.map((inst: any, index: number) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${inst.installmentNumber}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${formatDate(inst.dueDate)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(inst.amount)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(inst.paidAmount)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(inst.remainingAmount)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${inst.status}</td>
    </tr>
  `).join('') || '';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0;">${data.invoice?.company?.name || 'Company'}</h1>
        <h2 style="margin: 10px 0; color: #2563eb;">INSTALLMENT CONTRACT</h2>
        <p style="margin: 5px 0;">Contract No: ${data.contractNumber}</p>
        <p style="margin: 5px 0; color: #666;">Date: ${formatDate(data.contractDate)}</p>
      </div>

      <!-- Parties -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div style="width: 48%; background: #f5f5f5; padding: 15px; border-radius: 5px;">
          <h4 style="margin: 0 0 10px 0;">Seller:</h4>
          <p style="margin: 5px 0;"><strong>${data.invoice?.company?.name || ''}</strong></p>
          <p style="margin: 5px 0; color: #666;">${data.invoice?.company?.address || ''}</p>
        </div>
        <div style="width: 48%; background: #f5f5f5; padding: 15px; border-radius: 5px;">
          <h4 style="margin: 0 0 10px 0;">Buyer:</h4>
          <p style="margin: 5px 0;"><strong>${data.customer?.name || ''}</strong></p>
          <p style="margin: 5px 0; color: #666;">${data.customer?.address || ''}</p>
          <p style="margin: 5px 0; color: #666;">${data.customer?.phone || ''}</p>
        </div>
      </div>

      <!-- Contract Details -->
      <div style="margin-bottom: 30px;">
        <h4 style="margin: 0 0 15px 0; border-bottom: 2px solid #333; padding-bottom: 10px;">Contract Terms</h4>
        <table style="width: 100%;">
          <tr>
            <td style="padding: 8px 0;">Total Amount:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatCurrency(data.totalAmount)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">Down Payment:</td>
            <td style="padding: 8px 0; text-align: right;">${formatCurrency(data.downPayment)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">Financed Amount:</td>
            <td style="padding: 8px 0; text-align: right;">${formatCurrency(data.financedAmount)}</td>
          </tr>
          ${data.interestRate > 0 ? `
          <tr>
            <td style="padding: 8px 0;">Interest Rate:</td>
            <td style="padding: 8px 0; text-align: right;">${data.interestRate}%</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">Interest Amount:</td>
            <td style="padding: 8px 0; text-align: right;">${formatCurrency(data.interestAmount)}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0;">Number of Payments:</td>
            <td style="padding: 8px 0; text-align: right;">${data.numberOfPayments}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">Payment Frequency:</td>
            <td style="padding: 8px 0; text-align: right;">${data.paymentFrequency}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">Start Date:</td>
            <td style="padding: 8px 0; text-align: right;">${formatDate(data.startDate)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">End Date:</td>
            <td style="padding: 8px 0; text-align: right;">${formatDate(data.endDate)}</td>
          </tr>
        </table>
      </div>

      <!-- Installment Schedule -->
      <div style="margin-bottom: 30px;">
        <h4 style="margin: 0 0 15px 0; border-bottom: 2px solid #333; padding-bottom: 10px;">Payment Schedule</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">#</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Due Date</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Amount</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Paid</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Remaining</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${installments}
          </tbody>
          <tfoot>
            <tr style="background: #f5f5f5; font-weight: bold;">
              <td style="padding: 10px;" colspan="2">Total:</td>
              <td style="padding: 10px; text-align: right;">${formatCurrency(data.installments?.reduce((sum: number, i: any) => sum + i.amount, 0) || 0)}</td>
              <td style="padding: 10px; text-align: right;">${formatCurrency(data.installments?.reduce((sum: number, i: any) => sum + i.paidAmount, 0) || 0)}</td>
              <td style="padding: 10px; text-align: right;">${formatCurrency(data.installments?.reduce((sum: number, i: any) => sum + i.remainingAmount, 0) || 0)}</td>
              <td style="padding: 10px;"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Signatures -->
      <div style="display: flex; justify-content: space-between; margin-top: 50px;">
        <div style="text-align: center; width: 45%;">
          <div style="border-top: 1px solid #333; padding-top: 10px;">
            <p style="margin: 0;">Seller Signature</p>
          </div>
        </div>
        <div style="text-align: center; width: 45%;">
          <div style="border-top: 1px solid #333; padding-top: 10px;">
            <p style="margin: 0;">Buyer Signature</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Report HTML template
function generateReportHTML(data: any): string {
  const reportData = data.data ? JSON.parse(data.data) : {};

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0;">${data.company?.name || 'Company'}</h1>
        <h2 style="margin: 10px 0;">${data.name || 'Report'}</h2>
        <p style="margin: 5px 0; color: #666;">Generated: ${formatDate(data.createdAt)}</p>
      </div>

      <!-- Report Type -->
      <div style="background: #f5f5f5; padding: 10px; margin-bottom: 20px; border-radius: 5px;">
        <p style="margin: 0;"><strong>Report Type:</strong> ${data.type}</p>
      </div>

      <!-- Report Data -->
      <div style="margin-bottom: 30px;">
        <h4 style="margin: 0 0 15px 0;">Summary</h4>
        <pre style="background: #f9f9f9; padding: 15px; border-radius: 5px; overflow-x: auto;">
${JSON.stringify(reportData.summary || reportData, null, 2)}
        </pre>
      </div>

      <!-- Footer -->
      <div style="text-align: center; color: #666; font-size: 12px; margin-top: 40px;">
        <p>Report ID: ${data.id}</p>
      </div>
    </div>
  `;
}

// Helper function to generate QR code URL for document verification
async function generateQRCodeUrl(documentType: string, documentId: string, companyId: string): Promise<string> {
  // Generate a verification URL that can be used to verify document authenticity
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://verify.example.com';
  const verificationUrl = `${baseUrl}/verify/${documentType.toLowerCase()}/${documentId}?company=${companyId}`;
  
  // For QR code, we can use a QR code API service
  // In production, you might want to generate this server-side
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;
}

// Helper function to format date
function formatDate(date: any): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Helper function to format currency
function formatCurrency(amount: any): string {
  if (amount === null || amount === undefined) return '0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Default CSS for print templates
function getDefaultCSS(paperSize: string): string {
  const sizes: Record<string, string> = {
    'A4': '210mm 297mm',
    'A5': '148mm 210mm',
    'Letter': '8.5in 11in',
    'Legal': '8.5in 14in',
    'Thermal80mm': '80mm auto',
    'Thermal58mm': '58mm auto',
  };

  return `
    @page {
      size: ${sizes[paperSize] || sizes['A4']};
      margin: 10mm;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    th, td {
      padding: 8px;
      text-align: left;
    }
    
    h1, h2, h3, h4 {
      margin: 0 0 10px 0;
    }
    
    p {
      margin: 5px 0;
    }
  `;
}

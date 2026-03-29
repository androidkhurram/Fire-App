/**
 * Invoice PDF generation and sharing
 */
import type {Invoice, Customer, InvoiceLineItem} from './dataService';
import {generatePDF} from 'react-native-html-to-pdf';

/** Escape HTML to prevent broken PDF */
function escapeHtml(s: string): string {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildInvoiceHtml(
  invoice: Invoice,
  customer?: Customer,
  lineItems?: InvoiceLineItem[],
): string {
  const serviceType = invoice.service_type ?? 'inspection';
  const paymentMethod = invoice.payment_method ?? 'invoice';
  const paymentStatus = invoice.payment_status ?? 'pending';
  const nextServiceDate = customer?.next_service_date;

  const hasLineItems = lineItems && lineItems.length > 0;
  const lineItemsRows = hasLineItems
    ? lineItems!
        .map(
          li =>
            `<tr><td>${escapeHtml(li.description)}</td><td>${li.quantity}</td><td>$${(li.price * li.quantity).toFixed(2)}</td>${li.tax_applied ? `<td>8.25%</td>` : '<td>—</td>'}</tr>`,
        )
        .join('')
    : '';

  const detailsTable = hasLineItems
    ? `
    <table>
      <thead>
        <tr><th>Description</th><th>Qty</th><th>Amount</th><th>Tax</th></tr>
      </thead>
      <tbody>
        ${lineItemsRows}
      </tbody>
    </table>`
    : `
    <table>
      <thead>
        <tr><th>Description</th><th>Amount</th></tr>
      </thead>
      <tbody>
        <tr><td>${escapeHtml(serviceType.charAt(0).toUpperCase() + serviceType.slice(1))} Service</td><td>$${invoice.amount.toFixed(2)}</td></tr>
        ${invoice.tax > 0 ? `<tr><td>Tax</td><td>$${invoice.tax.toFixed(2)}</td></tr>` : ''}
      </tbody>
    </table>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 32px; font-size: 14px; color: #333; }
    h1 { color: #c00; border-bottom: 2px solid #c00; padding-bottom: 12px; margin-bottom: 24px; font-size: 24px; }
    .header { margin-bottom: 32px; overflow: hidden; }
    .company { font-weight: bold; font-size: 18px; color: #333; }
    .invoice-meta { float: right; text-align: right; color: #666; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background: #f5f5f5; font-weight: 600; }
    .section { margin: 24px 0; }
    .section h2 { color: #555; font-size: 16px; margin-bottom: 12px; }
    .totals { margin-top: 24px; text-align: right; }
    .totals table { width: 300px; margin-left: auto; }
    .total-row { font-weight: bold; font-size: 18px; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h1>INVOICE</h1>

  <div class="header">
    <div>
      <div class="company">Fire Inspection Services</div>
      <p style="margin: 8px 0 0 0; color: #666;">Invoice #${escapeHtml(invoice.id.slice(0, 8).toUpperCase())}</p>
    </div>
    <div class="invoice-meta">
      <p><strong>Date:</strong> ${escapeHtml(invoice.invoice_date)}</p>
      <p><strong>Service:</strong> ${escapeHtml(serviceType.charAt(0).toUpperCase() + serviceType.slice(1))}</p>
    </div>
  </div>

  <div class="section">
    <h2>Bill To</h2>
    <table>
      <tr><th>Customer</th><td>${escapeHtml(customer?.business_name ?? 'N/A')}</td></tr>
      ${customer?.address || customer?.suite ? `<tr><th>Address</th><td>${escapeHtml([customer?.address, customer?.suite, customer?.city, customer?.state, customer?.zip].filter(Boolean).join(', '))}</td></tr>` : ''}
      ${customer?.phone ? `<tr><th>Phone</th><td>${escapeHtml(customer.phone)}</td></tr>` : ''}
      ${customer?.email ? `<tr><th>Email</th><td>${escapeHtml(customer.email)}</td></tr>` : ''}
    </table>
  </div>

  <div class="section">
    <h2>Invoice Details</h2>
    ${detailsTable}
  </div>

  <div class="totals">
    <table>
      ${hasLineItems && invoice.tax > 0 ? `
      <tr><td>Subtotal</td><td>$${invoice.amount.toFixed(2)}</td></tr>
      <tr><td>Total Tax</td><td>$${invoice.tax.toFixed(2)}</td></tr>
      ` : ''}
      <tr class="total-row"><td>Total</td><td>$${invoice.total.toFixed(2)}</td></tr>
      <tr><td>Payment Method</td><td>${escapeHtml(paymentMethod)}</td></tr>
      <tr><td>Status</td><td>${escapeHtml(paymentStatus)}</td></tr>
      ${nextServiceDate ? `<tr><td>Next Inspection Due</td><td>${escapeHtml(nextServiceDate)}</td></tr>` : ''}
    </table>
  </div>

  <div class="footer">
    <p>Thank you for your business.</p>
    <p>Generated: ${escapeHtml(new Date().toLocaleString())}</p>
  </div>
</body>
</html>`;
}

export async function generateInvoicePdf(
  invoice: Invoice,
  customer?: Customer,
  lineItems?: InvoiceLineItem[],
): Promise<{filePath: string; fileUri: string} | null> {
  try {
    if (typeof generatePDF !== 'function') throw new Error('PDF module not available');
    const html = buildInvoiceHtml(invoice, customer, lineItems);
    const options = {
      html,
      fileName: `invoice-${invoice.id.slice(0, 8)}`,
      directory: 'Documents',
      width: 612,
      height: 792,
      shouldPrintBackgrounds: true,
    };
    const file = await generatePDF(options);
    if (!file?.filePath) return null;
    const fileUri = file.filePath.startsWith('file://') ? file.filePath : `file://${file.filePath}`;
    return {filePath: file.filePath, fileUri};
  } catch (e) {
    if (__DEV__) console.warn('Invoice PDF generation failed:', e);
    return null;
  }
}

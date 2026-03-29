import { supabaseServer } from '@/lib/supabase-server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDateUS } from '@/lib/date-utils';
import { DownloadPdfButton } from '@/components/DownloadPdfButton';

export const dynamic = 'force-dynamic';

async function getInvoice(id: string) {
  const { data, error } = await supabaseServer
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data as Record<string, unknown>;
}

async function getCustomer(customerId: string) {
  const { data, error } = await supabaseServer
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();
  if (error || !data) return null;
  return data as Record<string, unknown>;
}

async function getInvoiceLineItems(invoiceId: string) {
  const { data, error } = await supabaseServer
    .from('invoice_line_items')
    .select('id, description, price, quantity, tax_applied')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return (data ?? []) as Array<{
    id: string;
    description: string;
    price: number;
    quantity: number;
    tax_applied: boolean;
  }>;
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const [customer, lineItems] = await Promise.all([
    invoice.customer_id ? getCustomer(invoice.customer_id as string) : Promise.resolve(null),
    getInvoiceLineItems(id),
  ]);

  const serviceType = (invoice.service_type as string) ?? 'inspection';
  const paymentMethod = String(invoice.payment_method ?? 'invoice');
  const paymentStatus = String(invoice.payment_status ?? 'pending');
  const amount = Number(invoice.amount ?? 0);
  const tax = Number(invoice.tax ?? 0);
  const total = Number(invoice.total ?? 0);

  const customerAddress = customer
    ? [customer.address, customer.suite, customer.city, customer.state, customer.zip]
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <div className="p-8">
      <style>
        {`@media print {
          .print\\:hidden { display: none !important; }
          body { padding: 0; }
        }`}
      </style>
      <div className="mb-6 flex justify-between items-center print:hidden">
        <Link
          href="/invoices"
          className="text-red-600 hover:text-red-800 font-medium text-sm"
        >
          ← Back to Invoices
        </Link>
        <DownloadPdfButton elementId="invoice-print-area" title="Invoice" />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden print:shadow-none" id="invoice-print-area">
        <div className="p-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-red-600">INVOICE</h1>
              <p className="text-gray-500 mt-1 font-mono">
                #{String(invoice.id).slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p>
                <strong>Date:</strong> {formatDateUS(String(invoice.invoice_date))}
              </p>
              <p>
                <strong>Service:</strong> {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h2>
            <p className="font-medium text-gray-900">{String(customer?.business_name ?? 'N/A')}</p>
            {customerAddress ? (
              <p className="text-gray-600 text-sm mt-1">{customerAddress}</p>
            ) : null}
            {customer?.phone ? (
              <p className="text-gray-600 text-sm">Phone: {String(customer.phone)}</p>
            ) : null}
            {customer?.email ? (
              <p className="text-gray-600 text-sm">Email: {String(customer.email)}</p>
            ) : null}
          </div>

          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Invoice Details</h2>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Qty
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Tax
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lineItems.length > 0 ? (
                  lineItems.map((li) => (
                    <tr key={li.id}>
                      <td className="px-4 py-3 text-gray-900">{li.description}</td>
                      <td className="px-4 py-3 text-gray-600">{li.quantity}</td>
                      <td className="px-4 py-3 text-gray-900">
                        ${(li.price * li.quantity).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {li.tax_applied ? '8.25%' : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-3 text-gray-900">
                      {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Service
                    </td>
                    <td className="px-4 py-3">1</td>
                    <td className="px-4 py-3 text-gray-900">${amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-600">{tax > 0 ? '8.25%' : '—'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <table className="w-64">
              <tbody>
                {lineItems.length > 0 && tax > 0 ? (
                  <>
                    <tr>
                      <td className="py-2 text-gray-600">Subtotal</td>
                      <td className="py-2 text-right font-medium">${amount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-gray-600">Total Tax</td>
                      <td className="py-2 text-right font-medium">${tax.toFixed(2)}</td>
                    </tr>
                  </>
                ) : null}
                <tr className="border-t-2 border-gray-300">
                  <td className="py-3 font-bold text-gray-900">Total</td>
                  <td className="py-3 text-right font-bold text-lg">${total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
            <p>Payment Method: {paymentMethod}</p>
            <p>Status: {paymentStatus}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

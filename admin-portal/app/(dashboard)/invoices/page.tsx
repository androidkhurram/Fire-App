import { Suspense } from 'react';
import { supabaseServer } from '@/lib/supabase-server';
import Link from 'next/link';
import { formatDateUS } from '@/lib/date-utils';
import { FilterBar } from '@/components/FilterBar';

export const dynamic = 'force-dynamic';

type InvoiceRow = {
  id: string;
  invoice_date: string;
  customer_id: string | null;
  customer_name: string;
  service_type: string;
  amount: number;
  tax: number;
  total: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
};

function formatPaymentMethod(m: string): string {
  if (!m) return '—';
  if (m === 'credit_card' || m === 'card') return 'Credit Card';
  if (m === 'cash') return 'Cash';
  if (m === 'invoice') return 'Invoice';
  if (m === 'check') return 'Check';
  return m;
}

async function getInvoices(): Promise<InvoiceRow[]> {
  const { data: invoicesData, error } = await supabaseServer
    .from('invoices')
    .select('id, invoice_date, customer_id, service_type, amount, tax, total, payment_method, payment_status, created_at')
    .order('invoice_date', { ascending: false });
  if (error) return [];

  const invoices = (invoicesData ?? []) as Record<string, unknown>[];
  const customerIds = Array.from(new Set(invoices.map((i) => i.customer_id as string).filter(Boolean)));
  const customersMap: Record<string, string> = {};

  if (customerIds.length > 0) {
    const { data: customersData } = await supabaseServer
      .from('customers')
      .select('id, business_name')
      .in('id', customerIds);
    if (customersData) {
      for (const c of customersData as Record<string, unknown>[]) {
        customersMap[c.id as string] = String(c.business_name ?? '');
      }
    }
  }

  return invoices.map((i) => ({
    id: i.id as string,
    invoice_date: String(i.invoice_date ?? '').split('T')[0] ?? '—',
    customer_id: i.customer_id as string | null,
    customer_name: customersMap[i.customer_id as string] ?? '—',
    service_type: String(i.service_type ?? 'inspection'),
    amount: Number(i.amount ?? 0),
    tax: Number(i.tax ?? 0),
    total: Number(i.total ?? 0),
    payment_method: formatPaymentMethod(String(i.payment_method ?? '')),
    payment_status: String(i.payment_status ?? 'pending'),
    created_at: String(i.created_at ?? ''),
  }));
}

function filterInvoices(
  invoices: InvoiceRow[],
  filters: { search?: string; dateFrom?: string; dateTo?: string; status?: string; serviceType?: string }
) {
  let out = invoices;
  if (filters.search?.trim()) {
    const term = filters.search.trim().toLowerCase();
    out = out.filter((i) => i.customer_name.toLowerCase().includes(term));
  }
  if (filters.dateFrom) {
    out = out.filter((i) => i.invoice_date >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    out = out.filter((i) => i.invoice_date <= filters.dateTo!);
  }
  if (filters.status) {
    out = out.filter((i) => i.payment_status === filters.status);
  }
  if (filters.serviceType) {
    out = out.filter((i) => i.service_type === filters.serviceType);
  }
  return out;
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; dateFrom?: string; dateTo?: string; status?: string; serviceType?: string }>;
}) {
  const params = await searchParams;
  const allInvoices = await getInvoices();
  const invoices = filterInvoices(allInvoices, params);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Invoices</h1>
      <Suspense fallback={<div className="h-14 mb-6" />}>
        <FilterBar
          fields={[
            { type: 'search', param: 'search', placeholder: 'Search customer...' },
            { type: 'date', param: 'dateFrom', label: 'From' },
            { type: 'date', param: 'dateTo', label: 'To' },
            {
              type: 'select',
              param: 'status',
              label: 'Status',
              options: [
                { value: 'paid', label: 'Paid' },
                { value: 'pending', label: 'Pending' },
                { value: 'overdue', label: 'Overdue' },
              ],
            },
            {
              type: 'select',
              param: 'serviceType',
              label: 'Service',
              options: [
                { value: 'inspection', label: 'Inspection' },
                { value: 'installation', label: 'Installation' },
                { value: 'maintenance', label: 'Maintenance' },
              ],
            },
          ]}
        />
      </Suspense>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No invoices yet. Invoices are created from the mobile app.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">{formatDateUS(inv.invoice_date)}</td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">
                    #{inv.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-gray-900">{inv.customer_name}</td>
                  <td className="px-6 py-4 text-gray-600 capitalize">{inv.service_type}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">${inv.total.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        inv.payment_status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : inv.payment_status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {inv.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { Suspense } from 'react';
import { supabaseServer } from '@/lib/supabase-server';
import Link from 'next/link';
import { FilterBar } from '@/components/FilterBar';

export const dynamic = 'force-dynamic';

type PaymentRow = {
  id: string;
  date: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  payment_method: string;
  payment_status: string;
  inspection_id?: string;
  source: 'payments' | 'inspection';
};

function formatPaymentMethod(m: string): string {
  if (!m) return '—';
  if (m === 'credit_card' || m === 'card') return 'Credit Card';
  if (m === 'cash') return 'Cash';
  if (m === 'invoice') return 'Invoice';
  return m;
}

/** payment_info_json stores amounts as strings; empty string must not become NaN. */
function amountFromJson(v: unknown): number {
  if (v == null || v === '') return 0;
  const n = parseFloat(String(v).replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

async function getPayments(): Promise<PaymentRow[]> {
  const rows: PaymentRow[] = [];

  // 1. Payments from the payments table
  const { data: paymentsData, error } = await supabaseServer
    .from('payments')
    .select('*')
    .order('date', { ascending: false });
  if (!error && paymentsData) {
    for (const p of paymentsData as Record<string, unknown>[]) {
      const amt = Number(p.amount ?? 0);
      const status = String(p.payment_status ?? 'paid');
      rows.push({
        id: p.id as string,
        date: String(p.date ?? '—'),
        totalAmount: amt,
        paidAmount: status === 'paid' ? amt : 0,
        pendingAmount: status === 'pending' ? amt : 0,
        payment_method: formatPaymentMethod(String(p.payment_method ?? '')),
        payment_status: status,
        inspection_id: p.inspection_id as string | undefined,
        source: 'payments',
      });
    }
  }

  // 2. Payments from inspections (payment_info_json) - added via mobile app
  const { data: inspectionsData } = await supabaseServer
    .from('inspections')
    .select('id, inspection_date, payment_info_json, created_at')
    .not('payment_info_json', 'is', null)
    .order('inspection_date', { ascending: false })
    .limit(100);
  if (inspectionsData) {
    for (const i of inspectionsData as Record<string, unknown>[]) {
      const info = i.payment_info_json as Record<string, unknown> | null;
      if (!info) continue;
      const total = amountFromJson(info.totalAmount);
      const advance = amountFromJson(info.advanceAmount);
      const balance = amountFromJson(info.balanceAmount);
      const paid = advance;
      const pending = balance > 0 ? balance : (total - advance);
      if (total <= 0 && advance <= 0) continue;
      const method = formatPaymentMethod(String(info.paymentMode ?? 'cash'));
      const date = String(i.inspection_date ?? i.created_at ?? '').split('T')[0] ?? '—';
      const hasPending = pending > 0;
      rows.push({
        id: `insp-${i.id}`,
        date,
        totalAmount: total > 0 ? total : advance + pending,
        paidAmount: paid,
        pendingAmount: pending,
        payment_method: method,
        payment_status: hasPending ? 'partial' : 'paid',
        inspection_id: i.id as string,
        source: 'inspection',
      });
    }
  }

  // Sort by date descending
  rows.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  return rows;
}

function filterPayments(
  payments: PaymentRow[],
  filters: { dateFrom?: string; dateTo?: string; status?: string; method?: string }
) {
  let out = payments;
  if (filters.dateFrom) {
    out = out.filter((p) => p.date >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    out = out.filter((p) => p.date <= filters.dateTo!);
  }
  if (filters.status) {
    out = out.filter((p) => p.payment_status === filters.status);
  }
  if (filters.method) {
    const methodMap: Record<string, string[]> = {
      cash: ['Cash'],
      card: ['Credit Card', 'card', 'credit_card'],
      invoice: ['Invoice'],
      check: ['Check'],
    };
    const matches = methodMap[filters.method] ?? [filters.method];
    out = out.filter((p) => matches.some((m) => p.payment_method.toLowerCase().includes(m.toLowerCase())));
  }
  return out;
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string; status?: string; method?: string }>;
}) {
  const params = await searchParams;
  const allPayments = await getPayments();
  const payments = filterPayments(allPayments, params);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Payments</h1>
      <Suspense fallback={<div className="h-14 mb-6" />}>
        <FilterBar
          fields={[
            { type: 'date', param: 'dateFrom', label: 'From' },
            { type: 'date', param: 'dateTo', label: 'To' },
            {
              type: 'select',
              param: 'status',
              label: 'Status',
              options: [
                { value: 'paid', label: 'Paid' },
                { value: 'partial', label: 'Partial' },
                { value: 'pending', label: 'Pending' },
              ],
            },
            {
              type: 'select',
              param: 'method',
              label: 'Method',
              options: [
                { value: 'cash', label: 'Cash' },
                { value: 'card', label: 'Card' },
                { value: 'invoice', label: 'Invoice' },
                { value: 'check', label: 'Check' },
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No payments yet.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">{p.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">${p.totalAmount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-900">${p.paidAmount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-900">${p.pendingAmount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-600">{p.payment_method}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        p.payment_status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : p.payment_status === 'partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {p.payment_status}
                      </span>
                      {p.inspection_id && (
                        <Link
                          href={`/inspections/${p.inspection_id}`}
                          className="text-red-600 hover:underline text-xs"
                        >
                          View inspection
                        </Link>
                      )}
                    </div>
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

import { supabaseServer } from '@/lib/supabase-server';
import Link from 'next/link';
import { formatDateUS } from '@/lib/date-utils';
import { FilterBar } from '@/components/FilterBar';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

async function getSemiAnnualReports() {
  const { data, error } = await supabaseServer
    .from('semi_annual_reports')
    .select(`
      *,
      customers(business_name, customer_name)
    `)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

function filterReports(
  reports: Record<string, unknown>[],
  filters: { search?: string; dateFrom?: string; dateTo?: string }
) {
  let out = reports;
  if (filters.search?.trim()) {
    const term = filters.search.trim().toLowerCase();
    out = out.filter((r) => {
      const fd = r.form_data as Record<string, unknown> | null;
      const customerName = String(fd?.customerName ?? '').toLowerCase();
      const cust = r.customers as Record<string, unknown> | null;
      const custName = cust ? String(cust.business_name ?? cust.customer_name ?? '').toLowerCase() : '';
      return customerName.includes(term) || custName.includes(term);
    });
  }
  if (filters.dateFrom) {
    out = out.filter((r) => {
      const fd = r.form_data as Record<string, unknown> | null;
      const d = fd?.date as string | undefined;
      return (d ?? '').toString().slice(0, 10) >= filters.dateFrom!;
    });
  }
  if (filters.dateTo) {
    out = out.filter((r) => {
      const fd = r.form_data as Record<string, unknown> | null;
      const d = fd?.date as string | undefined;
      return (d ?? '').toString().slice(0, 10) <= filters.dateTo!;
    });
  }
  return out;
}

export default async function SemiAnnualReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; dateFrom?: string; dateTo?: string }>;
}) {
  const params = await searchParams;
  const allReports = await getSemiAnnualReports();
  const reports = filterReports(allReports, params);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Inspection Reports</h1>
      <Suspense fallback={<div className="h-14 mb-6" />}>
        <FilterBar
          fields={[
            { type: 'search', param: 'search', placeholder: 'Search customer...' },
            { type: 'date', param: 'dateFrom', label: 'From' },
            { type: 'date', param: 'dateTo', label: 'To' },
          ]}
        />
      </Suspense>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No semi-annual reports yet. Create from the mobile app.
                </td>
              </tr>
            ) : (
              reports.map((r: Record<string, unknown>) => {
                const fd = r.form_data as Record<string, unknown> | null;
                const customerName = fd?.customerName ?? '';
                const cust = r.customers as Record<string, unknown> | null;
                const displayName =
                  (customerName as string) ||
                  (cust ? String(cust.business_name ?? cust.customer_name ?? '') : '—');
                const reportType = fd?.reportType as string | undefined;
                const date = fd?.date as string | undefined;
                const created = r.created_at as string | undefined;
                return (
                  <tr key={r.id as string} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">{formatDateUS(date)}</td>
                    <td className="px-6 py-4 text-gray-600">{String(displayName)}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {reportType === 'annual'
                        ? 'Annual'
                        : reportType === 'semi_annual'
                          ? 'Semi-Annual'
                          : reportType === 'certified'
                            ? 'Certified'
                            : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatDateUS(created?.slice(0, 10))}</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/semi-annual-reports/${r.id}`}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

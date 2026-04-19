import { Suspense } from 'react';
import { supabaseServer } from '@/lib/supabase-server';
import Link from 'next/link';
import { formatDateUS } from '@/lib/date-utils';
import { FilterBar } from '@/components/FilterBar';

export const dynamic = 'force-dynamic';

async function getInstallations() {
  const { data, error } = await supabaseServer
    .from('inspections')
    .select(`
      *,
      customers(business_name, customer_name)
    `)
    .eq('service_type', 'installation')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

function filterRows(
  rows: Record<string, unknown>[],
  filters: { search?: string; dateFrom?: string; dateTo?: string; status?: string; phase?: string }
) {
  let out = rows;
  if (filters.search?.trim()) {
    const term = filters.search.trim().toLowerCase();
    out = out.filter((i) => {
      const customer = i.customers as Record<string, unknown> | null;
      const customerName = customer
        ? String(customer.business_name ?? customer.customer_name ?? '').toLowerCase()
        : '';
      const systemBrand = String(i.system_brand ?? '').toLowerCase();
      return customerName.includes(term) || systemBrand.includes(term);
    });
  }
  if (filters.dateFrom) {
    out = out.filter((i) => (i.inspection_date as string)?.toString().slice(0, 10) >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    out = out.filter((i) => (i.inspection_date as string)?.toString().slice(0, 10) <= filters.dateTo!);
  }
  if (filters.status) {
    out = out.filter((i) => i.inspection_status === filters.status);
  }
  if (filters.phase) {
    out = out.filter((i) => String(i.phase ?? '').toLowerCase() === filters.phase!.toLowerCase());
  }
  return out;
}

export default async function InstallationsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; dateFrom?: string; dateTo?: string; status?: string; phase?: string }>;
}) {
  const params = await searchParams;
  const allRows = await getInstallations();
  const rows = filterRows(allRows, params);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Installations</h1>
      <Suspense fallback={<div className="h-14 mb-6" />}>
        <FilterBar
          fields={[
            { type: 'search', param: 'search', placeholder: 'Search customer or system...' },
            { type: 'date', param: 'dateFrom', label: 'From' },
            { type: 'date', param: 'dateTo', label: 'To' },
            {
              type: 'select',
              param: 'status',
              label: 'Status',
              options: [
                { value: 'pass', label: 'Pass' },
                { value: 'fail', label: 'Fail' },
                { value: 'needs_repair', label: 'Needs Repair' },
              ],
            },
            {
              type: 'select',
              param: 'phase',
              label: 'Phase',
              options: [
                { value: 'site_inspection', label: 'Site Inspection' },
                { value: 'installation', label: 'Installation' },
                { value: 'testing', label: 'Testing' },
                { value: 'completed', label: 'Completed' },
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phase</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">System</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No installations yet. Create a new installation from the iPad app.
                </td>
              </tr>
            ) : (
              rows.map((i: Record<string, unknown>) => {
                const customer = i.customers as Record<string, unknown> | null;
                return (
                  <tr key={i.id as string} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">{formatDateUS(i.inspection_date as string)}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {customer ? String(customer.business_name ?? customer.customer_name ?? '') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          i.inspection_status === 'pass'
                            ? 'bg-green-100 text-green-800'
                            : i.inspection_status === 'fail'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {String(i.inspection_status ?? '—')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{String(i.phase ?? '—')}</td>
                    <td className="px-6 py-4 text-gray-600">{String(i.system_brand ?? '—')}</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/inspections/${i.id}?returnTo=installations`}
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

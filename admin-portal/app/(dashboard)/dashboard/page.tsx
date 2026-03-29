import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { formatDateUS } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

function getNextMonthRange() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = today.toISOString().split('T')[0]!;
  const end = new Date(today);
  end.setDate(end.getDate() + 30);
  return { start, end: end.toISOString().split('T')[0]! };
}

async function getDashboardData() {
  const { start, end } = getNextMonthRange();

  const [customersRes, inspectionsRes, inspectionsDueRes] = await Promise.all([
    supabase.from('customers').select('id'),
    supabase.from('inspections').select('inspection_status, inspection_date'),
    supabase
      .from('customers')
      .select('*')
      .not('next_service_date', 'is', null)
      .gte('next_service_date', start)
      .lte('next_service_date', end)
      .order('next_service_date', { ascending: true }),
  ]);

  const inspections = inspectionsRes.data ?? [];
  const inspectionsDue = (inspectionsDueRes.data ?? []) as Array<Record<string, unknown>>;
  const thisMonth = new Date().toISOString().slice(0, 7);
  const passCount = inspections.filter((i) => i.inspection_status === 'pass').length;
  const failCount = inspections.filter((i) => i.inspection_status === 'fail').length;
  const needsRepairCount = inspections.filter((i) => i.inspection_status === 'needs_repair').length;
  const thisMonthInspections = inspections.filter(
    (i) => i.inspection_date?.toString().startsWith(thisMonth)
  ).length;

  return {
    totalCustomers: customersRes.data?.length ?? 0,
    totalInspections: inspections.length,
    inspectionsDueCount: inspectionsDue.length,
    inspectionsDue: inspectionsDue.slice(0, 10),
    passCount,
    failCount,
    needsRepairCount,
    thisMonthInspections,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm font-medium">Total Customers</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{data.totalCustomers}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm font-medium">Total Inspections</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{data.totalInspections}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm font-medium">Inspections Due (Next 30 Days)</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{data.inspectionsDueCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm font-medium">This Month</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{data.thisMonthInspections}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm font-medium">Passed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{data.passCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm font-medium">Failed</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{data.failCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm font-medium">Needs Repair</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{data.needsRepairCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Inspections Due (Next 30 Days)</h2>
          <Link
            href="/inspections-due"
            className="text-red-600 hover:text-red-800 font-medium text-sm"
          >
            View all →
          </Link>
        </div>
        {data.inspectionsDue.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No inspections due in the next 30 days.
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Service Due</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.inspectionsDue.map((c) => (
                <tr key={c.id as string} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{String(c.business_name ?? '')}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {String(c.customer_name ?? '')}
                    {c.phone ? <span className="block text-sm">{String(c.phone)}</span> : null}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {[c.address, c.suite, c.city, c.state].filter(Boolean).join(', ')}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">
                    {formatDateUS(c.next_service_date as string)}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/customers/${c.id}`}
                      className="text-red-600 hover:text-red-800 font-medium text-sm"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}

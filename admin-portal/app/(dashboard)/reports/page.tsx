import { Suspense } from 'react';
import { supabaseServer } from '@/lib/supabase-server';
import { FilterBar } from '@/components/FilterBar';

export const dynamic = 'force-dynamic';

async function getReportData(dateFrom?: string, dateTo?: string, status?: string) {
  const [inspectionsRes, customersRes] = await Promise.all([
    supabaseServer.from('inspections').select('inspection_status, inspection_date'),
    supabaseServer.from('customers').select('id'),
  ]);
  let inspections = (inspectionsRes.data ?? []) as Array<{ inspection_status?: string; inspection_date?: string }>;

  if (dateFrom) {
    inspections = inspections.filter((i) => (i.inspection_date ?? '').toString().slice(0, 10) >= dateFrom);
  }
  if (dateTo) {
    inspections = inspections.filter((i) => (i.inspection_date ?? '').toString().slice(0, 10) <= dateTo);
  }
  if (status) {
    inspections = inspections.filter((i) => i.inspection_status === status);
  }

  const passCount = inspections.filter((i) => i.inspection_status === 'pass').length;
  const failCount = inspections.filter((i) => i.inspection_status === 'fail').length;
  const needsRepairCount = inspections.filter((i) => i.inspection_status === 'needs_repair').length;
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthInspections = inspections.filter(
    (i) => i.inspection_date?.toString().startsWith(thisMonth)
  ).length;

  return {
    totalCustomers: customersRes.data?.length ?? 0,
    totalInspections: inspections.length,
    passCount,
    failCount,
    needsRepairCount,
    thisMonthInspections,
  };
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string; status?: string }>;
}) {
  const params = await searchParams;
  const data = await getReportData(params.dateFrom, params.dateTo, params.status);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>
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
                { value: 'pass', label: 'Pass' },
                { value: 'fail', label: 'Fail' },
                { value: 'needs_repair', label: 'Needs Repair' },
              ],
            },
          ]}
        />
      </Suspense>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm font-medium">Total Inspections</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{data.totalInspections}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm font-medium">Passed</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{data.passCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm font-medium">Failed / Needs Repair</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{data.failCount + data.needsRepairCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm font-medium">This Month</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{data.thisMonthInspections}</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Inspection Summary</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Pass</span>
            <span className="font-medium">{data.passCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Fail</span>
            <span className="font-medium">{data.failCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Needs Repair</span>
            <span className="font-medium">{data.needsRepairCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

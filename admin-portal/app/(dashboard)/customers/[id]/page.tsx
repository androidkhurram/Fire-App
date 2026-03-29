import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDateUS } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

async function getCustomer(id: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data as Record<string, unknown>;
}

async function getAllInspections(customerId: string) {
  const { data, error } = await supabase
    .from('inspections')
    .select('*')
    .eq('customer_id', customerId)
    .order('inspection_date', { ascending: false });
  if (error) return [];
  return (data ?? []) as Array<Record<string, unknown>>;
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customer, inspections] = await Promise.all([
    getCustomer(id),
    getAllInspections(id),
  ]);

  if (!customer) notFound();

  const address = [customer.address, customer.suite, customer.city, customer.state, customer.zip]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="p-8">
      <div className="mb-6 flex gap-4">
        <Link
          href="/customers"
          className="text-red-600 hover:text-red-800 font-medium text-sm"
        >
          ← Back to Customers
        </Link>
        <Link
          href="/inspections-due"
          className="text-gray-600 hover:text-gray-800 font-medium text-sm"
        >
          Inspections Due
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {String(customer.business_name ?? '')}
      </h1>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Business</dt>
              <dd className="mt-1 text-gray-900">{String(customer.business_name ?? '—')}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Contact</dt>
              <dd className="mt-1 text-gray-900">{String(customer.customer_name ?? '—')}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-gray-900">{String(customer.phone ?? '—')}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-gray-900">{String(customer.email ?? '—')}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
              <dd className="mt-1 text-gray-900">{String(customer.contact_person_name ?? '—')}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Contact Phone</dt>
              <dd className="mt-1 text-gray-900">{String(customer.contact_person_phone ?? '—')}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Contact Email</dt>
              <dd className="mt-1 text-gray-900">{String(customer.contact_person_email ?? '—')}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-gray-900">{address || '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Inspection Due</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Next Service Due</dt>
              <dd className="mt-1 text-lg font-semibold text-red-600">
                {formatDateUS(customer.next_service_date as string)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Service</dt>
              <dd className="mt-1 text-gray-900">{formatDateUS(customer.last_service_date as string)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">System Type</dt>
              <dd className="mt-1 text-gray-900">{String(customer.system_type ?? '—')}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Inspections & Reports</h2>
          {inspections.length === 0 ? (
            <p className="text-gray-500">No inspections yet for this customer.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Type</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">System</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inspections.map((insp) => (
                  <tr key={insp.id as string} className="hover:bg-gray-50">
                    <td className="py-3 text-gray-900">
                      {formatDateUS(insp.inspection_date as string)}
                    </td>
                    <td className="py-3 text-gray-600">
                      {String(insp.service_type ?? 'inspection')}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          insp.inspection_status === 'pass'
                            ? 'bg-green-100 text-green-800'
                            : insp.inspection_status === 'fail'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {String(insp.inspection_status ?? '—')}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">
                      {[insp.system_brand, insp.system_model].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/inspections/${insp.id}`}
                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                      >
                        View details
                      </Link>
                      {insp.report_url ? (
                        <>
                          {' · '}
                          <a
                            href={String(insp.report_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                          >
                            PDF
                          </a>
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

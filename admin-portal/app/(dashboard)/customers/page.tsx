import { Suspense } from 'react';
import { supabaseServer } from '@/lib/supabase-server';
import Link from 'next/link';
import { formatDateUS } from '@/lib/date-utils';
import { FilterBar } from '@/components/FilterBar';

export const dynamic = 'force-dynamic';

async function getCustomers() {
  const { data, error } = await supabaseServer
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' }, { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
];

function filterCustomers(
  customers: Record<string, unknown>[],
  filters: { search?: string; dateFrom?: string; dateTo?: string; state?: string }
) {
  let out = customers;
  if (filters.search?.trim()) {
    const term = filters.search.trim().toLowerCase();
    out = out.filter((c) => {
      const biz = String(c.business_name ?? '').toLowerCase();
      const contact = String(c.customer_name ?? '').toLowerCase();
      const phone = String(c.phone ?? '').toLowerCase();
      const email = String(c.email ?? '').toLowerCase();
      const addr = [c.address, c.suite, c.city, c.state, c.zip].map((x) => String(x ?? '').toLowerCase()).join(' ');
      return biz.includes(term) || contact.includes(term) || phone.includes(term) || email.includes(term) || addr.includes(term);
    });
  }
  if (filters.dateFrom) {
    out = out.filter((c) => {
      const d = String(c.next_service_date ?? '').slice(0, 10);
      return d && d >= filters.dateFrom!;
    });
  }
  if (filters.dateTo) {
    out = out.filter((c) => {
      const d = String(c.next_service_date ?? '').slice(0, 10);
      return d && d <= filters.dateTo!;
    });
  }
  if (filters.state) {
    const filterVal = filters.state.toUpperCase();
    const filterLabel = US_STATES.find((x) => x.value === filters.state)?.label?.toLowerCase();
    out = out.filter((c) => {
      const s = String(c.state ?? '').trim();
      return s.toUpperCase() === filterVal || s.toLowerCase() === filterLabel;
    });
  }
  return out;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; dateFrom?: string; dateTo?: string; state?: string }>;
}) {
  const params = await searchParams;
  const allCustomers = await getCustomers();
  const customers = filterCustomers(allCustomers, params);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
      </div>
      <Suspense fallback={<div className="h-14 mb-6" />}>
        <FilterBar
          fields={[
            { type: 'search', param: 'search', placeholder: 'Search business, contact, address...' },
            { type: 'date', param: 'dateFrom', label: 'Next service from' },
            { type: 'date', param: 'dateTo', label: 'Next service to' },
            {
              type: 'select',
              param: 'state',
              label: 'State',
              options: US_STATES,
            },
          ]}
        />
      </Suspense>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No customers yet. Add from the iPad app.
                </td>
              </tr>
            ) : (
              customers.map((c: Record<string, unknown>) => (
                <tr key={c.id as string} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{String(c.business_name ?? '')}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {String(c.customer_name ?? '')}
                    {c.phone ? <span className="block text-sm">{String(c.phone)}</span> : null}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {[c.address, c.suite, c.city, c.state].filter(Boolean).join(', ')}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{formatDateUS(c.next_service_date as string)}</td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/customers/${c.id}`}
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

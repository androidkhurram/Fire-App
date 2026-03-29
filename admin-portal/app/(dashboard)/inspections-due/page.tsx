'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase-client';
import { formatDateUS } from '@/lib/date-utils';

type FilterType = 'week' | 'month' | 'quarter' | 'custom';

function getDateRange(filter: FilterType, customStart?: string, customEnd?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let start: Date;
  let end: Date;

  switch (filter) {
    case 'week':
      start = new Date(today);
      end = new Date(today);
      end.setDate(end.getDate() + 7);
      break;
    case 'month':
      start = new Date(today);
      end = new Date(today);
      end.setDate(end.getDate() + 30);
      break;
    case 'quarter':
      start = new Date(today);
      end = new Date(today);
      end.setDate(end.getDate() + 90);
      break;
    case 'custom':
      start = customStart ? new Date(customStart) : today;
      end = customEnd ? new Date(customEnd) : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      start = today;
      end = new Date(today);
      end.setDate(end.getDate() + 30);
  }

  return {
    start: start.toISOString().split('T')[0]!,
    end: end.toISOString().split('T')[0]!,
  };
}

export default function InspectionsDuePage() {
  const [filter, setFilter] = useState<FilterType>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [customStartInput, setCustomStartInput] = useState('');
  const [customEndInput, setCustomEndInput] = useState('');
  const [customers, setCustomers] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { start, end } = getDateRange(filter, customStart || undefined, customEnd || undefined);

    async function fetchCustomers() {
      setLoading(true);
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .not('next_service_date', 'is', null)
        .gte('next_service_date', start)
        .lte('next_service_date', end)
        .order('next_service_date', { ascending: true });
      if (error) {
        setCustomers([]);
      } else {
        setCustomers(data ?? []);
      }
      setLoading(false);
    }

    if (filter === 'custom' && !customStart && !customEnd) {
      setLoading(false);
      setCustomers([]);
      return;
    }

    fetchCustomers();
  }, [filter, customStart, customEnd]);

  const handleCustomApply = () => {
    if (customStartInput && customEndInput) {
      setCustomStart(customStartInput);
      setCustomEnd(customEndInput);
    }
  };

  const filterLabels: Record<FilterType, string> = {
    week: 'Due in next week',
    month: 'Due in next month',
    quarter: 'Due in next 3 months',
    custom: 'Custom dates',
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Inspections Due</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        {(['week', 'month', 'quarter', 'custom'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === f
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {filter === 'custom' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
            <input
              type="date"
              value={customStartInput}
              onChange={(e) => setCustomStartInput(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
            <input
              type="date"
              value={customEndInput}
              onChange={(e) => setCustomEndInput(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <button
            onClick={handleCustomApply}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
          >
            Apply
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-gray-500">Loading...</div>
        ) : (
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
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {filter === 'custom' && !customStart && !customEnd
                      ? 'Select start and end dates, then click Apply'
                      : 'No customers with inspections due in this time frame'}
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
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {formatDateUS(c.next_service_date as string)}
                    </td>
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
        )}
      </div>
    </div>
  );
}

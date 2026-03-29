'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export type FilterField =
  | { type: 'search'; param: string; placeholder: string }
  | { type: 'select'; param: string; label: string; options: { value: string; label: string }[] }
  | { type: 'date'; param: string; label: string };

interface FilterBarProps {
  fields: FilterField[];
  onClear?: () => void;
}

export function FilterBar({ fields }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchField = fields.find((f) => f.type === 'search') as { type: 'search'; param: string; placeholder: string } | undefined;
  const [searchDraft, setSearchDraft] = useState(searchParams.get(searchField?.param ?? '') ?? '');

  useEffect(() => {
    setSearchDraft(searchParams.get(searchField?.param ?? '') ?? '');
  }, [searchParams, searchField?.param]);

  const updateParam = useCallback(
    (param: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value) next.set(param, value);
      else next.delete(param);
      router.push(`?${next.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push(window.location.pathname, { scroll: false });
  }, [router]);

  const hasActive = fields.some((f) => searchParams.get(f.param));

  const handleSearchApply = useCallback(
    (param: string, value: string) => {
      const v = value.trim();
      updateParam(param, v);
      setSearchDraft(v);
    },
    [updateParam]
  );

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      {fields.map((f) => {
        if (f.type === 'search') {
          return (
            <input
              key={f.param}
              type="search"
              placeholder={f.placeholder}
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onBlur={(e) => handleSearchApply(f.param, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchApply(f.param, (e.target as HTMLInputElement).value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-48 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          );
        }
        if (f.type === 'select') {
          return (
            <div key={f.param} className="flex items-center gap-2">
              <label className="text-sm text-gray-600">{f.label}:</label>
              <select
                value={searchParams.get(f.param) ?? ''}
                onChange={(e) => updateParam(f.param, e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">All</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        if (f.type === 'date') {
          return (
            <div key={f.param} className="flex items-center gap-2">
              <label className="text-sm text-gray-600">{f.label}:</label>
              <input
                type="date"
                value={searchParams.get(f.param) ?? ''}
                onChange={(e) => updateParam(f.param, e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          );
        }
        return null;
      })}
      {hasActive && (
        <button
          onClick={clearFilters}
          className="px-3 py-2 text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

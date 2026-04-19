'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase-client';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/inspections-due', label: 'Inspections Due', icon: '📅' },
  { href: '/customers', label: 'Customers', icon: '👥' },
  {
    label: 'Reports',
    icon: '📈',
    children: [
      { href: '/reports', label: 'Summary', icon: '📊' },
      { href: '/installations', label: 'Installations', icon: '🔧' },
      { href: '/inspections', label: 'Inspections', icon: '📋' },
      { href: '/semi-annual-reports', label: 'Inspection Reports', icon: '📄' },
    ],
  },
  { href: '/payments', label: 'Payments', icon: '💳' },
  { href: '/invoices', label: 'Invoices', icon: '📄' },
  { href: '/settings/system-config', label: 'System Config', icon: '⚙️' },
  { href: '/users', label: 'Technicians', icon: '👷' },
  { href: '/import', label: 'Data Import', icon: '📤' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const installationsListActive =
    pathname === '/installations' || pathname.startsWith('/installations/');
  const inspectionsListActive =
    pathname === '/inspections' || pathname.startsWith('/inspections/');
  const semiAnnualReportsActive =
    pathname === '/semi-annual-reports' || pathname.startsWith('/semi-annual-reports/');
  const reportsActive =
    pathname === '/reports' ||
    installationsListActive ||
    inspectionsListActive ||
    semiAnnualReportsActive;
  const [reportsExpanded, setReportsExpanded] = useState(reportsActive);

  useEffect(() => {
    if (reportsActive) setReportsExpanded(true);
  }, [reportsActive]);

  const handleLogout = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="w-64 shrink-0 bg-gray-900 text-white min-h-screen flex flex-col print:hidden">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold">FireApp</h1>
        <p className="text-gray-400 text-sm">Admin Portal</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          if ('children' in item) {
            const isExpanded = reportsExpanded;
            const isActive = (item.children ?? []).some(
              c =>
                pathname === c.href ||
                (c.href === '/installations' && installationsListActive) ||
                (c.href === '/inspections' && inspectionsListActive) ||
                (c.href === '/semi-annual-reports' && semiAnnualReportsActive)
            );
            return (
              <div key={item.label}>
                <button
                  onClick={() => setReportsExpanded(!isExpanded)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-red-600/80 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-gray-700 pl-2">
                    {(item.children ?? []).map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          pathname === child.href ||
                          (child.href === '/installations' && installationsListActive) ||
                          (child.href === '/inspections' && inspectionsListActive) ||
                          (child.href === '/semi-annual-reports' && semiAnnualReportsActive)
                            ? 'bg-red-600 text-white'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <span className="text-base">{child.icon}</span>
                        <span className="text-sm">{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                pathname === item.href
                  ? 'bg-red-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

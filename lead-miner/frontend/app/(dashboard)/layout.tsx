'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, clearSession, getToken, getUser, SessionUser } from '@/lib/api';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '▤' },
  { href: '/search', label: 'Search', icon: '⌕' },
  { href: '/projects', label: 'Projects', icon: '◈' },
  { href: '/jobs', label: 'Jobs', icon: '⚙' },
  { href: '/leads', label: 'Leads', icon: '☰' },
  { href: '/actors', label: 'Actors', icon: '◎' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser());
  }, [router]);

  async function logout() {
    try {
      await api.post('/logout');
    } catch {
      /* ignore */
    }
    clearSession();
    router.replace('/login');
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
            L
          </div>
          <span className="font-semibold text-slate-900">Lead Miner</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="w-4 text-center">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <div className="mb-2 truncate text-xs text-slate-500">{user?.email}</div>
          <div className="mb-3">
            <span className="badge bg-slate-100 capitalize text-slate-600">
              {user?.role ?? '—'}
            </span>
          </div>
          <button onClick={logout} className="btn-ghost w-full text-xs">
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}

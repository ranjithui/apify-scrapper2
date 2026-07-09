'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setSession } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{
        access_token: string;
        user: { id: string; email: string };
      }>('/login', { email, password });
      // fetch profile (role) after login
      setSession(res.access_token, {
        id: res.user.id,
        email: res.user.email,
        role: 'viewer',
      });
      const me = await api.get<{ user: { role: 'admin' | 'manager' | 'operator' | 'viewer' } }>('/me');
      setSession(res.access_token, {
        id: res.user.id,
        email: res.user.email,
        role: me.user.role,
      });
      router.replace('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-xl font-bold text-white">
            L
          </div>
          <h1 className="text-xl font-bold text-slate-900">Lead Mining Platform</h1>
          <p className="text-sm text-slate-500">Sign in to your workspace</p>
        </div>
        <form onSubmit={submit} className="card space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">
          Create users via the backend <code>/signup</code> endpoint or Supabase.
        </p>
      </div>
    </div>
  );
}

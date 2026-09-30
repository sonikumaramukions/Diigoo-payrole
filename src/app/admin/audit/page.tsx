'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  ipAddress: string | null;
  createdAt: string;
  admin: { email: string; name: string } | null;
}

function fmt(v: string) {
  return new Date(v).toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function AuditPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/audit', { cache: 'no-store' });
      if (res.status === 401) {
        router.push('/admin/login?redirect=/admin/audit');
        return;
      }
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      setError('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Audit Logs</h1>
      <p className="text-dark-400 text-sm mb-6">
        Every admin action is recorded here — accountability for who ran the campaign and viewed the data.
      </p>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-dark-400 text-xs uppercase tracking-wider border-b border-dark-700/60">
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">IP</th>
                <th className="px-4 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-dark-400">Loading…</td></tr>
              ) : error ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-red-400">{error}</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-dark-400">No activity recorded yet.</td></tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="border-b border-dark-800/60 hover:bg-dark-800/40">
                    <td className="px-4 py-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-primary-500/15 text-primary-400 border border-primary-500/30">{l.action}</span>
                    </td>
                    <td className="px-4 py-3 text-dark-300">{l.resource}{l.resourceId ? <span className="text-dark-500"> · {l.resourceId.slice(0, 8)}</span> : null}</td>
                    <td className="px-4 py-3 text-dark-300">{l.admin?.email || '—'}</td>
                    <td className="px-4 py-3 text-dark-400 font-mono text-xs">{l.ipAddress || '—'}</td>
                    <td className="px-4 py-3 text-dark-400 text-xs whitespace-nowrap">{fmt(l.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

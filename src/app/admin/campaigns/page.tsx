'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  trackingEnabled: boolean;
  createdAt: string;
  stats: { total: number; visited: number; attempted: number; reported: number };
}

const STATUS_CLS: Record<string, string> = {
  RUNNING: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  SCHEDULED: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  DRAFT: 'bg-dark-600/40 text-dark-300 border-dark-500/40',
  COMPLETED: 'bg-primary-500/15 text-primary-400 border-primary-500/30',
  ARCHIVED: 'bg-dark-600/40 text-dark-400 border-dark-500/40',
};

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('RUNNING');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/campaigns', { cache: 'no-store' });
      if (res.status === 401) {
        router.push('/admin/login?redirect=/admin/campaigns');
        return;
      }
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch {
      setError('Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: description || undefined, status, trackingEnabled: true }),
      });
      if (!res.ok) {
        const d = await res.json();
        setFormError(d.error || 'Could not create campaign');
        return;
      }
      setName('');
      setDescription('');
      await load();
    } catch {
      setFormError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const copyShared = (id: string) => {
    const link = `${window.location.origin}/login?c=${id}`;
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(''), 1500);
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Campaigns</h1>
      <p className="text-dark-400 text-sm mb-6">
        A campaign groups the people you&apos;re testing. Only <strong>RUNNING</strong> campaigns track engagement.
      </p>

      {/* Create form */}
      <div className="glass-card rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-4">New campaign</h2>
        <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <input
            value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign name" required
            className="md:col-span-2 px-3 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
          <select
            value={status} onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            {['RUNNING', 'DRAFT', 'SCHEDULED', 'COMPLETED', 'ARCHIVED'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="submit" disabled={saving} className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-medium disabled:opacity-60">
            {saving ? 'Creating…' : 'Create'}
          </button>
          <input
            value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)"
            className="md:col-span-4 px-3 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
        </form>
        {formError && <p className="text-sm text-red-400 mt-3">{formError}</p>}
      </div>

      {/* List */}
      {loading ? (
        <div className="glass-card rounded-xl p-12 text-center text-dark-400">Loading…</div>
      ) : error ? (
        <div className="glass-card rounded-xl p-12 text-center text-red-400">{error}</div>
      ) : campaigns.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center text-dark-400">No campaigns yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((c) => (
            <div key={c.id} className="glass-card rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">{c.name}</h3>
                  {c.description && <p className="text-sm text-dark-400 mt-0.5">{c.description}</p>}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_CLS[c.status] || STATUS_CLS.DRAFT}`}>{c.status}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-4">
                {[['People', c.stats.total], ['Visited', c.stats.visited], ['Submitted', c.stats.attempted], ['Reported', c.stats.reported]].map(([l, v]) => (
                  <div key={l as string} className="rounded-lg bg-dark-800/50 px-3 py-2 text-center">
                    <p className="text-lg font-bold text-white">{v as number}</p>
                    <p className="text-[10px] uppercase tracking-wider text-dark-400">{l}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => copyShared(c.id)}
                className="mt-4 w-full py-2 rounded-lg bg-primary-600/15 text-primary-300 border border-primary-500/25 hover:bg-primary-600/25 text-sm font-medium transition-colors"
              >
                {copied === c.id ? 'Copied!' : 'Copy shared link (one link for everyone)'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

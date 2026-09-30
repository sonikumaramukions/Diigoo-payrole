'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Campaign {
  id: string;
  name: string;
}

interface Participant {
  id: string;
  employeeId: string;
  employeeEmail: string;
  department: string;
  uniqueToken: string;
  landingPageVisited: boolean;
  loginAttempted: boolean;
  phishingReported: boolean;
  campaign?: { name: string };
}

function stageOf(p: Participant) {
  if (p.phishingReported) return { label: 'Reported', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
  if (p.loginAttempted) return { label: 'Submitted', cls: 'bg-red-500/15 text-red-400 border-red-500/30' };
  if (p.landingPageVisited) return { label: 'Visited', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
  return { label: 'Delivered', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
}

export default function ParticipantsPage() {
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  // add form
  const [employeeId, setEmployeeId] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/admin/participants?limit=1000', { cache: 'no-store' }),
        fetch('/api/admin/campaigns', { cache: 'no-store' }),
      ]);
      if (pRes.status === 401 || cRes.status === 401) {
        router.push('/admin/login?redirect=/admin/participants');
        return;
      }
      const pData = await pRes.json();
      const cData = await cRes.json();
      setParticipants(pData.participants || []);
      setCampaigns(cData.campaigns || []);
      if (!campaignId && cData.campaigns?.[0]) setCampaignId(cData.campaigns[0].id);
    } catch {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [router, campaignId]);

  useEffect(() => {
    load();
  }, [load]);

  const addParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, employeeEmail, department, campaignId }),
      });
      if (!res.ok) {
        const d = await res.json();
        setFormError(d.error || 'Could not add participant');
        return;
      }
      setEmployeeId('');
      setEmployeeEmail('');
      setDepartment('');
      await load();
    } catch {
      setFormError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this participant? This deletes their tracking data too.')) return;
    const res = await fetch(`/api/admin/participants/${id}`, { method: 'DELETE' });
    if (res.ok) setParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/login?token=${token}`;
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(token);
      setTimeout(() => setCopied(''), 1500);
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Participants</h1>
      <p className="text-dark-400 text-sm mb-6">
        Add the employees to test. Each gets a unique tracking link — send it in the simulated email.
      </p>

      {/* Add form */}
      <div className="glass-card rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-4">Add participant</h2>
        {campaigns.length === 0 ? (
          <p className="text-sm text-amber-400">Create a campaign first (Campaigns tab).</p>
        ) : (
          <form onSubmit={addParticipant} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <input
              value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="Employee ID" required
              className="px-3 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
            <input
              value={employeeEmail} onChange={(e) => setEmployeeEmail(e.target.value)}
              type="email" placeholder="Email" required
              className="px-3 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
            <input
              value={department} onChange={(e) => setDepartment(e.target.value)}
              placeholder="Department" required
              className="px-3 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
            <select
              value={campaignId} onChange={(e) => setCampaignId(e.target.value)}
              className="px-3 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button
              type="submit" disabled={saving}
              className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-medium disabled:opacity-60"
            >
              {saving ? 'Adding…' : 'Add'}
            </button>
          </form>
        )}
        {formError && <p className="text-sm text-red-400 mt-3">{formError}</p>}
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-dark-400 text-xs uppercase tracking-wider border-b border-dark-700/60">
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Campaign</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Test Link</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-dark-400">Loading…</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-red-400">{error}</td></tr>
              ) : participants.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-dark-400">No participants yet.</td></tr>
              ) : (
                participants.map((p) => {
                  const s = stageOf(p);
                  return (
                    <tr key={p.id} className="border-b border-dark-800/60 hover:bg-dark-800/40">
                      <td className="px-4 py-3">
                        <div className="text-white">{p.employeeEmail}</div>
                        <div className="text-dark-500 text-xs">{p.employeeId}</div>
                      </td>
                      <td className="px-4 py-3 text-dark-300">{p.department}</td>
                      <td className="px-4 py-3 text-dark-300">{p.campaign?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => copyLink(p.uniqueToken)} className="text-primary-400 hover:text-primary-300 text-xs font-medium">
                          {copied === p.uniqueToken ? 'Copied!' : 'Copy link'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => remove(p.id)} className="text-dark-500 hover:text-red-400 text-xs">Delete</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

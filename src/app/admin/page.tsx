'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface CampaignEvent {
  id: string;
  eventType: string;
  ipAddress: string | null;
  browser: string | null;
  operatingSystem: string | null;
  emailEntered: string | null;
  createdAt: string;
}

interface Participant {
  id: string;
  employeeId: string;
  employeeEmail: string;
  department: string;
  campaignId: string;
  emailDelivered: boolean;
  emailOpened: boolean;
  landingPageVisited: boolean;
  loginAttempted: boolean;
  phishingReported: boolean;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  browser: string | null;
  operatingSystem: string | null;
  campaign: { name: string; status: string };
  events: CampaignEvent[];
}

type StageFilter = 'all' | 'attempted' | 'visited' | 'reported' | 'delivered';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function stageOf(p: Participant): { label: string; color: string } {
  if (p.phishingReported) return { label: 'Reported', color: 'green' };
  if (p.loginAttempted) return { label: 'Submitted', color: 'red' };
  if (p.landingPageVisited) return { label: 'Visited', color: 'amber' };
  if (p.emailDelivered) return { label: 'Delivered', color: 'blue' };
  return { label: 'Pending', color: 'gray' };
}

const STAGE_STYLES: Record<string, string> = {
  green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  red: 'bg-red-500/15 text-red-400 border-red-500/30',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  gray: 'bg-dark-600/40 text-dark-300 border-dark-500/40',
};

function MetricCard({
  color,
  label,
  value,
  sub,
}: {
  color: string;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className={`metric-card ${color} glass-card p-5`}>
      <p className="text-dark-400 text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className="text-white text-3xl font-bold mt-2">{value}</p>
      {sub && <p className="text-dark-400 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState<StageFilter>('all');
  const [campaign, setCampaign] = useState('all');
  const [loggingOut, setLoggingOut] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/participants?limit=1000', {
        cache: 'no-store',
      });
      if (res.status === 401) {
        router.push('/admin/login?redirect=/admin');
        return;
      }
      if (!res.ok) {
        setError('Failed to load participant data.');
        return;
      }
      const data = await res.json();
      setParticipants(data.participants || []);
    } catch {
      setError('Network error while loading data.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // ignore — redirect regardless
    }
    router.push('/admin/login');
  };

  const campaigns = useMemo(() => {
    const names = new Map<string, string>();
    participants.forEach((p) => names.set(p.campaignId, p.campaign?.name || 'Unknown'));
    return Array.from(names.entries());
  }, [participants]);

  const stats = useMemo(() => {
    const total = participants.length;
    const delivered = participants.filter((p) => p.emailDelivered).length;
    const visited = participants.filter((p) => p.landingPageVisited).length;
    const attempted = participants.filter((p) => p.loginAttempted).length;
    const reported = participants.filter((p) => p.phishingReported).length;
    return { total, delivered, visited, attempted, reported };
  }, [participants]);

  const filtered = useMemo(() => {
    return participants.filter((p) => {
      if (campaign !== 'all' && p.campaignId !== campaign) return false;
      if (stage === 'attempted' && !p.loginAttempted) return false;
      if (stage === 'visited' && !(p.landingPageVisited && !p.loginAttempted)) return false;
      if (stage === 'reported' && !p.phishingReported) return false;
      if (stage === 'delivered' && !(p.emailDelivered && !p.landingPageVisited)) return false;
      if (search) {
        const q = search.toLowerCase();
        const enteredEmails = p.events
          .map((e) => e.emailEntered || '')
          .join(' ')
          .toLowerCase();
        const haystack = `${p.employeeEmail} ${p.employeeId} ${p.department} ${p.ipAddress || ''} ${enteredEmails}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [participants, campaign, stage, search]);

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Top bar */}
      <header className="border-b border-dark-700/60 bg-dark-800/40 backdrop-blur-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-cyber-purple rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/25">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Security Operations</h1>
              <p className="text-dark-400 text-xs">Phishing Simulation · Campaign Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="px-3 py-2 text-sm text-dark-300 hover:text-white border border-dark-600 rounded-lg hover:bg-dark-700/50 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-3 py-2 text-sm bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors disabled:opacity-60"
            >
              {loggingOut ? 'Signing out…' : 'Sign Out'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Privacy banner — the ethical core of the tool */}
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
          <span className="text-lg leading-none mt-0.5">🔒</span>
          <p className="text-sm text-emerald-300/90">
            <strong className="text-emerald-300">Privacy by design:</strong> This dashboard shows
            engagement metrics only — who opened, visited, submitted the form, or reported the email.
            Passwords are <strong>never captured, stored, or displayed</strong>. Any password typed on
            the simulation page is discarded server-side before anything is recorded.
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard color="blue" label="Participants" value={stats.total} />
          <MetricCard
            color="cyan"
            label="Delivered"
            value={stats.delivered}
            sub={`${pct(stats.delivered, stats.total)}% of total`}
          />
          <MetricCard
            color="amber"
            label="Page Visited"
            value={stats.visited}
            sub={`${pct(stats.visited, stats.total)}% clicked through`}
          />
          <MetricCard
            color="red"
            label="Form Submitted"
            value={stats.attempted}
            sub={`${pct(stats.attempted, stats.total)}% fell for it`}
          />
          <MetricCard
            color="green"
            label="Reported"
            value={stats.reported}
            sub={`${pct(stats.reported, stats.total)}% did the right thing`}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <svg
              className="w-4 h-4 text-dark-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email, employee ID, department, or IP…"
              className="w-full pl-9 pr-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
            />
          </div>
          <select
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            className="px-3 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            <option value="all">All campaigns</option>
            {campaigns.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as StageFilter)}
            className="px-3 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            <option value="all">All stages</option>
            <option value="delivered">Delivered only</option>
            <option value="visited">Visited (no submit)</option>
            <option value="attempted">Submitted form</option>
            <option value="reported">Reported phishing</option>
          </select>
        </div>

        {/* Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-dark-400 text-xs uppercase tracking-wider border-b border-dark-700/60">
                  <th className="px-4 py-3 font-medium">Target Employee</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Stage</th>
                  <th className="px-4 py-3 font-medium">Email Entered</th>
                  <th className="px-4 py-3 font-medium">IP Address</th>
                  <th className="px-4 py-3 font-medium">Device</th>
                  <th className="px-4 py-3 font-medium">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-dark-400">
                      <div className="inline-flex items-center gap-3">
                        <span className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full" />
                        Loading campaign data…
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-red-400">
                      {error}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-dark-400">
                      No participants match the current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    const s = stageOf(p);
                    const entered =
                      p.events.find((e) => e.eventType === 'LOGIN_ATTEMPTED' && e.emailEntered)
                        ?.emailEntered || null;
                    const device =
                      p.browser || p.operatingSystem
                        ? `${p.browser || 'Unknown browser'} · ${p.operatingSystem || 'Unknown OS'}`
                        : '—';
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-dark-800/60 hover:bg-dark-800/40 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="text-white">{p.employeeEmail}</div>
                          <div className="text-dark-500 text-xs">{p.employeeId}</div>
                        </td>
                        <td className="px-4 py-3 text-dark-300">{p.department}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${STAGE_STYLES[s.color]}`}
                          >
                            {s.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-dark-300">{entered || '—'}</td>
                        <td className="px-4 py-3 text-dark-300 font-mono text-xs">
                          {p.ipAddress || '—'}
                        </td>
                        <td className="px-4 py-3 text-dark-300 text-xs">{device}</td>
                        <td className="px-4 py-3 text-dark-400 text-xs whitespace-nowrap">
                          {formatDate(p.lastSeenAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {!loading && !error && filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-dark-700/60 text-xs text-dark-400">
              Showing {filtered.length} of {participants.length} participants
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

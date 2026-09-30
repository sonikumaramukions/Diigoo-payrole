'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

type Phase = 'signing-in' | 'dashboard' | 'reveal';
type Tab =
  | 'Dashboard'
  | 'Salary Slips'
  | 'Previous Salary'
  | 'Future Salary'
  | 'PD Calculator'
  | 'Profile'
  | 'Performance';

const TABS: Tab[] = [
  'Dashboard',
  'Salary Slips',
  'Previous Salary',
  'Future Salary',
  'PD Calculator',
  'Profile',
  'Performance',
];

const KPIS = [
  { label: 'This Month (Stipend)', value: '₹ 10,000', sub: 'September 2026' },
  { label: 'Received So Far', value: '₹ 20,000', sub: '2 months' },
  { label: 'Tenure', value: '2 months', sub: 'Probation' },
  { label: 'Full-time CTC (projected)', value: '₹ 3.5 LPA', sub: 'On confirmation' },
];

const SLIPS = [
  { month: 'September 2026', type: 'Probation Stipend', net: '₹ 10,000' },
  { month: 'August 2026', type: 'Probation Stipend', net: '₹ 10,000' },
];

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>{children}</div>;
}

function FakePortal() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [phase, setPhase] = useState<Phase>('signing-in');
  const [tab, setTab] = useState<Tab>('Dashboard');
  const [profileSaved, setProfileSaved] = useState(false);

  const [pdMonthly, setPdMonthly] = useState('1800');
  const [pdYears, setPdYears] = useState('3');
  const pdTotal = (() => {
    const m = parseFloat(pdMonthly) || 0;
    const y = parseFloat(pdYears) || 0;
    return Math.round(m * 12 * y * 2 * 1.08).toLocaleString('en-IN');
  })();

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('dashboard'), 2000);
    const t2 = setTimeout(() => setPhase('reveal'), 240000); // ~4 min explore window
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Behaves like the real app: shows a "saved" confirmation and stores NOTHING.
  // The reveal is left to the ~4 min timer so the experience feels genuine.
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(true);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Signing-in splash */}
      {phase === 'signing-in' && (
        <div className="fixed inset-0 z-40 bg-[#0f1226] flex flex-col items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/diigoo-logo.png" alt="diigoo" className="h-11 w-auto object-contain mb-8" />
          <div className="animate-spin h-8 w-8 border-4 border-[#7c6cff] border-t-transparent rounded-full" />
          <p className="mt-6 text-white/70 text-sm">Signing you in…</p>
          <p className="mt-1 text-white/40 text-xs">Authenticating with Diigoo SSO</p>
        </div>
      )}

      <div
        className={`transition-all duration-500 ${phase === 'reveal' ? 'blur-md scale-[1.01]' : ''} ${
          phase === 'signing-in' ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden={phase === 'reveal'}
      >
        {/* Top bar */}
        <header className="bg-[#0f1226] text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/diigoo-logo.png" alt="diigoo" className="h-7 w-auto object-contain" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#7c6cff]/30 flex items-center justify-center text-sm font-semibold">D</div>
              <span className="hidden sm:block text-sm text-white/70">My Account</span>
            </div>
          </div>
          <nav className="border-t border-white/10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
              {TABS.map((t) => {
                const soon = t === 'Future Salary';
                return (
                  <button
                    key={t}
                    onClick={() => !soon && setTab(t)}
                    className={`px-3 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                      tab === t
                        ? 'border-[#7c6cff] text-white font-medium'
                        : 'border-transparent text-white/60 hover:text-white/90'
                    } ${soon ? 'cursor-default' : ''}`}
                  >
                    {t}
                    {soon && (
                      <span className="ml-1.5 text-[10px] uppercase bg-white/10 rounded px-1 py-0.5 align-middle">soon</span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* Dashboard */}
          {tab === 'Dashboard' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Welcome back</h1>
                  <p className="text-sm text-gray-500">Here is your payroll summary</p>
                </div>
                <span className="text-xs text-gray-400">Updated just now</span>
              </div>
              <div className="rounded-xl border border-[#7c6cff]/30 bg-[#f3f1ff] px-5 py-4 mb-6">
                <p className="text-sm text-[#4a3cd0] font-semibold">You&apos;re on probation — 2 of 6 months completed</p>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  Monthly stipend is <strong>₹10,000</strong> during probation. Provident Fund (PF) contributions begin
                  once you are confirmed to full-time. On confirmation your CTC becomes <strong>₹3,50,000 / year</strong>,
                  plus performance-based increments.
                </p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {KPIS.map((k) => (
                  <Card key={k.label} className="p-5">
                    <p className="text-xs text-gray-500">{k.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{k.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Salary Slips */}
          {tab === 'Salary Slips' && (
            <Card className="overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Salary Slips</h2>
                <p className="text-sm text-gray-500">Probation stipend — ₹10,000 / month</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="px-5 py-3 font-medium">Month</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Net Pay</th>
                    <th className="px-5 py-3 font-medium text-right">Slip</th>
                  </tr>
                </thead>
                <tbody>
                  {SLIPS.map((s) => (
                    <tr key={s.month} className="border-b border-gray-50">
                      <td className="px-5 py-3 text-gray-800">{s.month}</td>
                      <td className="px-5 py-3 text-gray-500">{s.type}</td>
                      <td className="px-5 py-3 text-gray-900 font-medium">{s.net}</td>
                      <td className="px-5 py-3 text-right"><span className="text-[#6b5cff] font-medium cursor-pointer">Download PDF</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* Previous Salary */}
          {tab === 'Previous Salary' && (
            <Card className="p-6">
              <h2 className="font-semibold text-gray-900 mb-1">Previous Salary</h2>
              <p className="text-sm text-gray-500 mb-4">Your earnings history since joining (Aug 2026)</p>
              <div className="space-y-3">
                {SLIPS.map((s) => (
                  <div key={s.month} className="flex items-center justify-between border-b border-gray-50 pb-3">
                    <div>
                      <p className="text-gray-800 font-medium">{s.month}</p>
                      <p className="text-xs text-gray-500">{s.type}</p>
                    </div>
                    <p className="text-gray-900 font-semibold">{s.net}</p>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-gray-500 text-sm">Total received so far</p>
                  <p className="text-lg font-bold text-gray-900">₹ 20,000</p>
                </div>
              </div>
            </Card>
          )}

          {/* Future Salary */}
          {tab === 'Future Salary' && (
            <Card className="p-6">
              <h2 className="font-semibold text-gray-900">Future Salary</h2>
              <p className="text-2xl font-bold text-gray-900 mt-3">₹ 3,50,000<span className="text-sm font-medium text-gray-400"> / yr on confirmation</span></p>
            </Card>
          )}

          {/* PD Calculator */}
          {tab === 'PD Calculator' && (
            <Card className="p-6 max-w-xl">
              <h2 className="font-semibold text-gray-900 mb-1">Provident Dues (PD) Calculator</h2>
              <p className="text-sm text-gray-500 mb-5">Estimate your PF corpus (starts after confirmation to full-time).</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly contribution (₹)</label>
                  <input value={pdMonthly} onChange={(e) => setPdMonthly(e.target.value)} inputMode="numeric"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7c6cff]/25 focus:border-[#7c6cff]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Years of service</label>
                  <input value={pdYears} onChange={(e) => setPdYears(e.target.value)} inputMode="numeric"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7c6cff]/25 focus:border-[#7c6cff]" />
                </div>
              </div>
              <div className="mt-5 rounded-lg bg-[#f3f1ff] border border-[#7c6cff]/20 px-4 py-4">
                <p className="text-sm text-gray-600">Projected PF corpus</p>
                <p className="text-2xl font-bold text-[#4a3cd0] mt-1">₹ {pdTotal}</p>
              </div>
            </Card>
          )}

          {/* Profile (reveal-on-submit, stores nothing) */}
          {tab === 'Profile' && (
            <Card className="p-6 max-w-xl">
              <h2 className="font-semibold text-gray-900 mb-1">My Profile</h2>
              <p className="text-sm text-gray-500 mb-5">Keep your employee details up to date.</p>
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input required placeholder="Your full name"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7c6cff]/25 focus:border-[#7c6cff]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Work Email</label>
                  <input type="email" required placeholder="you@diigoo.com"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7c6cff]/25 focus:border-[#7c6cff]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                  <input placeholder="e.g. Engineering"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7c6cff]/25 focus:border-[#7c6cff]" />
                </div>
                <button type="submit" className="w-full py-3 px-4 bg-[#5647e0] hover:bg-[#4a3cd0] text-white font-semibold rounded-lg transition-colors text-sm">Save Profile</button>
                {profileSaved && (
                  <p className="text-sm text-green-600 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Profile updated successfully.
                  </p>
                )}
              </form>
            </Card>
          )}

          {/* Performance */}
          {tab === 'Performance' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="p-5"><p className="text-xs text-gray-500">Current Rating</p><p className="text-2xl font-bold text-gray-900 mt-2">Meets Expectations</p></Card>
              <Card className="p-5"><p className="text-xs text-gray-500">Goals Completed</p><p className="text-2xl font-bold text-gray-900 mt-2">4 / 6</p></Card>
              <Card className="p-5"><p className="text-xs text-gray-500">Next Review</p><p className="text-2xl font-bold text-gray-900 mt-2">Confirmation</p></Card>
            </div>
          )}
        </main>
      </div>

      {/* Reveal */}
      {phase === 'reveal' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-6"><span className="text-4xl">⚠️</span></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Hold on — this was a phishing test</h1>
            <p className="text-gray-600 leading-relaxed">
              You reached this &quot;portal&quot; from an <strong>email link</strong> and entered details on it. A real
              attacker could have captured your password and personal information and used it to break into your accounts.
            </p>
            <div className="mt-5 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
              Your real account is safe. This was an authorized Diigoo Tech Security drill — <strong>nothing you typed was stored.</strong>
            </div>
            <a href={`/awareness${token ? `?token=${token}` : ''}`} className="mt-7 inline-flex items-center justify-center gap-2 w-full py-3.5 px-5 bg-[#5647e0] hover:bg-[#4a3cd0] text-white font-semibold rounded-xl transition-colors">
              See what you missed
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </a>
            <p className="mt-4 text-xs text-gray-400">Diigoo Tech · Security Awareness Program</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PortalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f1226] flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-[#7c6cff] border-t-transparent rounded-full" /></div>}>
      <FakePortal />
    </Suspense>
  );
}

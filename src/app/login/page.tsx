'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || searchParams.get('campaign') || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Track landing page visit
  const trackVisit = useCallback(async () => {
    if (!token) return;
    try {
      await fetch('/api/tracking/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    } catch {
      // Silent fail - don't break UX
    }
  }, [token]);

  useEffect(() => {
    trackVisit();
  }, [trackVisit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Corporate portal: only accept @diigoo.com addresses.
    if (!/@diigoo\.com$/i.test(email.trim())) {
      setError('Please sign in with your Diigoo corporate email (@diigoo.com).');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/tracking/login-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          // Password is sent to the API but immediately discarded server-side.
          // It is NEVER stored, logged, or persisted.
          password,
        }),
      });

      const data = await response.json();

      if (data.redirect) {
        window.location.href = data.redirect;
      } else {
        window.location.href = `/portal${token ? `?token=${token}` : ''}`;
      }
    } catch {
      window.location.href = `/portal${token ? `?token=${token}` : ''}`;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left brand panel */}
      <div className="relative lg:w-1/2 bg-[#0f1226] text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#7c6cff]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#a855f7]/10 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
            }}
          />
        </div>
        <div className="relative z-10 flex flex-col h-full px-8 sm:px-14 py-10 lg:py-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/diigoo-logo.png" alt="diigoo" className="h-11 w-auto object-contain" />

          <div className="mt-auto max-w-md">
            <p className="text-[#9b8cff] font-semibold tracking-wide text-sm uppercase">
              Employee Self-Service
            </p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold leading-tight">
              Digital Asset &amp; Payroll Management System
            </h1>
            <p className="mt-4 text-white/60 text-sm leading-relaxed">
              Access your salary slips, benefits, PD calculator and profile — all in one
              secure workspace.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                'View & download monthly salary slips',
                'Track provident dues and benefits',
                'Manage your employee profile',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="w-5 h-5 rounded-full bg-[#7c6cff]/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-[#9b8cff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 mt-auto pt-10 text-xs text-white/40">
            © 2026 Diigoo Tech. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="lg:w-1/2 flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <div className="inline-flex items-center justify-center px-5 py-3 bg-[#0f1226] rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/diigoo-logo.png" alt="diigoo" className="h-7 w-auto object-contain" />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Sign in</h2>
            <p className="text-sm text-gray-500 mt-1">
              Use your Diigoo corporate account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@diigoo.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7c6cff]/25 focus:border-[#7c6cff] transition-all duration-200 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7c6cff]/25 focus:border-[#7c6cff] transition-all duration-200 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7c6cff] focus:ring-[#7c6cff]/25" />
                <span className="text-sm text-gray-600">Keep me signed in</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#5647e0] hover:bg-[#4a3cd0] text-white font-semibold rounded-xl shadow-lg shadow-[#5647e0]/25 focus:outline-none focus:ring-2 focus:ring-[#7c6cff]/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 text-sm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400">Protected by Diigoo Tech IT Security</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#5647e0] border-t-transparent rounded-full" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

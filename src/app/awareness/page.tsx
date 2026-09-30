'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AwarenessContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const warningsSigns = [
    {
      icon: '🔗',
      title: 'Suspicious URL',
      description: 'The URL in the email did not point to the official Diigoo Mail domain. Always verify the URL in your browser address bar before entering credentials.',
    },
    {
      icon: '📧',
      title: 'Unsolicited Request',
      description: 'You received an unexpected email asking you to log in. Legitimate services rarely ask you to click a link and re-enter your credentials.',
    },
    {
      icon: '⏰',
      title: 'Urgency Tactics',
      description: 'Phishing emails often create a false sense of urgency ("Your account will be suspended", "Action required immediately") to prevent you from thinking critically.',
    },
    {
      icon: '🎭',
      title: 'Impersonation',
      description: 'The email appeared to come from a trusted source but was actually sent from an unauthorized domain. Always check the sender address carefully.',
    },
    {
      icon: '🔒',
      title: 'Credential Harvesting',
      description: 'The login page was designed to capture your credentials. A legitimate page would be on the official domain with proper SSL certificates.',
    },
    {
      icon: '📋',
      title: 'Generic Greeting',
      description: 'Phishing emails often use generic greetings like "Dear Employee" instead of your actual name. Legitimate internal communications typically address you by name.',
    },
  ];

  const bestPractices = [
    'Always verify the sender\'s email address, not just the display name',
    'Hover over links before clicking to preview the actual URL',
    'Never enter credentials on a page you reached via an email link',
    'Use bookmarks for frequently accessed internal services',
    'Report suspicious emails using the official reporting channel',
    'Enable multi-factor authentication (MFA) on all accounts',
    'Contact IT Security if you suspect you have been phished',
    'Keep your browser and security software up to date',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 py-2">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-white text-sm font-medium">
            🛡️ Diigoo Tech Security Awareness Program
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Main Alert */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            This Was a Security Awareness Simulation
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            You have just interacted with a <strong>simulated phishing page</strong> created by the{' '}
            <span className="text-amber-600 font-semibold">Diigoo Tech Security Team</span>. This was
            an authorized security awareness exercise — your real account has{' '}
            <strong>not been compromised</strong>.
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800 mb-1">Your Account Is Safe</h3>
              <p className="text-sm text-green-700">
                No credentials were stored, transmitted to third parties, or used to access any system.
                Any information you entered on the simulation page has been <strong>immediately discarded</strong>.
                Your real Diigoo account is unaffected.
              </p>
            </div>
          </div>
        </div>

        {/* Warning Signs */}
        <div className="mb-10 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-amber-500">🔍</span>
            Warning Signs You Should Have Noticed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warningsSigns.map((sign, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{sign.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{sign.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{sign.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best Practices */}
        <div className="mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-blue-500">✅</span>
            Security Best Practices
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <ul className="space-y-3">
              {bestPractices.map((practice, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <span className="text-sm text-gray-700 leading-relaxed">{practice}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* What To Do Next */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-8 mb-10 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-blue-500">📌</span>
            What To Do Next
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-600">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Don&apos;t Panic</h4>
                <p className="text-sm text-gray-600">This was a simulation. Your account credentials were not captured or stored.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-600">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Review the Warning Signs</h4>
                <p className="text-sm text-gray-600">Take a moment to understand what clues could have helped you identify this as a phishing attempt.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-600">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Stay Vigilant</h4>
                <p className="text-sm text-gray-600">Apply these lessons to real-world emails. When in doubt, report the email to IT Security.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Report if they haven't already */}
        {token && (
          <div className="text-center mb-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <p className="text-sm text-gray-500 mb-3">
              Did you recognize this was a simulation before clicking?
            </p>
            <a
              href={`/login?token=${token}`}
              onClick={async (e) => {
                e.preventDefault();
                try {
                  await fetch('/api/tracking/report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                  });
                  alert('Thank you for reporting! Your security awareness is appreciated.');
                } catch {
                  alert('Report submitted. Thank you!');
                }
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              I Would Report This Email
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="text-center border-t border-gray-200 pt-8 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
          <p className="text-sm text-gray-500 mb-2">
            This exercise is part of Diigoo Tech&apos;s ongoing security awareness program.
          </p>
          <p className="text-xs text-gray-400">
            If you have questions, contact the Security Team at{' '}
            <span className="text-blue-500">security@diigoo.com</span>
          </p>
          <p className="text-xs text-gray-400 mt-4">
            © 2026 Diigoo Tech Security Team. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AwarenessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    }>
      <AwarenessContent />
    </Suspense>
  );
}

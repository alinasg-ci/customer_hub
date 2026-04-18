'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError('Invalid email or password');
      setLoading(false);
    } else {
      router.push('/');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-matcha-800">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center">
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-[12px] bg-black text-lg font-bold text-white"
            style={{ transform: 'rotate(-5deg)', boxShadow: '-4px 4px 0 rgba(255,255,255,0.3)' }}
          >
            CH
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Client Hub
          </h1>
          <p className="mt-1 text-sm text-matcha-300">Sign in to your workspace</p>
        </div>

        <div className="clay-card-static p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-charcoal-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="clay-input mt-1.5 w-full text-sm"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-charcoal-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="clay-input mt-1.5 w-full text-sm"
                placeholder="Enter your password"
              />
            </div>
            {error && (
              <div className="rounded-[12px] border border-pomegranate-400/30 bg-pomegranate-400/10 px-3 py-2">
                <p className="text-sm text-pomegranate-600">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="clay-btn clay-btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

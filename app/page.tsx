'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function LandingPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  const handleAuth = async (action: 'login' | 'signup') => {
    setLoading(true);
    try {
      const { error } = action === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      if (error) throw error;

      toast.success(action === 'login' ? 'Authentication successful!' : 'Account created!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-50 relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md p-8 space-y-6 bg-zinc-900/50 border border-zinc-800 rounded-xl shadow-2xl backdrop-blur-sm z-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            StructEngine <span className="text-blue-500">Pro</span>
          </h1>
          <p className="text-sm text-zinc-400">Advanced structural analysis matrix solver.</p>
        </div>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-zinc-950 border-zinc-800"
              placeholder="engineer@firm.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-zinc-950 border-zinc-800"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => handleAuth('login')}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
            <Button
              className="w-full border-zinc-700 hover:bg-zinc-800"
              variant="outline"
              onClick={() => handleAuth('signup')}
              disabled={loading}
            >
              Create Account
            </Button>
          </div>

          <div className="text-center pt-4 border-t border-zinc-800 mt-6">
            <Button
              variant="link"
              className="text-zinc-400 hover:text-zinc-300"
              onClick={() => router.push('/calculator')}
            >
              Continue as Guest (No saving) &rarr;
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

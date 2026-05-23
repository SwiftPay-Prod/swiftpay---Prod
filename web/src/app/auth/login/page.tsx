'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      setError('Falha no login. Verifique suas credenciais.');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-white">
      <div className="m-auto w-full max-w-sm px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-10 w-10 rounded-lg bg-black" />
          <h1 className="text-2xl font-bold text-black">Swiftpay</h1>
          <p className="mt-1 text-sm text-zinc-500">Entre na sua conta</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
            <input type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:border-black transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Senha</label>
            <input type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:border-black transition-colors" />
          </div>
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-black text-white font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

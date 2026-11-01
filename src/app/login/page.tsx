'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Sparkles, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin1234');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al autenticar');

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Luces decorativas de fondo */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 via-amber-500 to-red-700 shadow-xl shadow-red-600/40 mb-3">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            SUPER RIFA NAVIDEÑA
          </h1>
          <p className="text-xs text-amber-400 font-bold uppercase tracking-widest">
            Panel Privado de Administración
          </p>
          <p className="text-xs text-slate-400">
            MOTO ELÉCTRICA GW E-MAX 800W | 100 NÚMEROS (00-99)
          </p>
        </div>

        {/* Tarjeta de Login */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-7 shadow-2xl backdrop-blur-xl space-y-6">
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Usuario Administrador
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm font-medium"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Credenciales por defecto:</span>
              <span className="font-mono text-amber-400 font-bold">admin / admin1234</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white hover:opacity-95 shadow-lg shadow-red-600/30 transition-all cursor-pointer font-bold"
            >
              <span>{loading ? 'Accediendo a MySQL...' : 'Iniciar Sesión'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="text-center mt-6 text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Conexión cifrada y autenticación segura con JWT & Bcrypt</span>
        </div>
      </div>
    </div>
  );
}

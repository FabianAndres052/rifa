'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck, Eye, EyeOff, Clock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429 || data.isLocked) {
          setIsLocked(true);
        }
        throw new Error(data.error || 'Credenciales no autorizadas');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center p-4 relative">
      <div className="w-full max-w-sm relative z-10">
        {/* Cabecera / Identidad */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 shadow-sm mx-auto mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
            Super Rifa
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Panel de Control y Administración
          </p>
        </div>

        {/* Tarjeta de Inicio de Sesión */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-6 sm:p-7 shadow-xl space-y-5">
          {error && (
            <div
              className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs leading-relaxed ${
                isLocked
                  ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                  : 'bg-red-950/40 border-red-800/60 text-red-300'
              }`}
            >
              {isLocked ? (
                <Clock className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
              )}
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Usuario */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Usuario
              </label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  disabled={loading || isLocked}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Usuario administrativo"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 text-sm transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* Campo Contraseña con Toggle de Visibilidad */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  disabled={loading || isLocked}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 text-sm transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botón de Enviar */}
            <button
              type="submit"
              disabled={loading || isLocked || !username || !password}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-zinc-100 text-zinc-950 hover:bg-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <span>{loading ? 'Validando credenciales...' : 'Iniciar Sesión'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Garantías de Seguridad */}
        <div className="text-center mt-6 space-y-1 text-xs text-zinc-500">
          <div className="flex items-center justify-center gap-1.5 text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            <span>Sesión protegida y cookies seguras HttpOnly</span>
          </div>
          <p className="text-[11px] text-zinc-600">
            Bloqueo preventivo tras 5 intentos fallidos consecutivos.
          </p>
        </div>
      </div>
    </div>
  );
}

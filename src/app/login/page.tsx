'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Sparkles, AlertCircle, ArrowRight, ShieldCheck, Eye, EyeOff, Clock } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-red-600 selection:text-white">
      {/* Resplandores festivos de fondo */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Cabecera / Identidad de la Rifa */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 via-amber-500 to-red-700 shadow-xl shadow-red-600/30 mb-3 transform hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            SUPER RIFA NAVIDEÑA
          </h1>
          <div className="inline-block px-3 py-1 rounded-full bg-red-950/80 border border-red-800/40 text-[11px] text-amber-300 font-extrabold uppercase tracking-widest">
            Acceso Administrativo Seguro
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Plataforma Oficial de Control y Sorteo
          </p>
        </div>

        {/* Tarjeta de Inicio de Sesión */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-7 shadow-2xl backdrop-blur-xl space-y-6">
          {error && (
            <div
              className={`flex items-start gap-3 p-3.5 rounded-2xl border text-xs leading-relaxed animate-fade-in ${
                isLocked
                  ? 'bg-amber-950/80 border-amber-500/50 text-amber-200'
                  : 'bg-red-950/80 border-red-500/50 text-red-200'
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
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Usuario
              </label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-red-400 transition-colors" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  disabled={loading || isLocked}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingrese su usuario asignado"
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm font-medium transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Campo Contraseña con Toggle de Visibilidad */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-red-400 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  disabled={loading || isLocked}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm font-medium transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botón de Enviar */}
            <button
              type="submit"
              disabled={loading || isLocked || !username || !password}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white hover:opacity-95 shadow-lg shadow-red-600/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-98"
            >
              <span>{loading ? 'Validando credenciales...' : 'Ingresar al Panel'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Garantías de Seguridad */}
        <div className="text-center mt-6 space-y-1 text-xs text-slate-500">
          <div className="flex items-center justify-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sesión protegida por cifrado criptográfico y cookies seguras HttpOnly</span>
          </div>
          <p className="text-[11px] text-slate-600">
            Bloqueo preventivo de seguridad activado tras 5 intentos fallidos consecutivos.
          </p>
        </div>
      </div>
    </div>
  );
}

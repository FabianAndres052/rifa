'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sparkles,
  LayoutGrid,
  Users,
  DollarSign,
  Trophy,
  History,
  LogOut,
  Radio,
  Menu,
  X,
  UserCheck
} from 'lucide-react';

interface HeaderProps {
  realtimeStatus?: boolean;
}

export default function Header({ realtimeStatus = true }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ fullName: string; username: string } | null>(null);

  useEffect(() => {
    // Verificar sesión activa
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setAdminUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { href: '/', label: 'Tablero & Cartón', icon: LayoutGrid },
    { href: '/clientes', label: 'Clientes', icon: Users },
    { href: '/finanzas', label: 'Finanzas & Abonos', icon: DollarSign },
    { href: '/sorteos', label: 'Sorteos (4)', icon: Trophy },
    { href: '/auditoria', label: 'Auditoría', icon: History },
  ];

  if (pathname === '/login') return null;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-red-900/40 text-white shadow-xl shadow-red-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Nombre */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-amber-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/40 group-hover:scale-105 transition-transform duration-200">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-red-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
                  SUPER RIFA NAVIDEÑA
                </span>
                <span className="text-[10px] text-slate-400 -mt-1 font-medium tracking-wider">
                  MOTO ELÉCTRICA GW E-MAX 800W
                </span>
              </div>
            </Link>

            {/* Badge de Tiempo Real */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
              <Radio className={`w-3.5 h-3.5 ${realtimeStatus ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
              <span>{realtimeStatus ? 'En Vivo (SSE)' : 'Conectando...'}</span>
            </div>
          </div>

          {/* Navegación Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-700/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Acciones de usuario / Admin */}
          <div className="hidden sm:flex items-center gap-3">
            {adminUser && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-medium text-slate-200">{adminUser.fullName || adminUser.username}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-950/60 hover:bg-red-900 text-red-200 border border-red-800/40 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>

          {/* Botón Menú Mobile */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Desplegable Móvil */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950/95 px-4 pt-3 pb-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-red-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {adminUser ? adminUser.fullName : 'Admin'}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

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
  UserCheck,
  Download
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
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 text-zinc-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Nombre */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-100 group-hover:border-zinc-500 transition-colors shadow-sm">
                <Sparkles className="w-4 h-4 text-zinc-200" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm sm:text-base tracking-tight text-zinc-100">
                  SUPER RIFA NAVIDEÑA
                </span>
                <span className="text-[10px] text-zinc-400 -mt-0.5 font-medium tracking-wide uppercase">
                  MOTO ELÉCTRICA GW E-MAX 800W
                </span>
              </div>
            </Link>

            {/* Badge de Tiempo Real */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-900/90 border border-zinc-800 text-zinc-300">
              <span className={`w-2 h-2 rounded-full ${realtimeStatus ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse' : 'bg-zinc-500'}`} />
              <span className="text-[11px] font-mono">{realtimeStatus ? 'En Vivo' : 'Conectando...'}</span>
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
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Acciones de usuario / Admin */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-pwa-install'));
                }
              }}
              title="Instalar como aplicación en tu móvil o equipo"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Instalar App</span>
            </button>

            {adminUser && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300">
                <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-medium text-zinc-200">{adminUser.fullName || adminUser.username}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>

          {/* Botón Menú Mobile */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Desplegable Móvil */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-800 bg-zinc-950/95 px-4 pt-3 pb-4 space-y-1.5">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('open-pwa-install'));
              }
            }}
            className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-zinc-100 hover:bg-white shadow-sm transition-colors cursor-pointer mb-2"
          >
            <Download className="w-4 h-4" />
            <span>Instalar Aplicación (Android / iOS)</span>
          </button>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-zinc-800 text-white border border-zinc-700/60'
                    : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-400">
              {adminUser ? adminUser.fullName : 'Admin'}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white font-medium"
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

'use client';

import React from 'react';
import {
  Ticket,
  CheckCircle,
  Clock,
  Bookmark,
  DollarSign,
  TrendingUp,
  Users,
  Trophy,
  Calendar
} from 'lucide-react';
import { DashboardStats } from '@/lib/types';

interface DashboardStatsCardsProps {
  stats: DashboardStats;
}

export default function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  const percentSold = Math.round((stats.soldNumbers / stats.totalNumbers) * 100) || 0;
  const percentCollected =
    Math.round((stats.totalCollected / stats.totalPotentialRevenue) * 100) || 0;

  return (
    <div className="space-y-4">
      {/* Barra de Progreso Principal de Ventas */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border border-red-900/40 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-extrabold text-white tracking-tight">
              Progreso General de la Rifa
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              Meta: $4.000.000 COP
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="text-slate-300">
              Vendidos: <strong className="text-white">{stats.soldNumbers}</strong> / 100
            </span>
            <span className="text-amber-400">
              Recaudado: {percentCollected}%
            </span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 transition-all duration-700 shadow-lg"
            style={{ width: `${percentSold}%` }}
          />
        </div>
      </div>

      {/* Cuadrícula de Tarjetas de Indicadores */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Disponibles */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-900/40 shadow-lg hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Disponibles
            </span>
            <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {stats.availableNumbers}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Listos para asignación ($40k c/u)
          </p>
        </div>

        {/* Vendidos y Pagados */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-900/40 shadow-lg hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pagados
            </span>
            <div className="p-2 rounded-xl bg-rose-950/80 text-rose-400 border border-rose-800/40">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">
            {stats.paidNumbers}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Confirmados al 100%
          </p>
        </div>

        {/* Vendidos Pendientes */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-orange-900/40 shadow-lg hover:border-orange-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pendientes
            </span>
            <div className="p-2 rounded-xl bg-orange-950/80 text-orange-400 border border-orange-800/40">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-orange-400 font-mono">
            {stats.pendingNumbers}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Por recaudar: ${stats.totalPending.toLocaleString('es-CO')}
          </p>
        </div>

        {/* Reservados */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-900/40 shadow-lg hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Reservados
            </span>
            <div className="p-2 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/40">
              <Bookmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
            {stats.reservedNumbers}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Apartados temporalmente
          </p>
        </div>

        {/* Dinero Total Recaudado */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg sm:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Efectivamente Recaudado
            </span>
            <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            ${stats.totalCollected.toLocaleString('es-CO')} COP
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats.paidCustomersCount} clientes con pago completado
          </p>
        </div>

        {/* Dinero Pendiente y Clientes */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg sm:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pendiente por Cobrar
            </span>
            <div className="p-2 rounded-xl bg-orange-950/80 text-orange-400 border border-orange-800/40">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-orange-400 font-mono">
            ${stats.totalPending.toLocaleString('es-CO')} COP
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats.totalCustomers} clientes registrados ({stats.pendingCustomersCount} pendientes)
          </p>
        </div>
      </div>
    </div>
  );
}

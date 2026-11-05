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
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-200 tracking-tight">
              Progreso General de la Rifa
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium border border-zinc-700/60">
              Meta: $4.000.000 COP
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="text-zinc-400">
              Vendidos: <strong className="text-zinc-100 font-mono">{stats.soldNumbers}</strong> / 100
            </span>
            <span className="text-zinc-200 font-mono">
              Recaudado: {percentCollected}%
            </span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
          <div
            className="h-full rounded-full bg-zinc-100 transition-all duration-500"
            style={{ width: `${percentSold}%` }}
          />
        </div>
      </div>

      {/* Cuadrícula de Tarjetas de Indicadores */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Disponibles */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Disponibles
            </span>
            <div className="p-1.5 rounded-lg bg-zinc-800 text-emerald-400 border border-zinc-700/60">
              <Ticket className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-100 font-mono">
            {stats.availableNumbers}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Listos para asignación ($40k c/u)
          </p>
        </div>

        {/* Vendidos y Pagados */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Pagados
            </span>
            <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700/60">
              <CheckCircle className="w-3.5 h-3.5 text-zinc-200" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-100 font-mono">
            {stats.paidNumbers}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Confirmados al 100%
          </p>
        </div>

        {/* Vendidos Pendientes */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Pendientes
            </span>
            <div className="p-1.5 rounded-lg bg-zinc-800 text-amber-400 border border-zinc-700/60">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {stats.pendingNumbers}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Por recaudar: ${stats.totalPending.toLocaleString('es-CO')}
          </p>
        </div>

        {/* Reservados */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Reservados
            </span>
            <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700/60">
              <Bookmark className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-300 font-mono">
            {stats.reservedNumbers}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Apartados temporalmente
          </p>
        </div>

        {/* Dinero Total Recaudado */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm sm:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Efectivamente Recaudado
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">
            ${stats.totalCollected.toLocaleString('es-CO')} COP
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            {stats.paidCustomersCount} clientes con pago completado
          </p>
        </div>

        {/* Dinero Pendiente y Clientes */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm sm:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Pendiente por Cobrar
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-mono">
            ${stats.totalPending.toLocaleString('es-CO')} COP
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            {stats.totalCustomers} clientes registrados ({stats.pendingCustomersCount} con saldo)
          </p>
        </div>
      </div>
    </div>
  );
}

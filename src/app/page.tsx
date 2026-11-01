'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Sparkles,
  UserPlus,
  Trophy,
  Calendar,
  Radio,
  RefreshCw,
  Gift,
  ShieldCheck,
  Zap
} from 'lucide-react';
import Header from '@/components/Header';
import DashboardStatsCards from '@/components/DashboardStatsCards';
import InteractiveBoard from '@/components/InteractiveBoard';
import CustomerModal from '@/components/CustomerModal';
import NumberDetailsModal from '@/components/NumberDetailsModal';
import PaymentModal from '@/components/PaymentModal';
import { RaffleNumberData, DashboardStats } from '@/lib/types';

export default function DashboardPage() {
  const [numbers, setNumbers] = useState<RaffleNumberData[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalNumbers: 100,
    soldNumbers: 0,
    reservedNumbers: 0,
    availableNumbers: 100,
    paidNumbers: 0,
    pendingNumbers: 0,
    totalCollected: 0,
    totalPending: 0,
    totalPotentialRevenue: 4000000,
    totalCustomers: 0,
    paidCustomersCount: 0,
    pendingCustomersCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Modales
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [initialNumbersForCustomer, setInitialNumbersForCustomer] = useState<string[]>([]);
  const [selectedNumberForDetail, setSelectedNumberForDetail] = useState<RaffleNumberData | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Modal de Abono / Pago
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentCustomerInfo, setPaymentCustomerInfo] = useState<{ id: string; name: string }>({
    id: '',
    name: '',
  });

  // Carga de datos
  const loadData = useCallback(async () => {
    try {
      const [resStats, resNumbers] = await Promise.all([
        fetch('/api/dashboard/stats', { cache: 'no-store' }),
        fetch('/api/numbers', { cache: 'no-store' }),
      ]);

      if (resStats.ok) {
        const statsData = await resStats.json();
        setStats(statsData);
      }

      if (resNumbers.ok) {
        const numbersData = await resNumbers.json();
        setNumbers(numbersData);

        // Si hay un modal abierto con un número específico, actualizar sus datos
        if (selectedNumberForDetail) {
          const updatedNum = numbersData.find(
            (n: RaffleNumberData) => n.number === selectedNumberForDetail.number
          );
          if (updatedNum) setSelectedNumberForDetail(updatedNum);
        }
      }
    } catch (error) {
      console.error('Error cargando datos de la rifa:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedNumberForDetail]);

  useEffect(() => {
    loadData();

    // 1. Conexión en TIEMPO REAL mediante Server-Sent Events (SSE)
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/realtime');

      eventSource.onopen = () => {
        setRealtimeConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type !== 'CONNECTED') {
            // Sincronizar inmediatamente al recibir eventos de mutación
            loadData();
          }
        } catch {}
      };

      eventSource.onerror = () => {
        setRealtimeConnected(false);
      };
    } catch (e) {
      console.error('Error al inicializar SSE:', e);
    }

    // 2. Respaldo de sincronización periódica cada 10 segundos
    const interval = setInterval(loadData, 10000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [loadData]);

  // Manejar click en número del cartón
  const handleSelectNumber = (numData: RaffleNumberData) => {
    setSelectedNumberForDetail(numData);
    setDetailModalOpen(true);
  };

  // Asignar desde el modal de detalle
  const handleAssignFromDetail = (num: string) => {
    setInitialNumbersForCustomer([num]);
    setCustomerModalOpen(true);
  };

  // Asignar selección múltiple
  const handleMultiAssign = (selected: string[]) => {
    setInitialNumbersForCustomer(selected);
    setCustomerModalOpen(true);
  };

  // Abrir modal de abono
  const handleOpenPaymentModal = (customerId: string, customerName: string) => {
    setPaymentCustomerInfo({ id: customerId, name: customerName });
    setPaymentModalOpen(true);
  };

  const availableNumbersList = numbers
    .filter((n) => n.status === 'AVAILABLE')
    .map((n) => n.number);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-red-600 selection:text-white">
      <Header realtimeStatus={realtimeConnected} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner Hero Oficial de la Rifa */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-950 via-slate-900 to-amber-950 border border-red-900/50 shadow-2xl p-6 sm:p-8">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Rifa Oficial 100 Números (00 - 99)</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                ¡GRAN PREMIO MAYOR! <br />
                <span className="bg-gradient-to-r from-red-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
                  MOTO ELÉCTRICA GW E-MAX 800W
                </span>
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-300 pt-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Sorteo Mayor: <strong>23 de Diciembre de 2026</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Juega con: <strong>Lotería Sinuano Noche</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-emerald-400" />
                  <span>3 Premios Adicionales de: <strong>$100.000 COP</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Valor de cada número: <strong>$40.000 COP</strong></span>
                </div>
              </div>
            </div>

            {/* Botón de Registro Rápido */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setInitialNumbersForCustomer([]);
                  setCustomerModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white hover:opacity-95 shadow-xl shadow-red-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                <UserPlus className="w-5 h-5" />
                <span>Registrar Cliente & Asignar</span>
              </button>

              <button
                type="button"
                onClick={loadData}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualizar Datos Ahora</span>
              </button>
            </div>
          </div>
        </section>

        {/* Indicadores Estadísticos Principales (KPIs) */}
        <section>
          <DashboardStatsCards stats={stats} />
        </section>

        {/* Módulo del Cartón Interactivo Oficial */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Cartón Interactivo de la Rifa</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-600/30 border border-red-500/40 text-red-300 font-mono">
                  10 × 10 (00 - 99)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Selecciona números para consultar compradores, registrar ventas o cambiar estados en MySQL.
              </p>
            </div>
          </div>

          <InteractiveBoard
            numbers={numbers}
            onSelectNumber={handleSelectNumber}
            onMultiAssign={handleMultiAssign}
          />
        </section>
      </main>

      {/* Modal de Registro de Clientes */}
      <CustomerModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSuccess={loadData}
        initialNumbers={initialNumbersForCustomer}
        availableNumbers={availableNumbersList}
      />

      {/* Modal de Detalle y Acciones Rápidas del Número */}
      <NumberDetailsModal
        numberData={selectedNumberForDetail}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onAssignCustomer={handleAssignFromDetail}
        onOpenPaymentModal={handleOpenPaymentModal}
        onRefresh={loadData}
      />

      {/* Modal de Registro de Abonos */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        customerId={paymentCustomerInfo.id}
        customerName={paymentCustomerInfo.name}
        onSuccess={loadData}
      />
    </div>
  );
}

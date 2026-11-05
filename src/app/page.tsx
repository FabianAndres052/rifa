'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const selectedNumberRef = useRef<RaffleNumberData | null>(null);
  selectedNumberRef.current = selectedNumberForDetail;

  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Modal de Abono / Pago
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentCustomerInfo, setPaymentCustomerInfo] = useState<{
    id: string;
    name: string;
    pendingBalance?: number;
    totalPaid?: number;
  }>({
    id: '',
    name: '',
  });

  // Carga de datos optimizada
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

        // Si hay un modal abierto con un número específico, actualizar sus datos sin bucles
        if (selectedNumberRef.current) {
          const updatedNum = numbersData.find(
            (n: RaffleNumberData) => n.number === selectedNumberRef.current?.number
          );
          if (updatedNum) setSelectedNumberForDetail(updatedNum);
        }
      }
      setRealtimeConnected(true);
    } catch (error) {
      console.error('Error cargando datos de la rifa:', error);
      setRealtimeConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Sincronización automática de alto rendimiento cada 5 segundos si la página está activa
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    }, 5000);

    // Refresco inmediato al volver a enfocar la ventana o cambiar de pestaña
    const handleSync = () => {
      loadData();
    };

    window.addEventListener('focus', handleSync);
    window.addEventListener('visibilitychange', handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('visibilitychange', handleSync);
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
  const handleOpenPaymentModal = (
    customerId: string,
    customerName: string,
    pendingBalance?: number,
    totalPaid?: number
  ) => {
    setPaymentCustomerInfo({
      id: customerId,
      name: customerName,
      pendingBalance,
      totalPaid,
    });
    setPaymentModalOpen(true);
  };

  const availableNumbersList = numbers
    .filter((n) => n.status === 'AVAILABLE')
    .map((n) => n.number);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-zinc-800 selection:text-white">
      <Header realtimeStatus={realtimeConnected} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner Hero Oficial de la Rifa - Estética Neutra Profesional */}
        <section className="relative overflow-hidden rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm p-6 sm:p-8">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-200 border border-zinc-700/60">
                <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                <span>Rifa Oficial 100 Números (00 - 99)</span>
              </div>

              <div>
                <span className="text-xs uppercase tracking-widest font-bold text-zinc-400">Gran Premio Mayor</span>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mt-0.5">
                  Moto Eléctrica GW E-MAX 800W
                </h1>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-zinc-300 pt-1">
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/70">
                  <Calendar className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <span>Sorteo Mayor: <strong className="text-white">23 de Dic, 2026</strong></span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/70">
                  <Trophy className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <span>Juega con: <strong className="text-white">Sinuano Noche</strong></span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/70">
                  <Gift className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <span>Premios Adicionales: <strong className="text-white">3 × $100.000 COP</strong></span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/70">
                  <Zap className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <span>Valor Número: <strong className="text-white">$40.000 COP</strong></span>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 justify-end lg:min-w-[220px]">
              <button
                type="button"
                onClick={() => {
                  setInitialNumbersForCustomer([]);
                  setCustomerModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-100 hover:bg-white text-zinc-950 shadow-sm transition-all cursor-pointer active:scale-98"
              >
                <UserPlus className="w-4 h-4" />
                <span>Registrar Cliente</span>
              </button>

              <button
                type="button"
                onClick={loadData}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-zinc-200' : 'text-zinc-400'}`} />
                <span>Actualizar Datos</span>
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
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                <span>Cartón Interactivo de la Rifa</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/60 text-zinc-300 font-mono font-medium">
                  10 × 10 (00 - 99)
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Selecciona números para consultar compradores, registrar ventas o cambiar estados en tiempo real.
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
        pendingBalance={paymentCustomerInfo.pendingBalance}
        totalPaid={paymentCustomerInfo.totalPaid}
        onSuccess={loadData}
      />
    </div>
  );
}

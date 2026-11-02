'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  User,
  CheckCircle,
  Clock,
  FileText,
  Search,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';
import Header from '@/components/Header';
import PaymentModal from '@/components/PaymentModal';

interface PaymentItem {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerNumbers?: string[];
  customerTotalPurchased?: number;
  customerTotalPaid?: number;
  customerPendingBalance?: number;
  amount: number;
  paymentType: 'TOTAL' | 'ABONO';
  paymentMethod: string;
  reference?: string | null;
  paidAt: string;
  notes?: string | null;
}

interface CustomerOption {
  id: string;
  fullName: string;
  numbersCount?: number;
  numbers?: string[];
  totalPurchased?: number;
  totalPaid?: number;
  pendingBalance?: number;
}

export default function FinancePage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [stats, setStats] = useState({
    totalPotentialRevenue: 4000000,
    totalCollected: 0,
    totalPending: 0,
    paidCustomersCount: 0,
    pendingCustomersCount: 0,
    totalCustomers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Clientes para modal de abono
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [selectedCustomerPending, setSelectedCustomerPending] = useState<number | undefined>(undefined);
  const [selectedCustomerPaid, setSelectedCustomerPaid] = useState<number | undefined>(undefined);

  const handleDeletePayment = async (p: PaymentItem) => {
    const confirmMsg = `¿Está seguro de eliminar este abono de $${p.amount.toLocaleString(
      'es-CO'
    )} COP registrado para "${p.customerName}"?\n\nEsta acción revertirá el pago en la base de datos y recalculará las estadísticas de Finanzas inmediatamente.`;
    if (!window.confirm(confirmMsg)) return;

    setDeletingId(p.id);
    try {
      const res = await fetch(`/api/payments?id=${p.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar abono');
      loadFinanceData();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el abono');
    } finally {
      setDeletingId(null);
    }
  };

  const loadFinanceData = useCallback(async () => {
    try {
      const [resStats, resPayments, resCustomers] = await Promise.all([
        fetch('/api/dashboard/stats', { cache: 'no-store' }),
        fetch('/api/payments', { cache: 'no-store' }),
        fetch('/api/customers?minimal=true', { cache: 'no-store' }),
      ]);

      if (resStats.ok) {
        const statsData = await resStats.json();
        setStats(statsData);
      }

      if (resPayments.ok) {
        const paymentsData = await resPayments.json();
        setPayments(paymentsData);
      }

      if (resCustomers.ok) {
        const customersData = await resCustomers.json();
        setCustomers(customersData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFinanceData();

    // Sincronización automática periódica cada 5 segundos si la pestaña está activa
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadFinanceData();
      }
    }, 5000);

    // Actualizar de inmediato al regresar a la pestaña
    const handleFocus = () => {
      loadFinanceData();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, [loadFinanceData]);

  const filteredPayments = payments.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.customerName.toLowerCase().includes(q) ||
      p.paymentMethod.toLowerCase().includes(q) ||
      (p.reference && p.reference.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              <span>Control Financiero & Historial de Abonos</span>
            </h1>
            <p className="text-xs text-slate-400">
              Seguimiento exacto de recaudos, abonos parciales, cuentas por cobrar y métodos de pago.
            </p>
          </div>

          {customers.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                onChange={(e) => {
                  const cust = customers.find((c) => c.id === e.target.value);
                  if (cust) {
                    setSelectedCustomerId(cust.id);
                    setSelectedCustomerName(cust.fullName);
                    setSelectedCustomerPending(cust.pendingBalance);
                    setSelectedCustomerPaid(cust.totalPaid);
                  } else {
                    setSelectedCustomerId('');
                    setSelectedCustomerName('');
                    setSelectedCustomerPending(undefined);
                    setSelectedCustomerPaid(undefined);
                  }
                }}
                value={selectedCustomerId}
              >
                <option value="">-- Seleccionar cliente para abono --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} {c.pendingBalance !== undefined && c.pendingBalance > 0 ? `(Debe: $${c.pendingBalance.toLocaleString('es-CO')})` : ''}
                  </option>
                ))}
              </select>

              {(() => {
                const selectedCust = customers.find((c) => c.id === selectedCustomerId);
                if (!selectedCust) return null;
                return (
                  <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs">
                    {selectedCust.numbers && selectedCust.numbers.length > 0 && (
                      <span className="text-slate-400">
                        Núm:{' '}
                        <span className="font-mono font-bold text-amber-300">
                          {selectedCust.numbers.map((n) => `#${n}`).join(', ')}
                        </span>
                      </span>
                    )}
                    <span className="text-slate-400">
                      Abonó:{' '}
                      <span className="font-mono font-bold text-emerald-400">
                        ${(selectedCust.totalPaid || 0).toLocaleString('es-CO')}
                      </span>
                    </span>
                    <span className="text-slate-400">
                      Debe:{' '}
                      <span className="font-mono font-black text-amber-300">
                        ${(selectedCust.pendingBalance || 0).toLocaleString('es-CO')} COP
                      </span>
                    </span>
                  </div>
                );
              })()}

              <button
                type="button"
                disabled={!selectedCustomerId}
                onClick={() => setPaymentModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Abono</span>
              </button>
            </div>
          )}
        </div>

        {/* Tarjetas Financieras */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-800/40 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Recaudado
              </span>
              <div className="p-2 rounded-xl bg-emerald-900/60 text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-400 font-mono">
              ${stats.totalCollected.toLocaleString('es-CO')} COP
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Dinero recibido y confirmado en caja
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-950/80 to-slate-900 border border-orange-800/40 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pendiente por Cobrar
              </span>
              <div className="p-2 rounded-xl bg-orange-900/60 text-orange-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-orange-400 font-mono">
              ${stats.totalPending.toLocaleString('es-CO')} COP
            </div>
            <p className="text-xs text-slate-400 mt-1">
              De {stats.pendingCustomersCount} clientes con saldo pendiente
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Meta Total (100 números)
              </span>
              <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-white font-mono">
              $4.000.000 COP
            </div>
            <p className="text-xs text-slate-400 mt-1">
              100 números × $40.000 COP
            </p>
          </div>
        </div>

        {/* Buscador de pagos */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en historial por cliente o método..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Total transacciones: {filteredPayments.length}
          </span>
        </div>

        {/* Historial de Pagos y Abonos */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Libro Mayor de Pagos y Abonos</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 font-bold">Fecha & Hora</th>
                  <th className="px-4 py-3.5 font-bold">Cliente</th>
                  <th className="px-4 py-3.5 font-bold">Monto Abono</th>
                  <th className="px-4 py-3.5 font-bold">Total Abonado</th>
                  <th className="px-4 py-3.5 font-bold">Saldo Pendiente (Debe)</th>
                  <th className="px-4 py-3.5 font-bold">Tipo & Método</th>
                  <th className="px-4 py-3.5 font-bold">Referencia / Notas</th>
                  <th className="px-4 py-3.5 font-bold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-slate-300 text-xs whitespace-nowrap">
                      {new Date(p.paidAt).toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white">{p.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <span>{p.customerPhone}</span>
                        {p.customerNumbers && p.customerNumbers.length > 0 && (
                          <span className="text-amber-400 font-bold">
                            [{p.customerNumbers.map((n) => `#${n}`).join(', ')}]
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-black text-emerald-400 text-sm sm:text-base whitespace-nowrap">
                      ${p.amount.toLocaleString('es-CO')} COP
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-300 text-xs whitespace-nowrap">
                      ${(p.customerTotalPaid ?? p.amount).toLocaleString('es-CO')} COP
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                          (p.customerPendingBalance ?? 0) > 0
                            ? 'bg-amber-950/80 border border-amber-600/50 text-amber-300'
                            : 'bg-emerald-950/80 border border-emerald-600/50 text-emerald-300'
                        }`}
                      >
                        ${(p.customerPendingBalance ?? 0).toLocaleString('es-CO')} COP
                        {(p.customerPendingBalance ?? 0) > 0 ? (
                          <span className="text-[10px] uppercase font-sans text-amber-400 font-extrabold">(Debe)</span>
                        ) : (
                          <span className="text-[10px] uppercase font-sans text-emerald-400 font-extrabold">(Al día)</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold w-fit ${
                            p.paymentType === 'TOTAL'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                              : 'bg-blue-950 text-sky-300 border border-blue-800/40'
                          }`}
                        >
                          {p.paymentType === 'TOTAL' ? 'PAGO COMPLETO' : 'ABONO PARCIAL'}
                        </span>
                        <span className="text-xs text-slate-300 font-semibold">{p.paymentMethod}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400">
                      {p.reference && (
                        <div className="font-mono text-amber-400 font-medium">Ref: {p.reference}</div>
                      )}
                      {p.notes && <div>{p.notes}</div>}
                      {!p.reference && !p.notes && <span className="text-slate-600">-</span>}
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        title="Eliminar este abono/pago"
                        disabled={deletingId === p.id}
                        onClick={() => handleDeletePayment(p)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/50 border border-slate-800 hover:border-red-800/50 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredPayments.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      No se registran pagos en el historial todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal de Abono */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        customerId={selectedCustomerId}
        customerName={selectedCustomerName}
        pendingBalance={selectedCustomerPending}
        totalPaid={selectedCustomerPaid}
        onSuccess={loadFinanceData}
      />
    </div>
  );
}

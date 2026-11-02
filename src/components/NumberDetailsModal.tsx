'use client';

import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Unlock,
  CreditCard,
  UserPlus,
  AlertTriangle
} from 'lucide-react';
import { RaffleNumberData } from '@/lib/types';

interface NumberDetailsModalProps {
  numberData: RaffleNumberData | null;
  isOpen: boolean;
  onClose: () => void;
  onAssignCustomer: (num: string) => void;
  onOpenPaymentModal: (customerId: string, customerName: string) => void;
  onRefresh: () => void;
}

export default function NumberDetailsModal({
  numberData,
  isOpen,
  onClose,
  onAssignCustomer,
  onOpenPaymentModal,
  onRefresh,
}: NumberDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !numberData) return null;

  const getStatusBadge = (status: string, hasAbono?: boolean) => {
    if (hasAbono) {
      return {
        label: 'Con Abono Parcial (¡Debe Saldo!)',
        bg: 'bg-blue-950 border-blue-500/50 text-blue-300',
        dot: 'bg-blue-400',
      };
    }
    switch (status) {
      case 'AVAILABLE':
        return {
          label: 'Disponible',
          bg: 'bg-emerald-950 border-emerald-500/50 text-emerald-300',
          dot: 'bg-emerald-400',
        };
      case 'RESERVED':
        return {
          label: 'Reservado',
          bg: 'bg-yellow-950 border-yellow-500/50 text-yellow-300',
          dot: 'bg-yellow-400',
        };
      case 'SOLD_PAID':
        return {
          label: 'Vendido y Pagado',
          bg: 'bg-red-950 border-red-500/50 text-red-300',
          dot: 'bg-red-400',
        };
      case 'SOLD_PENDING':
        return {
          label: 'Vendido (Pendiente de Pago)',
          bg: 'bg-orange-950 border-orange-500/50 text-orange-300',
          dot: 'bg-orange-400',
        };
      default:
        return {
          label: status,
          bg: 'bg-slate-900 border-slate-700 text-slate-300',
          dot: 'bg-slate-400',
        };
    }
  };

  const statusInfo = getStatusBadge(numberData.status, numberData.hasAbono);

  // Cambiar estado del número (ej: marcar como pagado o liberarlo)
  const handleUpdateStatus = async (newStatus: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/numbers/${numberData.number}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar');
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al procesar acción');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header con número destacado */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 border-b border-red-900/40">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-600/40">
              <span className="font-mono text-3xl font-black text-white tracking-wider">
                {numberData.number}
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Detalle del Número
              </span>
              <h3 className="text-xl font-extrabold text-white">
                Número #{numberData.number}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.bg}`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusInfo.dot} animate-pulse`} />
                  {statusInfo.label}
                </span>
                <span className="text-xs font-bold text-amber-400">
                  $40.000 COP
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {numberData.customer ? (
            <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Comprador Asociado
                </span>
                <span className="text-xs font-medium text-slate-500">
                  ID: {numberData.customer.id.substring(0, 8)}...
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2.5 text-slate-200">
                  <User className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="font-bold">{numberData.customer.fullName}</span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{numberData.customer.phone}</span>
                  </div>
                  <a
                    href={`https://wa.me/57${numberData.customer.phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(
                      numberData.customer.fullName
                    )},%20te%20contacto%20sobre%20tu%20n%C3%BAmero%20${numberData.number}%20de%20la%20Gran%20Rifa%20Navide%C3%B1a.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline"
                  >
                    WhatsApp 💬
                  </a>
                </div>

                <div className="flex items-center gap-2.5 text-slate-300">
                  <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{numberData.customer.address}</span>
                </div>

                {numberData.assignment && (
                  <div className="flex items-center gap-2.5 text-xs text-slate-400 pt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      Registrado:{' '}
                      {new Date(numberData.assignment.assignedAt).toLocaleString('es-CO')}
                    </span>
                  </div>
                )}

                {numberData.hasAbono && (
                  <div className="mt-3 p-3 rounded-xl bg-blue-950/80 border border-blue-500/50 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-blue-200 font-bold">
                      <span>Estado Financiero:</span>
                      <span className="uppercase text-sky-300">Con Abono Parcial</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Abonado hasta ahora:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        ${numberData.totalPaid?.toLocaleString('es-CO')} COP
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Resta por pagar (Debe):</span>
                      <span className="font-mono font-black text-amber-300 text-sm">
                        ${numberData.pendingBalance?.toLocaleString('es-CO')} COP
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-950/50 rounded-xl border border-slate-800">
              <span className="text-3xl mb-2 block">🎟️</span>
              <p className="text-sm font-semibold text-slate-200">
                Este número está disponible para la venta
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Puedes asignarlo inmediatamente a un nuevo cliente o marcarlo como reservado.
              </p>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="pt-2 space-y-2">
            {numberData.status === 'AVAILABLE' ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAssignCustomer(numberData.number);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white hover:opacity-95 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Asignar y Vender a Cliente</span>
              </button>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {numberData.status !== 'SOLD_PAID' && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleUpdateStatus('SOLD_PAID')}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Marcar como PAGADO</span>
                  </button>
                )}

                {numberData.customer && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPaymentModal(numberData.customer!.id, numberData.customer!.fullName);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Registrar Abono</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    if (
                      confirm(
                        `¿Está seguro de liberar el número ${numberData.number}? Quedará disponible para otros compradores.`
                      )
                    ) {
                      handleUpdateStatus('AVAILABLE');
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-medium bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-300 border border-slate-700 transition-colors cursor-pointer sm:col-span-2"
                >
                  <Unlock className="w-4 h-4 text-red-400" />
                  <span>Liberar Número (Volver a Disponible)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

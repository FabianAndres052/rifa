'use client';

import React, { useState } from 'react';
import { X, DollarSign, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  pendingBalance?: number;
  totalPaid?: number;
  onSuccess: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  customerId,
  customerName,
  pendingBalance,
  totalPaid,
  onSuccess,
}: PaymentModalProps) {
  const [amount, setAmount] = useState(
    pendingBalance && pendingBalance > 0 ? pendingBalance.toString() : '40000'
  );
  const [paymentType, setPaymentType] = useState<'ABONO' | 'TOTAL'>(
    pendingBalance && pendingBalance > 0 ? 'ABONO' : 'TOTAL'
  );
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar monto sugerido si cambia pendingBalance al abrir
  React.useEffect(() => {
    if (isOpen) {
      if (pendingBalance && pendingBalance > 0) {
        setAmount(pendingBalance.toString());
        setPaymentType('ABONO');
      } else {
        setAmount('40000');
        setPaymentType('TOTAL');
      }
      setError(null);
    }
  }, [isOpen, pendingBalance]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Ingrese un monto válido mayor a 0');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          amount: numAmount,
          paymentType,
          paymentMethod,
          reference: reference.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar pago');

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {}

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 border-b border-amber-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-600/30 border border-amber-500/40 text-amber-300">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Registrar Abono / Pago
              </h3>
              <p className="text-xs text-amber-300/80 font-medium">
                Cliente: {customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {(totalPaid !== undefined || pendingBalance !== undefined) && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/40">
                <span className="block text-[10px] text-emerald-400 font-bold uppercase">Ya Abonó</span>
                <span className="font-mono font-bold text-emerald-300 text-sm">
                  ${(totalPaid || 0).toLocaleString('es-CO')} COP
                </span>
              </div>
              <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-900/40">
                <span className="block text-[10px] text-amber-400 font-bold uppercase">Resta por Pagar (Debe)</span>
                <span className="font-mono font-black text-amber-300 text-sm">
                  ${(pendingBalance || 0).toLocaleString('es-CO')} COP
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Monto del Pago ($ COP) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input
                type="number"
                step="1000"
                min="1000"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-base focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Tipo de Pago
              </label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="ABONO">Abono Parcial</option>
                <option value="TOTAL">Pago Completo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Método
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="NEQUI">Nequi</option>
                <option value="DAVIPLATA">Daviplata</option>
                <option value="BANCOLOMBIA">Bancolombia</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Referencia / Comprobante (Opcional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ej: Aprobación #83921"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Notas adicionales
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles sobre el pago..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 hover:opacity-95 shadow-lg shadow-amber-600/30 transition-all cursor-pointer font-bold"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Guardando...' : 'Confirmar Abono'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

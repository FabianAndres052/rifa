'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, User, Phone, MapPin, Hash, DollarSign, CreditCard, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialNumbers?: string[];
  availableNumbers?: string[];
}

export default function CustomerModal({
  isOpen,
  onClose,
  onSuccess,
  initialNumbers = [],
  availableNumbers = [],
}: CustomerModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [manualNumberInput, setManualNumberInput] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'SOLD_PAID' | 'SOLD_PENDING' | 'RESERVED'>('SOLD_PENDING');
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedNumbers(initialNumbers);
      setError(null);
    }
  }, [isOpen, initialNumbers]);

  if (!isOpen) return null;

  const ticketPrice = 40000;
  const totalAmount = selectedNumbers.length * ticketPrice;

  const handleAddNumber = (numStr: string) => {
    const formatted = numStr.trim().padStart(2, '0');
    const val = parseInt(formatted, 10);
    if (isNaN(val) || val < 0 || val > 99) {
      setError('El número debe estar entre 00 y 99');
      return;
    }
    if (selectedNumbers.includes(formatted)) {
      setError(`El número ${formatted} ya está en la lista`);
      return;
    }
    if (availableNumbers.length > 0 && !availableNumbers.includes(formatted)) {
      setError(`El número ${formatted} no está disponible actualmente`);
      return;
    }
    setSelectedNumbers([...selectedNumbers, formatted].sort());
    setManualNumberInput('');
    setError(null);
  };

  const handleRemoveNumber = (num: string) => {
    setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      setError('Por favor complete todos los campos obligatorios (*)');
      return;
    }

    if (selectedNumbers.length === 0) {
      setError('Debe seleccionar al menos un número para el cliente');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          numbers: selectedNumbers,
          paymentStatus,
          paymentMethod,
          paymentReference: paymentReference.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar registro');
      }

      // Animación de celebración
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al procesar el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-900/80 via-slate-900 to-slate-900 border-b border-red-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-600/30 border border-red-500/40 text-red-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Registrar Cliente & Asignar Números
              </h3>
              <p className="text-xs text-slate-400">
                Valor por número: $40.000 COP | Sorteo Moto Eléctrica
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Información del Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nombre Completo *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Carlos Alberto Gómez"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Número de Teléfono *
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: 300 123 4567"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Dirección de Residencia *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej: Cra 45 # 72 - 15, Barranquilla"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Selector y Gestión de Números */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Hash className="w-4 h-4" />
                Números Asignados ({selectedNumbers.length})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={2}
                  value={manualNumberInput}
                  onChange={(e) => setManualNumberInput(e.target.value)}
                  placeholder="00-99"
                  className="w-16 px-2.5 py-1 text-center font-mono font-bold rounded-lg bg-slate-900 border border-slate-700 text-amber-300 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNumber(manualNumberInput);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddNumber(manualNumberInput)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium cursor-pointer"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* Badges de números seleccionados */}
            <div className="flex flex-wrap gap-2 min-h-[42px] p-2 bg-slate-900/80 rounded-lg border border-slate-800">
              {selectedNumbers.length === 0 ? (
                <span className="text-xs text-slate-500 italic flex items-center">
                  Ningún número seleccionado. Escribe uno arriba o selecciónalos en el cartón.
                </span>
              ) : (
                selectedNumbers.map((num) => (
                  <span
                    key={num}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-sm"
                  >
                    #{num}
                    <button
                      type="button"
                      onClick={() => handleRemoveNumber(num)}
                      className="hover:text-red-200 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Cálculo automático */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-sm">
              <span className="text-slate-400">
                Fórmula: {selectedNumbers.length} números × $40.000 COP
              </span>
              <span className="font-extrabold text-base text-emerald-400">
                Total: ${totalAmount.toLocaleString('es-CO')} COP
              </span>
            </div>
          </div>

          {/* Estado de Pago y Método */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Estado del Pago *
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-red-500 text-sm font-medium"
              >
                <option value="SOLD_PAID">🔴 Pagado (Efectivamente cancelado)</option>
                <option value="SOLD_PENDING">🟠 Pendiente de Pago (Vendido por cobrar)</option>
                <option value="RESERVED">🟡 Reservado (Apartado temporalmente)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Método de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-red-500 text-sm"
              >
                <option value="EFECTIVO">Efectivo en Mano</option>
                <option value="NEQUI">Nequi</option>
                <option value="DAVIPLATA">Daviplata</option>
                <option value="BANCOLOMBIA">Bancolombia</option>
                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
              </select>
            </div>

            {paymentStatus === 'SOLD_PAID' && (
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Referencia o Comprobante de Pago (Opcional)
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Ej: Nro de aprobación Nequi #M098762"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Observaciones Opcionales
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Entregar boleta física el sábado, conocido del trabajo..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm resize-none"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || selectedNumbers.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white hover:opacity-95 shadow-lg shadow-red-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Guardando en MySQL...' : 'Guardar y Asociar Números'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

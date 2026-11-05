'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  CreditCard,
  X,
  AlertTriangle
} from 'lucide-react';
import Header from '@/components/Header';
import CustomerModal from '@/components/CustomerModal';
import PaymentModal from '@/components/PaymentModal';
import { CustomerData } from '@/lib/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modales
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activeCustomerForPayment, setActiveCustomerForPayment] = useState<{
    id: string;
    name: string;
    pendingBalance?: number;
    totalPaid?: number;
  }>({
    id: '',
    name: '',
  });

  // Modal de Edición de Cliente
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    notes: '',
    paymentStatus: '',
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      const url = new URL('/api/customers', window.location.origin);
      if (searchQuery.trim()) url.searchParams.set('q', searchQuery.trim());
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);

      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Manejar apertura de edición
  const handleOpenEdit = (c: CustomerData) => {
    setEditingCustomer(c);
    setEditForm({
      fullName: c.fullName,
      phone: c.phone,
      address: c.address,
      notes: c.notes || '',
      paymentStatus: c.paymentStatus,
    });
    setEditError(null);
    setEditModalOpen(true);
  };

  // Guardar edición
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setEditLoading(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar');
      setEditModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      setEditError(err.message || 'Error al guardar cambios');
    } finally {
      setEditLoading(false);
    }
  };

  // Eliminar cliente
  const handleDeleteCustomer = async (c: CustomerData) => {
    const nums = c.numbers.map((n) => n.number).join(', ');
    const msg = `¿Está seguro de eliminar a ${c.fullName}?\n\nEsta acción liberará de inmediato sus números asignados: [${nums}] y registrará la trazabilidad en auditoría.`;
    if (!confirm(msg)) return;

    try {
      const res = await fetch(`/api/customers/${c.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar cliente');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Cabecera de la Sección */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-5 h-5 text-zinc-400" />
              <span>Gestión de Clientes Compradores</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Administración, consulta de números, trazabilidad y estado de pagos de todos los compradores.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCustomerModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-100 hover:bg-white text-zinc-950 shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Nuevo Cliente</span>
          </button>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, teléfono o número comprado..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs sm:text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: 'Todos los Clientes' },
              { id: 'PAID', label: 'Totalmente Pagados' },
              { id: 'PARTIAL', label: 'Con Abono Parcial' },
              { id: 'PENDING', label: 'Pendientes de Pago' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setStatusFilter(btn.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === btn.id
                    ? 'bg-zinc-800 text-white border border-zinc-700/60 shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla / Lista de Clientes */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[11px] border-b border-zinc-800 font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">Contacto</th>
                  <th className="px-5 py-3.5">Números Comprados</th>
                  <th className="px-5 py-3.5">Total / Pagado</th>
                  <th className="px-5 py-3.5">Estado de Pago</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                    {/* Nombre y Dirección */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white text-sm">{c.fullName}</div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{c.address}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1">
                        Reg: {new Date(c.createdAt).toLocaleDateString('es-CO')}
                      </div>
                    </td>

                    {/* Teléfono y WhatsApp */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-zinc-200 font-mono text-xs">
                        <Phone className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{c.phone}</span>
                      </div>
                      <a
                        href={`https://wa.me/57${c.phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(
                          c.fullName
                        )},%20te%20contacto%20sobre%20tus%20n%C3%BAmeros%20de%20la%20Super%20Rifa.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-[11px] text-zinc-400 hover:text-white hover:underline mt-1 font-medium"
                      >
                        Enviar WhatsApp
                      </a>
                    </td>

                    {/* Números asociados */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {c.numbers.map((n) => (
                          <span
                            key={n.number}
                            className={`px-2 py-0.5 rounded font-mono font-semibold text-xs ${
                              n.status === 'SOLD_PAID'
                                ? 'bg-zinc-800 text-zinc-200 border border-zinc-700/60'
                                : n.status === 'RESERVED'
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                                : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                            }`}
                          >
                            #{n.number}
                          </span>
                        ))}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-1 font-mono">
                        {c.numbers.length} {c.numbers.length === 1 ? 'número' : 'números'}
                      </div>
                    </td>

                    {/* Total y Pagado */}
                    <td className="px-5 py-4">
                      <div className="font-mono font-bold text-white text-xs sm:text-sm">
                        ${c.totalPurchased.toLocaleString('es-CO')} COP
                      </div>
                      <div className="text-xs text-emerald-400 font-mono mt-0.5">
                        Abonado: ${c.totalPaid.toLocaleString('es-CO')}
                      </div>
                      {c.pendingBalance > 0 && (
                        <div className="text-xs text-amber-400 font-mono">
                          Resta: ${c.pendingBalance.toLocaleString('es-CO')}
                        </div>
                      )}
                    </td>

                    {/* Badge de Estado */}
                    <td className="px-5 py-4">
                      {c.paymentStatus === 'PAID' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span>PAGADO</span>
                        </span>
                      ) : c.paymentStatus === 'PARTIAL' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-sky-400 border border-blue-500/20">
                          <CreditCard className="w-3 h-3 text-sky-400" />
                          <span>ABONO PARCIAL</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>PENDIENTE</span>
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCustomerForPayment({
                              id: c.id,
                              name: c.fullName,
                              pendingBalance: c.pendingBalance,
                              totalPaid: c.totalPaid,
                            });
                            setPaymentModalOpen(true);
                          }}
                          title="Registrar Abono"
                          className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-zinc-700/60 transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          title="Editar Cliente"
                          className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(c)}
                          title="Eliminar Cliente"
                          className="p-1.5 rounded-lg bg-zinc-900 text-red-400 hover:bg-red-950/60 border border-zinc-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {customers.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-zinc-500">
                      No hay clientes registrados que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal de Registro de Clientes */}
      <CustomerModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSuccess={fetchCustomers}
      />

      {/* Modal de Abono */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        customerId={activeCustomerForPayment.id}
        customerName={activeCustomerForPayment.name}
        pendingBalance={activeCustomerForPayment.pendingBalance}
        totalPaid={activeCustomerForPayment.totalPaid}
        onSuccess={fetchCustomers}
      />

      {/* Modal de Edición de Cliente */}
      {editModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">
                Editar Información del Cliente
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  required
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Estado de Pago de sus Números
                </label>
                <select
                  value={editForm.paymentStatus}
                  onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-zinc-600"
                >
                  <option value="PAID">Pagado Total</option>
                  <option value="PENDING">Pendiente de Pago</option>
                  <option value="RESERVED">Reservado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Observaciones
                </label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-zinc-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 shadow-sm cursor-pointer"
                >
                  {editLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

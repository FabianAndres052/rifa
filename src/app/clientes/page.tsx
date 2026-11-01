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
  const [activeCustomerForPayment, setActiveCustomerForPayment] = useState<{ id: string; name: string }>({
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Cabecera de la Sección */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-amber-400" />
              <span>Gestión de Clientes Compradores</span>
            </h1>
            <p className="text-xs text-slate-400">
              Administración, consulta de números, trazabilidad y estado de pagos de todos los compradores.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCustomerModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white shadow-lg shadow-red-600/30 hover:opacity-95 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Nuevo Cliente</span>
          </button>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, teléfono o número comprado..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: 'Todos los Clientes' },
              { id: 'PAID', label: 'Totalmente Pagados' },
              { id: 'PARTIAL', label: 'Con Abono Parcial' },
              { id: 'PENDING', label: 'Pendientes de Pago' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setStatusFilter(btn.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === btn.id
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla / Lista de Clientes */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Cliente</th>
                  <th className="px-5 py-3.5 font-bold">Contacto</th>
                  <th className="px-5 py-3.5 font-bold">Números Comprados</th>
                  <th className="px-5 py-3.5 font-bold">Total / Pagado</th>
                  <th className="px-5 py-3.5 font-bold">Estado de Pago</th>
                  <th className="px-5 py-3.5 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Nombre y Dirección */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-sm">{c.fullName}</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{c.address}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Reg: {new Date(c.createdAt).toLocaleDateString('es-CO')}
                      </div>
                    </td>

                    {/* Teléfono y WhatsApp */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-slate-200 font-mono">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{c.phone}</span>
                      </div>
                      <a
                        href={`https://wa.me/57${c.phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(
                          c.fullName
                        )},%20te%20contacto%20sobre%20tus%20n%C3%BAmeros%20de%20la%20Gran%20Rifa%20Navide%C3%B1a.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-[11px] text-emerald-400 hover:underline mt-1 font-semibold"
                      >
                        Enviar WhatsApp 💬
                      </a>
                    </td>

                    {/* Números asociados */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {c.numbers.map((n) => (
                          <span
                            key={n.number}
                            className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                              n.status === 'SOLD_PAID'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800/40'
                                : n.status === 'RESERVED'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                                : 'bg-orange-950 text-orange-300 border border-orange-800/40'
                            }`}
                          >
                            #{n.number}
                          </span>
                        ))}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {c.numbers.length} {c.numbers.length === 1 ? 'número' : 'números'}
                      </div>
                    </td>

                    {/* Total y Pagado */}
                    <td className="px-5 py-4">
                      <div className="font-mono font-extrabold text-white">
                        ${c.totalPurchased.toLocaleString('es-CO')} COP
                      </div>
                      <div className="text-xs text-emerald-400 font-medium mt-0.5">
                        Abonado: ${c.totalPaid.toLocaleString('es-CO')}
                      </div>
                      {c.pendingBalance > 0 && (
                        <div className="text-xs text-orange-400 font-medium">
                          Resta: ${c.pendingBalance.toLocaleString('es-CO')}
                        </div>
                      )}
                    </td>

                    {/* Badge de Estado */}
                    <td className="px-5 py-4">
                      {c.paymentStatus === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800/40">
                          <CheckCircle className="w-3 h-3 text-rose-400" />
                          <span>PAGADO</span>
                        </span>
                      ) : c.paymentStatus === 'PARTIAL' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800/40">
                          <CreditCard className="w-3 h-3 text-amber-400" />
                          <span>ABONO PARCIAL</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-950 text-orange-300 border border-orange-800/40">
                          <Clock className="w-3 h-3 text-orange-400" />
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
                            setActiveCustomerForPayment({ id: c.id, name: c.fullName });
                            setPaymentModalOpen(true);
                          }}
                          title="Registrar Abono"
                          className="p-1.5 rounded-lg bg-amber-950 text-amber-300 hover:bg-amber-900 border border-amber-800/40 transition-colors"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          title="Editar Cliente"
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(c)}
                          title="Eliminar Cliente"
                          className="p-1.5 rounded-lg bg-red-950 text-red-400 hover:bg-red-900 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {customers.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
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
        onSuccess={fetchCustomers}
      />

      {/* Modal de Edición de Cliente */}
      {editModalOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                Editar Información del Cliente
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-red-950 border border-red-500 text-red-200 text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  required
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Estado de Pago de sus Números
                </label>
                <select
                  value={editForm.paymentStatus}
                  onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                >
                  <option value="PAID">Pagado Total</option>
                  <option value="PENDING">Pendiente de Pago</option>
                  <option value="RESERVED">Reservado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observaciones
                </label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-500 cursor-pointer"
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

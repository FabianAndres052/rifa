'use client';

import React, { useState, useEffect } from 'react';
import { History, Shield, Search, Calendar, User, FileText } from 'lucide-react';
import Header from '@/components/Header';
import { AuditLogData } from '@/lib/types';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadLogs = async () => {
    try {
      const res = await fetch('/api/auditoria', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.performedBy.toLowerCase().includes(q) ||
      log.entity.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-red-400" />
            <span>Trazabilidad & Auditoría del Sistema</span>
          </h1>
          <p className="text-xs text-slate-400">
            Registro cronológico inmutable de todas las acciones administrativas (asignaciones, pagos, eliminaciones).
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en logs por acción, usuario o detalle..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>
          <span className="text-xs text-slate-400">
            {filteredLogs.length} eventos registrados
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Fecha / Hora</th>
                  <th className="px-5 py-3.5 font-bold">Acción</th>
                  <th className="px-5 py-3.5 font-bold">Módulo</th>
                  <th className="px-5 py-3.5 font-bold">Responsable</th>
                  <th className="px-5 py-3.5 font-bold">Detalle de la Operación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-slate-400 text-xs whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString('es-CO')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-red-950 text-red-300 border border-red-800/40">
                        {l.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 font-medium">
                      {l.entity}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <User className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-semibold">{l.performedBy}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {l.details}
                    </td>
                  </tr>
                ))}

                {filteredLogs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500">
                      No hay registros de auditoría que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

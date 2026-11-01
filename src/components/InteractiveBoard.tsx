'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Sparkles,
  LayoutGrid,
  Image as ImageIcon,
  CheckSquare,
  Square,
  Search,
  Filter,
  UserPlus,
  Info,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { RaffleNumberData, NumberStatus } from '@/lib/types';

interface InteractiveBoardProps {
  numbers: RaffleNumberData[];
  onSelectNumber: (numData: RaffleNumberData) => void;
  onMultiAssign: (selectedNumbers: string[]) => void;
}

export default function InteractiveBoard({
  numbers,
  onSelectNumber,
  onMultiAssign,
}: InteractiveBoardProps) {
  const [viewMode, setViewMode] = useState<'OFFICIAL' | 'TACTICAL'>('OFFICIAL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);

  // Función para obtener clase CSS de color según el estado
  const getStatusColor = (status: NumberStatus, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-blue-600 text-white border-2 border-white ring-4 ring-blue-400/50 shadow-xl scale-105 z-10';
    }
    switch (status) {
      case 'AVAILABLE':
        // Verde
        return 'bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-400/50 shadow-sm shadow-emerald-950/40';
      case 'RESERVED':
        // Amarillo
        return 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black border border-amber-300 shadow-sm shadow-amber-950/40';
      case 'SOLD_PAID':
        // Rojo
        return 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400/50 shadow-sm shadow-rose-950/40';
      case 'SOLD_PENDING':
        // Naranja
        return 'bg-orange-500 hover:bg-orange-400 text-white border border-orange-300/50 shadow-sm shadow-orange-950/40';
      default:
        return 'bg-slate-800 text-white';
    }
  };

  // Manejar click en celda
  const handleCellClick = (numData: RaffleNumberData) => {
    if (multiSelectMode) {
      if (numData.status !== 'AVAILABLE') {
        // Si no está disponible, mostrar detalle
        onSelectNumber(numData);
        return;
      }
      if (selectedNumbers.includes(numData.number)) {
        setSelectedNumbers(selectedNumbers.filter((n) => n !== numData.number));
      } else {
        setSelectedNumbers([...selectedNumbers, numData.number].sort());
      }
    } else {
      onSelectNumber(numData);
    }
  };

  // Filtrado de números para vista táctica
  const filteredNumbers = numbers.filter((item) => {
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const numMatch = item.number.includes(q);
      const buyerMatch = item.customer?.fullName.toLowerCase().includes(q);
      return numMatch || buyerMatch;
    }
    return true;
  });

  // Conteo de estados
  const counts = {
    AVAILABLE: numbers.filter((n) => n.status === 'AVAILABLE').length,
    RESERVED: numbers.filter((n) => n.status === 'RESERVED').length,
    SOLD_PAID: numbers.filter((n) => n.status === 'SOLD_PAID').length,
    SOLD_PENDING: numbers.filter((n) => n.status === 'SOLD_PENDING').length,
  };

  return (
    <div className="space-y-6">
      {/* Barra de Controles: Selector de Vista, Filtros y Leyenda */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Selector de Modo */}
          <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('OFFICIAL')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                viewMode === 'OFFICIAL'
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md shadow-red-700/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Cartón Oficial Ilustrado</span>
            </button>
            <button
              onClick={() => setViewMode('TACTICAL')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                viewMode === 'TACTICAL'
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md shadow-red-700/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Tablero Táctico HD (10×10)</span>
            </button>
          </div>

          {/* Toggle de Selección Múltiple */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setMultiSelectMode(!multiSelectMode);
                if (multiSelectMode) setSelectedNumbers([]);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                multiSelectMode
                  ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              {multiSelectMode ? (
                <CheckSquare className="w-4 h-4 text-blue-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Modo Selección Múltiple</span>
            </button>
          </div>
        </div>

        {/* Leyenda Oficial de Colores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="w-4 h-4 rounded-md bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-200">Disponible</span>
              <span className="text-[11px] font-semibold text-emerald-400">
                {counts.AVAILABLE} números
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="w-4 h-4 rounded-md bg-amber-400 shadow-sm shadow-amber-400/50" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-200">Reservado</span>
              <span className="text-[11px] font-semibold text-amber-400">
                {counts.RESERVED} números
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="w-4 h-4 rounded-md bg-rose-600 shadow-sm shadow-rose-600/50" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-200">Vendido y Pagado</span>
              <span className="text-[11px] font-semibold text-rose-400">
                {counts.SOLD_PAID} números
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="w-4 h-4 rounded-md bg-orange-500 shadow-sm shadow-orange-500/50" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-200">Pendiente de Pago</span>
              <span className="text-[11px] font-semibold text-orange-400">
                {counts.SOLD_PENDING} números
              </span>
            </div>
          </div>
        </div>

        {/* Barra flotante de Selección Múltiple activa */}
        {multiSelectMode && selectedNumbers.length > 0 && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 border border-blue-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs">
                {selectedNumbers.length} números
              </span>
              <span className="text-xs text-blue-200 font-medium">
                Seleccionados: [{selectedNumbers.join(', ')}]
              </span>
              <span className="text-xs font-bold text-emerald-400 ml-2">
                Total: ${(selectedNumbers.length * 40000).toLocaleString('es-CO')} COP
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedNumbers([])}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => onMultiAssign(selectedNumbers)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md shadow-red-600/30 hover:opacity-95 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Vender Seleccionados</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =======================================================================
          VISTA 1: CARTÓN OFICIAL ILUSTRADO (SUPERPOSICIÓN PRECISA 10x10)
      ======================================================================== */}
      {viewMode === 'OFFICIAL' && (
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-2xl bg-black rounded-3xl p-2 sm:p-4 shadow-2xl border border-red-900/50 overflow-hidden">
            <div className="relative w-full aspect-[682/1024] rounded-2xl overflow-hidden shadow-inner">
              {/* Imagen oficial proporcionada por el usuario */}
              <Image
                src="/images/carton-oficial.jpg"
                alt="Cartón Oficial Super Rifa Navideña"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 700px"
                className="object-contain"
              />

              {/* Contenedor Overlay de la Cuadrícula 10x10
                  Alineado matemáticamente a:
                  Left: 3.08%, Top: 59.28%, Width: 77.42%, Height: 36.33%
              */}
              <div
                className="absolute grid grid-cols-10 grid-rows-10 gap-[1px] p-[1px]"
                style={{
                  left: '3.08%',
                  top: '59.28%',
                  width: '77.42%',
                  height: '36.33%',
                }}
              >
                {numbers.map((item) => {
                  const isSelected = selectedNumbers.includes(item.number);
                  const statusClass = getStatusColor(item.status, isSelected);

                  return (
                    <button
                      key={item.number}
                      type="button"
                      onClick={() => handleCellClick(item)}
                      title={`Número #${item.number} - ${item.status === 'AVAILABLE' ? 'Disponible' : item.customer?.fullName || item.status}`}
                      className={`relative flex items-center justify-center font-mono text-[11px] sm:text-sm md:text-base font-extrabold rounded-[3px] transition-all duration-100 cursor-pointer select-none active:scale-95 ${statusClass}`}
                    >
                      <span>{item.number}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-amber-400" />
              <span>
                Haz clic sobre cualquier número del cartón para ver su comprador, cambiar estado o asignarlo.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          VISTA 2: TABLERO TÁCTICO DIGITAL HD (10x10)
      ======================================================================== */}
      {viewMode === 'TACTICAL' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md space-y-5">
          {/* Barra de Filtros y Búsqueda */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por número o comprador..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
              {[
                { id: 'ALL', label: 'Todos (100)' },
                { id: 'AVAILABLE', label: `Disponibles (${counts.AVAILABLE})` },
                { id: 'SOLD_PAID', label: `Pagados (${counts.SOLD_PAID})` },
                { id: 'SOLD_PENDING', label: `Pendientes (${counts.SOLD_PENDING})` },
                { id: 'RESERVED', label: `Reservados (${counts.RESERVED})` },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setFilterStatus(btn.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    filterStatus === btn.id
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cuadrícula 10x10 Táctica */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-2.5">
            {filteredNumbers.map((item) => {
              const isSelected = selectedNumbers.includes(item.number);
              const statusClass = getStatusColor(item.status, isSelected);

              return (
                <button
                  key={item.number}
                  type="button"
                  onClick={() => handleCellClick(item)}
                  className={`group relative flex flex-col items-center justify-between p-2 rounded-xl aspect-square transition-all duration-150 cursor-pointer ${statusClass}`}
                >
                  <span className="font-mono text-base sm:text-lg font-black tracking-tight">
                    {item.number}
                  </span>

                  <span className="text-[9px] font-bold tracking-tight uppercase truncate max-w-full opacity-90">
                    {item.status === 'AVAILABLE'
                      ? 'DISP'
                      : item.status === 'RESERVED'
                      ? 'RESERV'
                      : item.status === 'SOLD_PAID'
                      ? 'PAGADO'
                      : 'PEND'}
                  </span>

                  {item.customer && (
                    <span className="text-[8px] font-medium truncate max-w-full opacity-75">
                      {item.customer.fullName.split(' ')[0]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {filteredNumbers.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">
              No se encontraron números con el filtro seleccionado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Trophy,
  Calendar,
  Gift,
  Clock,
  CheckCircle,
  Sparkles,
  Zap,
  Award,
  Edit2
} from 'lucide-react';
import Header from '@/components/Header';
import { RaffleDrawData } from '@/lib/types';
import confetti from 'canvas-confetti';

export default function DrawsPage() {
  const [draws, setDraws] = useState<RaffleDrawData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDrawId, setEditingDrawId] = useState<string | null>(null);
  const [winningInput, setWinningInput] = useState('');
  const [saving, setSaving] = useState(false);

  const loadDraws = async () => {
    try {
      const res = await fetch('/api/sorteos', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setDraws(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDraws();
  }, []);

  const handleSaveWinner = async (drawId: string) => {
    const val = winningInput.trim().padStart(2, '0');
    if (!val || isNaN(parseInt(val, 10))) {
      alert('Ingrese un número de 2 cifras válido (00-99)');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/sorteos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: drawId, winningNumber: val }),
      });
      if (res.ok) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
        setEditingDrawId(null);
        setWinningInput('');
        loadDraws();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Cabecera */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            <span>Sorteos Oficiales & Oportunidades de Ganar</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Cada cliente juega con el mismo número en los 4 sorteos oficiales de la Lotería Sinuano Noche.
          </p>
        </div>

        {/* Banner Promocional con Imagen */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 relative rounded-3xl overflow-hidden border border-red-900/40 shadow-2xl bg-black">
            <div className="relative aspect-[3/4] w-full">
              <Image
                src="/images/carton-promo.jpg"
                alt="Banner Promocional Rifa Navideña"
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {/* Lista de Sorteos */}
            {draws.map((draw) => (
              <div
                key={draw.id}
                className={`p-5 rounded-2xl border transition-all ${
                  draw.isMain
                    ? 'bg-gradient-to-r from-red-950/80 via-slate-900 to-amber-950/60 border-amber-500/50 shadow-xl ring-1 ring-amber-500/20'
                    : 'bg-slate-900/90 border-slate-800 shadow-lg'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {draw.isMain ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-sm">
                          GRAN SORTEO MAYOR
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/40">
                          OPORTUNIDAD ADICIONAL
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-semibold">
                        {draw.lottery}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-white tracking-tight">
                      {draw.title}
                    </h3>

                    <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-base sm:text-lg">
                      <Gift className="w-5 h-5 text-amber-400" />
                      <span>{draw.prize}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>
                        Fecha Oficial:{' '}
                        <strong>
                          {new Date(draw.drawDate).toLocaleDateString('es-CO', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Número Ganador y Registro */}
                  <div className="flex flex-col items-end justify-center min-w-[140px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Número Ganador
                    </span>

                    {editingDrawId === draw.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          maxLength={2}
                          value={winningInput}
                          onChange={(e) => setWinningInput(e.target.value)}
                          placeholder="00-99"
                          className="w-16 px-2 py-1 text-center font-mono font-bold text-lg rounded-lg bg-slate-950 border border-amber-500 text-white"
                        />
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleSaveWinner(draw.id)}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer"
                        >
                          Guardar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {draw.winningNumber ? (
                          <div className="flex items-center gap-2">
                            <span className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-mono text-2xl font-black shadow-lg">
                              #{draw.winningNumber}
                            </span>
                            <button
                              onClick={() => {
                                setEditingDrawId(draw.id);
                                setWinningInput(draw.winningNumber || '');
                              }}
                              className="p-1.5 text-slate-400 hover:text-white"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDrawId(draw.id);
                              setWinningInput('');
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                          >
                            Registrar Ganador
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

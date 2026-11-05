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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Cabecera */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight flex items-center gap-3">
            <Trophy className="w-7 h-7 text-zinc-400" />
            <span>Sorteos Oficiales & Premios</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Cada número juega simultáneamente en los 4 sorteos oficiales con la Lotería Sinuano Noche.
          </p>
        </div>

        {/* Banner Promocional con Imagen */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 relative rounded-2xl overflow-hidden border border-zinc-800 shadow-sm bg-zinc-900/50">
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
                    ? 'bg-zinc-900/80 border-zinc-700/80 shadow-md ring-1 ring-zinc-700/40'
                    : 'bg-zinc-900/40 border-zinc-800/80 shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      {draw.isMain ? (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-950 uppercase tracking-wider">
                          Gran Sorteo Mayor
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/60 uppercase tracking-wider">
                          Oportunidad Adicional
                        </span>
                      )}
                      <span className="text-xs text-zinc-400 font-medium">
                        {draw.lottery}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-zinc-100 tracking-tight">
                      {draw.title}
                    </h3>

                    <div className="flex items-center gap-2 text-zinc-200 font-semibold text-base sm:text-lg">
                      <Gift className="w-4 h-4 text-zinc-400" />
                      <span>{draw.prize}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <span>
                        Fecha Oficial:{' '}
                        <strong className="text-zinc-200 font-medium">
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
                  <div className="flex flex-col sm:items-end justify-center min-w-[140px]">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
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
                          className="w-16 px-2 py-1 text-center font-mono font-bold text-lg rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-zinc-500"
                        />
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleSaveWinner(draw.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-950 hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Guardar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {draw.winningNumber ? (
                          <div className="flex items-center gap-2">
                            <span className="px-3.5 py-1 rounded-xl bg-zinc-800 text-zinc-100 border border-zinc-700/80 font-mono text-xl font-bold shadow-sm">
                              #{draw.winningNumber}
                            </span>
                            <button
                              onClick={() => {
                                setEditingDrawId(draw.id);
                                setWinningInput(draw.winningNumber || '');
                              }}
                              className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                              title="Editar número ganador"
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
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors cursor-pointer"
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

'use client';

import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, Check, ArrowRight } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone PWA mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) {
      return; // Already running as installed app, no prompts needed
    }

    // 2. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    setIsIos(isIosDevice);

    // 3. Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('PWA Service Worker registered:', reg.scope);
          })
          .catch((err) => {
            console.warn('PWA Service Worker error:', err);
          });
      });
    }

    // 4. Android / Chromium install prompt listener
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Check if user dismissed banner recently
      const dismissed = sessionStorage.getItem('pwa_banner_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 5. On app installed event
    const handleAppInstalled = () => {
      setInstalledSuccess(true);
      setShowBanner(false);
      setDeferredPrompt(null);
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Custom trigger from Header or any button
    const handleCustomOpen = () => {
      if (isIosDevice) {
        setShowIosModal(true);
      } else {
        setShowBanner(true);
      }
    };
    window.addEventListener('open-pwa-install', handleCustomOpen);

    // For iOS, if not dismissed, show banner after brief delay
    if (isIosDevice) {
      const dismissed = sessionStorage.getItem('pwa_banner_dismissed');
      if (!dismissed) {
        const timer = setTimeout(() => setShowBanner(true), 2500);
        return () => {
          clearTimeout(timer);
          window.removeEventListener('open-pwa-install', handleCustomOpen);
        };
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('open-pwa-install', handleCustomOpen);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosModal(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback guide if browser does not support programmatic prompt
      setShowIosModal(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  // If already standalone, do not render anything
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Toast de instalación exitosa */}
      {installedSuccess && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-950 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>¡Aplicación instalada exitosamente en tu dispositivo!</span>
        </div>
      )}

      {/* Banner flotante discreto de instalación para móviles y escritorio */}
      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-zinc-900/95 border border-zinc-700/80 p-4 rounded-2xl shadow-2xl backdrop-blur-md animate-fade-in text-zinc-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-100 text-sm flex-shrink-0">
                SR
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-bold text-zinc-100 tracking-tight">
                  Instalar Super Rifa
                </h4>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  {isIos
                    ? 'Agrégala a tu pantalla de inicio de iPhone/iPad'
                    : 'Instala la aplicación en tu Android o PC para acceso rápido'}
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-zinc-800">
            <button
              onClick={handleInstallClick}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-950 hover:bg-white transition-colors cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar Aplicación</span>
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Ahora no
            </button>
          </div>
        </div>
      )}

      {/* Modal interactivo con instrucciones detalladas para iOS Safari */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-5 text-zinc-100 shadow-2xl relative">
            <button
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-100 text-base">
                SR
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  Instalar en iOS (iPhone / iPad)
                </h3>
                <p className="text-xs text-zinc-400">
                  Funciona como app nativa a pantalla completa
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-zinc-300 bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/80">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-200 font-bold flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-semibold text-zinc-100">
                    Toca el botón Compartir
                  </p>
                  <p className="text-zinc-400 text-[11px] mt-0.5 flex items-center gap-1.5">
                    Es el ícono <Share className="w-3.5 h-3.5 text-blue-400 inline" /> ubicado en la barra inferior de Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-200 font-bold flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-semibold text-zinc-100">
                    Selecciona &quot;Agregar al inicio&quot;
                  </p>
                  <p className="text-zinc-400 text-[11px] mt-0.5 flex items-center gap-1.5">
                    Desliza hacia abajo en el menú y presiona <PlusSquare className="w-3.5 h-3.5 text-zinc-300 inline" /> <strong>Agregar a pantalla de inicio</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-200 font-bold flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-semibold text-zinc-100">
                    Confirma tocando &quot;Agregar&quot;
                  </p>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    En la esquina superior derecha de la pantalla para crear el acceso directo de la app.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosModal(false)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-950 hover:bg-white transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}

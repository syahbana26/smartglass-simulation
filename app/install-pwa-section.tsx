"use client";

import React, { useState, useEffect } from 'react';
import { Download, CheckCircle2, X, Glasses, Info } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function InstallPWASection({ theme }: { theme: 'light' | 'dark' }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window.navigator as any).standalone === true
      );
    }
    return false;
  });
  const [installStatus, setInstallStatus] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Diagnostics states
  const [diag, setDiag] = useState({
    swSupported: false,
    swRegistered: false,
    swController: false,
    manifestStatus: 'checking',
    protocolOk: false,
    isStandalone: false,
    eventReceived: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const protocolOk = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const swSupported = 'serviceWorker' in navigator;

    // Check SW registration and controller
    if (swSupported) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        setDiag(prev => ({
          ...prev,
          swSupported: true,
          swRegistered: regs.length > 0,
          swController: Boolean(navigator.serviceWorker.controller),
          protocolOk,
          isStandalone,
        }));
      }).catch(() => {
        setDiag(prev => ({ ...prev, swSupported: true, protocolOk, isStandalone }));
      });
    }

    // Check manifest fetch
    fetch('/manifest.webmanifest')
      .then(res => {
        setDiag(prev => ({ ...prev, manifestStatus: res.ok ? `OK (${res.status})` : `Failed (${res.status})` }));
      })
      .catch(err => {
        setDiag(prev => ({ ...prev, manifestStatus: `Error: ${err.message}` }));
      });

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setDiag(prev => ({ ...prev, eventReceived: true }));
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setInstallStatus('Aplikasi berhasil dipasang.');
      setIsModalOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const dismissed = localStorage.getItem('smartglass_pwa_dismissed');
    if (!isInstalled && dismissed !== 'true') {
      const timer = setTimeout(() => {
        setIsModalOpen(true);
      }, 1200);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstallStatus('Pengguna menerima instalasi.');
      } else {
        setInstallStatus('Instalasi dibatalkan.');
      }
      setDeferredPrompt(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error during install prompt:', err);
    }
  };

  const handleDismissModal = () => {
    setIsModalOpen(false);
    try {
      localStorage.setItem('smartglass_pwa_dismissed', 'true');
    } catch {}
  };

  const t = theme === 'light' ? {
    surface: 'bg-[#FFFFFF]',
    surfaceSec: 'bg-[#EEF1F4]',
    border: 'border-[#DCE1E7]',
    textPrimary: 'text-[#202833]',
    textSec: 'text-[#667085]',
    primaryBtn: 'bg-[#34465A] hover:bg-[#29394A] text-white',
  } : {
    surface: 'bg-[#131B2E]',
    surfaceSec: 'bg-[#1A253D]',
    border: 'border-[#22304D]',
    textPrimary: 'text-[#F0F4F8]',
    textSec: 'text-[#94A3B8]',
    primaryBtn: 'bg-[#3B82F6] hover:bg-[#2563EB] text-white',
  };

  return (
    <>
      {/* SETTINGS SECTION UI */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-medium block">Instalasi Aplikasi (PWA)</label>
            <p className={`text-[11px] ${t.textSec} mt-0.5`}>
              Pasang SmartGlass V1 di perangkat Android Anda (Chrome / Edge) untuk akses cepat.
            </p>
          </div>
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className={`px-2 py-1 rounded text-[10px] ${t.surfaceSec} border ${t.border} ${t.textSec} hover:${t.textPrimary} flex items-center gap-1`}
          >
            <Info className="w-3 h-3" />
            {showDiagnostics ? 'Sembunyikan Diagnostik' : 'Cek Diagnostik PWA'}
          </button>
        </div>

        {showDiagnostics && (
          <div className={`p-3 rounded-xl ${t.surfaceSec} border ${t.border} text-[11px] space-y-1 font-mono`}>
            <div className="font-bold pb-1 border-b border-slate-300 dark:border-slate-700">Audit & Diagnostik PWA:</div>
            <div>- Protocol OK (HTTPS / Localhost): <strong className={diag.protocolOk ? 'text-emerald-500' : 'text-rose-500'}>{String(diag.protocolOk)}</strong></div>
            <div>- Service Worker Supported: <strong className={diag.swSupported ? 'text-emerald-500' : 'text-rose-500'}>{String(diag.swSupported)}</strong></div>
            <div>- Service Worker Registered: <strong className={diag.swRegistered ? 'text-emerald-500' : 'text-amber-500'}>{String(diag.swRegistered)}</strong></div>
            <div>- Service Worker Controller: <strong className={diag.swController ? 'text-emerald-500' : 'text-amber-500'}>{String(diag.swController)}</strong></div>
            <div>- Manifest Fetch Status: <strong className={diag.manifestStatus.includes('OK') ? 'text-emerald-500' : 'text-rose-500'}>{diag.manifestStatus}</strong></div>
            <div>- Standalone Mode Active: <strong className={diag.isStandalone ? 'text-emerald-500' : 'text-slate-400'}>{String(diag.isStandalone)}</strong></div>
            <div>- beforeinstallprompt Fired: <strong className={diag.eventReceived ? 'text-emerald-500' : 'text-amber-500'}>{String(diag.eventReceived)}</strong></div>
            <p className="text-[10px] text-slate-500 pt-1">
              Catatan: Chrome/Edge hanya mengirim `beforeinstallprompt` jika manifest valid, SW aktif, HTTPS/localhost, dan kriteria keterlibatan pengguna (engagement) terpenuhi.
            </p>
          </div>
        )}

        <div className={`p-4 rounded-xl ${t.surfaceSec} border ${t.border} space-y-3 text-xs`}>
          {isInstalled ? (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Aplikasi sudah terpasang (Mode Standalone).</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={t.textSec}>
                  Status: <strong className={t.textPrimary}>{deferredPrompt ? 'Siap Diinstal' : 'Menunggu Event Browser'}</strong>
                </span>
                {!isModalOpen && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className={`px-3 py-1.5 rounded-lg ${t.surface} border ${t.border} ${t.textPrimary} hover:opacity-80 transition-opacity font-medium flex items-center gap-1.5`}
                  >
                    Buka Popup Instalasi
                  </button>
                )}
              </div>

              {deferredPrompt ? (
                <button
                  onClick={handleInstallClick}
                  className={`w-full py-2.5 px-4 rounded-lg ${t.primaryBtn} font-medium text-xs flex items-center justify-center gap-2 transition-colors`}
                >
                  <Download className="w-4 h-4" />
                  Install SmartGlass
                </button>
              ) : (
                <div className={`w-full py-2 px-3 rounded-lg ${t.surface} border ${t.border} ${t.textSec} text-center text-[11px]`}>
                  Event instalasi belum tersedia dari browser. Tombol install akan aktif saat browser siap.
                </div>
              )}
            </div>
          )}

          {installStatus && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{installStatus}</p>
          )}
        </div>
      </div>

      {/* SLIDE-IN SIDE POPUP */}
      {isModalOpen && !isInstalled && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-sm w-full animate-in slide-in-from-right duration-300">
          <div className={`${t.surface} border ${t.border} rounded-2xl shadow-xl p-4 sm:p-5 space-y-4 text-xs`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${t.surfaceSec} border ${t.border} flex items-center justify-center shrink-0`}>
                  <Glasses className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Install SmartGlass</h3>
                  <p className={`text-[11px] ${t.textSec} mt-0.5`}>
                    Akses cepat & pengalaman aplikasi native (Android Chrome / Edge).
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismissModal}
                className={`w-7 h-7 rounded-lg ${t.surfaceSec} ${t.textSec} hover:${t.textPrimary} flex items-center justify-center transition-colors shrink-0`}
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!deferredPrompt && (
              <div className={`p-2.5 rounded-lg ${t.surfaceSec} border ${t.border} text-[11px] ${t.textSec}`}>
                Event instalasi belum tersedia dari browser. Tombol install akan aktif saat browser siap.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={handleDismissModal}
                className={`px-3.5 py-2 rounded-lg ${t.surfaceSec} border ${t.border} ${t.textSec} hover:${t.textPrimary} font-medium transition-colors`}
              >
                Not Now
              </button>
              <button
                onClick={handleInstallClick}
                disabled={!deferredPrompt}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  deferredPrompt ? t.primaryBtn : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                Install
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

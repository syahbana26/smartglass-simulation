"use client";

import React, { useState, useEffect } from 'react';
import { Download, CheckCircle2, Smartphone, Monitor, HelpCircle } from 'lucide-react';

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      const handleAppInstalled = () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setInstallStatus('Aplikasi berhasil dipasang!');
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

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
    } catch (err) {
      console.error('Error during install prompt:', err);
    }
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
    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-medium block">Instalasi Aplikasi (PWA)</label>
          <p className={`text-[11px] ${t.textSec} mt-0.5`}>
            Pasang SmartGlass V1 di perangkat Anda untuk akses cepat dan pengalaman seperti aplikasi native.
          </p>
        </div>
      </div>

      <div className={`p-4 rounded-xl ${t.surfaceSec} border ${t.border} space-y-3 text-xs`}>
        {isInstalled ? (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Aplikasi sudah terpasang (Mode Standalone).</span>
          </div>
        ) : deferredPrompt ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={t.textSec}>Status: <strong className={t.textPrimary}>Siap Diinstal</strong></span>
            </div>
            <button
              onClick={handleInstallClick}
              className={`w-full py-2.5 px-4 rounded-lg ${t.primaryBtn} font-medium text-xs flex items-center justify-center gap-2 transition-colors`}
            >
              <Download className="w-4 h-4" />
              Instal SmartGlass
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>Prompt instalasi otomatis tidak tersedia pada browser ini. Ikuti petunjuk manual di bawah.</span>
            </div>
          </div>
        )}

        {installStatus && (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{installStatus}</p>
        )}

        <div className={`pt-3 border-t ${t.border} space-y-2.5`}>
          <p className={`font-semibold ${t.textPrimary}`}>Petunjuk Instalasi Manual:</p>
          
          <div className="space-y-2 text-[11px]">
            <div className="flex items-start gap-2">
              <Smartphone className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <strong className={t.textPrimary}>Android (Chrome / Edge):</strong> Buka menu browser (ikon titik tiga di pojok kanan atas), lalu pilih <strong className={t.textPrimary}>&quot;Instal aplikasi&quot;</strong> atau <strong className={t.textPrimary}>&quot;Tambahkan ke layar utama&quot;</strong>.
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Smartphone className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
              <div>
                <strong className={t.textPrimary}>iPhone / iPad (Safari):</strong> Ketuk tombol <strong className={t.textPrimary}>Bagikan (Share)</strong> di bagian bawah layar, lalu gulir dan pilih <strong className={t.textPrimary}>&quot;Add to Home Screen&quot;</strong>.
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Monitor className="w-4 h-4 shrink-0 mt-0.5 text-purple-500" />
              <div>
                <strong className={t.textPrimary}>Desktop (Chrome / Edge):</strong> Klik ikon instalasi (<code className="bg-slate-800 text-slate-200 px-1 py-0.5 rounded">Install</code> / ikon komputer dengan panah) di sebelah kanan bilah alamat URL, atau buka menu browser dan pilih <strong className={t.textPrimary}>&quot;Install SmartGlass...&quot;</strong>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

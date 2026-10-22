"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Download, CheckCircle2, X, Glasses, Info, HelpCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Module-level global capture for early beforeinstallprompt events before React hydration
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
  });
}

export default function InstallPWASection({ theme }: { theme: 'light' | 'dark' }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => globalDeferredPrompt);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(globalDeferredPrompt);

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
  const [userChoiceResult, setUserChoiceResult] = useState<string>('belum ada');
  const [promptUsed, setPromptUsed] = useState<boolean>(false);
  const [eventReceived, setEventReceived] = useState<boolean>(Boolean(globalDeferredPrompt));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showManualGuidance, setShowManualGuidance] = useState(false);

  // Diagnostics states
  const [diag, setDiag] = useState({
    swSupported: false,
    swRegistered: false,
    swController: false,
    manifestStatus: 'checking',
    protocolOk: false,
    isStandalone: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const protocolOk = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const swSupported = 'serviceWorker' in navigator;

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

    fetch('/manifest.webmanifest')
      .then(res => {
        setDiag(prev => ({ ...prev, manifestStatus: res.ok ? `OK (${res.status})` : `Failed (${res.status})` }));
      })
      .catch(err => {
        setDiag(prev => ({ ...prev, manifestStatus: `Error: ${err.message}` }));
      });

    // Sync global prompt if caught early
    if (globalDeferredPrompt && !deferredPromptRef.current) {
      deferredPromptRef.current = globalDeferredPrompt;
      setDeferredPrompt(globalDeferredPrompt);
      setEventReceived(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      globalDeferredPrompt = promptEvent;
      deferredPromptRef.current = promptEvent;
      setDeferredPrompt(promptEvent);
      setEventReceived(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      globalDeferredPrompt = null;
      deferredPromptRef.current = null;
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
    const currentPrompt = deferredPromptRef.current || globalDeferredPrompt;
    if (currentPrompt) {
      try {
        await currentPrompt.prompt();
        const choiceResult = await currentPrompt.userChoice;
        setUserChoiceResult(choiceResult.outcome);
        if (choiceResult.outcome === 'accepted') {
          setInstallStatus('Pengguna menerima instalasi.');
        } else {
          setInstallStatus('Instalasi dibatalkan oleh pengguna.');
        }
        setPromptUsed(true);
        globalDeferredPrompt = null;
        deferredPromptRef.current = null;
        setDeferredPrompt(null);
        setIsModalOpen(false);
      } catch (err) {
        console.error('Error during install prompt:', err);
        setShowManualGuidance(true);
      }
    } else {
      // Browser has not fired beforeinstallprompt event yet.
      // Technical limitation: web apps cannot programmatically invoke native install dialog without this event.
      setShowManualGuidance(true);
    }
  };

  const handleDismissModal = () => {
    setIsModalOpen(false);
    setShowManualGuidance(false);
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
            <label className="text-xs font-medium block">Instal App</label>
          </div>
        </div>

        <div className={`p-4 rounded-xl ${t.surfaceSec} border ${t.border} space-y-3 text-xs`}>
          {isInstalled ? (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Aplikasi sudah terpasang (Mode Standalone).</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
              </div>

              <button
                onClick={handleInstallClick}
                className={`w-full py-2.5 px-4 rounded-lg ${t.primaryBtn} font-medium text-xs flex items-center justify-center gap-2 transition-colors`}
              >
                <Download className="w-4 h-4" />
                {deferredPrompt ? 'Install SmartGlass' : 'Install Manual'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

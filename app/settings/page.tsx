"use client";

import React, { useState } from 'react';
import {
  Glasses,
  LayoutDashboard,
  User,
  Settings,
  Volume2,
  VolumeX,
  Sun,
  Moon
} from 'lucide-react';
import Link from 'next/link';
import InstallPWASection from '../install-pwa-section';

export default function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('smartglass_theme');
        if (saved === 'dark' || saved === 'light') return saved;
      } catch {}
    }
    return 'light';
  });

  const [volume, setVolume] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('smartglass_volume');
        if (saved !== null) return Number(saved);
      } catch {}
    }
    return 60;
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('smartglass_muted');
        if (saved !== null) return saved === 'true';
      } catch {}
    }
    return false;
  });

  const [previousVolume, setPreviousVolume] = useState<number>(60);
  const [textSize, setTextSize] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('smartglass_text_size');
        if (saved !== null) return Number(saved);
      } catch {}
    }
    return 18;
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    try {
      localStorage.setItem('smartglass_theme', nextTheme);
    } catch {}
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
    }
    try {
      localStorage.setItem('smartglass_volume', String(newVol));
      localStorage.setItem('smartglass_muted', String(newVol === 0));
    } catch {}
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      const restore = previousVolume > 0 ? previousVolume : 60;
      setVolume(restore);
      try {
        localStorage.setItem('smartglass_muted', 'false');
        localStorage.setItem('smartglass_volume', String(restore));
      } catch {}
    } else {
      setPreviousVolume(volume);
      setIsMuted(true);
      setVolume(0);
      try {
        localStorage.setItem('smartglass_muted', 'true');
        localStorage.setItem('smartglass_volume', '0');
      } catch {}
    }
  };

  const handleTextSizeChange = (size: number) => {
    setTextSize(size);
    try {
      localStorage.setItem('smartglass_text_size', String(size));
    } catch {}
  };

  const t = theme === 'light' ? {
    bg: 'bg-[#F5F6F7]',
    surface: 'bg-[#FFFFFF]',
    surfaceSec: 'bg-[#EEF1F4]',
    border: 'border-[#DCE1E7]',
    textPrimary: 'text-[#202833]',
    textSec: 'text-[#667085]',
    primaryBtn: 'bg-[#34465A] hover:bg-[#29394A] text-white',
  } : {
    bg: 'bg-[#0B0F17]',
    surface: 'bg-[#131B2E]',
    surfaceSec: 'bg-[#1A253D]',
    border: 'border-[#22304D]',
    textPrimary: 'text-[#F0F4F8]',
    textSec: 'text-[#94A3B8]',
    primaryBtn: 'bg-[#3B82F6] hover:bg-[#2563EB] text-white',
  };

  return (
    <div className={`min-h-screen ${t.bg} ${t.textPrimary} flex flex-col font-sans transition-colors duration-200`}>
      {/* TOP NAVBAR */}
      <header className={`${t.surface} border-b ${t.border} px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${t.surfaceSec} border ${t.border} flex items-center justify-center`}>
            <Glasses className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight">SmartGlass V1</h1>
            <p className={`text-[11px] ${t.textSec}`}>AI Assistive Glasses Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg ${t.surfaceSec} border ${t.border} ${t.textSec} hover:${t.textPrimary} transition-colors`}
            title="Ganti Tema"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24 md:pb-6 gap-6">
        {/* SIDEBAR NAVIGATION (DESKTOP) */}
        <aside className="hidden md:block w-64 shrink-0 space-y-2">
          <div className={`${t.surface} border ${t.border} rounded-xl p-2 space-y-1 shadow-sm`}>
            <Link
              href="/dashboard"
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${t.textSec} hover:${t.textPrimary} hover:${t.surfaceSec}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/profiles"
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${t.textSec} hover:${t.textPrimary} hover:${t.surfaceSec}`}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </Link>
            <Link
              href="/settings"
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${t.surfaceSec} ${t.textPrimary} font-semibold`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
          </div>
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-1 space-y-6">
          <div className="space-y-6">
            <div className={`${t.surface} border ${t.border} rounded-xl p-6 space-y-6 shadow-sm`}>
              <div className="space-y-6 pt-2">
                {/* A. SPEAKER VOLUME */}
                <div className={`space-y-3 pb-6 border-b ${t.border}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-medium block">Volume Speaker</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium">{isMuted ? '0%' : `${volume}%`}</span>
                      <button
                        onClick={toggleMute}
                        className={`p-1.5 rounded-lg ${t.surfaceSec} border ${t.border} hover:opacity-80 transition-opacity`}
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      className="flex-1 accent-slate-600 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* B. TEXT SIZE FOR DISPLAY */}
                <div className="space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
                  <label className="text-xs font-medium block">Ukuran Teks Display Kacamata</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Kecil (14px)', size: 14 },
                      { label: 'Sedang (18px)', size: 18 },
                      { label: 'Besar (24px)', size: 24 }
                    ].map((item) => (
                      <button
                        key={item.size}
                        onClick={() => handleTextSizeChange(item.size)}
                        className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                          textSize === item.size
                            ? `${t.surfaceSec} border-slate-500 ${t.textPrimary}`
                            : `${t.surface} ${t.border} ${t.textSec} hover:opacity-80`
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* C. PWA INSTALLATION SECTION */}
                <InstallPWASection theme={theme} />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 ${t.surface} border-t ${t.border} px-4 py-2 flex items-center justify-around shadow-lg`}>
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[11px] font-medium transition-colors ${t.textSec} hover:${t.textPrimary}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/profiles"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[11px] font-medium transition-colors ${t.textSec} hover:${t.textPrimary}`}
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </Link>
        <Link
          href="/settings"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[11px] font-medium transition-colors ${t.textPrimary} font-semibold`}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  );
}

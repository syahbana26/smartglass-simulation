"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Glasses,
  LayoutDashboard,
  User,
  Settings,
  Eye,
  Ear,
  MessageSquare,
  Battery,
  Wifi,
  Play,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  X,
  Send
} from 'lucide-react';
import InstallPWASection from '../install-pwa-section';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'settings'>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('smartglass_theme');
        if (saved === 'dark' || saved === 'light') return saved;
      } catch {}
    }
    return 'light';
  });
  
  // Settings states (persisted in localStorage)
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

  // Simulation modal states
  const [simulationModalOpen, setSimulationModalOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'tunanetra' | 'tunarungu' | 'tunawicara' | null>(null);

  // Tunanetra simulation state
  const [objects] = useState([
    { name: 'Kursi Kerja', distance: '1.2 m', status: 'Aman', speech: 'Kursi terdeteksi di depan pada jarak 1.2 meter, status aman.' },
    { name: 'Pintu Keluar', distance: '3.5 m', status: 'Jalur Lurus', speech: 'Pintu keluar terdeteksi pada jarak 3.5 meter, jalur lurus.' },
    { name: 'Meja Resepsionis', distance: '2.0 m', status: 'Waspada', speech: 'Meja resepsionis terdeteksi di depan, harap waspada.' }
  ]);
  const [ocrMessage] = useState('Perhatian: Tangga Darurat di sebelah kanan. Jaga jarak 1.5 meter.');

  // Tunarungu simulation state & real Speech Recognition
  const [transcripts, setTranscripts] = useState([
    { sender: 'Lawan Bicara', text: 'Selamat pagi, Pak. Ada yang bisa kami bantu?', time: '09:41' },
    { sender: 'AI Assistant', text: '[Menerjemahkan suara ke teks]', time: '09:41' },
    { sender: 'Lawan Bicara', text: 'Nomor antrean 42 silakan menuju ke loket 3.', time: '09:42' }
  ]);
  const [inputTranscript, setInputTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Tunawicara simulation state
  const [selectedPhrase, setSelectedPhrase] = useState('Tolong tunjukkan arah keluar.');
  const [customInputText, setCustomInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const quickPhrases = [
    'Tolong tunjukkan arah keluar.',
    'Berapa harga barang ini?',
    'Saya butuh bantuan medis.',
    'Terima kasih banyak atas bantuannya.',
    'Di mana toilet terdekat?'
  ];

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText('');
  };

  // Cleanup speech synthesis and recognition on unmount
  useEffect(() => {
    return () => {
      stopListening();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Save theme
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    try {
      localStorage.setItem('smartglass_theme', nextTheme);
    } catch {}
  };

  // Save volume
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

  // Save text size
  const handleTextSizeChange = (size: number) => {
    setTextSize(size);
    try {
      localStorage.setItem('smartglass_text_size', String(size));
    } catch {}
  };

  // TTS helper for Web Speech API
  const handleSpeak = (text: string) => {
    if (!text.trim()) return;
    setSelectedPhrase(text);
    
    if (isMuted || volume === 0) {
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 1000);
      return;
    }
    
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      utterance.volume = volume / 100;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 2000);
    }
  };

  const openSimulation = (mode: 'tunanetra' | 'tunarungu' | 'tunawicara') => {
    setSelectedMode(mode);
    setSimulationModalOpen(true);
  };

  const closeSimulation = () => {
    stopListening();
    setSimulationModalOpen(false);
  };

  const startListening = () => {
    setSpeechError(null);
    if (typeof window === 'undefined') return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setSpeechError('Browser Anda tidak mendukung Speech Recognition. Silakan gunakan Google Chrome atau Microsoft Edge.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'id-ID';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (final.trim()) {
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setTranscripts(prev => [...prev, { sender: 'Lawan Bicara (Mic)', text: final.trim(), time: timeStr }]);
          setInterimText('');
        } else {
          setInterimText(interim);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Akses mikrofon ditolak. Mohon izinkan akses mikrofon pada browser Anda.');
        } else if (event.error === 'no-speech') {
          // ignore minor no-speech timeout
        } else {
          setSpeechError(`Terjadi kesalahan pada mikrofon/STT: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setSpeechError('Gagal memulai pengenalan suara.');
      setIsListening(false);
    }
  };

  // Theme-based class definitions
  const t = theme === 'light' ? {
    bg: 'bg-[#F5F6F7]',
    surface: 'bg-[#FFFFFF]',
    surfaceSec: 'bg-[#EEF1F4]',
    border: 'border-[#DCE1E7]',
    textPrimary: 'text-[#202833]',
    textSec: 'text-[#667085]',
    primaryBtn: 'bg-[#34465A] hover:bg-[#29394A] text-white',
    accentSubtle: 'bg-[#E4EAF0]',
    cardHover: 'hover:border-[#94A3B8]',
    modalBg: 'bg-[#FFFFFF]',
    modalBorder: 'border-[#DCE1E7]',
    inputBg: 'bg-[#F5F6F7]',
  } : {
    bg: 'bg-[#0B0F17]',
    surface: 'bg-[#131B2E]',
    surfaceSec: 'bg-[#1A253D]',
    border: 'border-[#22304D]',
    textPrimary: 'text-[#F0F4F8]',
    textSec: 'text-[#94A3B8]',
    primaryBtn: 'bg-[#3B82F6] hover:bg-[#2563EB] text-white',
    accentSubtle: 'bg-[#1E293B]',
    cardHover: 'hover:border-[#475569]',
    modalBg: 'bg-[#131B2E]',
    modalBorder: 'border-[#22304D]',
    inputBg: 'bg-[#0B0F17]',
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
            <h1 className="font-bold text-sm tracking-tight">SmartGlass</h1>
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
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'dashboard' ? `${t.surfaceSec} ${t.textPrimary} font-semibold` : `${t.textSec} hover:${t.textPrimary} hover:${t.surfaceSec}`
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Utama</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'profile' ? `${t.surfaceSec} ${t.textPrimary} font-semibold` : `${t.textSec} hover:${t.textPrimary} hover:${t.surfaceSec}`
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profil Pengguna</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'settings' ? `${t.surfaceSec} ${t.textPrimary} font-semibold` : `${t.textSec} hover:${t.textPrimary} hover:${t.surfaceSec}`
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Pengaturan Perangkat</span>
            </button>
          </div>

          {/* HARDWARE STATUS CARD */}
          <div className={`${t.surface} border ${t.border} rounded-xl p-4 space-y-3 shadow-sm`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${t.textSec}`}>Hardware</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className={t.textSec}>ESP32-S3 Cam</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Online</span>
              </div>
              <div className="flex justify-between">
                <span className={t.textSec}>Mic Array</span>
                <span className="font-medium">Active (id-ID)</span>
              </div>
              <div className="flex justify-between">
                <span className={t.textSec}>Speaker Haptic</span>
                <span className="font-medium">{isMuted ? 'Muted' : `${volume}%`}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-1 space-y-6">
          {activeTab === 'dashboard' && (
            <>
              {/* DEVICE STATUS BAR */}
              <div className={`${t.surface} border ${t.border} rounded-xl p-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-4 text-xs shadow-sm`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span className={t.textSec}>Status: <strong className={`${t.textPrimary} font-medium`}>Simulasi Aktif</strong></span>
                </div>
                <div className={`flex items-center gap-6 ${t.textSec}`}>
                  <div className="flex items-center gap-1.5">
                    <Battery className="w-4 h-4" />
                    <span>Baterai: <strong className={`${t.textPrimary} font-medium`}>85%</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wifi className="w-4 h-4" />
                    <span>Koneksi: <strong className={`${t.textPrimary} font-medium`}>BLE</strong></span>
                  </div>
                </div>
              </div>

              {/* ASSISTANCE MODES */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider ${t.textSec}`}>Pilih Mode Bantuan</h3>
                  <span className={`text-[11px] ${t.textSec}`}>3 Mode Utama</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* TUNANETRA */}
                  <div className={`${t.surface} border ${t.border} ${t.cardHover} rounded-xl p-5 flex flex-col justify-between transition-all shadow-sm`}>
                    <div>
                      <div className={`w-9 h-9 rounded-lg ${t.surfaceSec} flex items-center justify-center ${t.textPrimary} mb-4`}>
                        <Eye className="w-4 h-4" />
                      </div>
                      <h4 className="font-semibold text-sm mb-1.5">Tunanetra</h4>
                      <p className={`text-xs ${t.textSec} mb-6 leading-relaxed`}>
                        Deteksi objek sekitar, pembacaan teks OCR, dan navigasi audio.
                      </p>
                    </div>
                    <button
                      onClick={() => openSimulation('tunanetra')}
                      className={`w-full py-2.5 px-3 rounded-lg ${t.primaryBtn} font-medium text-xs flex items-center justify-center gap-1.5 transition-colors`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Mulai Simulasi
                    </button>
                  </div>

                  {/* TUNARUNGU */}
                  <div className={`${t.surface} border ${t.border} ${t.cardHover} rounded-xl p-5 flex flex-col justify-between transition-all shadow-sm`}>
                    <div>
                      <div className={`w-9 h-9 rounded-lg ${t.surfaceSec} flex items-center justify-center ${t.textPrimary} mb-4`}>
                        <Ear className="w-4 h-4" />
                      </div>
                      <h4 className="font-semibold text-sm mb-1.5">Tunarungu</h4>
                      <p className={`text-xs ${t.textSec} mb-6 leading-relaxed`}>
                        Transkripsi suara ke teks langsung pada tampilan visual kacamata.
                      </p>
                    </div>
                    <button
                      onClick={() => openSimulation('tunarungu')}
                      className={`w-full py-2.5 px-3 rounded-lg ${t.primaryBtn} font-medium text-xs flex items-center justify-center gap-1.5 transition-colors`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Mulai Simulasi
                    </button>
                  </div>

                  {/* TUNAWICARA */}
                  <div className={`${t.surface} border ${t.border} ${t.cardHover} rounded-xl p-5 flex flex-col justify-between transition-all shadow-sm`}>
                    <div>
                      <div className={`w-9 h-9 rounded-lg ${t.surfaceSec} flex items-center justify-center ${t.textPrimary} mb-4`}>
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <h4 className="font-semibold text-sm mb-1.5">Tunawicara</h4>
                      <p className={`text-xs ${t.textSec} mb-6 leading-relaxed`}>
                        Pilihan kalimat cepat dan simulasi Text-to-Speech komunikasi.
                      </p>
                    </div>
                    <button
                      onClick={() => openSimulation('tunawicara')}
                      className={`w-full py-2.5 px-3 rounded-lg ${t.primaryBtn} font-medium text-xs flex items-center justify-center gap-1.5 transition-colors`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Mulai Simulasi
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'profile' && (
            <div className={`${t.surface} border ${t.border} rounded-xl p-6 space-y-5 shadow-sm`}>
              <div className={`flex items-center gap-4 pb-4 border-b ${t.border}`}>
                <div className={`w-12 h-12 rounded-lg ${t.surfaceSec} border ${t.border} flex items-center justify-center font-semibold text-base`}>
                  SG
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Profil Pengguna (Demo)</h3>
                  <p className={`text-xs ${t.textSec}`}>ID Perangkat: SG-V1-2026-DEMO</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className={`flex justify-between py-2.5 border-b ${t.border}`}>
                  <span className={t.textSec}>Nama Pengguna</span>
                  <span className="font-medium">Ahmad Fauzi</span>
                </div>
                <div className={`flex justify-between py-2.5 border-b ${t.border}`}>
                  <span className={t.textSec}>Perangkat Terhubung</span>
                  <span className="font-medium">SmartGlass V1 (ESP32-S3 Simulator)</span>
                </div>
                <div className={`flex justify-between py-2.5`}>
                  <span className={t.textSec}>Kontak Darurat</span>
                  <span className="font-medium">+62 812-3456-7890</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* SETTINGS SECTION: DEVICE OUTPUT */}
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
                  <div className="space-y-3">
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
          )}
        </main>
      </div>

      {/* SIMULATION MODAL */}
      {simulationModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${t.modalBg} border ${t.modalBorder} w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150`}>
            <div className={`px-5 py-4 border-b ${t.modalBorder} flex items-center justify-between ${t.surfaceSec}`}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <h3 className="font-semibold text-xs tracking-wider uppercase">
                  Simulasi Mode {selectedMode}
                </h3>
              </div>
              <button
                onClick={closeSimulation}
                className={`w-7 h-7 rounded-lg ${t.inputBg} ${t.textSec} hover:${t.textPrimary} flex items-center justify-center transition-colors`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {selectedMode === 'tunanetra' && (
                <div className="space-y-4">
                  <div className={`p-3.5 rounded-xl ${t.surfaceSec} border ${t.border} space-y-2.5`}>
                    <p className={`font-medium ${t.textSec}`}>Deteksi Objek & Halangan (Klik untuk Membaca Suara):</p>
                    <div className="space-y-2">
                      {objects.map((obj, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSpeak(obj.speech)}
                          className={`flex items-center justify-between p-2.5 rounded-lg ${t.surface} border ${t.border} cursor-pointer hover:border-slate-400 transition-all`}
                          title="Klik untuk membacakan pesan"
                        >
                          <div className="flex items-center gap-2">
                            <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-medium">{obj.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={t.textSec}>{obj.distance}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              {obj.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl ${t.surfaceSec} border ${t.border} space-y-2`}>
                    <p className={`font-medium ${t.textSec}`}>Pembacaan Teks OCR (Klik untuk Membaca):</p>
                    <div
                      onClick={() => handleSpeak(ocrMessage)}
                      className={`p-3 rounded-lg ${t.surface} border ${t.border} font-mono text-[11px] cursor-pointer hover:border-slate-400 transition-all flex items-start gap-2.5`}
                      title="Klik untuk membacakan OCR"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>&ldquo;{ocrMessage}&rdquo;</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedMode === 'tunarungu' && (
                <div className="space-y-4">
                  {speechError && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                      {speechError}
                    </div>
                  )}

                  <div className={`p-3 rounded-xl ${t.surfaceSec} border ${t.border} h-48 overflow-y-auto space-y-2`}>
                    {transcripts.map((tItem, idx) => (
                      <div key={idx} className={`p-2.5 rounded-lg ${t.surface} border ${t.border}`}>
                        <div className="flex justify-between text-[10px] opacity-60 mb-1">
                          <span>{tItem.sender}</span>
                          <span>{tItem.time}</span>
                        </div>
                        <p>{tItem.text}</p>
                      </div>
                    ))}
                    {interimText && (
                      <div className={`p-2.5 rounded-lg ${t.surface} border ${t.border} opacity-75`}>
                        <div className="flex justify-between text-[10px] opacity-60 mb-1">
                          <span>Mendengarkan (Sementara)...</span>
                          <span>Baru saja</span>
                        </div>
                        <p className="italic">{interimText}</p>
                      </div>
                    )}
                  </div>

                  {/* Real Microphone Listening Controls */}
                  <div className="flex items-center gap-2">
                    {!isListening ? (
                      <button
                        onClick={startListening}
                        className={`flex-1 py-2.5 px-4 rounded-lg ${t.primaryBtn} font-medium text-xs flex items-center justify-center gap-2 transition-colors`}
                      >
                        <Ear className="w-4 h-4" />
                        Mulai Mendengarkan (Mic)
                      </button>
                    ) : (
                      <button
                        onClick={stopListening}
                        className="flex-1 py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                      >
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                        Berhenti Mendengarkan
                      </button>
                    )}
                  </div>

                  {/* Simulation Input Backup */}
                  <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="Simulasikan suara masuk..."
                      value={inputTranscript}
                      onChange={(e) => setInputTranscript(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && inputTranscript.trim()) {
                          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          setTranscripts([...transcripts, { sender: 'Lawan Bicara (Simulasi)', text: inputTranscript, time: timeStr }]);
                          setInputTranscript('');
                        }
                      }}
                      className={`flex-1 ${t.inputBg} border ${t.border} rounded-lg px-3 py-2 focus:outline-none focus:border-slate-500`}
                    />
                    <button
                      onClick={() => {
                        if (!inputTranscript.trim()) return;
                        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        setTranscripts([...transcripts, { sender: 'Lawan Bicara (Simulasi)', text: inputTranscript, time: timeStr }]);
                        setInputTranscript('');
                      }}
                      className={`px-4 py-2 rounded-lg ${t.surface} border ${t.border} ${t.textPrimary} font-medium transition-colors`}
                    >
                      Kirim
                    </button>
                  </div>
                </div>
              )}

              {selectedMode === 'tunawicara' && (
                <div className="space-y-4">
                  <div className={`p-3.5 rounded-xl ${t.surfaceSec} border ${t.border} space-y-2`}>
                    <p className={`font-medium ${t.textSec}`}>Pilih Kalimat Cepat:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {quickPhrases.map((phrase, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSpeak(phrase)}
                          className={`text-left p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                            selectedPhrase === phrase
                              ? `${t.accentSubtle} border-slate-500 font-medium`
                              : `${t.surface} ${t.border} hover:opacity-80`
                          }`}
                        >
                          <span>{phrase}</span>
                          <Volume2 className="w-3.5 h-3.5 opacity-60" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Input for Tunawicara */}
                  <div className={`p-3.5 rounded-xl ${t.surfaceSec} border ${t.border} space-y-2`}>
                    <p className={`font-medium ${t.textSec}`}>Ketik Pesan Kustom:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ketik pesan komunikasi..."
                        value={customInputText}
                        onChange={(e) => setCustomInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customInputText.trim()) {
                            handleSpeak(customInputText);
                            setCustomInputText('');
                          }
                        }}
                        className={`flex-1 ${t.inputBg} border ${t.border} rounded-lg px-3 py-2 focus:outline-none focus:border-slate-500`}
                      />
                      <button
                        onClick={() => {
                          if (!customInputText.trim()) return;
                          handleSpeak(customInputText);
                          setCustomInputText('');
                        }}
                        className={`px-4 py-2 rounded-lg ${t.primaryBtn} font-medium transition-colors flex items-center gap-1.5`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Ucapkan
                      </button>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl ${t.surfaceSec} border ${t.border} space-y-2`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${t.textSec}`}>Preview Teks Display (Ukuran: {textSize}px):</span>
                      {isSpeaking && <span className="text-emerald-600 dark:text-emerald-400 font-medium">Memutar Suara...</span>}
                    </div>
                    <div className={`p-4 rounded-lg bg-[#111418] border border-slate-700 font-medium flex items-center justify-between shadow-inner`}>
                      <span style={{ fontSize: `${textSize}px`, lineHeight: 1.3 }} className="text-emerald-400 font-mono tracking-wide">
                        &ldquo;{selectedPhrase}&rdquo;
                      </span>
                      <button
                        onClick={() => handleSpeak(selectedPhrase)}
                        className="p-2 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 shrink-0 ml-3"
                        title="Putar Suara"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`px-5 py-3 border-t ${t.modalBorder} flex justify-between items-center ${t.surfaceSec}`}>
              <span className={`text-[11px] ${t.textSec}`}>
                {isListening ? 'Status: Mendengarkan suara (Mic)...' : isSpeaking ? 'Status: Memutar suara TTS...' : 'Status: Siap'}
              </span>
              <button
                onClick={closeSimulation}
                className={`px-4 py-2 rounded-lg ${t.surface} border ${t.border} font-medium hover:opacity-80 transition-opacity`}
              >
                Tutup Simulasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 ${t.surface} border-t ${t.border} px-4 py-2 flex items-center justify-around shadow-lg`}>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[11px] font-medium transition-colors ${
            activeTab === 'dashboard' ? `${t.textPrimary} font-semibold` : `${t.textSec} hover:${t.textPrimary}`
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[11px] font-medium transition-colors ${
            activeTab === 'profile' ? `${t.textPrimary} font-semibold` : `${t.textSec} hover:${t.textPrimary}`
          }`}
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[11px] font-medium transition-colors ${
            activeTab === 'settings' ? `${t.textPrimary} font-semibold` : `${t.textSec} hover:${t.textPrimary}`
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
}

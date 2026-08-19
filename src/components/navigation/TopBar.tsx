import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Radio, 
  Navigation, 
  Hospital as HospIcon, 
  LayoutGrid, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Globe
} from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';
import type { PortalView } from '../../types';
import { SdgImpactModal } from '../pitch/SdgImpactModal';

export const TopBar: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    isMuted, 
    toggleMute, 
    resetToInitialDemo 
  } = useEmergency();

  const [isSdgModalOpen, setIsSdgModalOpen] = useState<boolean>(false);

  const VIEWS: { id: PortalView; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'pitch_grid', label: '4-in-1 Pitch Grid', icon: <LayoutGrid className="w-3.5 h-3.5" />, badge: 'JUDGE VIEW' },
    { id: 'public', label: '1. Citizen SOS', icon: <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> },
    { id: 'dispatch', label: '2. Dispatch Center', icon: <Radio className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'responder', label: '3. Field Responder', icon: <Navigation className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'hospital', label: '4. Hospital ER Board', icon: <HospIcon className="w-3.5 h-3.5 text-emerald-400" /> },
  ];

  return (
    <>
      <header className="bg-[#070B14] border-b border-slate-800/90 px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 z-40">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-red-950/60 font-black text-base border border-red-400/40">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-base font-black tracking-tight text-white font-display">ResQNet</span>
                <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                  SDG 3 & 11
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Centralized Emergency Response Network</div>
            </div>
          </div>
        </div>

        {/* Center: Portal Selector Switcher Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner overflow-x-auto max-w-full">
          {VIEWS.map((tab) => {
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-md border border-slate-700 font-black'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[9px] font-black bg-amber-500 text-black px-1.5 py-0.2 rounded uppercase ml-1">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Sound FX, SDG Info, Reset */}
        <div className="flex items-center gap-2">
          
          {/* SDG Info Button */}
          <button
            onClick={() => setIsSdgModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 hover:text-white hover:bg-emerald-900/60 text-xs font-bold transition-colors cursor-pointer"
            title="View SDG 3 & 11 Impact Brief"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">SDG Impact</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={toggleMute}
            className={`p-2 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
              isMuted
                ? 'bg-slate-800/60 border-slate-700 text-slate-500'
                : 'bg-blue-950/60 border-blue-800/60 text-cyan-300 hover:bg-blue-900/60'
            }`}
            title={isMuted ? 'Unmute Audio Siren & Chimes' : 'Mute Sound Effects'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Reset Demo Button */}
          <button
            onClick={resetToInitialDemo}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            title="Reset Simulation to Initial State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

        </div>

      </header>

      {/* SDG Impact Brief Modal */}
      <SdgImpactModal isOpen={isSdgModalOpen} onClose={() => setIsSdgModalOpen(false)} />
    </>
  );
};

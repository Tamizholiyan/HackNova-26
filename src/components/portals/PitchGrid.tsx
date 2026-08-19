import React from 'react';
import { PublicPortal } from './PublicPortal';
import { DispatchCenter } from './DispatchCenter';
import { ResponderPortal } from './ResponderPortal';
import { HospitalBoard } from './HospitalBoard';
import { ShieldAlert, Radio, Navigation, Hospital as HospIcon, Maximize2 } from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';

export const PitchGrid: React.FC = () => {
  const { setCurrentView } = useEmergency();

  return (
    <div className="w-full h-full p-2 sm:p-3 bg-[#03060B] grid grid-cols-1 lg:grid-cols-2 grid-rows-2 gap-2 sm:gap-3 overflow-hidden">
      
      {/* Quadrant 1: Public Citizen Portal */}
      <div className="bg-[#0B0F19] rounded-2xl border border-slate-800 shadow-xl flex flex-col overflow-hidden relative group">
        {/* Quadrant Header */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              1. Public Portal (Zero-Login Citizen SOS)
            </span>
          </div>
          <button
            onClick={() => setCurrentView('public')}
            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-mono uppercase bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Maximize</span>
          </button>
        </div>

        {/* Viewport Content */}
        <div className="flex-1 overflow-hidden relative">
          <PublicPortal isEmbedded={true} />
        </div>
      </div>

      {/* Quadrant 2: Dispatch Command Center */}
      <div className="bg-[#0B0F19] rounded-2xl border border-slate-800 shadow-xl flex flex-col overflow-hidden relative group">
        {/* Quadrant Header */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <Radio className="w-3.5 h-3.5" />
              2. Dispatch Command Center (Admin View)
            </span>
          </div>
          <button
            onClick={() => setCurrentView('dispatch')}
            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-mono uppercase bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Maximize</span>
          </button>
        </div>

        {/* Viewport Content */}
        <div className="flex-1 overflow-hidden relative">
          <DispatchCenter isEmbedded={true} />
        </div>
      </div>

      {/* Quadrant 3: Field Responder MDT */}
      <div className="bg-[#0B0F19] rounded-2xl border border-slate-800 shadow-xl flex flex-col overflow-hidden relative group">
        {/* Quadrant Header */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5" />
              3. Field Responder Cockpit (Ambulance Alpha-1)
            </span>
          </div>
          <button
            onClick={() => setCurrentView('responder')}
            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-mono uppercase bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Maximize</span>
          </button>
        </div>

        {/* Viewport Content */}
        <div className="flex-1 overflow-hidden relative">
          <ResponderPortal isEmbedded={true} />
        </div>
      </div>

      {/* Quadrant 4: Hospital Operations Board */}
      <div className="bg-[#0B0F19] rounded-2xl border border-slate-800 shadow-xl flex flex-col overflow-hidden relative group">
        {/* Quadrant Header */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <HospIcon className="w-3.5 h-3.5" />
              4. Hospital ER Operations Board (Apollo Main)
            </span>
          </div>
          <button
            onClick={() => setCurrentView('hospital')}
            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-mono uppercase bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Maximize</span>
          </button>
        </div>

        {/* Viewport Content */}
        <div className="flex-1 overflow-hidden relative">
          <HospitalBoard isEmbedded={true} />
        </div>
      </div>

    </div>
  );
};

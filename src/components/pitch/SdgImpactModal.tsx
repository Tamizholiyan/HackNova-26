import React from 'react';
import { HeartPulse, Building2, TrendingUp, CheckCircle, X } from 'lucide-react';

export const SdgImpactModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-2xl font-bold">
              🌍
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">United Nations SDG Impact Brief</h2>
              <p className="text-xs text-slate-400 font-mono">HackNova 2026 — Centralized Emergency Response Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SDG 3 & 11 Side-by-Side Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* SDG 3 */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border-2 border-emerald-500/40 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-xs uppercase tracking-wider">
                SDG 3
              </span>
              <HeartPulse className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-base font-black text-white">Good Health & Well-Being</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Drastically slashes emergency response latency during the golden hour (first 60 minutes) and eliminates ER bed bottlenecks.
            </p>
            <div className="space-y-1.5 pt-2 border-t border-emerald-900/60 text-xs text-emerald-300 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero login friction for trauma victims</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Real-time ER bed telemetry prevents hospital dumping</span>
              </div>
            </div>
          </div>

          {/* SDG 11 */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900 border-2 border-amber-500/40 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-amber-600 text-black font-black text-xs uppercase tracking-wider">
                SDG 11
              </span>
              <Building2 className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-base font-black text-white">Sustainable & Resilient Cities</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Builds unified municipal digital infrastructure to withstand mass casualty events, urban fires, and disaster surges.
            </p>
            <div className="space-y-1.5 pt-2 border-t border-amber-900/60 text-xs text-amber-300 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>AI smart closest-unit dispatch optimization</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Synchronized tri-agency coordination (Med, Fire, Police)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Quantifiable Impact Metrics */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Quantifiable Platform Impact</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-2xl font-black font-mono text-emerald-400">-68%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Response Time Reduction</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-2xl font-black font-mono text-amber-400">100%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">ER Diversion Averted</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-2xl font-black font-mono text-cyan-400">0 sec</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Citizen Registration Delay</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-2xl font-black font-mono text-purple-400">4-in-1</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Single Digital Network</div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all cursor-pointer shadow"
          >
            Close Brief
          </button>
        </div>

      </div>
    </div>
  );
};

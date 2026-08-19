import React from 'react';
import { 
  Play, 
  RotateCcw, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2
} from 'lucide-react';
import { useEmergency } from '../../context/EmergencyContext';

export const PitchStoryWalkthrough: React.FC = () => {
  const { 
    pitchStep, 
    startGuidedPitch, 
    nextPitchStep, 
    resetToInitialDemo 
  } = useEmergency();

  const PITCH_STEPS = [
    {
      num: 1,
      title: "1. The Incident",
      desc: "Citizen at Marina Beach triggers Medical SOS on mobile. Auto GPS locks coordinates.",
      actionLabel: "Step 1: Trigger SOS",
      icon: "📍"
    },
    {
      num: 2,
      title: "2. The Dispatch",
      desc: "Red pin drops instantly at Central Command. Dispatcher allocates closest unit Alpha-1.",
      actionLabel: "Step 2: Assign Alpha-1",
      icon: "📡"
    },
    {
      num: 3,
      title: "3. The Response",
      desc: "Paramedic tablet flashes red. Paramedic taps 'Accept Mission' & navigation routes to beach.",
      actionLabel: "Step 3: Accept Mission",
      icon: "🚑"
    },
    {
      num: 4,
      title: "4. The Transport",
      desc: "Paramedic secures patient. Hospital A is full, so app auto-routes to Hospital B (Apollo).",
      actionLabel: "Step 4: Route to Hospital B",
      icon: "🏥"
    },
    {
      num: 5,
      title: "5. The Preparation",
      desc: "Hospital B triage monitor chimes. Inbound queue displays live ETA & preps ICU bay.",
      actionLabel: "Step 5: Touchdown at ER",
      icon: "🔔"
    },
    {
      num: 6,
      title: "6. The Resolution",
      desc: "Hospital clicks 'Patient Received'. Incident resolves, vehicle freed back to available!",
      actionLabel: "Step 6: Complete Cycle",
      icon: "🏆"
    }
  ];

  const currentStepInfo = pitchStep > 0 && pitchStep <= 6 ? PITCH_STEPS[pitchStep - 1] : null;

  return (
    <div className="bg-[#0B101D] border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-30 shadow-md">
      
      {/* Left: Interactive Step Indicator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 font-bold uppercase tracking-wider text-[10px]">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Hackathon Pitch Story</span>
        </div>

        {/* Step dots */}
        <div className="hidden sm:flex items-center gap-1">
          {PITCH_STEPS.map((s) => (
            <div
              key={s.num}
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all ${
                pitchStep === s.num
                  ? 'bg-amber-500 text-black font-black scale-105 shadow'
                  : pitchStep > s.num
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {s.icon} {s.num}
            </div>
          ))}
        </div>
      </div>

      {/* Center: Current Story Narrative Text */}
      <div className="flex-1 min-w-[240px] max-w-xl text-center">
        {currentStepInfo ? (
          <div className="space-y-0.5">
            <span className="font-bold text-white text-xs">{currentStepInfo.title}: </span>
            <span className="text-slate-300 text-[11px]">{currentStepInfo.desc}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-[11px]">
            Experience the complete closed-loop emergency workflow across all 4 portals.
          </span>
        )}
      </div>

      {/* Right: Next Step Action Buttons */}
      <div className="flex items-center gap-2">
        {pitchStep === 0 ? (
          <button
            onClick={startGuidedPitch}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs shadow-lg shadow-amber-950/50 transition-all active:scale-95 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>Start Guided Pitch</span>
          </button>
        ) : pitchStep < 6 ? (
          <button
            onClick={nextPitchStep}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs shadow-lg shadow-emerald-950/50 transition-all active:scale-95 cursor-pointer animate-pulse"
          >
            <span>Advance to Step {pitchStep + 1}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Story Complete!
            </span>
            <button
              onClick={resetToInitialDemo}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        )}

        <button
          onClick={resetToInitialDemo}
          title="Reset Simulation to Initial State"
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};

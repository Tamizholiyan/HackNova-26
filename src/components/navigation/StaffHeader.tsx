import React, { useState } from 'react';
import { 
  LogOut, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  Globe, 
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useEmergency } from '../../context/EmergencyContext';
import { SdgImpactModal } from '../pitch/SdgImpactModal';
import { useNavigate } from 'react-router-dom';

interface StaffHeaderProps {
  title: string;
  roleBadge: string;
  badgeColor?: string;
}

export const StaffHeader: React.FC<StaffHeaderProps> = ({ 
  title, 
  roleBadge, 
  badgeColor = 'bg-blue-600/20 text-blue-600 dark:text-blue-400 border-blue-500/40' 
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isMuted, toggleMute, resetData } = useEmergency();
  const [isSdgModalOpen, setIsSdgModalOpen] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="bg-white dark:bg-[#070B14] border-b border-slate-200 dark:border-slate-800/90 px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30 transition-colors shadow-sm dark:shadow-none">
        
        {/* Left: Brand & Scoped Portal Role */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-lg font-black text-base border border-red-400/40">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2 leading-none">
                <span className="text-base font-black tracking-tight text-slate-900 dark:text-white font-display">
                  ResQNet
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold uppercase ${badgeColor}`}>
                  {roleBadge}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {title}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Operator Profile */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.fullName || user?.email}</span>
          <span className="text-slate-500 dark:text-slate-400 font-mono">({user?.email})</span>
        </div>

        {/* Right: Controls & Logout */}
        <div className="flex items-center gap-2">
          
          {/* SDG Info Button */}
          <button
            onClick={() => setIsSdgModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-bold transition-colors cursor-pointer"
            title="View UN SDG 3 & 11 Impact Brief"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">SDG Impact</span>
          </button>

          {/* Theme Toggle (Dark / Light) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-sm dark:shadow-none"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={toggleMute}
            className={`p-2 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
              isMuted
                ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400'
                : 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800/60 text-blue-700 dark:text-cyan-300'
            }`}
            title={isMuted ? 'Unmute Siren & Chimes' : 'Mute Sound Effects'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Dev Reset Simulation Button */}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-500 text-xs font-bold transition-colors cursor-pointer"
            title="Reset Simulation Data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white border border-red-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

        </div>

      </header>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-xs w-full p-5 text-center space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Reset Simulation?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This will clear active test incidents and return fleet & hospitals to base ready state.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await resetData();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white cursor-pointer"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SDG Impact Brief Modal */}
      <SdgImpactModal isOpen={isSdgModalOpen} onClose={() => setIsSdgModalOpen(false)} />
    </>
  );
};

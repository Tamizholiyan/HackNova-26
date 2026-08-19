import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Radio, 
  Navigation, 
  Hospital as HospIcon, 
  Lock, 
  Mail, 
  ArrowLeft, 
  Sun, 
  Moon, 
  Sparkles, 
  AlertCircle,
  User,
  UserPlus,
  LogIn,
  ShieldCheck
} from 'lucide-react';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useEmergency } from '../../context/EmergencyContext';
import { sound } from '../../utils/audioSynth';
import type { UserRole } from '../../types';

export const StaffLogin: React.FC = () => {
  const { user, loginWithPassword, registerAccount, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { fleet, hospitals } = useEmergency();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  
  // Sign In Form State
  const [email, setEmail] = useState<string>('dispatcher@resqnet.org');
  const [password, setPassword] = useState<string>('admin123');
  
  // Register Form State
  const [regFullName, setRegFullName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regRole, setRegRole] = useState<UserRole>('responder');
  const [regUnitId, setRegUnitId] = useState<string>('unit-1');
  const [regHospitalId, setRegHospitalId] = useState<string>('hosp-2');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already logged in, redirect immediately
  useEffect(() => {
    if (user) {
      if (user.role === 'dispatcher') navigate('/dispatch');
      else if (user.role === 'responder') navigate('/responder');
      else if (user.role === 'hospital') navigate('/hospital');
    }
  }, [user, navigate]);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = await loginWithPassword(email, password);
    if (res.success && res.role) {
      sound.playTactileClick();
      if (res.role === 'dispatcher') navigate('/dispatch');
      else if (res.role === 'responder') navigate('/responder');
      else if (res.role === 'hospital') navigate('/hospital');
    } else {
      setErrorMsg(res.error || 'Authentication failed. Check your email and password.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = await registerAccount({
      email: regEmail,
      password: regPassword,
      fullName: regFullName,
      role: regRole,
      unitId: regRole === 'responder' ? regUnitId : undefined,
      hospitalId: regRole === 'hospital' ? regHospitalId : undefined,
    });

    if (res.success && res.role) {
      sound.playSuccessChime();
      if (res.role === 'dispatcher') navigate('/dispatch');
      else if (res.role === 'responder') navigate('/responder');
      else if (res.role === 'hospital') navigate('/hospital');
    } else {
      setErrorMsg(res.error || 'Account creation failed.');
    }
  };

  // Preset One-Click Fast Logins
  const handleQuickLogin = async (demoEmail: string) => {
    const demo = DEMO_USERS[demoEmail];
    if (demo) {
      setEmail(demo.profile.email);
      setPassword(demo.pass);
      const res = await loginWithPassword(demo.profile.email, demo.pass);
      if (res.success && res.role) {
        sound.playTactileClick();
        if (res.role === 'dispatcher') navigate('/dispatch');
        else if (res.role === 'responder') navigate('/responder');
        else if (res.role === 'hospital') navigate('/hospital');
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#05070D] text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 transition-colors font-sans">
      
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Citizen SOS</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="max-w-md w-full mx-auto my-auto bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 transition-colors">
        
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center mx-auto text-2xl font-black text-white shadow-xl shadow-red-500/20 border border-red-400/40">
            ⚡
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display">
            ResQNet Staff Access
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Authorized Dispatch, Responder, and ER Hospital Personnel
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signin' 
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-700/60' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Staff Sign In</span>
          </button>
          
          <button
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register' 
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-700/60' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {mode === 'signin' ? (
          /* =======================================
             MODE 1: SIGN IN (EMAIL + PASSWORD)
             ======================================= */
          <form onSubmit={handleSignInSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                Work Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="operator@resqnet.org"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-500/20 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>
        ) : (
          /* =======================================
             MODE 2: CREATE ACCOUNT / REGISTER
             ======================================= */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-500" />
                Full Name & Title
              </label>
              <input
                type="text"
                value={regFullName}
                onChange={e => setRegFullName(e.target.value)}
                placeholder="e.g. Paramedic Alex Kumar"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                Work Email Address
              </label>
              <input
                type="email"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                placeholder="alex.kumar@resqnet.org"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                Password
              </label>
              <input
                type="password"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                placeholder="Minimum 4 characters"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                required
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                Role / Department
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setRegRole('dispatcher')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                    regRole === 'dispatcher'
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 mx-auto mb-0.5" />
                  <span>Dispatcher</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('responder')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                    regRole === 'responder'
                      ? 'bg-amber-600 text-white shadow'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5 mx-auto mb-0.5" />
                  <span>Responder</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('hospital')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                    regRole === 'hospital'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <HospIcon className="w-3.5 h-3.5 mx-auto mb-0.5" />
                  <span>Hospital ER</span>
                </button>
              </div>
            </div>

            {/* Scoped Unit Assignment for Responder */}
            {regRole === 'responder' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Assign to Fleet Unit
                </label>
                <select
                  value={regUnitId}
                  onChange={e => setRegUnitId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                >
                  {fleet.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.callsign} ({u.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Scoped Facility Assignment for Hospital */}
            {regRole === 'hospital' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Assign to Hospital Facility
                </label>
                <select
                  value={regHospitalId}
                  onChange={e => setRegHospitalId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                >
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.shortCode})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Register & Enter Portal'}
            </button>
          </form>
        )}

        {/* Quick Demo Test Logins */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Instant Demo Accounts</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
            <button
              onClick={() => handleQuickLogin('dispatcher@resqnet.org')}
              className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 transition-all text-center cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 mx-auto mb-1 text-blue-500" />
              <span>Dispatcher</span>
            </button>

            <button
              onClick={() => handleQuickLogin('alpha1@resqnet.org')}
              className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 transition-all text-center cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 mx-auto mb-1 text-amber-500" />
              <span>Ambulance 1</span>
            </button>

            <button
              onClick={() => handleQuickLogin('apollo@resqnet.org')}
              className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 transition-all text-center cursor-pointer"
            >
              <HospIcon className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-500" />
              <span>Apollo ER</span>
            </button>
          </div>
        </div>

      </div>

      {/* Footer Note */}
      <div className="text-center text-xs text-slate-500 py-2">
        ResQNet Emergency Infrastructure • Role-Partitioned Network
      </div>

    </div>
  );
};

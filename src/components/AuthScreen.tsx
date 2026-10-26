import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  User, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Info
} from 'lucide-react';
import { UserRole, AuthSession, CompanyProfile } from '../types';
import { apiService } from '../services/api';

interface AuthScreenProps {
  profile: CompanyProfile;
  onLoginSuccess: (session: AuthSession) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  profile,
  onLoginSuccess
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSetup, setShowSetup] = useState<boolean>(false);

  // Setup mode states
  const [newAdminPin, setNewAdminPin] = useState<string>('9766');
  const [newStaffPin, setNewStaffPin] = useState<string>('1111');
  const [setupMessage, setSetupMessage] = useState<string>('');

  const handleDigitClick = (digit: string) => {
    if (pin.length < 8) {
      setPin(prev => prev + digit);
      setError('');
    }
  };

  const handleDeleteDigit = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin.trim()) {
      setError('Please enter your 4-digit PIN or Password');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const session = await apiService.login(selectedRole, pin);
      onLoginSuccess(session);
    } catch (err: any) {
      setError(err.message || 'Incorrect PIN. Try again.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSetup = async () => {
    if (!newAdminPin.trim() || !newStaffPin.trim()) {
      alert('Please fill both Admin and Staff PINs.');
      return;
    }
    try {
      await apiService.updateAuthConfig({
        adminPin: newAdminPin.trim(),
        staffPin: newStaffPin.trim()
      });
      setSetupMessage('PINs saved successfully! You can now log in.');
      setShowSetup(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save setup PINs.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100">
      {/* Brand Header */}
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-teal-400 shadow-lg shadow-brand-500/20 ring-4 ring-white/10 mb-2">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          {profile.businessName}
        </h1>
        <p className="text-xs sm:text-sm text-teal-300 font-medium max-w-md mx-auto">
          Glass &amp; Aluminium Billing, Ledger &amp; Inventory Management
        </p>
        <p className="text-[11px] text-slate-400 font-mono">
          {profile.address}
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Role Toggle Selector */}
        <div className="bg-slate-100 p-2 grid grid-cols-2 gap-1.5 border-b border-slate-200">
          <button
            type="button"
            onClick={() => {
              setSelectedRole('ADMIN');
              setPin('');
              setError('');
            }}
            className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              selectedRole === 'ADMIN'
                ? 'bg-navy-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${selectedRole === 'ADMIN' ? 'text-teal-400' : 'text-slate-500'}`} />
            <span>Owner / Admin</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole('STAFF');
              setPin('');
              setError('');
            }}
            className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              selectedRole === 'STAFF'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <User className={`w-4 h-4 ${selectedRole === 'STAFF' ? 'text-white' : 'text-slate-500'}`} />
            <span>Counter Staff</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-black text-slate-900">
              {selectedRole === 'ADMIN' ? 'Owner Portal Access' : 'Staff Billing Terminal'}
            </h2>
            <p className="text-xs text-slate-500">
              {selectedRole === 'ADMIN'
                ? 'Full access to Reports, Settings, Inventory Costs & Overrides'
                : 'Measurement entry, Smart billing, Customer Khata & Breakage'}
            </p>
          </div>

          {setupMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{setupMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* PIN Input Display */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Enter {selectedRole === 'ADMIN' ? 'Admin PIN / Password' : 'Staff 4-Digit PIN'}</span>
                <span className="text-[11px] text-brand-600 font-mono">
                  Default: {selectedRole === 'ADMIN' ? '9766' : '1111'}
                </span>
              </div>

              <div className="relative">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError('');
                  }}
                  autoFocus
                  placeholder="••••"
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 rounded-2xl py-3 px-4 text-center font-mono text-2xl tracking-[0.4em] font-black text-slate-900 transition-all focus:outline-hidden"
                />
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Mobile Touch Number Pad */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDigitClick(num)}
                  className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 font-bold text-lg text-slate-800 transition-colors shadow-2xs"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 font-semibold text-xs text-slate-600 transition-colors uppercase tracking-wider"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleDigitClick('0')}
                className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 font-bold text-lg text-slate-800 transition-colors shadow-2xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDeleteDigit}
                className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 font-semibold text-xs text-rose-600 transition-colors uppercase tracking-wider"
              >
                ⌫
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !pin}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 ${
                selectedRole === 'ADMIN'
                  ? 'bg-navy-900 hover:bg-navy-800 shadow-navy-900/20'
                  : 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/20'
              }`}
            >
              <span>{isLoading ? 'Verifying...' : `Login as ${selectedRole === 'ADMIN' ? 'Owner' : 'Staff'}`}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          {/* First Boot Setup Option Toggle */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => setShowSetup(!showSetup)}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center justify-center gap-1 mx-auto"
            >
              <span>{showSetup ? 'Hide Setup Wizard' : 'Change / Setup Owner & Staff PINs'}</span>
            </button>

            {showSetup && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-3 animate-in fade-in">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>Configure Security PINs</span>
                </h4>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    New Owner / Admin PIN:
                  </label>
                  <input
                    type="text"
                    value={newAdminPin}
                    onChange={(e) => setNewAdminPin(e.target.value)}
                    placeholder="e.g. 9766"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    New Counter Staff PIN:
                  </label>
                  <input
                    type="text"
                    value={newStaffPin}
                    onChange={(e) => setNewStaffPin(e.target.value)}
                    placeholder="e.g. 1111"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveSetup}
                  className="w-full bg-slate-900 text-white text-xs font-bold py-2 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Save Security Credentials
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Permissions Guide Pill */}
      <div className="mt-6 text-xs text-slate-400 text-center max-w-md">
        <span>Protected with Role-Based Access Control (RBAC) &bull; Auto-logout after 30 min of inactivity.</span>
      </div>
    </div>
  );
};


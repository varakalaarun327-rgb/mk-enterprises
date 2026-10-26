import React, { useState } from 'react';
import { ShieldAlert, X, KeyRound, Check, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';

interface AdminOverrideModalProps {
  isOpen: boolean;
  actionTitle?: string;
  actionDescription?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const AdminOverrideModal: React.FC<AdminOverrideModalProps> = ({
  isOpen,
  actionTitle = 'Admin Authorization Required',
  actionDescription = 'This action requires the Owner / Admin PIN to proceed.',
  onSuccess,
  onClose
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Please enter Admin PIN');
      return;
    }

    setIsVerifying(true);
    setError('');
    try {
      const authorized = await apiService.verifyAdminOverride(pin);
      if (authorized) {
        onSuccess();
        onClose();
      } else {
        setError('Incorrect Admin PIN.');
        setPin('');
      }
    } catch (err: any) {
      setError('Verification failed. Try again.');
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 border border-slate-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">{actionTitle}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{actionDescription}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Enter Owner / Admin PIN:
            </label>
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
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-xl py-2.5 px-3 text-center font-mono text-xl tracking-[0.3em] font-black text-slate-900 focus:outline-hidden"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 text-center font-mono">
              Default Admin PIN: 9766 or 1234
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || !pin}
              className="flex-1 bg-navy-900 hover:bg-navy-800 text-white py-2.5 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
            >
              {isVerifying ? 'Verifying...' : 'Authorize Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


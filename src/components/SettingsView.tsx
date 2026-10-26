import React, { useState } from 'react';
import { 
  Building2, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  AlertCircle,
  Phone,
  MapPin,
  CreditCard,
  FileText
} from 'lucide-react';
import { CompanyProfile } from '../types';
import { apiService } from '../services/api';

interface SettingsViewProps {
  profile: CompanyProfile;
  onUpdateProfile: (updated: CompanyProfile) => Promise<void>;
  onRefreshAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  onRefreshAll
}) => {
  const [form, setForm] = useState<CompanyProfile>({ ...profile });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateProfile(form);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      alert('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    const backup = apiService.exportAllData();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MK_Enterprises_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        apiService.restoreAllData(parsed);
        alert('Data restored successfully!');
        onRefreshAll();
      } catch (err) {
        alert('Invalid backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all data back to factory defaults for M.K. Enterprises?')) {
      apiService.resetToDefaults();
      onRefreshAll();
      alert('System reset to default state.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-brand-50 text-brand-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-brand-200 uppercase tracking-wider">
              Profile &amp; Configuration
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Business Profile, Bank &amp; Terms
          </h2>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Profile Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-600" />
            <span>Business Branding &amp; Address</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Business Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Tagline / Subheading
              </label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Shop / Office Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Primary Phone Number
              </label>
              <input
                type="text"
                value={form.phones[0] || ''}
                onChange={(e) => {
                  const phones = [...form.phones];
                  phones[0] = e.target.value;
                  setForm({ ...form, phones });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Secondary Phone Number
              </label>
              <input
                type="text"
                value={form.phones[1] || ''}
                onChange={(e) => {
                  const phones = [...form.phones];
                  phones[1] = e.target.value;
                  setForm({ ...form, phones });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                GSTIN Number
              </label>
              <input
                type="text"
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                placeholder="e.g. 36ABCDE1234F1Z5"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-brand-700"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                State &amp; State Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="Telangana"
                  className="w-2/3 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium"
                />
                <input
                  type="text"
                  value={form.stateCode}
                  onChange={(e) => setForm({ ...form, stateCode: e.target.value })}
                  placeholder="36"
                  className="w-1/3 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Bank &amp; Payment Accounts (Prints on Invoices)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Account Beneficiary Name
              </label>
              <input
                type="text"
                value={form.accountName}
                onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                IFSC Code &amp; Branch
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.ifscCode}
                  onChange={(e) => setForm({ ...form, ifscCode: e.target.value })}
                  className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono font-bold"
                />
                <input
                  type="text"
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  placeholder="Branch"
                  className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                UPI ID (Prints on Invoices &amp; WhatsApp Share)
              </label>
              <input
                type="text"
                value={form.upiId}
                onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                placeholder="e.g. 9766550152@upi"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-teal-700"
              />
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Standard Quotation &amp; Bill Terms</span>
          </h3>

          <div className="space-y-2">
            {form.terms.map((term, index) => (
              <input
                key={index}
                type="text"
                value={term}
                onChange={(e) => {
                  const terms = [...form.terms];
                  terms[index] = e.target.value;
                  setForm({ ...form, terms });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-navy-900 hover:bg-navy-800 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4 text-teal-400" />
          <span>{isSaving ? 'Saving Changes...' : 'Save Company Profile'}</span>
        </button>
      </form>

        {/* Backup, Restore & Reset Box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Data Backup, Cloud Snapshot &amp; Restore
              </h3>
              <p className="text-xs text-slate-500">Automated daily 11:59 PM backups (30-day retention) &amp; manual USB exports</p>
            </div>
            <span className="text-[11px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-bold">
              node-cron Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await apiService.createBackup();
                  if (res.fileName) {
                    window.location.href = `/api/backups/download/${res.fileName}`;
                  } else {
                    handleDownloadBackup();
                  }
                } catch (e) {
                  handleDownloadBackup();
                }
              }}
              className="p-4 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 text-left transition-all group"
            >
              <Download className="w-5 h-5 text-brand-600 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-900">Download Complete Backup (.ZIP)</div>
              <div className="text-[11px] text-slate-500">One-click server zip of all JSON data</div>
            </button>

            <label className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all cursor-pointer group block">
              <Upload className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-900">Restore from File</div>
              <div className="text-[11px] text-slate-500">Validated JSON snapshot upload</div>
              <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
            </label>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="p-4 rounded-xl border border-slate-200 hover:border-rose-500 hover:bg-rose-50/50 text-left transition-all group"
            >
              <RotateCcw className="w-5 h-5 text-rose-600 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-900">Reset Demo Data</div>
              <div className="text-[11px] text-slate-500">Revert to default seed data</div>
            </button>
          </div>

          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800">Standalone OS Cron Backup Script:</div>
            <p className="text-[11px]">
              You can trigger backups from Linux crontab or Windows Task Scheduler using:
              <code className="block bg-slate-900 text-teal-300 font-mono p-2 rounded-lg mt-1 select-all">
                node scripts/backup.js [optional_external_drive_path]
              </code>
            </p>
          </div>
        </div>
    </div>
  );
};


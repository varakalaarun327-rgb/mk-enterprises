import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  TrendingUp, 
  Wallet, 
  Clock, 
  AlertTriangle, 
  Download, 
  Database, 
  FileSpreadsheet, 
  Users, 
  KeyRound, 
  CheckCircle2, 
  ArrowRight, 
  Phone, 
  Share2, 
  RefreshCw, 
  Archive, 
  Upload, 
  Lock,
  Plus
} from 'lucide-react';
import { CompanyProfile, Customer, Invoice, InventoryItem, BackupInfo } from '../types';
import { formatCurrency, formatNumber, generateWhatsAppMessage } from '../utils/calculator';
import { apiService } from '../services/api';

interface AdminDashboardProps {
  metrics: any;
  customers: Customer[];
  invoices: Invoice[];
  inventory: InventoryItem[];
  profile: CompanyProfile;
  onNavigate: (tab: string, state?: any) => void;
  onRefreshAll: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  metrics,
  customers,
  invoices,
  inventory,
  profile,
  onNavigate,
  onRefreshAll
}) => {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState<boolean>(false);
  const [backupMessage, setBackupMessage] = useState<string>('');

  // Fast Due Clearance Modal State
  const [isDueModalOpen, setIsDueModalOpen] = useState<boolean>(false);
  const [selectedDueCustId, setSelectedDueCustId] = useState<string>('');
  const [duePayAmount, setDuePayAmount] = useState<number>(0);
  const [duePayMode, setDuePayMode] = useState<any>('UPI');
  const [duePayRef, setDuePayRef] = useState<string>('');
  const [isClearingDue, setIsClearingDue] = useState<boolean>(false);

  // Security Credentials Modal
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [adminPin, setAdminPin] = useState<string>('');
  const [staffPin, setStaffPin] = useState<string>('');
  const [staffName, setStaffName] = useState<string>('Counter Staff');
  const [secSuccess, setSecSuccess] = useState<boolean>(false);

  const fetchBackups = () => {
    apiService.getBackups().then(setBackups).catch(console.error);
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  // Compute monthly figures
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthInvoices = invoices.filter(i => i.date.startsWith(currentMonthStr));
  const monthlyTurnover = thisMonthInvoices.reduce((sum, i) => sum + (Number(i.grandTotal) || 0), 0);
  const monthlyTaxable = thisMonthInvoices.reduce((sum, i) => sum + (Number(i.taxableAmount) || 0), 0);
  const monthlyTotalGst = thisMonthInvoices.reduce((sum, i) => sum + (Number(i.totalGst) || 0), 0);
  const monthlyCGST = monthlyTotalGst / 2;
  const monthlySGST = monthlyTotalGst / 2;

  // Customers with pending dues
  const dueCustomers = customers
    .filter(c => (c.outstandingDue || 0) > 0)
    .sort((a, b) => (b.outstandingDue || 0) - (a.outstandingDue || 0));

  // Quick Action: Download GSTR-1 Summary CSV
  const handleDownloadGSTR1 = async () => {
    const report = await apiService.getGstReport();
    if (!report || report.invoices.length === 0) {
      alert('No sales data found to generate GSTR-1.');
      return;
    }

    const headers = ['Invoice No', 'Date', 'Customer Name', 'Phone', 'Taxable Value', 'CGST 9%', 'SGST 9%', 'Total GST', 'Gross Invoice Value'];
    const rows = report.invoices.map(row => [
      row.invoiceNumber,
      row.date,
      `"${row.customerName.replace(/"/g, '""')}"`,
      row.customerPhone,
      row.taxableAmount.toFixed(2),
      row.cgst.toFixed(2),
      row.sgst.toFixed(2),
      row.totalGst.toFixed(2),
      row.grandTotal.toFixed(2)
    ]);

    rows.push([]);
    rows.push(['TOTALS', '', '', '', report.summary.totalTaxable.toFixed(2), report.summary.totalCGST.toFixed(2), report.summary.totalSGST.toFixed(2), report.summary.totalGST.toFixed(2), report.summary.totalInvoiceValue.toFixed(2)]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MK_Enterprises_GSTR1_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Quick Action: Emergency Backup Now
  const handleTriggerEmergencyBackup = async () => {
    setIsCreatingBackup(true);
    setBackupMessage('');
    try {
      const res = await apiService.createBackup();
      setBackupMessage(`Emergency backup generated successfully! File: ${res.fileName}`);
      fetchBackups();
    } catch (err: any) {
      alert(err.message || 'Failed to create emergency backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Fast Due Clearance Submit
  const handleClearDueSubmit = async () => {
    if (!selectedDueCustId || duePayAmount <= 0) {
      alert('Please select customer and enter valid amount.');
      return;
    }
    setIsClearingDue(true);
    try {
      const targetCust = customers.find(c => c.id === selectedDueCustId);
      await apiService.addPayment({
        customerId: selectedDueCustId,
        customerName: targetCust?.name,
        amount: duePayAmount,
        paymentMode: duePayMode,
        paymentRef: duePayRef,
        notes: 'Fast clearance recorded via Admin Portal'
      });
      setIsDueModalOpen(false);
      setDuePayAmount(0);
      setDuePayRef('');
      onRefreshAll();
      alert('Payment receipt logged and customer balance updated!');
    } catch (err: any) {
      alert('Failed to clear due');
    } finally {
      setIsClearingDue(false);
    }
  };

  // Save Security PINs
  const handleSaveSecurity = async () => {
    if (!adminPin.trim() && !staffPin.trim()) {
      alert('Please enter at least one PIN to update.');
      return;
    }
    try {
      await apiService.updateAuthConfig({
        adminPin: adminPin.trim() || undefined,
        staffPin: staffPin.trim() || undefined,
        staffName: staffName.trim() || undefined
      });
      setSecSuccess(true);
      setTimeout(() => setSecSuccess(false), 3000);
      setIsSecurityModalOpen(false);
      alert('Security credentials updated successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to update credentials.');
    }
  };

  // Handle Restore Database from JSON
  const handleRestoreBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        await apiService.restoreBackup(parsed);
        alert('Database restored successfully from backup!');
        onRefreshAll();
        fetchBackups();
      } catch (err: any) {
        alert('Failed to restore backup: ' + (err.message || 'Corrupt JSON file.'));
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-radial from-teal-500/10 via-brand-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Owner / Executive Portal
              </span>
              <span className="text-slate-400 text-xs font-mono">
                M.K. Enterprises Pargi
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Business Intelligence &amp; Controls
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Owner-only analytics, market receivable dues, automated 11:59 PM backups, GSTR-1 tax export, and security credentials.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleTriggerEmergencyBackup}
              disabled={isCreatingBackup}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-navy-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Database className="w-4 h-4" />
              <span>{isCreatingBackup ? 'Backing Up...' : 'Emergency Backup Now'}</span>
            </button>

            <button
              onClick={() => setIsSecurityModalOpen(true)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2.5 rounded-xl font-bold text-xs backdrop-blur-xs transition-all"
            >
              <KeyRound className="w-4 h-4 text-amber-300" />
              <span>Manage PINs</span>
            </button>
          </div>
        </div>
      </div>

      {backupMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{backupMessage}</span>
          </div>
          <button onClick={() => setBackupMessage('')} className="text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Module 2: 4 Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Today's Sales */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Today's Sales
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 font-mono">
              {formatCurrency(metrics.todaySales)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.todayInvoiceCount} bills billed today
            </p>
          </div>
        </div>

        {/* 2. Total Outstanding Market Due */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              Market Receivables (Due)
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-600 font-mono">
              {formatCurrency(metrics.totalPendingDue)}
            </div>
            <p className="text-xs text-rose-500 font-semibold mt-1">
              {dueCustomers.length} clients with balance due
            </p>
          </div>
        </div>

        {/* 3. Monthly Turnover & 18% GST */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Monthly Turnover &amp; GST
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 font-mono">
              {formatCurrency(monthlyTurnover)}
            </div>
            <p className="text-[11px] text-teal-700 font-mono font-bold mt-1">
              GST: {formatCurrency(monthlyTotalGst)} (CGST ₹{formatNumber(monthlyCGST)} + SGST ₹{formatNumber(monthlySGST)})
            </p>
          </div>
        </div>

        {/* 4. Low Stock Alert Counter */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Safety Buffer Alerts
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-900 font-mono">
              {metrics.lowStockCount} Items Low
            </div>
            <p className="text-xs text-amber-700 mt-1">
              Raw sheets &amp; profiles below minimum
            </p>
          </div>
        </div>
      </div>

      {/* Module 2: Quick Action Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* One-Click GSTR-1 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">GSTR-1 Tax Summary</h3>
              <p className="text-xs text-slate-500">Download formatted sales &amp; GST register for CA filing</p>
            </div>
          </div>
          <button
            onClick={handleDownloadGSTR1}
            className="w-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download GSTR-1 (.CSV)</span>
          </button>
        </div>

        {/* Customer Due Clearance Fast Logger */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Customer Due Clearance</h3>
              <p className="text-xs text-slate-500">Fast recovery logger to settle balances with receipt</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (dueCustomers.length > 0) {
                setSelectedDueCustId(dueCustomers[0].id);
                setDuePayAmount(dueCustomers[0].outstandingDue || 0);
              }
              setIsDueModalOpen(true);
            }}
            className="w-full bg-slate-100 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Wallet className="w-4 h-4" />
            <span>Clear Customer Due</span>
          </button>
        </div>

        {/* Database Backup & Restore */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Complete Database Export</h3>
              <p className="text-xs text-slate-500">11:59 PM daily background backup &amp; USB snapshot</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerEmergencyBackup}
              disabled={isCreatingBackup}
              className="flex-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-800 hover:border-brand-300 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup .ZIP</span>
            </button>
            <label className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore</span>
              <input type="file" accept=".json" onChange={handleRestoreBackupFile} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Module 3: Automated Daily Backups History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600" />
              <span>Automated Daily Backups (Retention: Last 30 Days)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Runs automatically every day at 11:59 PM via internal cron scheduler. Timestamped files in <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">server/backups/</code>
            </p>
          </div>

          <button
            onClick={fetchBackups}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh List</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4">Backup File Name</th>
                <th className="py-3 px-4">Timestamp / Created</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">File Size</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {backups.map((b, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-brand-700">
                    {b.fileName}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono">
                    {new Date(b.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      b.type.includes('Auto') ? 'bg-teal-100 text-teal-800' : 'bg-brand-100 text-brand-800'
                    }`}>
                      {b.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                    {b.sizeFormatted}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <a
                      href={`/api/backups/download/${b.fileName}`}
                      download={b.fileName}
                      className="inline-flex items-center gap-1 bg-slate-100 hover:bg-brand-50 text-brand-700 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>
                  </td>
                </tr>
              ))}
              {backups.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    No automated backup snapshots recorded yet. Click "Emergency Backup Now" to create one immediately.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overdue Customer Receivables List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">Overdue Customer Receivables</h3>
            <p className="text-xs text-slate-500">Clients with outstanding balances requiring follow-up</p>
          </div>
          <span className="text-xs font-bold font-mono text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
            Total Due: {formatCurrency(metrics.totalPendingDue)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Site Location</th>
                <th className="py-3 px-4 text-right">Lifetime Billed</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dueCustomers.map(cust => (
                <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{cust.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{cust.phone}</td>
                  <td className="py-3 px-4 text-slate-500 truncate max-w-[200px]">{cust.address || '-'}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                    {formatCurrency(cust.totalBilled || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                    {formatCurrency(cust.totalPaid || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-rose-600 text-sm">
                    {formatCurrency(cust.outstandingDue || 0)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedDueCustId(cust.id);
                          setDuePayAmount(cust.outstandingDue || 0);
                          setIsDueModalOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shadow-2xs"
                      >
                        Clear Due
                      </button>
                      <button
                        onClick={() => onNavigate('ledger', { customerId: cust.id })}
                        className="text-brand-600 hover:text-brand-700 font-semibold p-1 hover:bg-brand-50 rounded"
                        title="View Full Khata Ledger"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {dueCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-emerald-700 font-bold">
                    All customer accounts are fully paid! Zero outstanding dues.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fast Due Clearance Modal */}
      {isDueModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Clear Customer Due Balance</h3>
              <button onClick={() => setIsDueModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Customer</label>
                <select
                  value={selectedDueCustId}
                  onChange={(e) => {
                    setSelectedDueCustId(e.target.value);
                    const sel = customers.find(c => c.id === e.target.value);
                    if (sel) setDuePayAmount(sel.outstandingDue || 0);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  {dueCustomers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — Outstanding Due: ₹{formatNumber(c.outstandingDue || 0)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  value={duePayAmount || ''}
                  onChange={(e) => setDuePayAmount(Number(e.target.value))}
                  className="w-full bg-emerald-50 border border-emerald-300 rounded-xl px-3.5 py-2 text-lg font-mono font-bold text-emerald-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Payment Mode</label>
                  <select
                    value={duePayMode}
                    onChange={(e) => setDuePayMode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="UPI">UPI (GPay/PhonePe)</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Ref / UTR #</label>
                  <input
                    type="text"
                    value={duePayRef}
                    onChange={(e) => setDuePayRef(e.target.value)}
                    placeholder="e.g. UPI Ref"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsDueModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleClearDueSubmit}
                disabled={isClearingDue}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                {isClearingDue ? 'Recording...' : 'Record Payment Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Credentials & PINs Modal */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Manage Access Control PINs</h3>
              <button onClick={() => setIsSecurityModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  New Owner / Admin PIN (Current fallback: 9766)
                </label>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="Leave blank to keep unchanged"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  New Counter Staff PIN (Current fallback: 1111)
                </label>
                <input
                  type="password"
                  value={staffPin}
                  onChange={(e) => setStaffPin(e.target.value)}
                  placeholder="Leave blank to keep unchanged"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Staff Terminal Display Name
                </label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsSecurityModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSecurity}
                className="bg-navy-900 hover:bg-navy-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm"
              >
                Save PINs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


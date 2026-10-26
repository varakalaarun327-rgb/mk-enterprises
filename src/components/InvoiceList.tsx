import React, { useState } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  Printer, 
  Share2, 
  Trash2, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowUpDown
} from 'lucide-react';
import { Invoice, CompanyProfile, UserRole } from '../types';
import { formatCurrency, generateWhatsAppMessage } from '../utils/calculator';

interface InvoiceListProps {
  invoices: Invoice[];
  profile: CompanyProfile;
  userRole?: UserRole;
  onPrintInvoice: (inv: Invoice) => void;
  onDeleteInvoice: (id: string) => Promise<void>;
  onNavigateNewBill: () => void;
  onRequestAdminOverride?: (actionTitle: string, actionDesc: string, onSuccess: () => void) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  profile,
  userRole = 'ADMIN',
  onPrintInvoice,
  onDeleteInvoice,
  onNavigateNewBill,
  onRequestAdminOverride
}) => {
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filtered = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerPhone.includes(search) ||
      (inv.siteAddress && inv.siteAddress.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || inv.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const totalBilled = filtered.reduce((sum, i) => sum + (Number(i.grandTotal) || 0), 0);
  const totalPaid = filtered.reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0);
  const totalDue = filtered.reduce((sum, i) => sum + (Number(i.balanceDue) || 0), 0);

  const handleShareWhatsApp = (inv: Invoice) => {
    const encoded = generateWhatsAppMessage(inv, profile);
    const cleanPhone = inv.customerPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${phoneWithCountry}?text=${encoded}`, '_blank');
  };

  const handleDelete = async (inv: Invoice) => {
    if (userRole === 'STAFF') {
      if (onRequestAdminOverride) {
        onRequestAdminOverride(
          `Delete Invoice ${inv.invoiceNumber}`,
          `Deleting finalized bills by counter staff requires Owner / Admin PIN override.`,
          async () => {
            await onDeleteInvoice(inv.id);
          }
        );
      } else {
        alert('Permission Denied: Only Admin can delete invoices.');
      }
      return;
    }

    if (confirm(`Are you sure you want to delete invoice ${inv.invoiceNumber} for ${inv.customerName}?`)) {
      await onDeleteInvoice(inv.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-brand-50 text-brand-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-brand-200 uppercase tracking-wider">
              Bills Registry
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {invoices.length} Total Records
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Invoices &amp; Quotations Management
          </h2>
        </div>

        <button
          onClick={onNavigateNewBill}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create New Bill</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Filtered Total Value</div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {formatCurrency(totalBilled)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{filtered.length} bills selected</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-emerald-600 uppercase">Total Collected</div>
          <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
            {formatCurrency(totalPaid)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Received in bank / cash</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-rose-600 uppercase">Pending Due Balance</div>
          <div className="text-2xl font-black text-rose-600 font-mono mt-1">
            {formatCurrency(totalDue)}
          </div>
          <div className="text-[11px] text-rose-500 mt-0.5">Outstanding collection</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Bill #, Customer, Phone..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="Paid">Fully Paid</option>
            <option value="Partial">Partial Payment</option>
            <option value="Unpaid">Unpaid / Full Due</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Document Types</option>
            <option value="Tax Invoice">Tax Invoice</option>
            <option value="Estimate / Quotation">Estimate / Quotation</option>
            <option value="Delivery Challan">Delivery Challan</option>
          </select>
        </div>
      </div>

      {/* Table of Invoices */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4">Bill No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer &amp; Phone</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-brand-700 text-sm">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono">
                    {inv.date}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{inv.customerName}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{inv.customerPhone}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                      {inv.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    {inv.items ? inv.items.length : 0}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(inv.grandTotal)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                    {formatCurrency(inv.paidAmount)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    {inv.balanceDue > 0 ? (
                      <span className="text-rose-600">{formatCurrency(inv.balanceDue)}</span>
                    ) : (
                      <span className="text-emerald-600">Nil</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      inv.status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : inv.status === 'Partial'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onPrintInvoice(inv)}
                        title="Print / View Invoice"
                        className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleShareWhatsApp(inv)}
                        title="Share on WhatsApp"
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(inv)}
                        title="Delete Invoice"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No invoices matching the search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  AlertCircle, 
  Clock, 
  Receipt, 
  Users, 
  Boxes, 
  Plus, 
  ArrowRight, 
  Share2, 
  Printer, 
  Calculator,
  CheckCircle2,
  PhoneCall,
  Calendar
} from 'lucide-react';
import { Invoice, InventoryItem, Customer, CompanyProfile } from '../types';
import { formatCurrency, calculateArea, generateWhatsAppMessage } from '../utils/calculator';

interface DashboardProps {
  metrics: {
    totalSales: number;
    totalReceived: number;
    totalPendingDue: number;
    totalInvoices: number;
    totalCustomers: number;
    todaySales: number;
    todayReceived: number;
    todayInvoiceCount: number;
    lowStockCount: number;
    lowStockItems: InventoryItem[];
  };
  recentInvoices: Invoice[];
  customers: Customer[];
  profile: CompanyProfile;
  onNavigate: (tab: string, state?: any) => void;
  onPrintInvoice: (invoice: Invoice) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  recentInvoices,
  customers,
  profile,
  onNavigate,
  onPrintInvoice
}) => {
  // Quick Calculator State
  const [calcLength, setCalcLength] = useState<number>(48);
  const [calcWidth, setCalcWidth] = useState<number>(36);
  const [calcQty, setCalcQty] = useState<number>(2);
  const [calcRate, setCalcRate] = useState<number>(180);
  const [calcUnit, setCalcUnit] = useState<'inch' | 'mm' | 'feet'>('inch');

  const calculatedSqFt = calculateArea(calcLength, calcUnit, calcWidth, calcUnit, calcQty, 'sqft');
  const calculatedEstimatedCost = calculatedSqFt * calcRate;

  const handleShareWhatsApp = (inv: Invoice) => {
    const encoded = generateWhatsAppMessage(inv, profile);
    const cleanPhone = inv.customerPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${phoneWithCountry}?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Welcome and Core Info */}
      <div className="bg-gradient-to-r from-navy-900 via-brand-950 to-navy-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-teal-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Shop Operations Active
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {profile.businessName}
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Digital Glass &bull; Etching Glass &bull; Tuffen Glass &bull; Railing Design &bull; UPVC &amp; Aluminium Fabrication
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => onNavigate('billing')}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-navy-950 px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 hover:shadow-teal-500/20"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create New Bill</span>
            </button>
            <button
              onClick={() => onNavigate('ledger')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl font-semibold text-sm backdrop-blur-xs transition-all"
            >
              <Users className="w-4 h-4" />
              <span>Customer Ledgers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Alert if any */}
      {metrics.lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Low Stock Alert ({metrics.lowStockCount} items below minimum safety threshold)
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                {metrics.lowStockItems.map(i => `${i.name} (${i.currentStock} ${i.unit})`).join(' • ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('inventory')}
            className="shrink-0 text-xs font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Manage Inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Core Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Lifetime Sales */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Billed (Sales)
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-brand-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">
              {formatCurrency(metrics.totalSales)}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Receipt className="w-3 h-3 text-slate-400" />
              <span>{metrics.totalInvoices} Invoices recorded</span>
            </p>
          </div>
        </div>

        {/* Payments Collected */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Payments Collected
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-700">
              {formatCurrency(metrics.totalReceived)}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Collected via Cash, UPI &amp; Bank</span>
            </p>
          </div>
        </div>

        {/* Outstanding Dues */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Net Outstanding Due
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-600">
              {formatCurrency(metrics.totalPendingDue)}
            </div>
            <p className="text-xs text-rose-500 font-medium mt-1">
              Pending balance across customers
            </p>
          </div>
        </div>

        {/* Today's Sales */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Today's Activity
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">
              {formatCurrency(metrics.todaySales)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.todayInvoiceCount} bills created today
            </p>
          </div>
        </div>
      </div>

      {/* Middle Grid: Quick Measurement Calculator & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Glass Sq. Ft. & Cost Estimator widget */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Quick Glass Estimator</h3>
                <p className="text-[11px] text-slate-500">Instant Sq. Ft. &amp; Price Check</p>
              </div>
            </div>
            <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs">
              {(['inch', 'mm', 'feet'] as const).map(u => (
                <button
                  key={u}
                  onClick={() => setCalcUnit(u)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold uppercase transition-all ${
                    calcUnit === u ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Length / Height ({calcUnit})
                </label>
                <input
                  type="number"
                  value={calcLength || ''}
                  onChange={(e) => setCalcLength(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="e.g. 72"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Width ({calcUnit})
                </label>
                <input
                  type="number"
                  value={calcWidth || ''}
                  onChange={(e) => setCalcWidth(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="e.g. 36"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={calcQty || ''}
                  onChange={(e) => setCalcQty(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Rate (₹ / Sq. Ft.)
                </label>
                <input
                  type="number"
                  value={calcRate || ''}
                  onChange={(e) => setCalcRate(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="180"
                />
              </div>
            </div>

            {/* Result calculation highlight box */}
            <div className="bg-brand-50/70 border border-brand-200 rounded-xl p-3.5 mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Calculated Area:</span>
                <span className="text-base font-extrabold text-brand-900 font-mono">
                  {calculatedSqFt} Sq. Ft.
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-brand-200/60">
                <span className="text-slate-600 font-medium">Estimated Material Cost:</span>
                <span className="text-lg font-black text-slate-900 font-mono">
                  {formatCurrency(calculatedEstimatedCost)}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 text-right">
                Formula: ({calcLength}" × {calcWidth}" ÷ 144) × {calcQty} pcs = {calculatedSqFt} sq.ft
              </p>
            </div>

            <button
              onClick={() => onNavigate('billing')}
              className="w-full bg-navy-900 hover:bg-navy-800 text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Add to New Bill</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Operations & Customer Shortcuts */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Quick Operations</h3>
                <p className="text-[11px] text-slate-500">Frequent glass business tasks &amp; shortcuts</p>
              </div>
              <span className="text-xs font-medium text-slate-400">Pargi Hub</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <button
                onClick={() => onNavigate('billing')}
                className="p-3.5 rounded-xl border border-brand-200 bg-brand-50/40 hover:bg-brand-50 hover:border-brand-300 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Receipt className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">New Bill</div>
                <div className="text-[11px] text-slate-500">Dynamic sqft &amp; GST</div>
              </button>

              <button
                onClick={() => onNavigate('ledger')}
                className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">Add Payment</div>
                <div className="text-[11px] text-slate-500">Record receipt voucher</div>
              </button>

              <button
                onClick={() => onNavigate('inventory')}
                className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/40 hover:bg-teal-50 hover:border-teal-300 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Boxes className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">Stock Inward</div>
                <div className="text-[11px] text-slate-500">Receive supplier lot</div>
              </button>

              <button
                onClick={() => onNavigate('inventory')}
                className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-300 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">Log Breakage</div>
                <div className="text-[11px] text-slate-500">Cut scrap / damage</div>
              </button>
            </div>
          </div>

          {/* Quick Customer Outstanding Strip */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">Top Outstanding Customers</span>
              <button
                onClick={() => onNavigate('ledger')}
                className="text-xs text-brand-600 font-semibold hover:text-brand-700 flex items-center gap-1"
              >
                <span>View All ({customers.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {customers
                .filter(c => (c.outstandingDue || 0) > 0)
                .slice(0, 3)
                .map(c => (
                  <div
                    key={c.id}
                    onClick={() => onNavigate('ledger', { customerId: c.id })}
                    className="shrink-0 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-2.5 cursor-pointer transition-all min-w-[210px]"
                  >
                    <div className="font-bold text-xs text-slate-900 truncate">{c.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{c.phone}</div>
                    <div className="text-xs font-extrabold text-rose-600 mt-1 font-mono">
                      Due: {formatCurrency(c.outstandingDue || 0)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Invoices &amp; Quotations</h3>
            <p className="text-xs text-slate-500">Latest paperless measurement bills generated</p>
          </div>
          <button
            onClick={() => onNavigate('invoices')}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Full Bill History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer &amp; Site</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4 text-right">Total (₹)</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentInvoices.slice(0, 5).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-brand-700">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs font-mono">
                    {inv.date}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 text-xs">{inv.customerName}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                      {inv.siteAddress || inv.customerPhone}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">
                    <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                      {inv.items ? inv.items.length : 0} items
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                    {formatCurrency(inv.grandTotal)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold">
                    {inv.balanceDue > 0 ? (
                      <span className="text-rose-600">{formatCurrency(inv.balanceDue)}</span>
                    ) : (
                      <span className="text-emerald-600">Nil</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'Partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
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
                    </div>
                  </td>
                </tr>
              ))}
              {recentInvoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-sm">
                    No invoices generated yet. Click "Create New Bill" to make your first paperless bill!
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


import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  MapPin, 
  Plus, 
  ArrowRight, 
  Receipt, 
  Wallet, 
  Printer, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  X,
  CreditCard,
  Building2
} from 'lucide-react';
import { Customer, Invoice, PaymentRecord, LedgerEntry, CompanyProfile, UserRole } from '../types';
import { formatCurrency, formatNumber } from '../utils/calculator';
import { apiService } from '../services/api';

interface CustomerLedgerViewProps {
  customers: Customer[];
  profile: CompanyProfile;
  selectedCustomerId?: string;
  userRole?: UserRole;
  onRefresh: () => void;
  onPrintInvoice: (inv: Invoice) => void;
}

export const CustomerLedgerView: React.FC<CustomerLedgerViewProps> = ({
  customers,
  profile,
  selectedCustomerId,
  userRole = 'ADMIN',
  onRefresh,
  onPrintInvoice
}) => {
  const [search, setSearch] = useState<string>('');
  const [filterDueOnly, setFilterDueOnly] = useState<boolean>(false);
  const [activeCustomerId, setActiveCustomerId] = useState<string>(
    selectedCustomerId || (customers.length > 0 ? customers[0].id : '')
  );

  // Deep customer ledger data state
  const [ledgerData, setLedgerData] = useState<{
    customer: Customer;
    totalBilled: number;
    totalPaid: number;
    outstandingDue: number;
    invoices: Invoice[];
    payments: PaymentRecord[];
    ledger: LedgerEntry[];
  } | null>(null);
  const [isLoadingLedger, setIsLoadingLedger] = useState<boolean>(false);

  // Add Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentRecord['paymentMode']>('Cash');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);

  // Add New Customer Modal State
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustAddress, setNewCustAddress] = useState<string>('');
  const [newCustNotes, setNewCustNotes] = useState<string>('');

  // Payment Receipt Print Modal State
  const [receiptToPrint, setReceiptToPrint] = useState<PaymentRecord | null>(null);

  // Sync active customer if prop changes
  useEffect(() => {
    if (selectedCustomerId) {
      setActiveCustomerId(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  // Load ledger details whenever activeCustomerId changes
  useEffect(() => {
    if (!activeCustomerId) return;
    setIsLoadingLedger(true);
    apiService.getCustomerLedger(activeCustomerId)
      .then(data => {
        setLedgerData(data);
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        setIsLoadingLedger(false);
      });
  }, [activeCustomerId]);

  // Filter customers by search and due
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchesDue = filterDueOnly ? (c.outstandingDue || 0) > 0 : true;
    return matchesSearch && matchesDue;
  });

  // Handle Add Payment Submit
  const handleAddPayment = async () => {
    if (!paymentAmount || paymentAmount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const recorded = await apiService.addPayment({
        customerId: activeCustomerId,
        customerName: ledgerData?.customer.name,
        invoiceId: paymentInvoiceId || undefined,
        amount: paymentAmount,
        paymentMode,
        paymentRef,
        notes: paymentNotes
      });

      setIsPaymentModalOpen(false);
      setReceiptToPrint(recorded);
      setPaymentAmount(0);
      setPaymentRef('');
      setPaymentNotes('');
      onRefresh();

      // Refresh current customer ledger
      const updated = await apiService.getCustomerLedger(activeCustomerId);
      setLedgerData(updated);
    } catch (err) {
      alert('Failed to record payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Handle Add Customer Submit
  const handleCreateCustomer = async () => {
    if (!newCustName.trim() || !newCustPhone.trim()) {
      alert('Customer Name and Phone number are required.');
      return;
    }
    try {
      const created = await apiService.addCustomer({
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
        address: newCustAddress.trim(),
        notes: newCustNotes.trim()
      });
      setIsNewCustModalOpen(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustAddress('');
      setNewCustNotes('');
      onRefresh();
      setActiveCustomerId(created.id);
    } catch (err) {
      alert('Failed to create customer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
              Khata &amp; Ledger Tracking
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Running Balances &bull; Payment Vouchers
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Customer Ledgers &amp; Account Statements
          </h2>
        </div>

        <button
          onClick={() => setIsNewCustModalOpen(true)}
          className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Main 2-Column Layout: Customer Directory Left, Statement Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customer Search & Directory List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500 font-semibold">
              Customers ({filteredCustomers.length})
            </span>
            <button
              onClick={() => setFilterDueOnly(!filterDueOnly)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                filterDueOnly
                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filterDueOnly ? 'Showing Dues Only' : 'Filter Dues'}
            </button>
          </div>

          {/* List of Customers */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredCustomers.map(cust => {
              const isSelected = cust.id === activeCustomerId;
              const hasDue = (cust.outstandingDue || 0) > 0;
              return (
                <div
                  key={cust.id}
                  onClick={() => setActiveCustomerId(cust.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-brand-50/60 border-brand-500 ring-1 ring-brand-500 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 leading-tight">
                        {cust.name}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{cust.phone}</span>
                      </p>
                    </div>
                    {hasDue ? (
                      <span className="bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                        Due: ₹{formatNumber(cust.outstandingDue || 0)}
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Clear
                      </span>
                    )}
                  </div>
                  {cust.address && (
                    <div className="text-[11px] text-slate-500 truncate mt-1 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                      <span>{cust.address}</span>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredCustomers.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                No matching customers found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer Detailed Dashboard & Ledger Statement (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {ledgerData ? (
            <>
              {/* Customer Profile & Lifetime Summary Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Customer Profile &amp; Khata
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-0.5">
                      {ledgerData.customer.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap">
                      <span className="font-mono flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {ledgerData.customer.phone}
                      </span>
                      {ledgerData.customer.address && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {ledgerData.customer.address}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add Payment Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setPaymentAmount(ledgerData.outstandingDue > 0 ? ledgerData.outstandingDue : 0);
                        setIsPaymentModalOpen(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>Add Payment</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Print Customer Ledger Statement"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Statement</span>
                    </button>
                  </div>
                </div>

                {/* 3 Metrics: Total Billed, Total Paid, Balance Due */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5">
                    <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                      Lifetime Billed
                    </div>
                    <div className="text-xl font-black text-blue-950 font-mono mt-1">
                      {formatCurrency(ledgerData.totalBilled)}
                    </div>
                    <div className="text-[11px] text-blue-600 mt-0.5">
                      {ledgerData.invoices.length} invoices generated
                    </div>
                  </div>

                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5">
                    <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                      Total Payments Paid
                    </div>
                    <div className="text-xl font-black text-emerald-950 font-mono mt-1">
                      {formatCurrency(ledgerData.totalPaid)}
                    </div>
                    <div className="text-[11px] text-emerald-600 mt-0.5">
                      {ledgerData.payments.length} payment receipts logged
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${
                    ledgerData.outstandingDue > 0
                      ? 'bg-rose-50/60 border-rose-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className={`text-[11px] font-bold uppercase tracking-wider ${
                      ledgerData.outstandingDue > 0 ? 'text-rose-700' : 'text-slate-600'
                    }`}>
                      Current Outstanding Due
                    </div>
                    <div className={`text-xl font-black font-mono mt-1 ${
                      ledgerData.outstandingDue > 0 ? 'text-rose-700' : 'text-slate-800'
                    }`}>
                      {formatCurrency(ledgerData.outstandingDue)}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {ledgerData.outstandingDue > 0 ? 'Pending recovery' : 'All accounts settled'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chronological Account Ledger Table with Running Balance */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      Chronological Ledger Statement
                    </h4>
                    <p className="text-xs text-slate-500">
                      Debit (Invoices) vs Credit (Payments) with running balance
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {profile.businessName}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Reference #</th>
                        <th className="py-2.5 px-3 min-w-[180px]">Particulars / Details</th>
                        <th className="py-2.5 px-3 text-right">Debit (Bill ₹)</th>
                        <th className="py-2.5 px-3 text-right">Credit (Paid ₹)</th>
                        <th className="py-2.5 px-3 text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ledgerData.ledger.map((entry, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-slate-500">
                            {entry.date}
                          </td>
                          <td className="py-2.5 px-3 font-bold">
                            {entry.type === 'INVOICE' ? (
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-mono">
                                INVOICE
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-mono">
                                PAYMENT
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                            {entry.refNumber}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {entry.description}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                            {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black">
                            <span className={entry.runningBalance > 0 ? 'text-rose-600' : 'text-slate-800'}>
                              {formatCurrency(entry.runningBalance)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {ledgerData.ledger.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No ledger transactions recorded yet for this customer.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Customer Past Invoices List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900">
                    Past Invoices &amp; Glass Measurements
                  </h4>
                  <span className="text-xs text-slate-500">
                    {ledgerData.invoices.length} Bills
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                        <th className="py-2.5 px-3">Bill #</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Items Summary</th>
                        <th className="py-2.5 px-3 text-right">Grand Total</th>
                        <th className="py-2.5 px-3 text-right">Balance Due</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ledgerData.invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-brand-700">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">
                            {inv.date}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {inv.items.map(i => `${i.name} (${i.areaSqFt} sqft)`).join(', ')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(inv.grandTotal)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                            {formatCurrency(inv.balanceDue)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => onPrintInvoice(inv)}
                              className="text-brand-600 hover:text-brand-700 font-semibold p-1 hover:bg-brand-50 rounded"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              Select a customer from the left list to view their ledger statement.
            </div>
          )}
        </div>
      </div>

      {/* Add Payment Modal */}
      {isPaymentModalOpen && ledgerData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Record Customer Payment</h3>
                <p className="text-xs text-slate-500">{ledgerData.customer.name}</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Payment Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  placeholder="Enter amount in ₹"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base font-mono font-bold text-emerald-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
                {ledgerData.outstandingDue > 0 && (
                  <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                    <span>Outstanding Due: <strong>{formatCurrency(ledgerData.outstandingDue)}</strong></span>
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(ledgerData.outstandingDue)}
                      className="text-brand-600 hover:underline font-bold"
                    >
                      Pay Full Due
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Link to Invoice (Optional)
                </label>
                <select
                  value={paymentInvoiceId}
                  onChange={(e) => setPaymentInvoiceId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="">-- Apply to Customer General Account --</option>
                  {ledgerData.invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} (Total: ₹{inv.grandTotal} | Due: ₹{inv.balanceDue})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI (GPay/PhonePe)</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Ref / UTR / Cheque #
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. UPI Ref"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Payment Notes / Receipt Remarks
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Received at site during glass delivery"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPayment}
                disabled={isSubmittingPayment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                {isSubmittingPayment ? 'Recording...' : 'Record Payment & Generate Voucher'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {isNewCustModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Add New Customer</h3>
                <p className="text-xs text-slate-500">M.K. Enterprises Client Registry</p>
              </div>
              <button
                onClick={() => setIsNewCustModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Customer / Builder Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Modern Builders & Architects"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Site / Delivery Address
                </label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="e.g. Shadnagar Road, Pargi"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Special Notes
                </label>
                <input
                  type="text"
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                  placeholder="e.g. Toughened glass railing project"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsNewCustModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomer}
                className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm"
              >
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Receipt Voucher Modal */}
      {receiptToPrint && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="no-print flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Payment Receipt Voucher
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Receipt
                </button>
                <button
                  onClick={() => setReceiptToPrint(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Voucher Body */}
            <div className="border border-slate-300 p-5 rounded-xl space-y-4 text-xs">
              <div className="text-center border-b border-slate-200 pb-3">
                <h3 className="text-lg font-black text-slate-900">{profile.businessName}</h3>
                <p className="text-[11px] text-slate-600">{profile.address}</p>
                <p className="text-[11px] font-mono font-bold text-slate-700">
                  Phone: {profile.phones.join(', ')}
                </p>
                <div className="inline-block bg-slate-100 text-slate-800 font-bold px-3 py-0.5 rounded text-[10px] uppercase tracking-wider mt-2">
                  Official Payment Receipt
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Receipt No: <strong className="font-mono">{receiptToPrint.receiptNumber}</strong></div>
                <div className="text-right">Date: <strong className="font-mono">{receiptToPrint.date}</strong></div>
                <div>Customer: <strong>{receiptToPrint.customerName}</strong></div>
                <div className="text-right">Mode: <strong>{receiptToPrint.paymentMode}</strong></div>
                {receiptToPrint.invoiceNumber && (
                  <div className="col-span-2">Against Bill No: <strong className="font-mono">{receiptToPrint.invoiceNumber}</strong></div>
                )}
                {receiptToPrint.paymentRef && (
                  <div className="col-span-2">Reference: <span className="font-mono">{receiptToPrint.paymentRef}</span></div>
                )}
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
                <span className="font-bold text-emerald-900">Amount Received:</span>
                <span className="text-lg font-black text-emerald-900 font-mono">
                  {formatCurrency(receiptToPrint.amount)}
                </span>
              </div>

              <div className="pt-6 flex justify-between text-[11px] text-slate-500">
                <div>Received with thanks</div>
                <div className="text-right">
                  <div className="font-bold text-slate-800 mb-6">For {profile.businessName}</div>
                  <div>Authorized Signatory</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


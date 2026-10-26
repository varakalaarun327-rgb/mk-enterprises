import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Calculator, 
  Receipt, 
  Printer, 
  Share2, 
  Save, 
  RotateCcw, 
  Check, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  Invoice, 
  MeasurementItem, 
  Customer, 
  InventoryItem, 
  CompanyProfile,
  InvoiceType,
  PaymentMode,
  CalcType
} from '../types';
import { calculateArea, formatCurrency, generateWhatsAppMessage } from '../utils/calculator';

interface BillingViewProps {
  customers: Customer[];
  inventory: InventoryItem[];
  profile: CompanyProfile;
  initialInvoice?: Invoice | null;
  onSaveInvoice: (invoiceData: Partial<Invoice> & { deductStock?: boolean }) => Promise<Invoice>;
  onPrintInvoice: (invoice: Invoice) => void;
  onCustomerSelect?: (cust: Customer) => void;
}

const DEFAULT_LINE_ITEM: MeasurementItem = {
  id: 'row-1',
  category: 'Glass Sheets',
  name: '12mm Toughened Clear Glass',
  description: 'Balcony Front Railing Panels',
  length: 72,
  lengthUnit: 'inch',
  width: 36,
  widthUnit: 'inch',
  quantity: 2,
  calcType: 'sqft',
  areaSqFt: 36, // (72*36/144)*2 = 36 sqft
  rate: 190,
  extraWorkType: 'Edge Polishing & Hole Cutouts',
  extraCharges: 800,
  lineTotal: 7640 // 36 * 190 + 800
};

export const BillingView: React.FC<BillingViewProps> = ({
  customers,
  inventory,
  profile,
  initialInvoice,
  onSaveInvoice,
  onPrintInvoice
}) => {
  // Invoice Header State
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('Tax Invoice');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Customer State
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [siteAddress, setSiteAddress] = useState<string>('');

  // Items Matrix State
  const [items, setItems] = useState<MeasurementItem[]>([
    { ...DEFAULT_LINE_ITEM, id: `row-${Date.now()}` }
  ]);

  // Pricing & GST State
  const [discount, setDiscount] = useState<number>(0);
  const [transportation, setTransportation] = useState<number>(0);
  const [gstMode, setGstMode] = useState<'18' | '12' | '5' | '0' | 'custom'>('18');
  const [customGstAmount, setCustomGstAmount] = useState<number>(0);

  // Payment Recording State
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [deductStock, setDeductStock] = useState<boolean>(true);

  // Status & Saved State
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Load initial invoice if provided (e.g. for re-editing or duplicating)
  useEffect(() => {
    if (initialInvoice) {
      setInvoiceType(initialInvoice.type);
      setInvoiceNumber(initialInvoice.invoiceNumber);
      setInvoiceDate(initialInvoice.date);
      setCustomerName(initialInvoice.customerName);
      setCustomerPhone(initialInvoice.customerPhone);
      setSiteAddress(initialInvoice.siteAddress);
      setSelectedCustomerId(initialInvoice.customerId);
      setItems(initialInvoice.items || []);
      setDiscount(initialInvoice.discount || 0);
      setTransportation(initialInvoice.transportation || 0);
      if (initialInvoice.gstRate === 18) setGstMode('18');
      else if (initialInvoice.gstRate === 12) setGstMode('12');
      else if (initialInvoice.gstRate === 5) setGstMode('5');
      else if (initialInvoice.gstRate === 0) setGstMode('0');
      else {
        setGstMode('custom');
        setCustomGstAmount(initialInvoice.totalGst);
      }
      setPaidAmount(initialInvoice.paidAmount || 0);
      setPaymentMode(initialInvoice.paymentMode || 'Cash');
      setPaymentRef(initialInvoice.paymentRef || '');
      setNotes(initialInvoice.notes || '');
    } else {
      // Auto-suggest next invoice number
      setInvoiceNumber(`MK-${Math.floor(2600 + Math.random() * 500)}`);
    }
  }, [initialInvoice]);

  // When customer is selected from dropdown
  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomerId(cust.id);
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone);
    setSiteAddress(cust.address);
    setCustomerSearch('');
  };

  // Recalculate row area and total whenever dimensions or rate change
  const updateRow = (index: number, updates: Partial<MeasurementItem>) => {
    const updatedItems = [...items];
    const row = { ...updatedItems[index], ...updates };

    // Recalculate Area
    const area = calculateArea(
      row.length,
      row.lengthUnit,
      row.width,
      row.widthUnit,
      row.quantity,
      row.calcType
    );
    row.areaSqFt = area;

    // Recalculate Line Total: (area * rate) + extraCharges
    const baseTotal = (Number(row.areaSqFt) || 0) * (Number(row.rate) || 0);
    const extra = Number(row.extraCharges) || 0;
    row.lineTotal = Number((baseTotal + extra).toFixed(2));

    updatedItems[index] = row;
    setItems(updatedItems);
  };

  // Handle inventory item selection for a row
  const handleItemSelect = (index: number, invItemId: string) => {
    const inv = inventory.find(i => i.id === invItemId);
    if (!inv) return;

    let defaultCalcType: CalcType = 'sqft';
    let lengthUnit: MeasurementItem['lengthUnit'] = 'inch';
    let widthUnit: MeasurementItem['widthUnit'] = 'inch';

    if (inv.category === 'Aluminium Profiles' || inv.category === 'UPVC Profiles') {
      defaultCalcType = 'rft';
    } else if (inv.category === 'Hardware & Fittings') {
      defaultCalcType = 'pcs';
      lengthUnit = 'pcs';
      widthUnit = 'pcs';
    }

    updateRow(index, {
      inventoryId: inv.id,
      category: inv.category,
      name: inv.name,
      rate: inv.sellingRate,
      calcType: defaultCalcType,
      lengthUnit,
      widthUnit,
      description: inv.notes || inv.name
    });
  };

  // Add Row
  const handleAddRow = () => {
    const newRow: MeasurementItem = {
      id: `row-${Date.now()}`,
      category: 'Glass Sheets',
      name: '12mm Toughened Clear Glass',
      description: 'Panel',
      length: 48,
      lengthUnit: 'inch',
      width: 36,
      widthUnit: 'inch',
      quantity: 1,
      calcType: 'sqft',
      areaSqFt: 12,
      rate: 190,
      extraWorkType: 'Edge Polishing',
      extraCharges: 0,
      lineTotal: 2280
    };
    setItems([...items, newRow]);
  };

  // Duplicate Row
  const handleDuplicateRow = (index: number) => {
    const itemToDuplicate = items[index];
    const duplicated: MeasurementItem = {
      ...itemToDuplicate,
      id: `row-${Date.now()}`
    };
    const newItems = [...items];
    newItems.splice(index + 1, 0, duplicated);
    setItems(newItems);
  };

  // Delete Row
  const handleDeleteRow = (index: number) => {
    if (items.length === 1) {
      alert('Invoice must have at least one measurement item.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Summary Calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
  const extraLabourTotal = items.reduce((sum, item) => sum + (Number(item.extraCharges) || 0), 0);
  const totalAreaSqFt = items
    .filter(i => i.calcType === 'sqft')
    .reduce((sum, item) => sum + (Number(item.areaSqFt) || 0), 0);

  const taxableAmount = Math.max(0, subtotal + Number(transportation || 0) - Number(discount || 0));

  let gstRate = 18;
  let cgst = 0;
  let sgst = 0;
  let totalGst = 0;

  if (gstMode === '0' || invoiceType === 'Estimate / Quotation') {
    gstRate = 0;
    cgst = 0;
    sgst = 0;
    totalGst = 0;
  } else if (gstMode === 'custom') {
    gstRate = 0;
    totalGst = Number(customGstAmount) || 0;
    cgst = totalGst / 2;
    sgst = totalGst / 2;
  } else {
    gstRate = Number(gstMode);
    cgst = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
    sgst = Number(((taxableAmount * (gstRate / 2)) / 100).toFixed(2));
    totalGst = Number((cgst + sgst).toFixed(2));
  }

  const grandTotal = Math.round(taxableAmount + totalGst);
  const balanceDue = Math.max(0, grandTotal - Number(paidAmount || 0));

  // Save Invoice Handler
  const handleSave = async (andPrint = false) => {
    if (!customerName.trim()) {
      alert('Please enter customer name');
      return;
    }
    if (!customerPhone.trim()) {
      alert('Please enter customer phone number');
      return;
    }

    setIsSaving(true);
    try {
      const invoicePayload: Partial<Invoice> & { deductStock?: boolean } = {
        invoiceNumber,
        type: invoiceType,
        customerId: selectedCustomerId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        siteAddress: siteAddress.trim(),
        date: invoiceDate,
        items,
        subtotal,
        extraLabourTotal,
        transportation: Number(transportation || 0),
        discount: Number(discount || 0),
        taxableAmount,
        gstRate,
        cgst,
        sgst,
        totalGst,
        grandTotal,
        paidAmount: Number(paidAmount || 0),
        balanceDue,
        status: Number(paidAmount) >= grandTotal && grandTotal > 0 ? 'Paid' : (Number(paidAmount) > 0 ? 'Partial' : 'Unpaid'),
        paymentMode,
        paymentRef: paymentRef.trim(),
        notes: notes.trim(),
        deductStock
      };

      const saved = await onSaveInvoice(invoicePayload);
      setSavedInvoice(saved);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);

      if (andPrint) {
        onPrintInvoice(saved);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save invoice. Please check the fields.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetForm = () => {
    if (confirm('Clear form and start a fresh bill?')) {
      setCustomerName('');
      setCustomerPhone('');
      setSiteAddress('');
      setSelectedCustomerId('');
      setItems([{ ...DEFAULT_LINE_ITEM, id: `row-${Date.now()}` }]);
      setDiscount(0);
      setTransportation(0);
      setPaidAmount(0);
      setPaymentRef('');
      setNotes('');
      setSavedInvoice(null);
      setInvoiceNumber(`MK-${Math.floor(2600 + Math.random() * 500)}`);
    }
  };

  const handleShareWhatsApp = () => {
    if (!savedInvoice) {
      alert('Please save the invoice first to generate a bill share link.');
      return;
    }
    const encoded = generateWhatsAppMessage(savedInvoice, profile);
    const cleanPhone = savedInvoice.customerPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${phoneWithCountry}?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-brand-50 text-brand-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-brand-200 uppercase tracking-wider">
              Paperless Bill Book
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Auto Sq. Ft. &bull; Dynamic GST
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Digital Measurement &amp; Smart Billing
          </h2>
        </div>

        {/* Invoice Type & Mode Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['Tax Invoice', 'Estimate / Quotation', 'Delivery Challan'] as const).map(t => (
            <button
              key={t}
              onClick={() => {
                setInvoiceType(t);
                if (t === 'Estimate / Quotation') setGstMode('0');
                else if (gstMode === '0') setGstMode('18');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                invoiceType === t
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Customer & Bill Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand-600" />
            <span>Customer &amp; Site Details</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">M.K. Enterprises Pargi</span>
        </div>

        {/* Customer Search / Quick Select dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Customer Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                setCustomerSearch(e.target.value);
              }}
              placeholder="e.g. Ramesh Reddy / Sri Venkateshwara Builders"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />

            {/* Auto-suggest dropdown from existing customers */}
            {customerSearch && customerSearch.length > 1 && !selectedCustomerId && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                <div className="p-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Matching Existing Customers:
                </div>
                {customers
                  .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch))
                  .slice(0, 4)
                  .map(c => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="px-3 py-2 hover:bg-brand-50 cursor-pointer rounded-lg text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{c.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{c.phone}</div>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                        Select
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Phone / Mobile Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="10-digit mobile"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Billing Date
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
          <div className="md:col-span-3">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Site / Project Delivery Address
            </label>
            <input
              type="text"
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
              placeholder="e.g. Royal City Layout, Near RTO Office, Pargi"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Invoice / Bill No.
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-brand-700 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Measurement Entry Matrix (Row-by-Row Table) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-brand-600" />
              <span>Measurement Entry Matrix</span>
            </h3>
            <p className="text-xs text-slate-500">
              Enter Length &amp; Width in inches, mm or feet. Sq. Ft. &amp; Totals calculate dynamically.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddRow}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Measurement Row</span>
            </button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3 min-w-[200px]">Item &amp; Description</th>
                <th className="py-2.5 px-3 min-w-[130px]">Length / Height</th>
                <th className="py-2.5 px-3 min-w-[130px]">Width / Depth</th>
                <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                <th className="py-2.5 px-3 w-28 text-right">Calc Area / Unit</th>
                <th className="py-2.5 px-3 w-28 text-right">Rate (₹)</th>
                <th className="py-2.5 px-3 min-w-[160px]">Extra Work / Labour</th>
                <th className="py-2.5 px-3 w-28 text-right">Line Total</th>
                <th className="py-2.5 px-3 w-16 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {items.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Row Number */}
                  <td className="py-3 px-3 text-center font-bold text-slate-400">
                    {index + 1}
                  </td>

                  {/* Item Selection & Description */}
                  <td className="py-3 px-3 space-y-1.5">
                    {/* Item Dropdown */}
                    <select
                      value={item.inventoryId || ''}
                      onChange={(e) => handleItemSelect(index, e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="">-- Select Standard Item --</option>
                      {inventory.map(inv => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name} (Stock: {inv.currentStock} {inv.unit} | ₹{inv.sellingRate}/{inv.unit})
                        </option>
                      ))}
                    </select>

                    {/* Custom Name or Notes input */}
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateRow(index, { description: e.target.value })}
                      placeholder="Location / details (e.g. Living room balcony panel)"
                      className="w-full bg-transparent border-b border-slate-200 focus:border-brand-500 px-1 py-0.5 text-[11px] text-slate-600 focus:outline-hidden"
                    />
                  </td>

                  {/* Length / Height */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={item.length || ''}
                        onChange={(e) => updateRow(index, { length: Number(e.target.value) })}
                        placeholder="Length"
                        className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-mono font-bold text-slate-800 text-xs text-right"
                      />
                      <select
                        value={item.lengthUnit}
                        onChange={(e) => updateRow(index, { lengthUnit: e.target.value as any })}
                        className="bg-slate-100 border border-slate-200 rounded-lg px-1.5 py-1.5 text-[11px] font-semibold text-slate-700"
                      >
                        <option value="inch">in</option>
                        <option value="mm">mm</option>
                        <option value="feet">ft</option>
                        <option value="pcs">pcs</option>
                      </select>
                    </div>
                  </td>

                  {/* Width / Depth */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={item.width || ''}
                        onChange={(e) => updateRow(index, { width: Number(e.target.value) })}
                        placeholder="Width"
                        disabled={item.calcType === 'pcs' || item.calcType === 'rft'}
                        className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-mono font-bold text-slate-800 text-xs text-right disabled:opacity-40"
                      />
                      <select
                        value={item.widthUnit}
                        onChange={(e) => updateRow(index, { widthUnit: e.target.value as any })}
                        disabled={item.calcType === 'pcs' || item.calcType === 'rft'}
                        className="bg-slate-100 border border-slate-200 rounded-lg px-1.5 py-1.5 text-[11px] font-semibold text-slate-700 disabled:opacity-40"
                      >
                        <option value="inch">in</option>
                        <option value="mm">mm</option>
                        <option value="feet">ft</option>
                        <option value="pcs">pcs</option>
                      </select>
                    </div>
                  </td>

                  {/* Quantity */}
                  <td className="py-3 px-3 text-center">
                    <input
                      type="number"
                      value={item.quantity || ''}
                      min="1"
                      onChange={(e) => updateRow(index, { quantity: Math.max(1, Number(e.target.value)) })}
                      className="w-14 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-mono font-bold text-center text-xs"
                    />
                  </td>

                  {/* Calculated Area / Unit */}
                  <td className="py-3 px-3 text-right">
                    <div className="font-mono font-extrabold text-brand-900 text-xs">
                      {item.areaSqFt} {item.calcType === 'sqft' ? 'sq.ft' : (item.calcType === 'rft' ? 'Rft' : 'Pcs')}
                    </div>
                    <select
                      value={item.calcType}
                      onChange={(e) => updateRow(index, { calcType: e.target.value as CalcType })}
                      className="text-[10px] text-slate-500 bg-transparent border-0 cursor-pointer p-0 font-medium hover:text-slate-800"
                    >
                      <option value="sqft">Sq. Ft Mode</option>
                      <option value="rft">Running Ft (Rft)</option>
                      <option value="pcs">Piece (Pcs)</option>
                    </select>
                  </td>

                  {/* Rate */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-slate-400 font-mono text-[11px]">₹</span>
                      <input
                        type="number"
                        value={item.rate || ''}
                        onChange={(e) => updateRow(index, { rate: Number(e.target.value) })}
                        placeholder="Rate"
                        className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 font-mono font-bold text-right text-xs"
                      />
                    </div>
                  </td>

                  {/* Extra Line Work & Charges */}
                  <td className="py-3 px-3 space-y-1">
                    <input
                      type="text"
                      value={item.extraWorkType || ''}
                      onChange={(e) => updateRow(index, { extraWorkType: e.target.value })}
                      placeholder="e.g. Edge Polish, Holes"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-700"
                    />
                    <div className="flex items-center gap-1 justify-end">
                      <span className="text-[10px] text-slate-500">+₹</span>
                      <input
                        type="number"
                        value={item.extraCharges || ''}
                        onChange={(e) => updateRow(index, { extraCharges: Number(e.target.value) })}
                        placeholder="Charges"
                        className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-0.5 font-mono text-right text-[11px]"
                      />
                    </div>
                  </td>

                  {/* Line Total */}
                  <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900 text-sm">
                    {formatCurrency(item.lineTotal)}
                  </td>

                  {/* Row Actions */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleDuplicateRow(index)}
                        title="Duplicate row"
                        className="p-1 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRow(index)}
                        title="Delete row"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Matrix Footer Area Total summary strip */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-4 flex-wrap">
            <span>
              Total Rows: <strong className="text-slate-900">{items.length}</strong>
            </span>
            <span>&bull;</span>
            <span>
              Total Glass Chargeable Area: <strong className="text-brand-700 font-mono">{totalAreaSqFt.toFixed(2)} Sq. Ft.</strong>
            </span>
            {extraLabourTotal > 0 && (
              <>
                <span>&bull;</span>
                <span>
                  Total Processing Charges: <strong className="text-slate-900 font-mono">₹{extraLabourTotal}</strong>
                </span>
              </>
            )}
          </div>

          <div className="text-right">
            <span>Subtotal: </span>
            <span className="font-extrabold text-slate-900 font-mono text-sm ml-1">
              {formatCurrency(subtotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Financials, GST Adjustments, and Payment Recording Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Additional Logistics & GST Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Tax, Freight &amp; Deductions
            </h3>
            <p className="text-xs text-slate-500">
              Adjustable 18% GST (9% CGST + 9% SGST), transport, and discounts
            </p>
          </div>

          {/* Freight & Discount inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Transportation / Site Delivery (₹)
              </label>
              <input
                type="number"
                value={transportation || ''}
                onChange={(e) => setTransportation(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Discount / Round-off Deduction (₹)
              </label>
              <input
                type="number"
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-semibold text-rose-600"
              />
            </div>
          </div>

          {/* GST Controls */}
          <div className="pt-2">
            <label className="text-xs font-bold text-slate-700 block mb-2 flex items-center justify-between">
              <span>GST Calculation Mode</span>
              <span className="text-[11px] text-teal-600 font-medium">Standard Default: 18%</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: '18', label: '18% GST (Default)' },
                { id: '12', label: '12% GST' },
                { id: '5', label: '5% GST' },
                { id: '0', label: '0% Non-GST' },
                { id: 'custom', label: 'Manual GST' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setGstMode(opt.id as any)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center ${
                    gstMode === opt.id
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Custom Manual GST adjustment input */}
            {gstMode === 'custom' && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
                <div>
                  <div className="text-xs font-bold text-amber-900">Flat Manual GST Amount (₹)</div>
                  <div className="text-[11px] text-amber-700">Enter custom lumpsum tax</div>
                </div>
                <input
                  type="number"
                  value={customGstAmount || ''}
                  onChange={(e) => setCustomGstAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-32 bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-right"
                />
              </div>
            )}
          </div>

          {/* Notes and Stock Option */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Order Notes / Fabrication Instructions
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Glass delivered to site. Installation scheduled for Friday."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={deductStock}
                onChange={(e) => setDeductStock(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              />
              <span className="text-xs font-semibold text-slate-700">
                Automatically deduct glass &amp; aluminium items from live inventory stock
              </span>
            </label>
          </div>
        </div>

        {/* Right Side: Totals Summary & Payment Recording */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Bill Summary &amp; Payment Details
              </h3>
              <p className="text-xs text-slate-500">Live breakdown with balance due auto-calculation</p>
            </div>

            {/* Calculations Breakdown */}
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              {transportation > 0 && (
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Transportation / Delivery:</span>
                  <span className="font-mono font-bold text-slate-900">+{formatCurrency(transportation)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between py-1 text-rose-600">
                  <span>Discount:</span>
                  <span className="font-mono font-bold">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 text-slate-700 font-semibold border-t border-slate-100 pt-2">
                <span>Taxable Amount:</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(taxableAmount)}</span>
              </div>

              {/* GST Rows */}
              {totalGst > 0 ? (
                <>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>CGST ({gstRate > 0 ? gstRate / 2 : 'Manual'}%):</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(cgst)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>SGST ({gstRate > 0 ? gstRate / 2 : 'Manual'}%):</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(sgst)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-teal-700 font-semibold">
                    <span>Total GST Amount:</span>
                    <span className="font-mono font-bold">{formatCurrency(totalGst)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between py-1 text-slate-400 italic">
                  <span>GST:</span>
                  <span>Non-GST (0%)</span>
                </div>
              )}

              {/* Grand Total Highlight */}
              <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-center justify-between mt-3">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-teal-300 font-bold block">
                    Total Bill Amount
                  </span>
                  <span className="text-xs text-slate-400">Net payable by customer</span>
                </div>
                <div className="text-2xl font-black font-mono text-white">
                  {formatCurrency(grandTotal)}
                </div>
              </div>
            </div>

            {/* Advance / Paid Amount & Balance Due Inputs */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Advance / Paid Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={paidAmount || ''}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Balance Due (Auto)
                  </label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-extrabold text-right">
                    {balanceDue > 0 ? (
                      <span className="text-rose-600">{formatCurrency(balanceDue)}</span>
                    ) : (
                      <span className="text-emerald-700">Fully Paid</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT / RTGS)</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Payment Ref / UTR / Cheque #
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. UPI/62918294 or Cheque #10294"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Bill saved successfully as {savedInvoice?.invoiceNumber}!
                </span>
                <button
                  onClick={handleShareWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1"
                >
                  <Share2 className="w-3 h-3" />
                  Share WhatsApp
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Bill'}</span>
              </button>

              <button
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="flex-1 bg-navy-900 hover:bg-navy-800 text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <Printer className="w-4 h-4 text-teal-400" />
                <span>Save &amp; Print A4</span>
              </button>

              {savedInvoice && (
                <button
                  onClick={handleShareWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  title="Share invoice on WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
              )}

              <button
                onClick={handleResetForm}
                className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                title="Reset Bill Form"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


import React from 'react';
import { X, Printer, Share2, Download, Building2, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import { Invoice, CompanyProfile } from '../types';
import { formatCurrency, numberToIndianWords, generateWhatsAppMessage } from '../utils/calculator';

interface InvoicePrintModalProps {
  invoice: Invoice | null;
  profile: CompanyProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  invoice,
  profile,
  isOpen,
  onClose
}) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const encoded = generateWhatsAppMessage(invoice, profile);
    const cleanPhone = invoice.customerPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${phoneWithCountry}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Controls Bar (hidden during print) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-teal-400 text-sm">
              {invoice.invoiceNumber}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-xs text-slate-300 font-medium">
              {invoice.type} &bull; {invoice.customerName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4 / Save PDF</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable A4 Body */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-white print:p-0 print:m-0 text-slate-900">
          <div className="border border-slate-300 print:border-black rounded-xl p-6 sm:p-8 space-y-6">
            {/* Header: Company Profile */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-slate-900 pb-5 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-navy-900 text-white flex items-center justify-center print:border print:border-black">
                    <Building2 className="w-5 h-5 text-teal-400 print:text-black" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                    {profile.businessName}
                  </h1>
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  {profile.tagline}
                </p>
                <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-500 print:hidden" />
                    <span>{profile.address}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-500 print:hidden" />
                    <span>Mobile: {profile.phones.join(', ')}</span>
                  </p>
                  {profile.gstin && (
                    <p className="font-mono font-bold text-slate-800">
                      GSTIN: {profile.gstin} | State Code: {profile.stateCode} ({profile.state})
                    </p>
                  )}
                </div>
              </div>

              {/* Invoice Meta Box */}
              <div className="text-right space-y-1 self-start sm:self-auto">
                <div className="inline-block bg-slate-900 print:bg-black text-white px-3 py-1 rounded text-xs font-black uppercase tracking-wider">
                  {invoice.type.toUpperCase()}
                </div>
                <div className="pt-2 text-xs space-y-0.5">
                  <div className="font-mono text-sm font-bold text-slate-900">
                    Bill No: {invoice.invoiceNumber}
                  </div>
                  <div className="text-slate-600">
                    Date: <strong className="font-mono text-slate-800">{invoice.date}</strong>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Place of Supply: Telangana (36)
                  </div>
                </div>
              </div>
            </div>

            {/* Billed To / Site Address Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 print:bg-transparent print:border print:border-slate-300 p-4 rounded-xl text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Customer (Bill To):
                </span>
                <div className="text-sm font-bold text-slate-900">
                  {invoice.customerName}
                </div>
                <div className="font-mono font-semibold text-slate-700 mt-0.5">
                  Phone: {invoice.customerPhone}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Site / Delivery Location:
                </span>
                <div className="font-medium text-slate-800">
                  {invoice.siteAddress || 'Site Delivery Parji Hub'}
                </div>
                {invoice.notes && (
                  <div className="text-[11px] text-slate-500 italic mt-1">
                    Note: {invoice.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Itemized Measurements Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 print:bg-slate-200 border-b border-slate-300 font-bold text-slate-800 uppercase text-[10px]">
                    <th className="py-2 px-2.5 border-r border-slate-300 w-8 text-center">S.No</th>
                    <th className="py-2 px-2.5 border-r border-slate-300">Description &amp; Specifications</th>
                    <th className="py-2 px-2.5 border-r border-slate-300 text-center w-28">Dimensions (L × W)</th>
                    <th className="py-2 px-2.5 border-r border-slate-300 text-center w-12">Qty</th>
                    <th className="py-2 px-2.5 border-r border-slate-300 text-right w-24">Area / Units</th>
                    <th className="py-2 px-2.5 border-r border-slate-300 text-right w-20">Rate (₹)</th>
                    <th className="py-2 px-2.5 border-r border-slate-300 text-right w-24">Extra Work</th>
                    <th className="py-2 px-2.5 text-right w-28">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id} className="align-top">
                      <td className="py-2 px-2.5 border-r border-slate-300 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-300">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        {item.description && (
                          <div className="text-[11px] text-slate-600 mt-0.5">{item.description}</div>
                        )}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-300 text-center font-mono">
                        {item.calcType === 'pcs' ? (
                          <span>1 Unit</span>
                        ) : item.calcType === 'rft' ? (
                          <span>{item.length} {item.lengthUnit}</span>
                        ) : (
                          <span>
                            {item.length}" × {item.width}"
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-300 text-center font-mono font-bold">
                        {item.quantity}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-300 text-right font-mono font-bold text-slate-800">
                        {item.areaSqFt} {item.calcType === 'sqft' ? 'sq.ft' : (item.calcType === 'rft' ? 'Rft' : 'Pcs')}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-300 text-right font-mono">
                        {item.rate.toFixed(2)}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-300 text-right font-mono text-slate-700">
                        {item.extraCharges > 0 ? (
                          <div>
                            <div>{item.extraCharges.toFixed(2)}</div>
                            {item.extraWorkType && (
                              <div className="text-[10px] text-slate-500">{item.extraWorkType}</div>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                        {item.lineTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary & Bank Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {/* Left Column: Bank Details & Amount in Words */}
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 print:bg-transparent print:border print:border-slate-300 p-3.5 rounded-xl space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Bank Account &amp; UPI for Payment:
                  </div>
                  <div className="font-bold text-slate-900">{profile.bankName}</div>
                  <div>A/C Name: <strong>{profile.accountName}</strong></div>
                  <div className="font-mono">A/C No: <strong>{profile.accountNumber}</strong></div>
                  <div className="font-mono">IFSC Code: <strong>{profile.ifscCode}</strong> ({profile.branch})</div>
                  <div className="pt-1 text-teal-700 font-mono font-bold">
                    UPI ID: {profile.upiId}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 print:bg-transparent border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                    Amount in Words:
                  </span>
                  <div className="font-bold text-slate-900 italic">
                    {numberToIndianWords(invoice.grandTotal)}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 space-y-0.5">
                  <div className="font-bold uppercase tracking-wider text-slate-600">Terms &amp; Conditions:</div>
                  {profile.terms.map((t, i) => (
                    <div key={i}>{t}</div>
                  ))}
                </div>
              </div>

              {/* Right Column: Pricing Breakdown & Payment Balances */}
              <div className="space-y-2 text-xs">
                <div className="border border-slate-300 rounded-xl divide-y divide-slate-200 overflow-hidden">
                  <div className="flex justify-between p-2.5 bg-slate-50">
                    <span className="text-slate-600">Items Subtotal:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(invoice.subtotal)}
                    </span>
                  </div>

                  {invoice.transportation > 0 && (
                    <div className="flex justify-between p-2.5">
                      <span className="text-slate-600">Transportation / Delivery:</span>
                      <span className="font-mono font-bold text-slate-900">
                        +{formatCurrency(invoice.transportation)}
                      </span>
                    </div>
                  )}

                  {invoice.discount > 0 && (
                    <div className="flex justify-between p-2.5 text-rose-600">
                      <span>Discount:</span>
                      <span className="font-mono font-bold">
                        -{formatCurrency(invoice.discount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between p-2.5 font-semibold bg-slate-50">
                    <span>Taxable Value:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(invoice.taxableAmount)}
                    </span>
                  </div>

                  {invoice.totalGst > 0 && (
                    <>
                      <div className="flex justify-between p-2.5 text-slate-600">
                        <span>CGST ({invoice.gstRate > 0 ? invoice.gstRate / 2 : 'Manual'}%):</span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(invoice.cgst)}
                        </span>
                      </div>
                      <div className="flex justify-between p-2.5 text-slate-600">
                        <span>SGST ({invoice.gstRate > 0 ? invoice.gstRate / 2 : 'Manual'}%):</span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(invoice.sgst)}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between p-3 bg-slate-900 text-white font-bold">
                    <span className="text-sm uppercase tracking-wider">Grand Total:</span>
                    <span className="text-lg font-black font-mono">
                      {formatCurrency(invoice.grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Payment History Record on Bill */}
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Paid / Advance Received:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {formatCurrency(invoice.paidAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
                    <span className="font-bold text-slate-800">Net Balance Due:</span>
                    <span className="font-mono font-extrabold text-sm text-rose-600">
                      {formatCurrency(invoice.balanceDue)}
                    </span>
                  </div>
                  {invoice.paymentMode && (
                    <div className="text-[11px] text-slate-500 pt-0.5">
                      Mode: <strong>{invoice.paymentMode}</strong>
                      {invoice.paymentRef ? ` (${invoice.paymentRef})` : ''}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Signatures & Stamp Footer */}
            <div className="pt-8 flex items-end justify-between text-xs">
              <div className="text-center w-40">
                <div className="border-b border-slate-400 mb-1 h-12" />
                <span className="text-slate-600 font-medium">Customer's Signature</span>
              </div>

              <div className="text-center w-56">
                <div className="text-slate-700 font-bold mb-8">
                  For {profile.businessName}
                </div>
                <div className="border-b border-slate-400 mb-1" />
                <span className="text-slate-600 font-medium">Authorized Signatory</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


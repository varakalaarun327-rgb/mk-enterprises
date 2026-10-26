import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Calendar, 
  TrendingUp, 
  Percent, 
  Receipt, 
  Building2,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { CompanyProfile } from '../types';
import { formatCurrency, formatNumber } from '../utils/calculator';
import { apiService } from '../services/api';

interface ReportsViewProps {
  profile: CompanyProfile;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ profile }) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reportData, setReportData] = useState<{
    summary: {
      totalTaxable: number;
      totalCGST: number;
      totalSGST: number;
      totalGST: number;
      totalInvoiceValue: number;
      count: number;
    };
    invoices: Array<{
      invoiceNumber: string;
      date: string;
      customerName: string;
      customerPhone: string;
      gstRate: number;
      taxableAmount: number;
      cgst: number;
      sgst: number;
      totalGst: number;
      grandTotal: number;
    }>;
  } | null>(null);

  const fetchReport = () => {
    apiService.getGstReport(startDate || undefined, endDate || undefined)
      .then(setReportData)
      .catch(console.error);
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const handleExportCSV = () => {
    if (!reportData || reportData.invoices.length === 0) {
      alert('No data to export.');
      return;
    }

    const headers = [
      'Invoice Number',
      'Invoice Date',
      'Customer Name',
      'Phone Number',
      'GST Rate (%)',
      'Taxable Value (INR)',
      'CGST 9% (INR)',
      'SGST 9% (INR)',
      'Total GST (INR)',
      'Total Invoice Value (INR)'
    ];

    const rows = reportData.invoices.map(row => [
      row.invoiceNumber,
      row.date,
      `"${row.customerName.replace(/"/g, '""')}"`,
      row.customerPhone,
      row.gstRate,
      row.taxableAmount.toFixed(2),
      row.cgst.toFixed(2),
      row.sgst.toFixed(2),
      row.totalGst.toFixed(2),
      row.grandTotal.toFixed(2)
    ]);

    // Summary row
    rows.push([]);
    rows.push([
      'TOTALS',
      '',
      '',
      '',
      '',
      reportData.summary.totalTaxable.toFixed(2),
      reportData.summary.totalCGST.toFixed(2),
      reportData.summary.totalSGST.toFixed(2),
      reportData.summary.totalGST.toFixed(2),
      reportData.summary.totalInvoiceValue.toFixed(2)
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MK_Enterprises_GST_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-brand-50 text-brand-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-brand-200 uppercase tracking-wider">
              Tax &amp; Sales Audit
            </span>
            <span className="text-xs text-slate-500 font-mono">
              GSTR-1 &bull; GSTR-3B Ready Summary
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Monthly GST &amp; Sales Reporting
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export to Excel / CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Date Filter Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>Filter Billing Period:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold"
            />
            <span className="text-slate-400 text-xs font-medium">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            All Time
          </button>
          <button
            onClick={() => {
              const now = new Date();
              const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
              const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
              setStartDate(firstDay);
              setEndDate(lastDay);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            This Month
          </button>
        </div>
      </div>

      {/* GST Summary KPI Cards */}
      {reportData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">Total Taxable Sales</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              {formatCurrency(reportData.summary.totalTaxable)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{reportData.summary.count} invoices evaluated</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="text-xs font-semibold text-brand-700 uppercase">CGST Collected (9%)</div>
            <div className="text-2xl font-black text-brand-700 font-mono mt-1">
              {formatCurrency(reportData.summary.totalCGST)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Central GST liability</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="text-xs font-semibold text-teal-700 uppercase">SGST Collected (9%)</div>
            <div className="text-2xl font-black text-teal-700 font-mono mt-1">
              {formatCurrency(reportData.summary.totalSGST)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">State GST liability (Telangana 36)</div>
          </div>

          <div className="bg-slate-900 text-white rounded-xl p-4 shadow-xs">
            <div className="text-xs font-semibold text-teal-300 uppercase">Total GST Output Tax</div>
            <div className="text-2xl font-black font-mono mt-1 text-white">
              {formatCurrency(reportData.summary.totalGST)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Total CGST + SGST collected</div>
          </div>
        </div>
      )}

      {/* Tax Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-black text-slate-900">Itemized B2B &amp; B2C Tax Register</h4>
            <p className="text-xs text-slate-500">Taxable turnover, CGST, SGST, and gross turnover</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600">
            GSTIN: {profile.gstin || 'Not registered'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-center">GST Rate</th>
                <th className="py-3 px-4 text-right">Taxable Value</th>
                <th className="py-3 px-4 text-right">CGST (9%)</th>
                <th className="py-3 px-4 text-right">SGST (9%)</th>
                <th className="py-3 px-4 text-right">Total GST</th>
                <th className="py-3 px-4 text-right">Invoice Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData?.invoices.map((inv, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-brand-700">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-500">
                    {inv.date}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    {inv.customerName}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                      {inv.gstRate}%
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(inv.taxableAmount)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                    {formatCurrency(inv.cgst)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                    {formatCurrency(inv.sgst)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-teal-700">
                    {formatCurrency(inv.totalGst)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900">
                    {formatCurrency(inv.grandTotal)}
                  </td>
                </tr>
              ))}
              {reportData?.invoices.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No sales invoices found for this date range.
                  </td>
                </tr>
              )}
            </tbody>
            {reportData && reportData.invoices.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-black border-t-2 border-slate-300 text-xs">
                  <td colSpan={4} className="py-3 px-4 text-right uppercase text-slate-700">
                    TOTALS:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900">
                    {formatCurrency(reportData.summary.totalTaxable)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-brand-700">
                    {formatCurrency(reportData.summary.totalCGST)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-teal-700">
                    {formatCurrency(reportData.summary.totalSGST)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-teal-800">
                    {formatCurrency(reportData.summary.totalGST)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900">
                    {formatCurrency(reportData.summary.totalInvoiceValue)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};


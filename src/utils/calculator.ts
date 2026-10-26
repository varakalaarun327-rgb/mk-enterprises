import { CalcType } from '../types';

/**
 * Calculates area or billable units based on dimensions, unit types and calculation mode.
 */
export function calculateArea(
  length: number,
  lengthUnit: 'inch' | 'mm' | 'feet' | 'pcs',
  width: number,
  widthUnit: 'inch' | 'mm' | 'feet' | 'pcs',
  quantity: number = 1,
  calcType: CalcType = 'sqft'
): number {
  const qty = Number(quantity) || 1;
  const l = Number(length) || 0;
  const w = Number(width) || 0;

  if (calcType === 'pcs') {
    return qty;
  }

  if (calcType === 'rft') {
    // Running feet calculation: convert length to feet and multiply by quantity
    let lengthInFeet = 0;
    if (lengthUnit === 'inch') {
      lengthInFeet = l / 12;
    } else if (lengthUnit === 'mm') {
      lengthInFeet = l / 304.8;
    } else if (lengthUnit === 'feet') {
      lengthInFeet = l;
    } else {
      lengthInFeet = l;
    }
    return Number((lengthInFeet * qty).toFixed(2));
  }

  // Sq. Ft. Calculation
  let lengthInInches = 0;
  let widthInInches = 0;

  if (lengthUnit === 'inch') lengthInInches = l;
  else if (lengthUnit === 'mm') lengthInInches = l / 25.4;
  else if (lengthUnit === 'feet') lengthInInches = l * 12;
  else lengthInInches = l;

  if (widthUnit === 'inch') widthInInches = w;
  else if (widthUnit === 'mm') widthInInches = w / 25.4;
  else if (widthUnit === 'feet') widthInInches = w * 12;
  else widthInInches = w;

  const sqFt = (lengthInInches * widthInInches / 144) * qty;
  return Number(sqFt.toFixed(2));
}

/**
 * Format number into Indian Rupee currency format (e.g. ₹ 1,45,200.00)
 */
export function formatCurrency(amount: number, showSymbol = true): string {
  const num = Number(amount) || 0;
  const formatted = num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  return showSymbol ? `₹ ${formatted}` : formatted;
}

/**
 * Format plain number with 2 decimals
 */
export function formatNumber(val: number): string {
  const num = Number(val) || 0;
  return num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

/**
 * Convert number into Words in Indian numbering format (Lakhs, Crores, Thousands)
 */
export function numberToIndianWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n === 0) return '';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
    if (n < 1000) return inWords(Math.floor(n / 100)) + 'Hundred ' + (n % 100 !== 0 ? 'and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  }

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  let result = inWords(integerPart).trim() + ' Rupees';
  if (decimalPart > 0) {
    result += ' and ' + inWords(decimalPart).trim() + ' Paise';
  }
  return result + ' Only';
}

/**
 * Generate formatted WhatsApp message text for sharing invoice
 */
export function generateWhatsAppMessage(
  invoice: {
    invoiceNumber: string;
    customerName: string;
    grandTotal: number;
    paidAmount: number;
    balanceDue: number;
    date: string;
    items?: Array<{ name: string; areaSqFt: number; calcType: string; lineTotal: number }>;
  },
  company: {
    businessName: string;
    phones: string[];
    upiId: string;
  }
): string {
  const itemLines = (invoice.items || [])
    .slice(0, 4)
    .map((item, idx) => `• ${item.name} (${item.calcType === 'sqft' ? `${item.areaSqFt} sq.ft` : `${item.areaSqFt} units`}) - ₹${item.lineTotal}`)
    .join('\n');

  const moreItemsText = (invoice.items && invoice.items.length > 4)
    ? `\n• + ${invoice.items.length - 4} more items...`
    : '';

  const message = `*${company.businessName}*
*INVOICE / BILL DETAILS*
--------------------------------
*Bill No:* ${invoice.invoiceNumber}
*Date:* ${invoice.date}
*Customer:* ${invoice.customerName}

*Items Summary:*
${itemLines}${moreItemsText}

--------------------------------
*Total Amount:* ₹${invoice.grandTotal.toLocaleString('en-IN')}
*Amount Paid:* ₹${invoice.paidAmount.toLocaleString('en-IN')}
*Balance Due:* *₹${invoice.balanceDue.toLocaleString('en-IN')}*
--------------------------------
*Payment UPI ID:* ${company.upiId}
*Contact:* ${company.phones.join(', ')}

_Thank you for doing business with ${company.businessName}!_`;

  return encodeURIComponent(message);
}


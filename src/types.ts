export type UnitType = 'inch' | 'mm' | 'feet' | 'pcs' | 'rft';
export type CalcType = 'sqft' | 'rft' | 'pcs';

export interface MeasurementItem {
  id: string;
  inventoryId?: string;
  category: string;
  name: string;
  description: string;
  length: number;
  lengthUnit: 'inch' | 'mm' | 'feet' | 'pcs';
  width: number;
  widthUnit: 'inch' | 'mm' | 'feet' | 'pcs';
  quantity: number;
  calcType: CalcType;
  areaSqFt: number; // calculated area or quantity
  rate: number;
  extraWorkType?: string; // e.g., 'Edge Polishing', 'Hole Cutting', 'Beveling', 'Fitting'
  extraCharges: number;
  lineTotal: number;
}

export type InvoiceType = 'Tax Invoice' | 'Estimate / Quotation' | 'Delivery Challan';
export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid';
export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  customerId: string;
  customerName: string;
  customerPhone: string;
  siteAddress: string;
  date: string;
  items: MeasurementItem[];
  subtotal: number;
  extraLabourTotal: number;
  transportation: number;
  discount: number;
  taxableAmount: number;
  gstRate: number; // e.g. 18, 12, 5, 0
  cgst: number;
  sgst: number;
  totalGst: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  status: PaymentStatus;
  paymentMode: PaymentMode;
  paymentRef?: string;
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes?: string;
  totalBilled?: number;
  totalPaid?: number;
  outstandingDue?: number;
  invoiceCount?: number;
  lastBilledDate?: string | null;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  receiptNumber: string;
  customerId: string;
  customerName: string;
  invoiceId?: string;
  invoiceNumber?: string;
  date: string;
  amount: number;
  paymentMode: PaymentMode;
  paymentRef?: string;
  notes?: string;
}

export interface LedgerEntry {
  date: string;
  type: 'INVOICE' | 'PAYMENT';
  refNumber: string;
  invoiceId?: string;
  paymentId?: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  timestamp: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Glass Sheets' | 'Aluminium Profiles' | 'UPVC Profiles' | 'Hardware & Fittings' | 'Other';
  thickness?: string;
  type?: string;
  unit: 'Sq. Ft' | 'Rft' | 'Pcs' | 'Sets';
  currentStock: number;
  minAlertStock: number;
  costRate: number;
  sellingRate: number;
  notes?: string;
}

export type StockLogType = 'INWARD' | 'OUTWARD_BILL' | 'WASTAGE_BREAKAGE' | 'OUTWARD_SALE' | 'SITE_CUT';

export interface StockLog {
  id: string;
  date: string;
  type: StockLogType;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  vendor?: string;
  costPrice: number;
  totalCost: number;
  refNumber: string;
  notes?: string;
}

export interface CompanyProfile {
  businessName: string;
  tagline: string;
  phones: string[];
  address: string;
  state: string;
  stateCode: string;
  gstin: string;
  email: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  upiId: string;
  services: string[];
  terms: string[];
}

export type UserRole = 'ADMIN' | 'STAFF';

export interface AuthUser {
  role: UserRole;
  name: string;
  username: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  expiresAt: number;
}

export interface AuthConfig {
  isInitialized: boolean;
  staffName: string;
  hasAdminPin: boolean;
  hasAdminPassword: boolean;
  staffPinMasked: string;
}

export interface BackupInfo {
  fileName: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
  timestamp?: number;
  type: string;
  extension: string;
}



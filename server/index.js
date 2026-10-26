import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { readData, writeData, initializeDatabase } from './db.js';
import { 
  authenticateUser, 
  verifyToken, 
  verifyAdminPinOverride, 
  getAuthConfig, 
  updateAuthConfig 
} from './authService.js';
import { 
  createDailyBackup, 
  listBackups, 
  restoreDatabase, 
  initializeBackupScheduler 
} from './backupService.js';

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Initialize demo data & daily automated backup cron
initializeDatabase();
initializeBackupScheduler();

// Lightweight Root Health Check for Cloud Pingers & Uptime Monitors (UptimeRobot, CronJob, Render/Railway)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'M.K. ENTERPRISES - Glass & Aluminium Billing System',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    storage: {
      dataDir: process.env.DATA_DIR || 'server/data'
    }
  });
});

// ==========================================
// AUTHENTICATION & RBAC ENDPOINTS
// ==========================================

// Login
app.post('/api/auth/login', (req, res) => {
  const { role, credential } = req.body;
  if (!role || !credential) {
    return res.status(400).json({ error: 'Role and PIN/Password are required.' });
  }

  const result = authenticateUser(role, credential);
  if (!result.success) {
    return res.status(401).json({ error: result.error });
  }

  res.json(result);
});

// Verify active session token
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Session expired or invalid token' });
  }

  res.json({ valid: true, user: payload });
});

// Admin PIN Override check
app.post('/api/auth/override', (req, res) => {
  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ error: 'PIN is required' });
  }

  const isValid = verifyAdminPinOverride(pin);
  if (!isValid) {
    return res.status(403).json({ error: 'Invalid Admin PIN.' });
  }

  res.json({ success: true, authorized: true });
});

// Get Auth status & config
app.get('/api/auth/config', (req, res) => {
  const config = getAuthConfig();
  res.json({
    isInitialized: config.isInitialized,
    staffName: config.staffName || 'Counter Staff',
    hasAdminPin: Boolean(config.adminPin),
    hasAdminPassword: Boolean(config.adminPassword),
    staffPinMasked: '••••'
  });
});

// Update PINs / Passwords (Admin only)
app.put('/api/auth/config', (req, res) => {
  const { adminPin, adminPassword, staffPin, staffName, currentAdminPin } = req.body;
  const config = getAuthConfig();

  // If already initialized, verify current Admin PIN
  if (config.isInitialized && currentAdminPin) {
    if (!verifyAdminPinOverride(currentAdminPin)) {
      return res.status(403).json({ error: 'Current Admin PIN is incorrect.' });
    }
  }

  const updates = { isInitialized: true };
  if (adminPin && adminPin.trim()) updates.adminPin = adminPin.trim();
  if (adminPassword && adminPassword.trim()) updates.adminPassword = adminPassword.trim();
  if (staffPin && staffPin.trim()) updates.staffPin = staffPin.trim();
  if (staffName && staffName.trim()) updates.staffName = staffName.trim();

  const saved = updateAuthConfig(updates);
  res.json({ success: true, message: 'Security credentials updated successfully.' });
});

// ==========================================
// AUTOMATED & MANUAL BACKUP ENDPOINTS
// ==========================================

// List all backups
app.get('/api/backups', (req, res) => {
  const backups = listBackups();
  res.json(backups);
});

// Create backup snapshot now
app.post('/api/backups/create', async (req, res) => {
  try {
    const result = await createDailyBackup(true);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download backup file
app.get('/api/backups/download/:filename', (req, res) => {
  const filename = req.params.filename;
  // Prevent directory traversal
  const safeName = path.basename(filename);
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const filePath = path.join(__dirname, 'backups', safeName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Backup file not found' });
  }

  res.download(filePath, safeName);
});

// Restore database
app.post('/api/backups/restore', (req, res) => {
  try {
    const dataPayload = req.body;
    const result = restoreDatabase(dataPayload);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'M.K. ENTERPRISES Billing API', timestamp: new Date().toISOString() });
});

// 2. Company Profile
app.get('/api/profile', (req, res) => {
  const profile = readData('profile');
  res.json(profile);
});

app.put('/api/profile', (req, res) => {
  const updated = req.body;
  writeData('profile', updated);
  res.json({ success: true, profile: updated });
});

// 3. Customers
app.get('/api/customers', (req, res) => {
  const customers = readData('customers');
  const invoices = readData('invoices');
  const payments = readData('payments');

  // Enrich with totals
  const enriched = customers.map(cust => {
    const custInvoices = invoices.filter(inv => inv.customerId === cust.id || inv.customerPhone === cust.phone);
    const custPayments = payments.filter(pay => pay.customerId === cust.id || custInvoices.some(i => i.id === pay.invoiceId));

    const totalBilled = custInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);
    const totalPaid = custPayments.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
    const outstandingDue = totalBilled - totalPaid;

    return {
      ...cust,
      totalBilled,
      totalPaid,
      outstandingDue: outstandingDue > 0 ? outstandingDue : 0,
      invoiceCount: custInvoices.length,
      lastBilledDate: custInvoices.length > 0 ? custInvoices[custInvoices.length - 1].date : null
    };
  });

  res.json(enriched);
});

app.post('/api/customers', (req, res) => {
  const customers = readData('customers');
  const { name, phone, address, notes } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Customer name and phone are required.' });
  }

  // Check if phone exists
  let customer = customers.find(c => c.phone.trim() === phone.trim());
  if (customer) {
    // Update existing customer details
    customer.name = name;
    customer.address = address || customer.address;
    customer.notes = notes || customer.notes;
    writeData('customers', customers);
    return res.json({ success: true, customer, isNew: false });
  }

  const newCust = {
    id: `CUST-${Date.now().toString().slice(-4)}`,
    name: name.trim(),
    phone: phone.trim(),
    address: address ? address.trim() : '',
    notes: notes ? notes.trim() : '',
    createdAt: new Date().toISOString()
  };

  customers.unshift(newCust);
  writeData('customers', customers);
  res.status(201).json({ success: true, customer: newCust, isNew: true });
});

app.put('/api/customers/:id', (req, res) => {
  const customers = readData('customers');
  const index = customers.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  customers[index] = { ...customers[index], ...req.body };
  writeData('customers', customers);
  res.json({ success: true, customer: customers[index] });
});

// Customer Ledger Statement (Chronological with running balance)
app.get('/api/customers/:id/ledger', (req, res) => {
  const { id } = req.params;
  const customers = readData('customers');
  const invoices = readData('invoices');
  const payments = readData('payments');

  const customer = customers.find(c => c.id === id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const custInvoices = invoices.filter(inv => inv.customerId === id || inv.customerPhone === customer.phone);
  const custPayments = payments.filter(pay => pay.customerId === id || custInvoices.some(i => i.id === pay.invoiceId));

  // Build combined chronological ledger events
  const events = [];

  custInvoices.forEach(inv => {
    events.push({
      date: inv.date,
      type: 'INVOICE',
      refNumber: inv.invoiceNumber,
      invoiceId: inv.id,
      description: `${inv.type} (${inv.items ? inv.items.length : 0} items)`,
      debit: Number(inv.grandTotal) || 0,
      credit: 0,
      timestamp: new Date(inv.date).getTime()
    });
  });

  custPayments.forEach(pay => {
    events.push({
      date: pay.date,
      type: 'PAYMENT',
      refNumber: pay.receiptNumber || 'RCP',
      paymentId: pay.id,
      invoiceRef: pay.invoiceNumber,
      description: `Payment received (${pay.paymentMode || 'Cash'}${pay.paymentRef ? ` - ${pay.paymentRef}` : ''})`,
      debit: 0,
      credit: Number(pay.amount) || 0,
      timestamp: new Date(pay.date).getTime()
    });
  });

  // Sort chronologically ascending
  events.sort((a, b) => a.timestamp - b.timestamp);

  // Compute running balance
  let runningBalance = 0;
  const ledgerRows = events.map(ev => {
    runningBalance += (ev.debit - ev.credit);
    return {
      ...ev,
      runningBalance
    };
  });

  const totalBilled = custInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);
  const totalPaid = custPayments.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
  const outstandingDue = Math.max(0, totalBilled - totalPaid);

  res.json({
    customer,
    totalBilled,
    totalPaid,
    outstandingDue,
    invoices: custInvoices,
    payments: custPayments,
    ledger: ledgerRows
  });
});

// 4. Invoices
app.get('/api/invoices', (req, res) => {
  const invoices = readData('invoices');
  res.json(invoices);
});

app.get('/api/invoices/:id', (req, res) => {
  const invoices = readData('invoices');
  const invoice = invoices.find(inv => inv.id === req.params.id || inv.invoiceNumber === req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  res.json(invoice);
});

app.post('/api/invoices', (req, res) => {
  const invoices = readData('invoices');
  const customers = readData('customers');
  const inventory = readData('inventory');
  const stockLogs = readData('stock_logs');
  const payments = readData('payments');

  const {
    invoiceNumber,
    type = 'Tax Invoice',
    customerId,
    customerName,
    customerPhone,
    siteAddress,
    date = new Date().toISOString().split('T')[0],
    items = [],
    subtotal = 0,
    extraLabourTotal = 0,
    transportation = 0,
    discount = 0,
    taxableAmount = 0,
    gstRate = 18,
    cgst = 0,
    sgst = 0,
    totalGst = 0,
    grandTotal = 0,
    paidAmount = 0,
    paymentMode = 'Cash',
    paymentRef = '',
    notes = '',
    deductStock = true
  } = req.body;

  if (!customerName || !customerPhone) {
    return res.status(400).json({ error: 'Customer name and phone number are required.' });
  }

  // Find or create customer
  let cust = customers.find(c => c.phone.trim() === customerPhone.trim());
  let targetCustId = cust ? cust.id : customerId;
  if (!cust) {
    targetCustId = `CUST-${Date.now().toString().slice(-4)}`;
    cust = {
      id: targetCustId,
      name: customerName.trim(),
      phone: customerPhone.trim(),
      address: siteAddress ? siteAddress.trim() : '',
      notes: 'Created via billing',
      createdAt: new Date().toISOString()
    };
    customers.unshift(cust);
    writeData('customers', customers);
  }

  // Generate unique invoice number if not provided
  let generatedInvNum = invoiceNumber;
  if (!generatedInvNum || generatedInvNum.trim() === '') {
    const nextNum = invoices.length + 2601;
    generatedInvNum = `MK-${nextNum}`;
  }

  const invoiceId = `INV-${Date.now()}`;
  const numGrandTotal = Number(grandTotal) || 0;
  const numPaidAmount = Number(paidAmount) || 0;
  const balanceDue = Math.max(0, numGrandTotal - numPaidAmount);

  let status = 'Unpaid';
  if (numPaidAmount >= numGrandTotal && numGrandTotal > 0) {
    status = 'Paid';
  } else if (numPaidAmount > 0) {
    status = 'Partial';
  }

  const newInvoice = {
    id: invoiceId,
    invoiceNumber: generatedInvNum.trim(),
    type,
    customerId: targetCustId,
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    siteAddress: siteAddress ? siteAddress.trim() : '',
    date,
    items,
    subtotal: Number(subtotal) || 0,
    extraLabourTotal: Number(extraLabourTotal) || 0,
    transportation: Number(transportation) || 0,
    discount: Number(discount) || 0,
    taxableAmount: Number(taxableAmount) || 0,
    gstRate: Number(gstRate) || 0,
    cgst: Number(cgst) || 0,
    sgst: Number(sgst) || 0,
    totalGst: Number(totalGst) || 0,
    grandTotal: numGrandTotal,
    paidAmount: numPaidAmount,
    balanceDue,
    status,
    paymentMode,
    paymentRef,
    notes,
    createdAt: new Date().toISOString()
  };

  invoices.unshift(newInvoice);
  writeData('invoices', invoices);

  // If advance/paid amount > 0, log a payment record
  if (numPaidAmount > 0) {
    const receiptNum = `RCP-${Date.now().toString().slice(-4)}`;
    const paymentRecord = {
      id: `PAY-${Date.now()}`,
      receiptNumber: receiptNum,
      customerId: targetCustId,
      customerName: customerName.trim(),
      invoiceId: newInvoice.id,
      invoiceNumber: newInvoice.invoiceNumber,
      date,
      amount: numPaidAmount,
      paymentMode,
      paymentRef,
      notes: `Payment recorded on invoice creation`
    };
    payments.unshift(paymentRecord);
    writeData('payments', payments);
  }

  // Automatic Stock Deduction if requested
  if (deductStock && items && items.length > 0) {
    items.forEach(item => {
      if (item.inventoryId) {
        const invItem = inventory.find(i => i.id === item.inventoryId);
        if (invItem) {
          const deductQty = item.calcType === 'sqft' ? (item.areaSqFt || item.quantity) : item.quantity;
          invItem.currentStock = Math.max(0, (invItem.currentStock || 0) - Number(deductQty));

          // Log outward movement
          stockLogs.unshift({
            id: `STK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            date,
            type: 'OUTWARD_BILL',
            itemId: invItem.id,
            itemName: invItem.name,
            quantity: Number(deductQty),
            unit: invItem.unit,
            vendor: customerName.trim(),
            costPrice: invItem.costRate || 0,
            totalCost: (Number(deductQty) * (invItem.costRate || 0)),
            refNumber: newInvoice.invoiceNumber,
            notes: `Auto deducted for invoice ${newInvoice.invoiceNumber} (${item.name})`
          });
        }
      }
    });
    writeData('inventory', inventory);
    writeData('stock_logs', stockLogs);
  }

  res.status(201).json({ success: true, invoice: newInvoice });
});

app.delete('/api/invoices/:id', (req, res) => {
  let invoices = readData('invoices');
  const targetId = req.params.id;
  const initialLen = invoices.length;
  invoices = invoices.filter(inv => inv.id !== targetId && inv.invoiceNumber !== targetId);

  if (invoices.length === initialLen) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  writeData('invoices', invoices);
  res.json({ success: true, message: 'Invoice deleted successfully' });
});

// 5. Payments (Record new payment against invoice or customer)
app.get('/api/payments', (req, res) => {
  const payments = readData('payments');
  res.json(payments);
});

app.post('/api/payments', (req, res) => {
  const payments = readData('payments');
  const invoices = readData('invoices');
  const { customerId, customerName, invoiceId, amount, paymentMode = 'Cash', paymentRef = '', notes = '', date = new Date().toISOString().split('T')[0] } = req.body;

  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'A valid payment amount is required.' });
  }

  let inv = null;
  if (invoiceId) {
    inv = invoices.find(i => i.id === invoiceId || i.invoiceNumber === invoiceId);
    if (inv) {
      inv.paidAmount = (Number(inv.paidAmount) || 0) + numAmount;
      inv.balanceDue = Math.max(0, (Number(inv.grandTotal) || 0) - inv.paidAmount);
      if (inv.balanceDue <= 0) {
        inv.status = 'Paid';
      } else {
        inv.status = 'Partial';
      }
      writeData('invoices', invoices);
    }
  }

  const receiptNumber = `RCP-${Date.now().toString().slice(-4)}`;
  const paymentRecord = {
    id: `PAY-${Date.now()}`,
    receiptNumber,
    customerId: customerId || (inv ? inv.customerId : ''),
    customerName: customerName || (inv ? inv.customerName : 'Walk-in Customer'),
    invoiceId: inv ? inv.id : '',
    invoiceNumber: inv ? inv.invoiceNumber : '',
    date,
    amount: numAmount,
    paymentMode,
    paymentRef,
    notes
  };

  payments.unshift(paymentRecord);
  writeData('payments', payments);

  res.status(201).json({ success: true, payment: paymentRecord, invoice: inv });
});

// 6. Inventory & Stock Management
app.get('/api/inventory', (req, res) => {
  const inventory = readData('inventory');
  res.json(inventory);
});

app.post('/api/inventory', (req, res) => {
  const inventory = readData('inventory');
  const { name, category, thickness, type, unit, currentStock = 0, minAlertStock = 10, costRate = 0, sellingRate = 0, notes = '' } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: 'Item name and category are required' });
  }

  const newItem = {
    id: `INV-${Date.now().toString().slice(-4)}`,
    name: name.trim(),
    category,
    thickness: thickness || '',
    type: type || '',
    unit: unit || 'Sq. Ft',
    currentStock: Number(currentStock) || 0,
    minAlertStock: Number(minAlertStock) || 10,
    costRate: Number(costRate) || 0,
    sellingRate: Number(sellingRate) || 0,
    notes: notes || ''
  };

  inventory.unshift(newItem);
  writeData('inventory', inventory);
  res.status(201).json({ success: true, item: newItem });
});

app.put('/api/inventory/:id', (req, res) => {
  const inventory = readData('inventory');
  const index = inventory.findIndex(i => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  inventory[index] = { ...inventory[index], ...req.body };
  writeData('inventory', inventory);
  res.json({ success: true, item: inventory[index] });
});

// Inward Stock Shipment (Stock In)
app.post('/api/inventory/inward', (req, res) => {
  const inventory = readData('inventory');
  const stockLogs = readData('stock_logs');
  const { itemId, quantity, unit, vendor, costPrice, refNumber, notes, date = new Date().toISOString().split('T')[0] } = req.body;

  const invItem = inventory.find(i => i.id === itemId);
  if (!invItem) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const numQty = Number(quantity);
  if (!numQty || numQty <= 0) {
    return res.status(400).json({ error: 'Quantity must be greater than zero' });
  }

  invItem.currentStock = (Number(invItem.currentStock) || 0) + numQty;
  if (costPrice) {
    invItem.costRate = Number(costPrice);
  }

  const logEntry = {
    id: `STK-${Date.now()}`,
    date,
    type: 'INWARD',
    itemId: invItem.id,
    itemName: invItem.name,
    quantity: numQty,
    unit: unit || invItem.unit,
    vendor: vendor || 'Supplier',
    costPrice: Number(costPrice) || invItem.costRate || 0,
    totalCost: (numQty * (Number(costPrice) || invItem.costRate || 0)),
    refNumber: refNumber || `INW-${Date.now().toString().slice(-4)}`,
    notes: notes || 'Stock inward entry'
  };

  stockLogs.unshift(logEntry);
  writeData('inventory', inventory);
  writeData('stock_logs', stockLogs);

  res.status(201).json({ success: true, item: invItem, log: logEntry });
});

// Outward Stock / Wastage / Breakage (Stock Out)
app.post('/api/inventory/outward', (req, res) => {
  const inventory = readData('inventory');
  const stockLogs = readData('stock_logs');
  const { itemId, quantity, unit, reason = 'WASTAGE_BREAKAGE', vendor, refNumber, notes, date = new Date().toISOString().split('T')[0] } = req.body;

  const invItem = inventory.find(i => i.id === itemId);
  if (!invItem) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const numQty = Number(quantity);
  if (!numQty || numQty <= 0) {
    return res.status(400).json({ error: 'Quantity must be greater than zero' });
  }

  invItem.currentStock = Math.max(0, (Number(invItem.currentStock) || 0) - numQty);

  const logEntry = {
    id: `STK-${Date.now()}`,
    date,
    type: reason, // 'WASTAGE_BREAKAGE', 'OUTWARD_SALE', 'SITE_CUT'
    itemId: invItem.id,
    itemName: invItem.name,
    quantity: numQty,
    unit: unit || invItem.unit,
    vendor: vendor || (reason === 'WASTAGE_BREAKAGE' ? 'Broken / Cut Scrap' : 'Manual Outward'),
    costPrice: invItem.costRate || 0,
    totalCost: (numQty * (invItem.costRate || 0)),
    refNumber: refNumber || `OUT-${Date.now().toString().slice(-4)}`,
    notes: notes || reason
  };

  stockLogs.unshift(logEntry);
  writeData('inventory', inventory);
  writeData('stock_logs', stockLogs);

  res.status(201).json({ success: true, item: invItem, log: logEntry });
});

app.get('/api/inventory/logs', (req, res) => {
  const stockLogs = readData('stock_logs');
  res.json(stockLogs);
});

// 7. Reports & Dashboard Metrics
app.get('/api/reports/dashboard', (req, res) => {
  const invoices = readData('invoices');
  const payments = readData('payments');
  const customers = readData('customers');
  const inventory = readData('inventory');

  const today = new Date().toISOString().split('T')[0];

  const totalSales = invoices.reduce((sum, i) => sum + (Number(i.grandTotal) || 0), 0);
  const totalReceived = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalPendingDue = Math.max(0, totalSales - totalReceived);

  // Today metrics
  const todayInvoices = invoices.filter(i => i.date === today);
  const todaySales = todayInvoices.reduce((sum, i) => sum + (Number(i.grandTotal) || 0), 0);
  const todayPayments = payments.filter(p => p.date === today);
  const todayReceived = todayPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Low stock alerts
  const lowStockAlerts = inventory.filter(i => (Number(i.currentStock) || 0) <= (Number(i.minAlertStock) || 0));

  res.json({
    totalSales,
    totalReceived,
    totalPendingDue,
    totalInvoices: invoices.length,
    totalCustomers: customers.length,
    todaySales,
    todayReceived,
    todayInvoiceCount: todayInvoices.length,
    lowStockCount: lowStockAlerts.length,
    lowStockItems: lowStockAlerts
  });
});

// GST Tax Report
app.get('/api/reports/gst', (req, res) => {
  const invoices = readData('invoices');
  const { startDate, endDate } = req.query;

  let filtered = invoices;
  if (startDate) {
    filtered = filtered.filter(i => i.date >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter(i => i.date <= endDate);
  }

  let totalTaxable = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalGST = 0;
  let totalInvoiceValue = 0;

  const invoiceTaxRows = filtered.map(inv => {
    const taxable = Number(inv.taxableAmount) || (Number(inv.subtotal) - (Number(inv.discount) || 0));
    const cgst = Number(inv.cgst) || 0;
    const sgst = Number(inv.sgst) || 0;
    const gst = Number(inv.totalGst) || (cgst + sgst);
    const grand = Number(inv.grandTotal) || 0;

    totalTaxable += taxable;
    totalCGST += cgst;
    totalSGST += sgst;
    totalGST += gst;
    totalInvoiceValue += grand;

    return {
      invoiceNumber: inv.invoiceNumber,
      date: inv.date,
      customerName: inv.customerName,
      customerPhone: inv.customerPhone,
      gstRate: inv.gstRate || 18,
      taxableAmount: taxable,
      cgst,
      sgst,
      totalGst: gst,
      grandTotal: grand
    };
  });

  res.json({
    summary: {
      totalTaxable,
      totalCGST,
      totalSGST,
      totalGST,
      totalInvoiceValue,
      count: filtered.length
    },
    invoices: invoiceTaxRows
  });
});

// 8. Full Export & Backup
app.get('/api/export/backup', (req, res) => {
  const backup = {
    exportedAt: new Date().toISOString(),
    profile: readData('profile'),
    customers: readData('customers'),
    invoices: readData('invoices'),
    payments: readData('payments'),
    inventory: readData('inventory'),
    stockLogs: readData('stock_logs')
  };
  res.json(backup);
});

app.post('/api/export/restore', (req, res) => {
  const { profile, customers, invoices, payments, inventory, stockLogs } = req.body;
  if (profile) writeData('profile', profile);
  if (customers) writeData('customers', customers);
  if (invoices) writeData('invoices', invoices);
  if (payments) writeData('payments', payments);
  if (inventory) writeData('inventory', inventory);
  if (stockLogs) writeData('stock_logs', stockLogs);

  res.json({ success: true, message: 'Data restored successfully' });
});

// Serve frontend static build if available
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, '..', 'dist');

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, HOST, () => {
  console.log(`M.K. ENTERPRISES Server running on http://${HOST}:${PORT}`);
});

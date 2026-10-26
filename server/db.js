import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

console.log(`[Storage Adapter] Active Persistent Data Directory: ${DATA_DIR}`);

const getFilePath = (name) => path.join(DATA_DIR, `${name}.json`);

export function readData(name, defaultVal = []) {
  const filePath = getFilePath(name);
  try {
    if (!fs.existsSync(filePath)) {
      writeData(name, defaultVal);
      return defaultVal;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${name}:`, err);
    return defaultVal;
  }
}

export function writeData(name, data) {
  const filePath = getFilePath(name);
  const tempPath = `${filePath}.tmp`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (err) {
    console.error(`Error writing ${name}:`, err);
    return false;
  }
}

// Initial seed data setup
export function initializeDatabase() {
  // 1. Company Profile
  const existingProfile = readData('profile', null);
  if (!existingProfile) {
    writeData('profile', {
      businessName: 'M.K. ENTERPRISES',
      tagline: 'Glass & Aluminium Specialists - Complete Architectural Solutions',
      phones: ['+91 9766550152', '+91 9515018304'],
      address: 'Shadnagar Road, PARGI, Vikarabad Dist. - 501 501',
      state: 'Telangana',
      stateCode: '36',
      gstin: '36ABCDE1234F1Z5',
      email: 'mkenterprises.pargi@gmail.com',
      bankName: 'State Bank of India',
      accountName: 'M.K. ENTERPRISES',
      accountNumber: '39485720194',
      ifscCode: 'SBIN0020184',
      branch: 'Pargi Main Branch',
      upiId: '9766550152@upi',
      services: [
        'Digital Glass',
        'Etching Glass',
        'Tuffen Glass (Toughened Glass)',
        'Railing Glass Design',
        'UPVC & Aluminium Work',
        'Mirror & Decorative Glass',
        'Shower Enclosures',
        'Spider Glazing & Patch Fittings'
      ],
      terms: [
        '1. 50% advance payment required upon order confirmation.',
        '2. Balance payment must be settled upon delivery or before installation.',
        '3. Glass once cut, polished, or toughened cannot be altered or returned.',
        '4. Measurements approved by customer will be final for fabrication.',
        '5. Goods once dispatched/installed are non-returnable. Breakage during external handling is not covered.'
      ]
    });
  }

  // 2. Inventory Items
  const existingInventory = readData('inventory', null);
  if (!existingInventory || existingInventory.length === 0) {
    const defaultInventory = [
      {
        id: 'INV-101',
        name: '12mm Toughened Clear Glass',
        category: 'Glass Sheets',
        thickness: '12mm',
        type: 'Toughened Clear',
        unit: 'Sq. Ft',
        currentStock: 480,
        minAlertStock: 120,
        costRate: 145,
        sellingRate: 190,
        notes: 'High demand for balcony railings & office partitions'
      },
      {
        id: 'INV-102',
        name: '10mm Toughened Clear Glass',
        category: 'Glass Sheets',
        thickness: '10mm',
        type: 'Toughened Clear',
        unit: 'Sq. Ft',
        currentStock: 350,
        minAlertStock: 100,
        costRate: 125,
        sellingRate: 165,
        notes: 'Window panes and shower partitions'
      },
      {
        id: 'INV-103',
        name: '8mm Toughened Clear Glass',
        category: 'Glass Sheets',
        thickness: '8mm',
        type: 'Toughened Clear',
        unit: 'Sq. Ft',
        currentStock: 220,
        minAlertStock: 80,
        costRate: 95,
        sellingRate: 135,
        notes: 'Table tops, shelves & windows'
      },
      {
        id: 'INV-104',
        name: '5mm Plain Float Glass',
        category: 'Glass Sheets',
        thickness: '5mm',
        type: 'Plain Float',
        unit: 'Sq. Ft',
        currentStock: 560,
        minAlertStock: 150,
        costRate: 52,
        sellingRate: 78,
        notes: 'Standard residential window panels'
      },
      {
        id: 'INV-105',
        name: '5mm Frosted / Etching Glass Blank',
        category: 'Glass Sheets',
        thickness: '5mm',
        type: 'Etching Glass',
        unit: 'Sq. Ft',
        currentStock: 180,
        minAlertStock: 60,
        costRate: 75,
        sellingRate: 115,
        notes: 'Acid etch & sandblast design sheets'
      },
      {
        id: 'INV-106',
        name: 'Digital Print Ceramic Glass Blank',
        category: 'Glass Sheets',
        thickness: '12mm',
        type: 'Digital Glass',
        unit: 'Sq. Ft',
        currentStock: 140,
        minAlertStock: 50,
        costRate: 190,
        sellingRate: 275,
        notes: 'UV digital printed glass for temple & elevation'
      },
      {
        id: 'INV-107',
        name: 'Aluminium 2.5-Track Sliding Window Section',
        category: 'Aluminium Profiles',
        thickness: '1.2mm',
        type: 'Powder Coated White',
        unit: 'Rft',
        currentStock: 380,
        minAlertStock: 100,
        costRate: 46,
        sellingRate: 72,
        notes: 'Jindal section standard lengths'
      },
      {
        id: 'INV-108',
        name: 'Aluminium Partition 2.5" x 1.5" Outer Frame',
        category: 'Aluminium Profiles',
        thickness: '1.5mm',
        type: 'Anodized Bronze',
        unit: 'Rft',
        currentStock: 240,
        minAlertStock: 70,
        costRate: 64,
        sellingRate: 95,
        notes: 'Office partition frames'
      },
      {
        id: 'INV-109',
        name: 'UPVC Casement Window Profile',
        category: 'UPVC Profiles',
        thickness: 'Multi-chamber',
        type: 'UPVC White',
        unit: 'Rft',
        currentStock: 190,
        minAlertStock: 60,
        costRate: 98,
        sellingRate: 145,
        notes: 'Soundproof UV resistant UPVC profile'
      },
      {
        id: 'INV-110',
        name: 'SS304 Glass Railing Base Spigots',
        category: 'Hardware & Fittings',
        thickness: 'Heavy Duty',
        type: 'SS 304 Grade',
        unit: 'Pcs',
        currentStock: 74,
        minAlertStock: 20,
        costRate: 380,
        sellingRate: 560,
        notes: 'Balcony glass floor mounting bracket'
      },
      {
        id: 'INV-111',
        name: 'Heavy Hydraulic Floor Spring (80kg)',
        category: 'Hardware & Fittings',
        thickness: 'Standard',
        type: 'Floor Machine',
        unit: 'Pcs',
        currentStock: 12,
        minAlertStock: 5,
        costRate: 1850,
        sellingRate: 2650,
        notes: 'Main toughened glass swing doors'
      },
      {
        id: 'INV-112',
        name: 'Clear Weatherproof Silicone Sealant Tube',
        category: 'Hardware & Fittings',
        thickness: '300ml',
        type: 'Silicone Cartridge',
        unit: 'Pcs',
        currentStock: 45,
        minAlertStock: 15,
        costRate: 140,
        sellingRate: 220,
        notes: 'Dow Corning / GP grade sealant'
      }
    ];
    writeData('inventory', defaultInventory);
  }

  // 3. Customers
  const existingCustomers = readData('customers', null);
  if (!existingCustomers || existingCustomers.length === 0) {
    const defaultCustomers = [
      {
        id: 'CUST-001',
        name: 'Sri Venkateshwara Builders (V. Rao)',
        phone: '9848012345',
        address: 'Royal City Layout, Near RTO Office, Pargi',
        notes: 'Regular residential apartments contractor',
        createdAt: '2026-09-15T10:00:00.000Z'
      },
      {
        id: 'CUST-002',
        name: 'Ramesh Reddy (Villa Project)',
        phone: '9440187654',
        address: 'Plot 42, Shadnagar Bypass Road, Pargi',
        notes: 'Premium railing glass and soundproof UPVC windows',
        createdAt: '2026-09-28T14:30:00.000Z'
      },
      {
        id: 'CUST-003',
        name: 'Modern Interiors & Architects',
        phone: '9988776655',
        address: 'Opp. Bus Station, Vikarabad Town',
        notes: 'Commercial office partitions and etching designs',
        createdAt: '2026-10-02T11:15:00.000Z'
      },
      {
        id: 'CUST-004',
        name: 'Mohammed Farooq',
        phone: '9700112233',
        address: 'Gunj Road, Near Masjid, Pargi',
        notes: 'Shopfront 12mm toughened glass with patch fittings',
        createdAt: '2026-10-10T16:00:00.000Z'
      }
    ];
    writeData('customers', defaultCustomers);
  }

  // 4. Invoices
  const existingInvoices = readData('invoices', null);
  if (!existingInvoices || existingInvoices.length === 0) {
    const defaultInvoices = [
      {
        id: 'INV-2026-001',
        invoiceNumber: 'MK-2601',
        type: 'Tax Invoice',
        customerId: 'CUST-001',
        customerName: 'Sri Venkateshwara Builders (V. Rao)',
        customerPhone: '9848012345',
        siteAddress: 'Royal City Layout, Near RTO Office, Pargi',
        date: '2026-10-18',
        items: [
          {
            id: 'row-1',
            inventoryId: 'INV-101',
            category: 'Glass Sheets',
            name: '12mm Toughened Clear Glass',
            description: 'Balcony Front Railing Panels with Diamond Polish',
            length: 72,
            lengthUnit: 'inch',
            width: 36,
            widthUnit: 'inch',
            quantity: 4,
            calcType: 'sqft',
            areaSqFt: 72, // (72*36/144)*4 = 72 sqft
            rate: 195,
            extraWorkType: 'Edge Polishing & Hole Cutting',
            extraCharges: 1400,
            lineTotal: 15440 // 72 * 195 + 1400
          },
          {
            id: 'row-2',
            inventoryId: 'INV-110',
            category: 'Hardware & Fittings',
            name: 'SS304 Glass Railing Base Spigots',
            description: 'Heavy square spigots with anchor fasteners',
            length: 1,
            lengthUnit: 'pcs',
            width: 1,
            widthUnit: 'pcs',
            quantity: 8,
            calcType: 'pcs',
            areaSqFt: 0,
            rate: 550,
            extraWorkType: 'Fitting & Anchoring',
            extraCharges: 800,
            lineTotal: 5200 // 8 * 550 + 800
          }
        ],
        subtotal: 20640,
        extraLabourTotal: 0,
        transportation: 600,
        discount: 240,
        taxableAmount: 21000,
        gstRate: 18,
        cgst: 1890,
        sgst: 1890,
        totalGst: 3780,
        grandTotal: 24780,
        paidAmount: 20000,
        balanceDue: 4780,
        status: 'Partial',
        paymentMode: 'UPI',
        paymentRef: 'UPI/62918294/PhonePe',
        notes: 'Glass delivered to site. Installation completed. Balance due on final handover.'
      },
      {
        id: 'INV-2026-002',
        invoiceNumber: 'MK-2602',
        type: 'Tax Invoice',
        customerId: 'CUST-002',
        customerName: 'Ramesh Reddy (Villa Project)',
        customerPhone: '9440187654',
        siteAddress: 'Plot 42, Shadnagar Bypass Road, Pargi',
        date: '2026-10-21',
        items: [
          {
            id: 'row-1',
            inventoryId: 'INV-106',
            category: 'Glass Sheets',
            name: 'Digital Print Ceramic Glass Blank',
            description: 'Pooja Room Temple Glass with Custom Gold Border Design',
            length: 84,
            lengthUnit: 'inch',
            width: 48,
            widthUnit: 'inch',
            quantity: 2,
            calcType: 'sqft',
            areaSqFt: 56, // (84*48/144)*2 = 56 sqft
            rate: 280,
            extraWorkType: 'Edge Beveling & Hole Cutouts',
            extraCharges: 1800,
            lineTotal: 17480 // 56 * 280 + 1800
          },
          {
            id: 'row-2',
            inventoryId: 'INV-107',
            category: 'Aluminium Profiles',
            name: 'Aluminium 2.5-Track Sliding Window Section',
            description: 'French Windows Bedroom - 3 Tracks with Mosquito Mesh',
            length: 120,
            lengthUnit: 'inch',
            width: 1,
            widthUnit: 'pcs',
            quantity: 6,
            calcType: 'rft',
            areaSqFt: 60, // 60 rft
            rate: 85,
            extraWorkType: 'Assembly & Fabrication',
            extraCharges: 1200,
            lineTotal: 6300 // 60 * 85 + 1200
          }
        ],
        subtotal: 23780,
        extraLabourTotal: 0,
        transportation: 800,
        discount: 580,
        taxableAmount: 24000,
        gstRate: 18,
        cgst: 2160,
        sgst: 2160,
        totalGst: 4320,
        grandTotal: 28320,
        paidAmount: 28320,
        balanceDue: 0,
        status: 'Paid',
        paymentMode: 'Bank Transfer',
        paymentRef: 'NEFT-SBI-4910284',
        notes: 'Full payment received via NEFT.'
      },
      {
        id: 'INV-2026-003',
        invoiceNumber: 'MK-2603',
        type: 'Tax Invoice',
        customerId: 'CUST-004',
        customerName: 'Mohammed Farooq',
        customerPhone: '9700112233',
        siteAddress: 'Gunj Road, Near Masjid, Pargi',
        date: '2026-10-24',
        items: [
          {
            id: 'row-1',
            inventoryId: 'INV-101',
            category: 'Glass Sheets',
            name: '12mm Toughened Clear Glass',
            description: 'Commercial Shopfront Double Swing Doors with Heavy Top/Bottom Patch',
            length: 84,
            lengthUnit: 'inch',
            width: 36,
            widthUnit: 'inch',
            quantity: 2,
            calcType: 'sqft',
            areaSqFt: 42, // (84*36/144)*2 = 42 sqft
            rate: 200,
            extraWorkType: 'Cutouts for Patch Fittings & Locks',
            extraCharges: 1600,
            lineTotal: 10000 // 42 * 200 + 1600
          },
          {
            id: 'row-2',
            inventoryId: 'INV-111',
            category: 'Hardware & Fittings',
            name: 'Heavy Hydraulic Floor Spring (80kg)',
            description: 'Enox / Ozone type floor machine set',
            length: 1,
            lengthUnit: 'pcs',
            width: 1,
            widthUnit: 'pcs',
            quantity: 2,
            calcType: 'pcs',
            areaSqFt: 0,
            rate: 2650,
            extraWorkType: 'Floor Cutting & Fitting',
            extraCharges: 1000,
            lineTotal: 6300 // 2 * 2650 + 1000
          }
        ],
        subtotal: 16300,
        extraLabourTotal: 0,
        transportation: 500,
        discount: 300,
        taxableAmount: 16500,
        gstRate: 18,
        cgst: 1485,
        sgst: 1485,
        totalGst: 2970,
        grandTotal: 19470,
        paidAmount: 10000,
        balanceDue: 9470,
        status: 'Partial',
        paymentMode: 'Cash',
        paymentRef: 'Cash advance at shop',
        notes: 'Advance ₹10,000 received. Balance ₹9,470 payable upon floor spring setting.'
      }
    ];
    writeData('invoices', defaultInvoices);
  }

  // 5. Payments History
  const existingPayments = readData('payments', null);
  if (!existingPayments || existingPayments.length === 0) {
    const defaultPayments = [
      {
        id: 'PAY-1001',
        receiptNumber: 'RCP-2601',
        customerId: 'CUST-001',
        customerName: 'Sri Venkateshwara Builders (V. Rao)',
        invoiceId: 'INV-2026-001',
        invoiceNumber: 'MK-2601',
        date: '2026-10-18',
        amount: 20000,
        paymentMode: 'UPI',
        paymentRef: 'UPI/62918294/PhonePe',
        notes: 'Advance payment for Balcony Front Railing'
      },
      {
        id: 'PAY-1002',
        receiptNumber: 'RCP-2602',
        customerId: 'CUST-002',
        customerName: 'Ramesh Reddy (Villa Project)',
        invoiceId: 'INV-2026-002',
        invoiceNumber: 'MK-2602',
        date: '2026-10-21',
        amount: 28320,
        paymentMode: 'Bank Transfer',
        paymentRef: 'NEFT-SBI-4910284',
        notes: 'Full bill clearance'
      },
      {
        id: 'PAY-1003',
        receiptNumber: 'RCP-2603',
        customerId: 'CUST-004',
        customerName: 'Mohammed Farooq',
        invoiceId: 'INV-2026-003',
        invoiceNumber: 'MK-2603',
        date: '2026-10-24',
        amount: 10000,
        paymentMode: 'Cash',
        paymentRef: 'Cash received by store manager',
        notes: 'Initial deposit for Shopfront 12mm glass'
      }
    ];
    writeData('payments', defaultPayments);
  }

  // 6. Stock Logs (Inward, Outward, Wastage)
  const existingStockLogs = readData('stock_logs', null);
  if (!existingStockLogs || existingStockLogs.length === 0) {
    const defaultStockLogs = [
      {
        id: 'STK-001',
        date: '2026-10-15',
        type: 'INWARD',
        itemId: 'INV-101',
        itemName: '12mm Toughened Clear Glass',
        quantity: 500,
        unit: 'Sq. Ft',
        vendor: 'Saint-Gobain Glass India / Asahi Float Depot',
        costPrice: 145,
        totalCost: 72500,
        refNumber: 'SG-BL-9402',
        notes: 'Container lot delivered safely at warehouse'
      },
      {
        id: 'STK-002',
        date: '2026-10-18',
        type: 'OUTWARD_BILL',
        itemId: 'INV-101',
        itemName: '12mm Toughened Clear Glass',
        quantity: 72,
        unit: 'Sq. Ft',
        vendor: 'Customer Project',
        costPrice: 145,
        totalCost: 10440,
        refNumber: 'MK-2601',
        notes: 'Deducted for Invoice MK-2601 (Sri Venkateshwara Builders)'
      },
      {
        id: 'STK-003',
        date: '2026-10-20',
        type: 'WASTAGE_BREAKAGE',
        itemId: 'INV-104',
        itemName: '5mm Plain Float Glass',
        quantity: 24,
        unit: 'Sq. Ft',
        vendor: 'Internal Wastage',
        costPrice: 52,
        totalCost: 1248,
        refNumber: 'WST-26-01',
        notes: 'Corner hairline crack during site transport trimming'
      }
    ];
    writeData('stock_logs', defaultStockLogs);
  }
}


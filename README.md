# M.K. ENTERPRISES — Glass & Aluminium Billing, Ledger & Inventory Management Web Application

> **Professional, Paperless Glass & Aluminium Fabrication Management System**  
> Tailored for **M.K. ENTERPRISES** | Shadnagar Road, PARGI, Vikarabad Dist. - 501 501  
> **Contact Numbers:** +91 9766550152, +91 9515018304  
> **Core Specializations:** Digital Glass • Etching Glass • Tuffen Glass (Toughened) • Railing Glass Design • UPVC & Aluminium Work  

---

## 🌟 System Architecture & Key Modules

This web application eliminates traditional paper bill books, handwritten measurement logs, and fragmented customer payment diaries. Built with a modern, mobile-responsive interface, operators, site engineers, and shop managers can quickly enter glass dimensions on mobile devices directly at the site, instantly calculate square footage and GST, log advance payments, track customer dues, and generate A4 invoices or share bills directly over WhatsApp.

---

### 🔐 1. Admin & Staff Role-Based Access Control (RBAC)

#### Authentication & Session Management
- **Lightweight, Secure PIN Login Screen:**
  - Fast selection between **Owner / Admin** and **Counter Staff**.
  - Touchscreen numeric keypad and standard keyboard input.
  - Signed HMAC-SHA256 session token stored in secure storage.
  - **Inactivity Timeout:** Automatic logout after 30 minutes of inactivity for security on mobile terminals.
  - **First-Boot Setup Wizard:** Configure custom Owner PIN and Staff PIN on initial boot.
  - **Default Fallback PINs:**
    - **Owner / Admin PIN:** `9766` (or `1234`)
    - **Counter Staff PIN:** `1111`

#### Role Permissions Matrix

| Feature / Screen | ADMIN Access | STAFF Access |
| :--- | :--- | :--- |
| **Smart Billing & Measurement Entry** | Full (Create, View, Print) | Full (Create, View, Print) |
| **WhatsApp Invoice Dispatch** | Enabled | Enabled |
| **Inward Stock Entry (Raw sheets, profiles)** | Full Access | 🔒 Hidden |
| **Stock Wastage / Damage Logging** | Full Access | Can report breakage & scrap only |
| **Inventory Purchase Cost & Margins** | Visible | 🔒 Masked (Quantities only) |
| **Customer Khata / Ledger (Total Outstanding)** | Full Access & Edit | View Only (Cannot alter old records) |
| **Add Customer Payment / Receipt** | Enabled | Enabled |
| **Delete or Edit Past Invoices** | Enabled | 🔒 Disabled (Requires Admin PIN Override) |
| **Monthly GST & Sales Tax Reports (CSV/Excel)** | Full Access | 🔒 Hidden |
| **Business Settings, UPI/Bank Config, Backups** | Full Access | 🔒 Hidden |

#### Admin PIN Override Modal
When a staff member attempts a restricted action (such as deleting an invoice or accessing restricted screens), a floating modal prompts for the **Owner / Admin PIN**. Once verified, the action is unlocked without disrupting the session.

---

### 👑 2. Dedicated Admin Dashboard View (`/admin`)

Exclusive executive portal featuring real-time business analytics:
- **Top Metric Cards:**
  1. **Today's Sales (Total ₹)** and today's billed invoice count.
  2. **Market Receivables (Due ₹)** tracking outstanding customer balances.
  3. **Monthly Turnover & 18% GST** (18% split into 9% CGST + 9% SGST for Telangana intra-state).
  4. **Safety Buffer Alerts** highlighting sheets and profiles below minimum replenishment threshold.
- **Quick Action Shortcuts:**
  - **One-Click "Download GSTR-1 Monthly Summary"** (`.csv` ready for CA / GST filing).
  - **One-Click "Emergency Backup Now"** (Immediate `.zip` snapshot of all database files).
  - **"Customer Due Clearance" Fast Logger** (Modal to clear customer dues with instant payment voucher).
  - **"Manage PINs"** (Owner can update Admin PIN or Staff PIN at any time).
- **Automated Backups Registry:** Complete list of all 30-day automated daily snapshots with single-click download and database restore.

---

### 💾 3. Automated Daily Backup System

#### In-App Automated Cron (`node-cron`)
- Runs in the background of `server/index.js` using `node-cron`.
- **Schedule:** Daily at **11:59 PM** (`59 23 * * *`).
- **Destination:** `server/backups/`.
- **Format:** Timestamped `.zip` archives (e.g., `mk_backup_YYYY-MM-DD_auto.zip`).
- **Retention:** Automatically retains the **latest 30 daily backups** and auto-prunes older files.

#### One-Click Cloud / USB Export & Safe Restore
- **"Download Complete Backup (.zip)"** button in the Admin portal and Settings.
- **"Restore from File"** with schema safety validation check (prevents corrupt database overwrites and auto-generates a pre-restore rollback backup).

#### Standalone Backup Script (`scripts/backup.js`)
Can be triggered independently via OS cron (Linux/macOS) or Windows Task Scheduler:
```bash
# Backup to default server/backups/ directory:
node scripts/backup.js

# Backup to custom USB drive or Google Drive sync folder:
node scripts/backup.js /media/usb/mk_backups
```

---

### 📐 4. Digital Measurement & Smart Billing (Paperless Bill Book)
- **Customer & Site Details:** Customer Name (auto-suggest from database), Mobile Number, Site Delivery Address, Billing Date, and Bill Number.
- **Measurement Matrix:**
  - Length/Height and Width with unit selectors (**Inches**, **MM**, **Feet**, **Pieces**).
  - **Glass Calculation Formula:**
    $$\text{Sq. Ft.} = \frac{\text{Length (inches)} \times \text{Width (inches)}}{144} \times \text{Quantity}$$
  - **Additional Line Processing Charges:** Edge Polishing, Hole Cutting, Beveling, Transportation, Fitting.
  - **Adjustable 18% GST Engine:** 18% (Standard default), 12%, 5%, 0% (Non-GST / Quotation), or Flat Manual Adjustment.
  - **Payment Modes:** Cash, UPI (GPay/PhonePe/Paytm), Bank Transfer, Cheque.
  - **A4 Printable Invoices & 1-Click WhatsApp Share:** Direct WhatsApp link (`https://wa.me/91...?text=...`) sends invoice summary to the customer's phone.

---

### 📦 5. Stock & Inventory Management (In / Out / Wastage)
- **Categories:** Glass Sheets (5mm, 8mm, 10mm, 12mm; Plain, Frosted, Tinted, Toughened blanks), Aluminium Channels/Profiles, UPVC Profiles, Hardware & Fittings.
- **Stock Inward (Stock In):** Log incoming shipments from suppliers (Admin only).
- **Stock Outward (Stock Out):** Automatic invoice deduction + manual logging for **Glass Breakage / Damage** and **Offcut Trimmings**.
- **Live Inventory Tracker:** Real-time stock counts in Sq. Ft., Rft, and Pieces with low-stock buffer alerts.

---

### 📊 6. Monthly GST & Sales Reporting
- **Tax Register:** Filter by billing period (This Month, Custom Range, All Time).
- **Tax Breakdown:** Taxable Value, CGST (9%), SGST (9%), Total GST, and Gross Turnover.
- **Export to CSV / Excel:** One-click download of `.csv` reports formatted for Chartered Accountants (CA) and GSTR-1 / GSTR-3B filing.

---

## 🚀 Quick Start & Running the Application

### 1. Production Mode (Single Command)
Run the unified backend server which serves both the REST API and the production web app:
```bash
npm start
```
Access the application in your browser:
👉 **`http://localhost:5000`**

### 2. Development Mode (Hot Reloading)
```bash
# Terminal 1: Backend API
node server/index.js

# Terminal 2: Vite Dev Server (http://localhost:3000)
npm run dev
```

### 3. Run Automated Tests
```bash
# RBAC & Automated Backup Engine Test Suite:
node test/auth_and_backup.test.js

# Glass Measurement Matrix & GST Test Suite:
node test/calculator.test.js
```

---

## ☁️ 24/7 Cloud Deployment Guide (Render.com / Railway)

Follow these steps to deploy the application to a permanent public link (`https://mk-enterprises.onrender.com`) that stays online 24/7 even when local shop computers are completely powered off.

### Step 1: Push Code to a Private GitHub Repository

1. Open your terminal or shell in this project directory:
   ```bash
   cd /home/arun/Documents/others.project
   ```
2. Verify git status:
   ```bash
   git status
   ```
3. Create a new **Private Repository** on [GitHub](https://github.com/new) named `mk-enterprises-billing`.
4. Link your local project to your GitHub repository:
   ```bash
   git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/mk-enterprises-billing.git
   git branch -M main
   git push -u origin main
   ```

---

### Step 2: Deploy to Render.com (Free Tier)

#### Method A: 1-Click Blueprint Deploy (Recommended)
Because the project contains a preconfigured [`render.yaml`](file:///home/arun/Documents/others.project/render.yaml):
1. Sign up or log into [Render.com](https://render.com).
2. Click **New +** in the top right and select **Blueprint**.
3. Connect your GitHub account and select your `mk-enterprises-billing` repository.
4. Render will automatically read `render.yaml` and configure:
   - **Environment:** Node.js
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
   - **Host Binding:** `0.0.0.0`
5. Click **Apply**. Within 2-3 minutes, your live URL will be active (e.g. `https://mk-enterprises.onrender.com`).

#### Method B: Manual Web Service Setup
1. On the Render Dashboard, click **New +** > **Web Service**.
2. Select your `mk-enterprises-billing` repository.
3. Configure the settings:
   - **Name:** `mk-enterprises`
   - **Region:** `Singapore` (Fastest for India / Telangana)
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** `Free`
4. Expand **Advanced** settings:
   - **Health Check Path:** `/health`
   - Add Environment Variable:
     - `HOST` = `0.0.0.0`
5. Click **Create Web Service**.

---

### Step 3: Keeping the Free Tier Awake 24/7 (Prevent Sleep)

Render's free tier spins down after 15 minutes of inactivity. To keep your app responsive and awake 24/7:
1. Go to [UptimeRobot.com](https://uptimerobot.com) or [Cron-job.org](https://cron-job.org) (both 100% free).
2. Click **Add New Monitor**:
   - **Monitor Type:** `HTTP(s)`
   - **Friendly Name:** `M.K. Enterprises Health Ping`
   - **URL:** `https://<YOUR-APP-NAME>.onrender.com/health`
   - **Monitoring Interval:** `Every 5 minutes`
3. Save the monitor. This continuously pings the lightweight `/health` route, ensuring zero cold-starts and 24/7 instant loading!

---

### Step 4: Persistent Disk Setup (Never Lose Data on Restart)

For permanent cloud persistence across server reboots:
- On Render (Starter tier): Click **Disks** > **Add Disk**, set mount path to `/var/data`, and add environment variable `DATA_DIR=/var/data`.
- On Railway: Simply add a Volume and set mount path to `/app/server/data`.
- In-App Backup: The system also includes 1-click **Download Complete Backup (.ZIP)** and daily automated 11:59 PM snapshots inside the Admin Portal.

---

## 🏢 Business Profile Reference
- **Name:** M.K. ENTERPRISES
- **Phone Numbers:** +91 9766550152 / +91 9515018304
- **Address:** Shadnagar Road, PARGI, Vikarabad Dist. - 501 501
- **UPI ID:** 9766550152@upi
- **Default Owner PIN:** `9766` (or `1234`)
- **Default Staff PIN:** `1111`

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { BillingView } from './components/BillingView';
import { InvoiceList } from './components/InvoiceList';
import { CustomerLedgerView } from './components/CustomerLedgerView';
import { InventoryView } from './components/InventoryView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { AdminDashboard } from './components/AdminDashboard';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { AuthScreen } from './components/AuthScreen';
import { AdminOverrideModal } from './components/AdminOverrideModal';

import { CompanyProfile, Customer, Invoice, InventoryItem, AuthSession, UserRole } from './types';
import { apiService } from './services/api';

export function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => apiService.getCurrentSession());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalSales: 0,
    totalReceived: 0,
    totalPendingDue: 0,
    totalInvoices: 0,
    totalCustomers: 0,
    todaySales: 0,
    todayReceived: 0,
    todayInvoiceCount: 0,
    lowStockCount: 0,
    lowStockItems: []
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Print Modal State
  const [activePrintInvoice, setActivePrintInvoice] = useState<Invoice | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Admin Override Modal State
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState<boolean>(false);
  const [overrideTitle, setOverrideTitle] = useState<string>('Admin Authorization Required');
  const [overrideDesc, setOverrideDesc] = useState<string>('Enter Owner / Admin PIN to authorize this action.');
  const [overrideCallback, setOverrideCallback] = useState<(() => void) | null>(null);

  // Selected customer for Ledger deep link
  const [selectedLedgerCustomerId, setSelectedLedgerCustomerId] = useState<string | undefined>();

  // Inactivity Auto-logout (30 minutes)
  useEffect(() => {
    if (!authSession) return;
    let timer: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        alert('Notice: Auto-logged out after 30 minutes of inactivity for security.');
        apiService.logout();
        setAuthSession(null);
      }, 30 * 60 * 1000);
    };

    const activityEvents = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    activityEvents.forEach(evt => window.addEventListener(evt, resetInactivityTimer, { passive: true }));
    resetInactivityTimer();

    return () => {
      clearTimeout(timer);
      activityEvents.forEach(evt => window.removeEventListener(evt, resetInactivityTimer));
    };
  }, [authSession]);

  // Fetch all core application state
  const loadData = async () => {
    try {
      const [profData, custData, invData, stockData, dashMetrics] = await Promise.all([
        apiService.getProfile(),
        apiService.getCustomers(),
        apiService.getInvoices(),
        apiService.getInventory(),
        apiService.getDashboardMetrics()
      ]);

      setProfile(profData);
      setCustomers(custData);
      setInvoices(invData);
      setInventory(stockData);
      setMetrics(dashMetrics);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenPrintModal = (invoice: Invoice) => {
    setActivePrintInvoice(invoice);
    setIsPrintModalOpen(true);
  };

  const handleSaveInvoice = async (invoiceData: Partial<Invoice> & { deductStock?: boolean }) => {
    const created = await apiService.createInvoice(invoiceData);
    await loadData();
    return created;
  };

  const handleDeleteInvoice = async (id: string) => {
    await apiService.deleteInvoice(id);
    await loadData();
  };

  const handleUpdateProfile = async (updated: CompanyProfile) => {
    await apiService.updateProfile(updated);
    setProfile(updated);
  };

  const handleLogout = () => {
    apiService.logout();
    setAuthSession(null);
    setCurrentTab('dashboard');
  };

  const triggerAdminOverride = (title: string, desc: string, callback: () => void) => {
    setOverrideTitle(title);
    setOverrideDesc(desc);
    setOverrideCallback(() => callback);
    setIsOverrideModalOpen(true);
  };

  const handleNavigate = (tab: string, state?: any) => {
    // Check role restrictions
    const userRole = authSession?.user.role;
    if (userRole === 'STAFF' && (tab === 'admin' || tab === 'reports' || tab === 'settings')) {
      triggerAdminOverride(
        `Restricted Screen: ${tab.toUpperCase()}`,
        `Access to ${tab} requires Owner / Admin PIN override.`,
        () => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      );
      return;
    }

    if (tab === 'ledger' && state?.customerId) {
      setSelectedLedgerCustomerId(state.customerId);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-teal-500 animate-spin border-4 border-slate-700 border-t-white mb-4" />
        <h2 className="text-xl font-bold tracking-tight">M.K. ENTERPRISES</h2>
        <p className="text-xs text-slate-400 mt-1">Loading Glass &amp; Aluminium Billing System...</p>
      </div>
    );
  }

  // If not authenticated, show Role Login Screen
  if (!authSession) {
    return (
      <AuthScreen
        profile={profile}
        onLoginSuccess={(session) => {
          setAuthSession(session);
          if (session.user.role === 'ADMIN') {
            setCurrentTab('admin');
          } else {
            setCurrentTab('dashboard');
          }
        }}
      />
    );
  }

  const userRole = authSession.user.role;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => handleNavigate(tab)}
        profile={profile}
        lowStockCount={metrics.lowStockCount || 0}
        userRole={userRole}
        userName={authSession.user.name}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <Dashboard
            metrics={metrics}
            recentInvoices={invoices}
            customers={customers}
            profile={profile}
            onNavigate={handleNavigate}
            onPrintInvoice={handleOpenPrintModal}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard
            metrics={metrics}
            customers={customers}
            invoices={invoices}
            inventory={inventory}
            profile={profile}
            onNavigate={handleNavigate}
            onRefreshAll={loadData}
          />
        )}

        {currentTab === 'billing' && (
          <BillingView
            customers={customers}
            inventory={inventory}
            profile={profile}
            onSaveInvoice={handleSaveInvoice}
            onPrintInvoice={handleOpenPrintModal}
          />
        )}

        {currentTab === 'invoices' && (
          <InvoiceList
            invoices={invoices}
            profile={profile}
            userRole={userRole}
            onPrintInvoice={handleOpenPrintModal}
            onDeleteInvoice={handleDeleteInvoice}
            onNavigateNewBill={() => setCurrentTab('billing')}
            onRequestAdminOverride={triggerAdminOverride}
          />
        )}

        {currentTab === 'ledger' && (
          <CustomerLedgerView
            customers={customers}
            profile={profile}
            selectedCustomerId={selectedLedgerCustomerId}
            userRole={userRole}
            onRefresh={loadData}
            onPrintInvoice={handleOpenPrintModal}
          />
        )}

        {currentTab === 'inventory' && (
          <InventoryView
            inventory={inventory}
            userRole={userRole}
            onRefresh={loadData}
            onAdminOverride={() => triggerAdminOverride(
              'Stock Inward Access',
              'Adding supplier shipment stock requires Admin PIN override.',
              () => {}
            )}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            profile={profile}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onRefreshAll={loadData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">{profile.businessName}</span>
            <span>&bull;</span>
            <span>{profile.address}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Direct Phones: {profile.phones.join(' / ')}</span>
            <span>&bull;</span>
            <span className="font-semibold text-teal-700">Role: {userRole} ({authSession.user.name})</span>
          </div>
        </div>
      </footer>

      {/* Printable Invoice Modal */}
      <InvoicePrintModal
        invoice={activePrintInvoice}
        profile={profile}
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setActivePrintInvoice(null);
        }}
      />

      {/* Admin Override PIN Modal */}
      <AdminOverrideModal
        isOpen={isOverrideModalOpen}
        actionTitle={overrideTitle}
        actionDescription={overrideDesc}
        onSuccess={() => {
          if (overrideCallback) overrideCallback();
        }}
        onClose={() => {
          setIsOverrideModalOpen(false);
          setOverrideCallback(null);
        }}
      />
    </div>
  );
}

export default App;

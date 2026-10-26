import React, { useState } from 'react';
import { 
  Building2, 
  Receipt, 
  Users, 
  Boxes, 
  BarChart3, 
  Settings, 
  Phone, 
  MapPin, 
  PlusCircle, 
  Menu, 
  X,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ShieldCheck,
  User,
  LogOut,
  Crown
} from 'lucide-react';
import { CompanyProfile, UserRole } from '../types';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  profile: CompanyProfile;
  lowStockCount: number;
  userRole: UserRole;
  userName?: string;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  profile,
  lowStockCount,
  userRole,
  userName,
  onLogout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Define tab items based on active role
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: ['ADMIN', 'STAFF'] },
    { id: 'admin', label: 'Admin Portal', icon: Crown, roles: ['ADMIN'], special: true },
    { id: 'billing', label: 'Smart Billing', icon: Receipt, roles: ['ADMIN', 'STAFF'], highlight: true },
    { id: 'invoices', label: 'Bills & Quotes', icon: FileSpreadsheet, roles: ['ADMIN', 'STAFF'] },
    { id: 'ledger', label: 'Customer Ledger', icon: Users, roles: ['ADMIN', 'STAFF'] },
    { 
      id: 'inventory', 
      label: 'Stock & Inventory', 
      icon: Boxes, 
      roles: ['ADMIN', 'STAFF'],
      badge: lowStockCount > 0 ? lowStockCount : undefined 
    },
    { id: 'reports', label: 'GST Reports', icon: Layers, roles: ['ADMIN'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['ADMIN'] }
  ];

  const visibleNavItems = allNavItems.filter(item => item.roles.includes(userRole));

  const handleNavClick = (id: string) => {
    onTabChange(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top micro bar with contact and address info */}
      <div className="bg-navy-900 text-slate-200 px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-teal-300 font-medium">
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              {profile.address}
            </span>
            <span className="hidden sm:inline-block text-slate-500">|</span>
            <span className="hidden sm:flex items-center gap-1.5 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Digital &bull; Etching &bull; Tuffen Glass &bull; Railing &bull; UPVC &amp; Aluminium
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <a href={`tel:${profile.phones[0]}`} className="hover:text-white transition-colors font-mono">
                {profile.phones[0]}
              </a>
              <span className="text-slate-500">/</span>
              <a href={`tel:${profile.phones[1]}`} className="hover:text-white transition-colors font-mono">
                {profile.phones[1]}
              </a>
            </div>
            {profile.gstin && (
              <span className="hidden sm:inline-block bg-slate-800 text-teal-300 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider font-semibold">
                GST: {profile.gstin}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 ring-2 ring-brand-100">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-navy-900 leading-tight">
                  M.K. ENTERPRISES
                </span>
                <span className="bg-brand-50 text-brand-700 border border-brand-200 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Glass &amp; Alu
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Billing, Ledger &amp; Stock System
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all relative ${
                    isActive
                      ? item.special 
                        ? 'bg-amber-100 text-amber-900 shadow-xs'
                        : 'bg-brand-50 text-brand-700 shadow-xs'
                      : item.special
                        ? 'text-amber-700 hover:bg-amber-50 hover:text-amber-900'
                        : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${
                    isActive 
                      ? item.special ? 'text-amber-600' : 'text-brand-600' 
                      : item.special ? 'text-amber-500' : 'text-slate-400'
                  }`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Button, Active Role Badge & Logout */}
          <div className="flex items-center gap-2.5">
            {/* Role Badge with direct click to switch/logout */}
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              {userRole === 'ADMIN' ? (
                <span className="flex items-center gap-1 font-bold text-slate-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span className="hidden sm:inline">Owner</span> (Admin)
                </span>
              ) : (
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <User className="w-3.5 h-3.5 text-brand-600" />
                  <span>Staff</span>
                </span>
              )}
              <button
                onClick={onLogout}
                title="Switch User / Logout"
                className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => onTabChange('billing')}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all hover:shadow active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">New Bill</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg animate-in slide-in-from-top-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold ${
                  isActive
                    ? item.special ? 'bg-amber-100 text-amber-900' : 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge} low
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-3 text-xs text-slate-500">
            <span>Signed in as <strong>{userRole}</strong></span>
            <button
              onClick={onLogout}
              className="text-rose-600 font-bold flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

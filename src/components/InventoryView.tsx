import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle, 
  Search, 
  Filter, 
  Clock, 
  ShieldAlert, 
  FileSpreadsheet, 
  X,
  Layers,
  Sparkles,
  Tag
} from 'lucide-react';
import { InventoryItem, StockLog, StockLogType, UserRole } from '../types';
import { formatCurrency, formatNumber } from '../utils/calculator';
import { apiService } from '../services/api';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onRefresh: () => void;
  userRole?: UserRole;
  onAdminOverride?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  onRefresh,
  userRole = 'ADMIN',
  onAdminOverride
}) => {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'LOGS'>('STOCK');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);

  // Modals
  const [isInwardModalOpen, setIsInwardModalOpen] = useState<boolean>(false);
  const [isOutwardModalOpen, setIsOutwardModalOpen] = useState<boolean>(false);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState<boolean>(false);

  // Inward Form State
  const [inwardItemId, setInwardItemId] = useState<string>('');
  const [inwardQty, setInwardQty] = useState<number>(100);
  const [inwardVendor, setInwardVendor] = useState<string>('');
  const [inwardCost, setInwardCost] = useState<number>(0);
  const [inwardRef, setInwardRef] = useState<string>('');
  const [inwardNotes, setInwardNotes] = useState<string>('');

  // Outward / Wastage Form State
  const [outwardItemId, setOutwardItemId] = useState<string>('');
  const [outwardQty, setOutwardQty] = useState<number>(10);
  const [outwardReason, setOutwardReason] = useState<'WASTAGE_BREAKAGE' | 'OUTWARD_SALE' | 'SITE_CUT'>('WASTAGE_BREAKAGE');
  const [outwardVendor, setOutwardVendor] = useState<string>('');
  const [outwardRef, setOutwardRef] = useState<string>('');
  const [outwardNotes, setOutwardNotes] = useState<string>('');

  // New Item Form State
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemCategory, setNewItemCategory] = useState<InventoryItem['category']>('Glass Sheets');
  const [newItemThickness, setNewItemThickness] = useState<string>('12mm');
  const [newItemUnit, setNewItemUnit] = useState<InventoryItem['unit']>('Sq. Ft');
  const [newItemStock, setNewItemStock] = useState<number>(100);
  const [newItemMinAlert, setNewItemMinAlert] = useState<number>(30);
  const [newItemCostRate, setNewItemCostRate] = useState<number>(140);
  const [newItemSellingRate, setNewItemSellingRate] = useState<number>(190);
  const [newItemNotes, setNewItemNotes] = useState<string>('');

  // Fetch logs on mount
  useEffect(() => {
    apiService.getStockLogs().then(setStockLogs);
  }, []);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          (item.type && item.type.toLowerCase().includes(search.toLowerCase())) ||
                          (item.thickness && item.thickness.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const lowStockItems = inventory.filter(i => Number(i.currentStock) <= Number(i.minAlertStock));
  const totalStockValue = inventory.reduce((sum, i) => sum + (Number(i.currentStock) * Number(i.costRate || 0)), 0);
  const totalGlassSqFt = inventory
    .filter(i => i.category === 'Glass Sheets' && i.unit === 'Sq. Ft')
    .reduce((sum, i) => sum + Number(i.currentStock), 0);

  // Inward Submit
  const handleInwardSubmit = async () => {
    if (!inwardItemId || inwardQty <= 0) {
      alert('Please select an item and enter valid quantity');
      return;
    }
    try {
      await apiService.stockInward({
        itemId: inwardItemId,
        quantity: inwardQty,
        vendor: inwardVendor,
        costPrice: inwardCost || undefined,
        refNumber: inwardRef,
        notes: inwardNotes
      });
      setIsInwardModalOpen(false);
      setInwardQty(100);
      setInwardVendor('');
      setInwardCost(0);
      setInwardRef('');
      setInwardNotes('');
      onRefresh();
      apiService.getStockLogs().then(setStockLogs);
    } catch (err) {
      alert('Failed to log stock inward');
    }
  };

  // Outward / Wastage Submit
  const handleOutwardSubmit = async () => {
    if (!outwardItemId || outwardQty <= 0) {
      alert('Please select an item and enter valid quantity');
      return;
    }
    try {
      await apiService.stockOutward({
        itemId: outwardItemId,
        quantity: outwardQty,
        reason: outwardReason,
        vendor: outwardVendor,
        refNumber: outwardRef,
        notes: outwardNotes
      });
      setIsOutwardModalOpen(false);
      setOutwardQty(10);
      setOutwardVendor('');
      setOutwardRef('');
      setOutwardNotes('');
      onRefresh();
      apiService.getStockLogs().then(setStockLogs);
    } catch (err) {
      alert('Failed to log stock outward');
    }
  };

  // New Item Submit
  const handleNewItemSubmit = async () => {
    if (!newItemName.trim()) {
      alert('Item name is required');
      return;
    }
    try {
      await apiService.addInventoryItem({
        name: newItemName.trim(),
        category: newItemCategory,
        thickness: newItemThickness,
        unit: newItemUnit,
        currentStock: Number(newItemStock) || 0,
        minAlertStock: Number(newItemMinAlert) || 10,
        costRate: Number(newItemCostRate) || 0,
        sellingRate: Number(newItemSellingRate) || 0,
        notes: newItemNotes.trim()
      });
      setIsNewItemModalOpen(false);
      setNewItemName('');
      setNewItemNotes('');
      onRefresh();
    } catch (err) {
      alert('Failed to add item');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-teal-50 text-teal-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-teal-200 uppercase tracking-wider">
              Warehouse &amp; Shop Floor
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Inward &bull; Outward &bull; Wastage / Breakage Log
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Stock &amp; Inventory Management
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {userRole === 'ADMIN' && (
            <button
              onClick={() => {
                if (inventory.length > 0) setInwardItemId(inventory[0].id);
                setIsInwardModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Stock In (Inward)</span>
            </button>
          )}

          <button
            onClick={() => {
              if (inventory.length > 0) setOutwardItemId(inventory[0].id);
              setIsOutwardModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Record Wastage / Breakage</span>
          </button>

          {userRole === 'ADMIN' && (
            <button
              onClick={() => setIsNewItemModalOpen(true)}
              className="flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Glass in Stock</div>
          <div className="text-2xl font-black text-brand-900 font-mono mt-1">
            {formatNumber(totalGlassSqFt)} Sq. Ft.
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Toughened, Etching &amp; Plain sheets</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">
            {userRole === 'ADMIN' ? 'Estimated Inventory Value' : 'Item Varieties Cataloged'}
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {userRole === 'ADMIN' ? formatCurrency(totalStockValue) : `${inventory.length} Varieties`}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {userRole === 'ADMIN' ? 'At warehouse cost prices' : 'Glass, aluminium &amp; hardware types'}
          </div>
        </div>

        <div className={`rounded-xl p-4 border shadow-xs ${
          lowStockItems.length > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-200'
        }`}>
          <div className="text-xs font-semibold text-amber-800 uppercase flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Items Alert</span>
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono mt-1">
            {lowStockItems.length} Items Low
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5">Below safe replenishment buffer</div>
        </div>
      </div>

      {/* Tabs: Live Inventory vs Movement Logs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('STOCK')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeTab === 'STOCK'
              ? 'text-brand-600 border-b-2 border-brand-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Live Inventory Stock ({inventory.length})
        </button>
        <button
          onClick={() => setActiveTab('LOGS')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative ${
            activeTab === 'LOGS'
              ? 'text-brand-600 border-b-2 border-brand-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Stock Movement &amp; Wastage Logs ({stockLogs.length})
        </button>
      </div>

      {activeTab === 'STOCK' ? (
        <>
          {/* Category Filter and Search */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items by name, thickness..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['ALL', 'Glass Sheets', 'Aluminium Profiles', 'UPVC Profiles', 'Hardware & Fittings'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                    <th className="py-3 px-4">Item Code</th>
                    <th className="py-3 px-4">Item Name &amp; Specs</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Available Stock</th>
                    <th className="py-3 px-4 text-right">Min Buffer</th>
                    {userRole === 'ADMIN' && (
                      <th className="py-3 px-4 text-right">Cost Rate</th>
                    )}
                    <th className="py-3 px-4 text-right">Selling Rate</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.map(item => {
                    const isLow = Number(item.currentStock) <= Number(item.minAlertStock);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-500 text-[11px]">
                          {item.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                          {item.notes && (
                            <div className="text-[11px] text-slate-500 mt-0.5">{item.notes}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-700">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-sm">
                          <span className={isLow ? 'text-amber-700' : 'text-slate-900'}>
                            {formatNumber(item.currentStock)} {item.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          {item.minAlertStock} {item.unit}
                        </td>
                        {userRole === 'ADMIN' && (
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            {formatCurrency(item.costRate)}/{item.unit}
                          </td>
                        )}
                        <td className="py-3 px-4 text-right font-mono font-bold text-brand-700">
                          {formatCurrency(item.sellingRate)}/{item.unit}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              In Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredInventory.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        No inventory items matching this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Stock Movement & Wastage Logs Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">Audit Trail: Inward, Outward &amp; Scrap</h4>
            <span className="text-xs text-slate-500 font-mono">{stockLogs.length} Events</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4">Party / Source</th>
                  <th className="py-3 px-4">Reference #</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-slate-500">{log.date}</td>
                    <td className="py-2.5 px-4">
                      {log.type === 'INWARD' ? (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          + INWARD (STOCK IN)
                        </span>
                      ) : log.type === 'WASTAGE_BREAKAGE' ? (
                        <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          - BREAKAGE / WASTAGE
                        </span>
                      ) : (
                        <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          - OUTWARD (BILL)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{log.itemName}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold">
                      {log.type === 'INWARD' ? `+${log.quantity}` : `-${log.quantity}`} {log.unit}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{log.vendor || '-'}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">{log.refNumber}</td>
                    <td className="py-2.5 px-4 text-slate-500 text-[11px]">{log.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Inward Modal */}
      {isInwardModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Stock Inward (Stock In)</h3>
                <p className="text-xs text-slate-500">Record incoming supplier glass shipment</p>
              </div>
              <button onClick={() => setIsInwardModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Item *</label>
                <select
                  value={inwardItemId}
                  onChange={(e) => {
                    setInwardItemId(e.target.value);
                    const sel = inventory.find(i => i.id === e.target.value);
                    if (sel) setInwardCost(sel.costRate);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  {inventory.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Current: {i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Inward Quantity *</label>
                  <input
                    type="number"
                    value={inwardQty || ''}
                    onChange={(e) => setInwardQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Cost Rate (₹)</label>
                  <input
                    type="number"
                    value={inwardCost || ''}
                    onChange={(e) => setInwardCost(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Supplier / Vendor Name</label>
                <input
                  type="text"
                  value={inwardVendor}
                  onChange={(e) => setInwardVendor(e.target.value)}
                  placeholder="e.g. Saint-Gobain Depot / Jindal Aluminium"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Inward Bill / Challan Ref #</label>
                <input
                  type="text"
                  value={inwardRef}
                  onChange={(e) => setInwardRef(e.target.value)}
                  placeholder="e.g. BL-2026-948"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Notes</label>
                <input
                  type="text"
                  value={inwardNotes}
                  onChange={(e) => setInwardNotes(e.target.value)}
                  placeholder="e.g. 10 sheets lot delivered"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsInwardModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleInwardSubmit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm"
              >
                Add Stock Inward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Outward / Wastage Modal */}
      {isOutwardModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Record Breakage &amp; Wastage</h3>
                <p className="text-xs text-slate-500">Log broken glass sheets or scrap offcuts</p>
              </div>
              <button onClick={() => setIsOutwardModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Item *</label>
                <select
                  value={outwardItemId}
                  onChange={(e) => setOutwardItemId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  {inventory.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Current: {i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Quantity Lost / Broken *</label>
                  <input
                    type="number"
                    value={outwardQty || ''}
                    onChange={(e) => setOutwardQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-rose-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Reason / Category</label>
                  <select
                    value={outwardReason}
                    onChange={(e) => setOutwardReason(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    <option value="WASTAGE_BREAKAGE">Glass Breakage / Damage</option>
                    <option value="SITE_CUT">Offcut Scrap</option>
                    {userRole === 'ADMIN' && (
                      <option value="OUTWARD_SALE">Manual Direct Sale</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Cause / Scrap Details</label>
                <input
                  type="text"
                  value={outwardNotes}
                  onChange={(e) => setOutwardNotes(e.target.value)}
                  placeholder="e.g. Edge chipped during manual polishing"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsOutwardModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleOutwardSubmit}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm"
              >
                Deduct &amp; Log Wastage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Inventory Item Modal */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Add New Inventory Item</h3>
                <p className="text-xs text-slate-500">M.K. Enterprises Catalog</p>
              </div>
              <button onClick={() => setIsNewItemModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Item Name *</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. 10mm Tinted Grey Glass"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    <option value="Glass Sheets">Glass Sheets</option>
                    <option value="Aluminium Profiles">Aluminium Profiles</option>
                    <option value="UPVC Profiles">UPVC Profiles</option>
                    <option value="Hardware & Fittings">Hardware &amp; Fittings</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Billing Unit</label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    <option value="Sq. Ft">Sq. Ft (Area)</option>
                    <option value="Rft">Rft (Running Feet)</option>
                    <option value="Pcs">Pcs (Pieces)</option>
                    <option value="Sets">Sets</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Opening Stock</label>
                  <input
                    type="number"
                    value={newItemStock || ''}
                    onChange={(e) => setNewItemStock(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Low Stock Alert Min</label>
                  <input
                    type="number"
                    value={newItemMinAlert || ''}
                    onChange={(e) => setNewItemMinAlert(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Cost Rate (₹)</label>
                  <input
                    type="number"
                    value={newItemCostRate || ''}
                    onChange={(e) => setNewItemCostRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Selling Rate (₹)</label>
                  <input
                    type="number"
                    value={newItemSellingRate || ''}
                    onChange={(e) => setNewItemSellingRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-brand-700"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsNewItemModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleNewItemSubmit}
                className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm"
              >
                Save Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

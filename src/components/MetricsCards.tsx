import React from 'react';
import { 
  Package, 
  Boxes, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';
import { InventoryItem } from '../types/inventory';

interface MetricsCardsProps {
  items: InventoryItem[];
  activeFilter: string;
  onFilterChange: (status: string) => void;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  items,
  activeFilter,
  onFilterChange,
}) => {
  const totalItems = items.length;
  const totalUnits = items.reduce((acc, item) => acc + item.quantity, 0);
  
  const totalCostValuation = items.reduce(
    (acc, item) => acc + item.quantity * item.unit_cost,
    0
  );
  
  const totalRetailValuation = items.reduce(
    (acc, item) => acc + item.quantity * item.selling_price,
    0
  );
  
  const potentialProfit = Math.max(0, totalRetailValuation - totalCostValuation);
  const profitMarginPercent = totalRetailValuation > 0 
    ? ((potentialProfit / totalRetailValuation) * 100).toFixed(1) 
    : '0';

  const lowStockItems = items.filter(
    (item) => item.quantity > 0 && item.quantity <= item.reorder_level
  );
  const outOfStockItems = items.filter((item) => item.quantity === 0);
  const totalAlerts = lowStockItems.length + outOfStockItems.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Unique Items */}
      <div 
        onClick={() => onFilterChange('all')}
        className={`cursor-pointer bg-white rounded-xl p-5 border transition-all shadow-xs hover:border-slate-300 ${
          activeFilter === 'all' ? 'ring-2 ring-indigo-500/30 border-indigo-200' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Inventory SKUs
          </span>
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {totalItems}
          </span>
          <span className="text-xs font-medium text-slate-500">products listed</span>
        </div>
        <div className="mt-3 flex items-center text-xs text-slate-500 gap-1.5 pt-2 border-t border-slate-100">
          <span className="font-medium text-indigo-600">Active MySQL Table:</span>
          <span>inventory_items</span>
        </div>
      </div>

      {/* 2. Total Warehouse Units */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Warehouse Stock Units
          </span>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Boxes className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {totalUnits.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-slate-500">units on hand</span>
        </div>
        <div className="mt-3 flex items-center text-xs text-slate-500 gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-slate-600">Avg per SKU:</span>
          <span className="font-semibold text-slate-800">
            {totalItems > 0 ? Math.round(totalUnits / totalItems) : 0} units
          </span>
        </div>
      </div>

      {/* 3. Valuation (Cost vs Retail) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Cost Valuation
          </span>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">
            ${totalCostValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1 text-slate-600">
            Retail value: <strong className="text-slate-800">${Math.round(totalRetailValuation).toLocaleString()}</strong>
          </span>
          <span className="inline-flex items-center text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
            <TrendingUp className="w-3 h-3 mr-0.5" />
            {profitMarginPercent}%
          </span>
        </div>
      </div>

      {/* 4. Low & Out of Stock Alerts */}
      <div 
        onClick={() => onFilterChange(activeFilter === 'attention' ? 'all' : 'attention')}
        className={`cursor-pointer bg-white rounded-xl p-5 border transition-all shadow-xs ${
          activeFilter === 'attention'
            ? 'ring-2 ring-amber-500 border-amber-300 bg-amber-50/20'
            : totalAlerts > 0
            ? 'border-amber-200 hover:border-amber-300'
            : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Reorder Attention
          </span>
          <div className={`p-2 rounded-lg ${totalAlerts > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-3xl font-extrabold tracking-tight ${totalAlerts > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {totalAlerts}
          </span>
          <span className="text-xs font-medium text-slate-500">items need reorder</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="text-amber-700 font-medium">
            {lowStockItems.length} Low • {outOfStockItems.length} Depleted
          </span>
          <span className="text-indigo-600 hover:underline font-semibold flex items-center gap-0.5">
            {activeFilter === 'attention' ? 'Show all' : 'Filter table'}
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};

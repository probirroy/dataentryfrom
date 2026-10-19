import React from 'react';
import { 
  X, 
  Edit, 
  Trash2, 
  Copy, 
  Check, 
  Layers, 
  Building2, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  Barcode as BarcodeIcon,
  Plus,
  Minus
} from 'lucide-react';
import { InventoryItem } from '../types/inventory';

interface ItemDetailModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onQuickAdjustQuantity: (id: number, delta: number) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onQuickAdjustQuantity,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !item) return null;

  const handleCopySku = () => {
    navigator.clipboard.writeText(item.sku);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const unitCost = Number(item.unit_cost);
  const unitPrice = Number(item.selling_price);
  const totalCostValue = item.quantity * unitCost;
  const totalRetailValue = item.quantity * unitPrice;
  const profitPerUnit = unitPrice - unitCost;
  const profitMargin = unitPrice > 0 ? ((profitPerUnit / unitPrice) * 100).toFixed(1) : '0';

  const isLowStock = item.quantity > 0 && item.quantity <= item.reorder_level;
  const isOutOfStock = item.quantity === 0;

  // Realistic mock barcode pattern generator based on SKU string
  const barcodeBars = Array.from(item.sku + '98412').map((char, index) => {
    const code = char.charCodeAt(0);
    const width = (code % 3) + 1.5;
    const isGap = index % 4 === 3;
    return { width, isGap };
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-slate-200 text-slate-800">
                {item.category}
              </span>
              {isOutOfStock ? (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Low Stock
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  In Stock
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-2 leading-snug">
              {item.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Barcode & SKU Card */}
          <div className="p-4 bg-slate-900 rounded-xl text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1 justify-center sm:justify-start">
                <BarcodeIcon className="w-3.5 h-3.5 text-indigo-400" />
                Barcode / SKU Code
              </div>
              <div className="font-mono text-xl font-bold text-white tracking-wider mt-0.5">
                {item.sku}
              </div>
            </div>

            {/* Visual Simulated Barcode */}
            <div className="bg-white p-2.5 rounded-lg flex flex-col items-center shadow-xs">
              <div className="flex items-end h-8 gap-[1.5px] px-2">
                {barcodeBars.slice(0, 22).map((bar, i) => (
                  <div
                    key={i}
                    style={{ width: `${bar.width}px` }}
                    className={`h-full ${bar.isGap ? 'bg-transparent' : 'bg-slate-950'}`}
                  />
                ))}
              </div>
              <span className="text-[9px] font-mono text-slate-800 tracking-widest mt-1">
                *{item.sku}*
              </span>
            </div>

            <button
              onClick={handleCopySku}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy SKU'}</span>
            </button>
          </div>

          {/* Stock Level Quick Adjustment */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                  Current Stock Level
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-2xl font-black ${item.quantity <= item.reorder_level ? 'text-amber-600' : 'text-slate-900'}`}>
                    {item.quantity} units
                  </span>
                  <span className="text-xs text-slate-500">
                    (Reorder trigger at ≤ {item.reorder_level})
                  </span>
                </div>
              </div>

              {/* Quick Increment / Decrement */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
                <button
                  onClick={() => onQuickAdjustQuantity(item.id, -1)}
                  disabled={item.quantity <= 0}
                  title="Remove 1 unit"
                  className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded disabled:opacity-40 transition"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-800 px-2">Adjust</span>
                <button
                  onClick={() => onQuickAdjustQuantity(item.id, 1)}
                  title="Add 1 unit"
                  className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stock Progress Bar */}
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3">
              <div
                className={`h-full transition-all duration-300 ${
                  isOutOfStock
                    ? 'bg-rose-500'
                    : isLowStock
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, (item.quantity / (item.reorder_level * 3 || 30)) * 100))}%` }}
              />
            </div>
          </div>

          {/* Financial Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Unit Cost</span>
              <span className="text-base font-bold text-slate-800">
                ${unitCost.toFixed(2)}
              </span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Selling Price</span>
              <span className="text-base font-bold text-indigo-700">
                ${unitPrice.toFixed(2)}
              </span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Profit / Unit</span>
              <span className="text-base font-bold text-emerald-600">
                +${profitPerUnit.toFixed(2)}
              </span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Margin</span>
              <span className="text-base font-bold text-emerald-600">
                {profitMargin}%
              </span>
            </div>
          </div>

          {/* Total Valuation Row */}
          <div className="flex items-center justify-between p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs">
            <span className="text-emerald-800 font-medium">Total Cost Valuation (Qty × Cost):</span>
            <span className="text-sm font-extrabold text-emerald-900">
              ${totalCostValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Warehouse & Supplier Info */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Warehouse Location:
              </span>
              <span className="font-semibold text-slate-800">
                {item.location || 'Default Warehouse Floor'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Primary Supplier:
              </span>
              <span className="font-semibold text-slate-800">
                {item.supplier || 'Not specified'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date Added (created_at):
              </span>
              <span className="font-mono text-slate-700">
                {item.created_at}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Last Modified (updated_at):
              </span>
              <span className="font-mono text-slate-700">
                {item.updated_at}
              </span>
            </div>
          </div>

          {/* Notes */}
          {item.notes && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              <strong className="block text-slate-800 font-semibold mb-1">Product Notes:</strong>
              {item.notes}
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onDelete(item);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Item</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

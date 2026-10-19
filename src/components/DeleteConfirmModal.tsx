import React from 'react';
import { AlertOctagon, Trash2, X, Database } from 'lucide-react';
import { InventoryItem } from '../types/inventory';

interface DeleteConfirmModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  item,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="relative bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Confirm Delete Inventory Item?
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            This action will execute a MySQL <code className="bg-slate-100 text-rose-600 px-1 py-0.5 rounded font-mono text-xs">DELETE</code> statement for:
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="font-semibold text-slate-900 text-sm">{item.name}</div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono">
            <span>SKU: {item.sku}</span>
            <span>•</span>
            <span>Stock: {item.quantity} units</span>
          </div>
        </div>

        <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg">
          <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
            <Database className="w-3 h-3 text-indigo-400" />
            MySQL Statement
          </div>
          DELETE FROM inventory_items WHERE id = {item.id};
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

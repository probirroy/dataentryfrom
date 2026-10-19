import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Database, 
  Layers, 
  DollarSign, 
  Hash, 
  Tag, 
  MapPin, 
  Building2 
} from 'lucide-react';
import { InventoryItem, InventoryFormData, StockStatus } from '../types/inventory';
import { CATEGORIES } from '../data/initialInventory';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InventoryFormData, editingItemId?: number) => void;
  editingItem?: InventoryItem | null;
  existingSkus: string[];
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingItem,
  existingSkus,
}) => {
  const isEditing = !!editingItem;

  const [formData, setFormData] = useState<InventoryFormData>({
    sku: '',
    name: '',
    category: 'Electronics',
    quantity: 10,
    reorder_level: 5,
    unit_cost: 0,
    selling_price: 0,
    supplier: '',
    location: '',
    status: 'in_stock',
    notes: '',
  });

  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCat, setShowCustomCat] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showSqlPreview, setShowSqlPreview] = useState(true);

  // Initialize form when opening or editing
  useEffect(() => {
    if (editingItem) {
      setFormData({
        sku: editingItem.sku,
        name: editingItem.name,
        category: editingItem.category,
        quantity: editingItem.quantity,
        reorder_level: editingItem.reorder_level,
        unit_cost: editingItem.unit_cost,
        selling_price: editingItem.selling_price,
        supplier: editingItem.supplier || '',
        location: editingItem.location || '',
        status: editingItem.status,
        notes: editingItem.notes || '',
      });
      setShowCustomCat(!CATEGORIES.includes(editingItem.category));
    } else {
      // Default new item
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setFormData({
        sku: `SKU-${randomNum}`,
        name: '',
        category: 'Electronics',
        quantity: 25,
        reorder_level: 10,
        unit_cost: 45.00,
        selling_price: 79.99,
        supplier: '',
        location: 'Aisle 1, Shelf A',
        status: 'in_stock',
        notes: '',
      });
      setShowCustomCat(false);
    }
    setErrors({});
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  // Auto-generate unique SKU helper
  const handleGenerateSku = () => {
    const catPrefix = (formData.category || 'GEN').substring(0, 3).toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const generated = `${catPrefix}-${rand}`;
    setFormData((prev) => ({ ...prev, sku: generated }));
    // Clear sku error if present
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.sku;
      return updated;
    });
  };

  // Dynamic profit & margin calculations
  const unitCost = Number(formData.unit_cost) || 0;
  const sellingPrice = Number(formData.selling_price) || 0;
  const unitProfit = sellingPrice - unitCost;
  const marginPercent = sellingPrice > 0 ? ((unitProfit / sellingPrice) * 100).toFixed(1) : '0';
  const markupPercent = unitCost > 0 ? ((unitProfit / unitCost) * 100).toFixed(1) : '0';

  // Determine automatic stock status
  const qty = Number(formData.quantity) || 0;
  const reorder = Number(formData.reorder_level) || 0;
  const computedStatus: StockStatus = 
    qty <= 0 ? 'out_of_stock' : qty <= reorder ? 'low_stock' : 'in_stock';

  // Validation according to Laravel FormRequest specifications
  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!formData.sku.trim()) {
      errs.sku = 'SKU is required (Laravel rule: required|string|max:64)';
    } else {
      // SKU unique validation
      const skuLower = formData.sku.trim().toLowerCase();
      const duplicate = existingSkus.some(
        (s) => s.toLowerCase() === skuLower && (!isEditing || s.toLowerCase() !== editingItem?.sku.toLowerCase())
      );
      if (duplicate) {
        errs.sku = 'This SKU code is already taken in the database (unique:inventory_items,sku)';
      }
    }

    if (!formData.name.trim()) {
      errs.name = 'Item name is required (Laravel rule: required|max:255)';
    }

    if (showCustomCat && !customCategory.trim()) {
      errs.category = 'Please enter a custom category name';
    }

    if (formData.quantity < 0) {
      errs.quantity = 'Quantity cannot be negative (min:0)';
    }

    if (formData.reorder_level < 0) {
      errs.reorder_level = 'Reorder level cannot be negative (min:0)';
    }

    if (formData.unit_cost < 0) {
      errs.unit_cost = 'Cost cannot be negative (min:0)';
    }

    if (formData.selling_price < 0) {
      errs.selling_price = 'Selling price cannot be negative (min:0)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalCategory = showCustomCat && customCategory.trim() 
      ? customCategory.trim() 
      : formData.category;

    const payload: InventoryFormData = {
      ...formData,
      category: finalCategory,
      status: computedStatus,
      quantity: Number(formData.quantity),
      reorder_level: Number(formData.reorder_level),
      unit_cost: Number(formData.unit_cost),
      selling_price: Number(formData.selling_price),
    };

    onSubmit(payload, editingItem?.id);
    onClose();
  };

  // SQL Query generation preview
  const generatedSql = isEditing
    ? `UPDATE inventory_items
SET sku = '${formData.sku}',
    name = '${formData.name.replace(/'/g, "''")}',
    category = '${showCustomCat ? customCategory : formData.category}',
    quantity = ${formData.quantity},
    reorder_level = ${formData.reorder_level},
    unit_cost = ${formData.unit_cost},
    selling_price = ${formData.selling_price},
    supplier = ${formData.supplier ? `'${formData.supplier.replace(/'/g, "''")}'` : 'NULL'},
    location = ${formData.location ? `'${formData.location.replace(/'/g, "''")}'` : 'NULL'},
    status = '${computedStatus}',
    updated_at = NOW()
WHERE id = ${editingItem.id};`
    : `INSERT INTO inventory_items 
(sku, name, category, quantity, reorder_level, unit_cost, selling_price, supplier, location, status, notes, created_at, updated_at)
VALUES (
  '${formData.sku}',
  '${formData.name.replace(/'/g, "''") || 'Product Name'}',
  '${showCustomCat ? customCategory : formData.category}',
  ${formData.quantity},
  ${formData.reorder_level},
  ${formData.unit_cost},
  ${formData.selling_price},
  ${formData.supplier ? `'${formData.supplier.replace(/'/g, "''")}'` : 'NULL'},
  ${formData.location ? `'${formData.location.replace(/'/g, "''")}'` : 'NULL'},
  '${computedStatus}',
  ${formData.notes ? `'${formData.notes.replace(/'/g, "''")}'` : 'NULL'},
  NOW(),
  NOW()
);`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Inventory Item' : 'New Inventory Item Data Entry'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulating Laravel FormRequest validation and MySQL {isEditing ? 'UPDATE' : 'INSERT'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* General Errors Banner */}
          {Object.keys(errors).length > 0 && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Validation failed in FormRequest:</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-rose-700">
                  {Object.values(errors).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Product Identification: SKU & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-indigo-500" />
                  SKU / Barcode ID <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:underline"
                >
                  <Sparkles className="w-3 h-3" />
                  Auto-Gen SKU
                </button>
              </div>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                placeholder="e.g. ELEC-9821"
                className={`w-full text-sm font-mono px-3.5 py-2.5 rounded-lg border focus:outline-none focus:ring-2 ${
                  errors.sku 
                    ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20' 
                    : 'border-slate-300 focus:ring-indigo-500'
                }`}
              />
              {errors.sku && <p className="text-rose-600 text-xs mt-1">{errors.sku}</p>}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-indigo-500" />
                Category <span className="text-rose-500">*</span>
              </label>
              {!showCustomCat ? (
                <div className="flex gap-2">
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setShowCustomCat(true);
                      } else {
                        setFormData({ ...formData, category: e.target.value });
                      }
                    }}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__NEW__">+ Add Custom Category...</option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter new category"
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomCat(false)}
                    className="px-2.5 text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              Item / Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Ergonomic Office Chair with Lumbar Support"
              className={`w-full text-sm px-3.5 py-2.5 rounded-lg border focus:outline-none focus:ring-2 ${
                errors.name 
                  ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20' 
                  : 'border-slate-300 focus:ring-indigo-500'
              }`}
            />
            {errors.name && <p className="text-rose-600 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Stock Quantities & Threshold */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
            <span className="text-xs font-bold uppercase text-slate-600 tracking-wider block">
              Stock Levels & Health
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Quantity On Hand (Units) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Reorder Alert Threshold <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.reorder_level}
                  onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Calculated Status Badge */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500">Computed Status:</span>
              {computedStatus === 'in_stock' && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                  ✓ In Stock ({formData.quantity} units healthy)
                </span>
              )}
              {computedStatus === 'low_stock' && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                  ⚠ Low Stock (At or below {formData.reorder_level} threshold)
                </span>
              )}
              {computedStatus === 'out_of_stock' && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold border border-rose-200">
                  ✕ Out of Stock (0 units)
                </span>
              )}
            </div>
          </div>

          {/* Pricing & Profit Calculation */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-600 tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Unit Pricing & Profit Margins
              </span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Profit: ${unitProfit.toFixed(2)} / unit ({marginPercent}%)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Unit Cost Basis ($) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full text-sm pl-7 pr-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Selling Price ($) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                    className="w-full text-sm pl-7 pr-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-600 pt-1">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Total Batch Cost</span>
                <strong className="text-slate-800">${(formData.quantity * unitCost).toFixed(2)}</strong>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Potential Retail</span>
                <strong className="text-slate-800">${(formData.quantity * sellingPrice).toFixed(2)}</strong>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Markup</span>
                <strong className="text-emerald-600">{markupPercent}%</strong>
              </div>
            </div>
          </div>

          {/* Supplier & Warehouse Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Supplier / Vendor
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="e.g. Apex Tech Wholesale Ltd"
                className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Warehouse Location / Aisle
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Aisle 3, Rack C2"
                className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Notes / Description */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Internal Notes / Specifications
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Fragile item, requires temperature controlled storage..."
              className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Live MySQL Query Preview Accordion */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSqlPreview(!showSqlPreview)}
              className="w-full px-3.5 py-2 bg-slate-100 hover:bg-slate-200/70 text-left text-xs font-bold text-slate-700 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5 font-mono">
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                Generated MySQL Query ({isEditing ? 'UPDATE' : 'INSERT'})
              </span>
              <span className="text-[11px] text-indigo-600 font-semibold">
                {showSqlPreview ? 'Hide SQL' : 'Show SQL'}
              </span>
            </button>
            {showSqlPreview && (
              <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed border-t border-slate-800">
                {generatedSql}
              </pre>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg shadow-xs hover:bg-slate-50 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
          >
            <Check className="w-4 h-4" />
            <span>{isEditing ? 'Save Changes' : 'Execute MySQL INSERT'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

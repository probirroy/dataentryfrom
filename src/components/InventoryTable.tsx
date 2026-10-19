import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Eye, 
  Edit3, 
  Trash2, 
  Plus, 
  Minus, 
  Boxes, 
  AlertTriangle, 
  CheckSquare, 
  Square,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { InventoryItem, SortField, SortDirection } from '../types/inventory';
import { CATEGORIES } from '../data/initialInventory';

interface InventoryTableProps {
  items: InventoryItem[];
  onViewItem: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (item: InventoryItem) => void;
  onQuickAdjustQuantity: (id: number, delta: number) => void;
  onOpenCreateModal: () => void;
  onBulkDelete: (ids: number[]) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  onViewItem,
  onEditItem,
  onDeleteItem,
  onQuickAdjustQuantity,
  onOpenCreateModal,
  onBulkDelete,
  filterStatus,
  setFilterStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search matching
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category matching
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;

      // Status matching
      let matchesStatus = true;
      if (filterStatus === 'in_stock') {
        matchesStatus = item.status === 'in_stock';
      } else if (filterStatus === 'low_stock') {
        matchesStatus = item.status === 'low_stock';
      } else if (filterStatus === 'out_of_stock') {
        matchesStatus = item.status === 'out_of_stock';
      } else if (filterStatus === 'attention') {
        matchesStatus = item.status === 'low_stock' || item.status === 'out_of_stock';
      }

      return matchesSearch && matchesCategory && matchesStatus;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'sku') {
        comparison = a.sku.localeCompare(b.sku);
      } else if (sortField === 'quantity') {
        comparison = a.quantity - b.quantity;
      } else if (sortField === 'selling_price') {
        comparison = a.selling_price - b.selling_price;
      } else if (sortField === 'unit_cost') {
        comparison = a.unit_cost - b.unit_cost;
      } else if (sortField === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [items, searchQuery, selectedCategory, filterStatus, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Multi-select handlers
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedItems.map((item) => item.id));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Extract distinct categories in current dataset
  const activeCategories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return ['All', ...Array.from(set)];
  }, [items]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Search, Filter & Bulk Actions Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-slate-50/50">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search SKU, item name, supplier, or aisle location..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Center / Right: Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center p-1 bg-slate-200/60 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => {
                setFilterStatus('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterStatus === 'all' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => {
                setFilterStatus('in_stock');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterStatus === 'in_stock' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => {
                setFilterStatus('low_stock');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterStatus === 'low_stock' ? 'bg-white text-amber-700 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => {
                setFilterStatus('out_of_stock');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterStatus === 'out_of_stock' ? 'bg-white text-rose-700 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Depleted
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs sm:text-sm py-2 pl-3 pr-8 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none shadow-xs text-slate-700 font-medium"
            >
              {activeCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (when items selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 border-y border-indigo-100 px-5 py-2.5 flex items-center justify-between text-xs text-indigo-900">
          <div className="flex items-center gap-2 font-semibold">
            <CheckSquare className="w-4 h-4 text-indigo-600" />
            <span>{selectedIds.length} items selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onBulkDelete(selectedIds);
                setSelectedIds([]);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bulk Delete</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm text-slate-600">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3.5 w-10 text-center">
                <button
                  onClick={handleSelectAll}
                  className="text-slate-400 hover:text-slate-700"
                >
                  {paginatedItems.length > 0 && selectedIds.length === paginatedItems.length ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th 
                onClick={() => handleSort('name')}
                className="px-4 py-3.5 cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>Product / Item & SKU</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="px-4 py-3.5">Category</th>
              <th 
                onClick={() => handleSort('quantity')}
                className="px-4 py-3.5 text-right cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Stock Quantity</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('unit_cost')}
                className="px-4 py-3.5 text-right cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Unit Cost</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('selling_price')}
                className="px-4 py-3.5 text-right cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Selling Price</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="px-4 py-3.5">Stock Status</th>
              <th className="px-4 py-3.5">Location</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const isLow = item.quantity > 0 && item.quantity <= item.reorder_level;
                const isDepleted = item.quantity === 0;

                return (
                  <tr 
                    key={item.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isSelected ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleSelect(item.id)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Product & SKU */}
                    <td className="px-4 py-3.5 max-w-[240px]">
                      <div 
                        onClick={() => onViewItem(item)}
                        className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer truncate"
                        title={item.name}
                      >
                        {item.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.sku}
                        </span>
                        {item.supplier && (
                          <span className="text-[11px] text-slate-400 truncate max-w-[120px]" title={item.supplier}>
                            • {item.supplier}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                        {item.category}
                      </span>
                    </td>

                    {/* Quantity with quick buttons */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onQuickAdjustQuantity(item.id, -1)}
                          disabled={item.quantity <= 0}
                          title="Quick deduct 1 unit"
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-slate-100 disabled:opacity-30 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <span
                          className={`font-mono font-bold px-1.5 py-0.5 rounded text-sm ${
                            isDepleted
                              ? 'text-rose-600 bg-rose-50'
                              : isLow
                              ? 'text-amber-600 bg-amber-50'
                              : 'text-slate-900'
                          }`}
                        >
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => onQuickAdjustQuantity(item.id, 1)}
                          title="Quick add 1 unit"
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      {item.reorder_level > 0 && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          alert ≤ {item.reorder_level}
                        </div>
                      )}
                    </td>

                    {/* Unit Cost */}
                    <td className="px-4 py-3.5 text-right font-mono text-slate-600">
                      ${Number(item.unit_cost).toFixed(2)}
                    </td>

                    {/* Selling Price */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="font-mono font-bold text-slate-900">
                        ${Number(item.selling_price).toFixed(2)}
                      </div>
                      {item.selling_price > item.unit_cost && (
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          +{((item.selling_price - item.unit_cost) / item.selling_price * 100).toFixed(0)}% margin
                        </div>
                      )}
                    </td>

                    {/* Status Pill */}
                    <td className="px-4 py-3.5">
                      {item.status === 'in_stock' && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          In Stock
                        </span>
                      )}
                      {item.status === 'low_stock' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock
                        </span>
                      )}
                      {item.status === 'out_of_stock' && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          Out of Stock
                        </span>
                      )}
                      {item.status === 'discontinued' && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                          Discontinued
                        </span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3.5 text-slate-500 text-xs">
                      {item.location ? (
                        <span className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[110px]">{item.location}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Actions: Show, Edit, Delete */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Show button */}
                        <button
                          onClick={() => onViewItem(item)}
                          title="Show Details (View)"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit button */}
                        <button
                          onClick={() => onEditItem(item)}
                          title="Edit Item"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => onDeleteItem(item)}
                          title="Delete Item"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center">
                  <div className="max-w-sm mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                      <Boxes className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-slate-800 text-base">
                      No Inventory Items Found
                    </div>
                    <p className="text-xs text-slate-500">
                      {searchQuery || selectedCategory !== 'All' || filterStatus !== 'all'
                        ? 'No products match your active search or filters. Try adjusting them or clear filters.'
                        : 'Your inventory database is empty. Click "+ Add Inventory Item" to enter your first product!'}
                    </p>
                    <button
                      onClick={onOpenCreateModal}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
                    >
                      <Plus className="w-4 h-4" />
                      Add Inventory Item
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Footer summary */}
      <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
        <div>
          Showing{' '}
          <strong className="text-slate-700">
            {filteredItems.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
          </strong>{' '}
          to{' '}
          <strong className="text-slate-700">
            {Math.min(currentPage * itemsPerPage, filteredItems.length)}
          </strong>{' '}
          of <strong className="text-slate-700">{filteredItems.length}</strong> entries
          {filteredItems.length !== items.length && ` (filtered from ${items.length} total)`}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const page = idx + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg font-semibold transition ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Code2, 
  Database, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

import { InventoryItem, InventoryFormData, SqlQueryLog, StockStatus } from './types/inventory';
import { INITIAL_INVENTORY_ITEMS } from './data/initialInventory';
import { Navbar } from './components/Navbar';
import { MetricsCards } from './components/MetricsCards';
import { InventoryTable } from './components/InventoryTable';
import { ItemFormModal } from './components/ItemFormModal';
import { ItemDetailModal } from './components/ItemDetailModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { LaravelCodeViewer } from './components/LaravelCodeViewer';
import { SqlConsoleDrawer } from './components/SqlConsoleDrawer';

const STORAGE_KEY = 'inventory_core_items_v1';
const SQL_LOGS_KEY = 'inventory_core_sql_logs_v1';

export default function App() {
  // Inventory items state
  const [items, setItems] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_INVENTORY_ITEMS;
  });

  // SQL Query Logs state
  const [sqlLogs, setSqlLogs] = useState<SqlQueryLog[]>(() => {
    try {
      const saved = localStorage.getItem(SQL_LOGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [
      {
        id: 'init-1',
        timestamp: new Date().toLocaleTimeString(),
        action: 'SELECT',
        query: 'SELECT * FROM `inventory_items` ORDER BY `created_at` DESC LIMIT 10;',
        executionTimeMs: 1.8,
        eloquentEquivalent: 'InventoryItem::latest()->paginate(10);',
      },
    ];
  });

  // Navigation & UI state
  const [currentView, setCurrentView] = useState<'dashboard' | 'code' | 'sql'>('dashboard');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);

  // Toast notification (simulating Laravel session()->flash('success', ...))
  const [flashMessage, setFlashMessage] = useState<{
    type: 'success' | 'danger' | 'info';
    text: string;
    undoAction?: () => void;
  } | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save inventory state', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(SQL_LOGS_KEY, JSON.stringify(sqlLogs.slice(0, 30)));
    } catch (e) {
      console.error('Failed to save SQL logs', e);
    }
  }, [sqlLogs]);

  // Toast auto-hide
  useEffect(() => {
    if (!flashMessage) return;
    const timer = setTimeout(() => {
      setFlashMessage(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [flashMessage]);

  // Helper to log SQL statement
  const logSql = (
    action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    query: string,
    eloquentEquivalent: string
  ) => {
    const newLog: SqlQueryLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      action,
      query,
      executionTimeMs: parseFloat((Math.random() * 2.5 + 0.4).toFixed(2)),
      eloquentEquivalent,
    };
    setSqlLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  // Helper to format timestamps
  const getCurrentTimestamp = () => {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
  };

  // ================= CRUD ACTIONS =================

  // 1. CREATE or UPDATE
  const handleFormSubmit = (data: InventoryFormData, editingItemId?: number) => {
    const now = getCurrentTimestamp();

    if (editingItemId) {
      // UPDATE
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === editingItemId) {
            return {
              ...item,
              ...data,
              updated_at: now,
            };
          }
          return item;
        })
      );

      logSql(
        'UPDATE',
        `UPDATE \`inventory_items\` SET 
  \`sku\` = '${data.sku}', 
  \`name\` = '${data.name.replace(/'/g, "''")}', 
  \`quantity\` = ${data.quantity}, 
  \`reorder_level\` = ${data.reorder_level},
  \`unit_cost\` = ${data.unit_cost}, 
  \`selling_price\` = ${data.selling_price}, 
  \`supplier\` = '${data.supplier || ''}', 
  \`status\` = '${data.status}', 
  \`updated_at\` = NOW() 
WHERE \`id\` = ${editingItemId};`,
        `$inventoryItem->update($request->validated());`
      );

      setFlashMessage({
        type: 'success',
        text: `Item "${data.name}" [${data.sku}] updated successfully in MySQL!`,
      });
    } else {
      // CREATE (Data Entry)
      const newId = items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
      const newItem: InventoryItem = {
        ...data,
        id: newId,
        created_at: now,
        updated_at: now,
      };

      setItems((prev) => [newItem, ...prev]);

      logSql(
        'INSERT',
        `INSERT INTO \`inventory_items\` 
(\`sku\`, \`name\`, \`category\`, \`quantity\`, \`reorder_level\`, \`unit_cost\`, \`selling_price\`, \`supplier\`, \`location\`, \`status\`, \`notes\`, \`created_at\`, \`updated_at\`) 
VALUES (
  '${data.sku}', 
  '${data.name.replace(/'/g, "''")}', 
  '${data.category}', 
  ${data.quantity}, 
  ${data.reorder_level}, 
  ${data.unit_cost}, 
  ${data.selling_price}, 
  ${data.supplier ? `'${data.supplier.replace(/'/g, "''")}'` : 'NULL'}, 
  ${data.location ? `'${data.location.replace(/'/g, "''")}'` : 'NULL'}, 
  '${data.status}', 
  ${data.notes ? `'${data.notes.replace(/'/g, "''")}'` : 'NULL'}, 
  NOW(), 
  NOW()
);`,
        `InventoryItem::create($request->validated());`
      );

      setFlashMessage({
        type: 'success',
        text: `New item "${data.name}" [${data.sku}] created and saved to MySQL!`,
      });
    }

    setEditingItem(null);
  };

  // 2. DELETE (Single)
  const handleDeleteConfirm = () => {
    if (!deletingItem) return;

    const targetItem = deletingItem;
    setItems((prev) => prev.filter((i) => i.id !== targetItem.id));

    logSql(
      'DELETE',
      `DELETE FROM \`inventory_items\` WHERE \`id\` = ${targetItem.id};`,
      `$inventoryItem->delete();`
    );

    // Provide undo
    setFlashMessage({
      type: 'danger',
      text: `Deleted "${targetItem.name}" [${targetItem.sku}] from MySQL database.`,
      undoAction: () => {
        setItems((prev) => [targetItem, ...prev]);
        logSql(
          'INSERT',
          `INSERT INTO \`inventory_items\` VALUES (...); -- Restored ${targetItem.sku}`,
          `InventoryItem::withTrashed()->find(${targetItem.id})->restore();`
        );
      },
    });

    setDeletingItem(null);
  };

  // 3. BULK DELETE
  const handleBulkDelete = (ids: number[]) => {
    const deletedItems = items.filter((i) => ids.includes(i.id));
    setItems((prev) => prev.filter((i) => !ids.includes(i.id)));

    logSql(
      'DELETE',
      `DELETE FROM \`inventory_items\` WHERE \`id\` IN (${ids.join(', ')});`,
      `InventoryItem::whereIn('id', [${ids.join(', ')}])->delete();`
    );

    setFlashMessage({
      type: 'danger',
      text: `Bulk deleted ${ids.length} items from database.`,
      undoAction: () => {
        setItems((prev) => [...deletedItems, ...prev]);
      },
    });
  };

  // 4. QUICK ADJUST QUANTITY (+/-)
  const handleQuickAdjustQuantity = (id: number, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, item.quantity + delta);
          let newStatus: StockStatus = item.status;
          if (newQty <= 0) {
            newStatus = 'out_of_stock';
          } else if (newQty <= item.reorder_level) {
            newStatus = 'low_stock';
          } else {
            newStatus = 'in_stock';
          }

          logSql(
            'UPDATE',
            `UPDATE \`inventory_items\` 
SET \`quantity\` = \`quantity\` ${delta > 0 ? '+' : '-'} ${Math.abs(delta)},
    \`status\` = '${newStatus}',
    \`updated_at\` = NOW()
WHERE \`id\` = ${id};`,
            `$item->increment('quantity', ${delta});`
          );

          return {
            ...item,
            quantity: newQty,
            status: newStatus,
            updated_at: getCurrentTimestamp(),
          };
        }
        return item;
      })
    );
  };

  // 5. CSV EXPORT
  const handleExportCsv = () => {
    const headers = [
      'id',
      'sku',
      'name',
      'category',
      'quantity',
      'reorder_level',
      'unit_cost',
      'selling_price',
      'supplier',
      'location',
      'status',
      'created_at',
    ];
    const rows = items.map((i) => [
      i.id,
      `"${i.sku}"`,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      i.quantity,
      i.reorder_level,
      i.unit_cost,
      i.selling_price,
      `"${(i.supplier || '').replace(/"/g, '""')}"`,
      `"${(i.location || '').replace(/"/g, '""')}"`,
      `"${i.status}"`,
      `"${i.created_at}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-export-${new Date().toISOString().substring(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setFlashMessage({
      type: 'info',
      text: `Exported ${items.length} inventory records to CSV successfully!`,
    });
  };

  // 6. RESET DATA
  const handleResetData = () => {
    if (confirm('Reset inventory items to default sample dataset?')) {
      setItems(INITIAL_INVENTORY_ITEMS);
      localStorage.removeItem(STORAGE_KEY);
      logSql(
        'INSERT',
        `-- Reset and seeded 8 default inventory items into MySQL
TRUNCATE TABLE \`inventory_items\`;
INSERT INTO \`inventory_items\` (...) VALUES (...);`,
        `Artisan::call('migrate:fresh --seed');`
      );
      setFlashMessage({
        type: 'info',
        text: 'Inventory reset to initial demonstration dataset.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenCreateModal={() => {
          setEditingItem(null);
          setIsFormModalOpen(true);
        }}
        onExportCsv={handleExportCsv}
        onResetData={handleResetData}
        sqlLogCount={sqlLogs.length}
        totalItemsCount={items.length}
      />

      {/* Flash Message Banner (Laravel Session Flash simulation) */}
      {flashMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between shadow-xs transition-all ${
              flashMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : flashMessage.type === 'danger'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-indigo-50 border-indigo-200 text-indigo-800'
            }`}
          >
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
              {flashMessage.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
              {flashMessage.type === 'danger' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              {flashMessage.type === 'info' && <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />}
              <span>{flashMessage.text}</span>
            </div>

            <div className="flex items-center gap-2">
              {flashMessage.undoAction && (
                <button
                  onClick={() => {
                    flashMessage.undoAction?.();
                    setFlashMessage({
                      type: 'info',
                      text: 'Deletion undone. Item restored to inventory.',
                    });
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-white border border-rose-300 text-rose-700 hover:bg-rose-100/50 rounded-lg shadow-2xs transition"
                >
                  Undo
                </button>
              )}
              <button
                onClick={() => setFlashMessage(null)}
                className="text-xs opacity-60 hover:opacity-100 p-1"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">
        {/* VIEW 1: DASHBOARD & INVENTORY TABLE */}
        {currentView === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Hero Banner with Data Entry trigger */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
                    Inventory Control Center
                  </span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
                  Inventory Management Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
                  Add new inventory items, manage stock levels, calculate profit margins, and perform full CRUD operations connected to a MySQL schema.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setCurrentView('code')}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  <Code2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>View Laravel MVC Code</span>
                </button>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsFormModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Data Entry Form</span>
                </button>
              </div>
            </div>

            {/* Metric KPI Summary Cards */}
            <MetricsCards
              items={items}
              activeFilter={filterStatus}
              onFilterChange={setFilterStatus}
            />

            {/* Inventory Items Data Table (Show, Edit, Delete, Search, Filter) */}
            <InventoryTable
              items={items}
              onViewItem={(item) => setViewingItem(item)}
              onEditItem={(item) => {
                setEditingItem(item);
                setIsFormModalOpen(true);
              }}
              onDeleteItem={(item) => setDeletingItem(item)}
              onQuickAdjustQuantity={handleQuickAdjustQuantity}
              onOpenCreateModal={() => {
                setEditingItem(null);
                setIsFormModalOpen(true);
              }}
              onBulkDelete={handleBulkDelete}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
            />
          </div>
        )}

        {/* VIEW 2: LARAVEL / PHP / MYSQL CODE HUB */}
        {currentView === 'code' && <LaravelCodeViewer />}

        {/* VIEW 3: MYSQL QUERY EXECUTION LOG */}
        {currentView === 'sql' && (
          <SqlConsoleDrawer
            logs={sqlLogs}
            onClearLogs={() => setSqlLogs([])}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">InventoryCore</span>
            <span>•</span>
            <span>PHP, Laravel 11, MySQL & React Dashboard</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="hover:text-indigo-600 transition"
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('code')}
              className="hover:text-indigo-600 transition"
            >
              Laravel Code
            </button>
            <button
              onClick={() => setCurrentView('sql')}
              className="hover:text-indigo-600 transition"
            >
              SQL Query Console
            </button>
          </div>
        </div>
      </footer>

      {/* ================= MODALS ================= */}

      {/* 1. Data Entry & Edit Form Modal */}
      <ItemFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleFormSubmit}
        editingItem={editingItem}
        existingSkus={items.map((i) => i.sku)}
      />

      {/* 2. Show / View Item Modal */}
      <ItemDetailModal
        item={viewingItem}
        isOpen={!!viewingItem}
        onClose={() => setViewingItem(null)}
        onEdit={(item) => {
          setViewingItem(null);
          setEditingItem(item);
          setIsFormModalOpen(true);
        }}
        onDelete={(item) => {
          setViewingItem(null);
          setDeletingItem(item);
        }}
        onQuickAdjustQuantity={handleQuickAdjustQuantity}
      />

      {/* 3. Delete Confirmation Modal */}
      <DeleteConfirmModal
        item={deletingItem}
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

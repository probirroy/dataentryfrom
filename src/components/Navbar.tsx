import React from 'react';
import { 
  Package, 
  Code2, 
  Database, 
  Plus, 
  Download, 
  RotateCcw,
  Boxes
} from 'lucide-react';

interface NavbarProps {
  currentView: 'dashboard' | 'code' | 'sql';
  setCurrentView: (view: 'dashboard' | 'code' | 'sql') => void;
  onOpenCreateModal: () => void;
  onExportCsv: () => void;
  onResetData: () => void;
  sqlLogCount: number;
  totalItemsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenCreateModal,
  onExportCsv,
  onResetData,
  sqlLogCount,
  totalItemsCount
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-sm ring-1 ring-indigo-500/20">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-lg">InventoryCore</span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-mono">
                  Laravel 11 • PHP 8 • MySQL
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                CRUD Data Entry, Show, Edit, Delete & Warehouse Dashboard
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200/80 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                currentView === 'dashboard'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'hover:text-slate-900 text-slate-600'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Dashboard</span>
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-slate-200 text-slate-700 rounded-full">
                {totalItemsCount}
              </span>
            </button>

            <button
              onClick={() => setCurrentView('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                currentView === 'code'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'hover:text-slate-900 text-slate-600'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Laravel / PHP Code</span>
            </button>

            <button
              onClick={() => setCurrentView('sql')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                currentView === 'sql'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'hover:text-slate-900 text-slate-600'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-amber-500" />
              <span>MySQL Logs</span>
              {sqlLogCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[10px] bg-indigo-100 text-indigo-700 font-bold rounded-full">
                  {sqlLogCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onResetData}
              title="Reset Sample Data"
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onExportCsv}
              title="Export Inventory as CSV"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Inventory Item</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

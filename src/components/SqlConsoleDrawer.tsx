import React from 'react';
import { Database, Clock, Terminal, Trash2, ArrowRight } from 'lucide-react';
import { SqlQueryLog } from '../types/inventory';

interface SqlConsoleDrawerProps {
  logs: SqlQueryLog[];
  onClearLogs: () => void;
}

export const SqlConsoleDrawer: React.FC<SqlConsoleDrawerProps> = ({
  logs,
  onClearLogs,
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-between border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold">MySQL Live Query Execution Log</h2>
            <span className="px-2 py-0.5 text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded font-mono">
              mysql:inventory_db
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time inspection of SQL queries and Eloquent ORM calls triggered by your Data Entry, Edit, and Delete actions.
          </p>
        </div>

        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Log</span>
          </button>
        )}
      </div>

      {/* Log Feed */}
      {logs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Terminal className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No SQL queries recorded yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Create an inventory item, edit a price, or adjust stock in the dashboard to see live MySQL queries logged here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const actionBadgeColor =
              log.action === 'INSERT'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : log.action === 'UPDATE'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : log.action === 'DELETE'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-blue-500/20 text-blue-300 border-blue-500/30';

            return (
              <div
                key={log.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs shadow-xs space-y-2.5"
              >
                {/* Top status bar */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-bold border ${actionBadgeColor}`}
                    >
                      {log.action}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {log.timestamp}
                    </span>
                  </div>

                  <span className="text-slate-500">
                    Execution: <strong className="text-slate-300">{log.executionTimeMs}ms</strong>
                  </span>
                </div>

                {/* SQL statement */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    MySQL Statement:
                  </span>
                  <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed select-all">
                    {log.query}
                  </pre>
                </div>

                {/* Eloquent Equivalent */}
                <div className="pt-2 border-t border-slate-900 flex items-start gap-2 text-indigo-300 text-[11px]">
                  <span className="text-slate-500 shrink-0 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-indigo-400" />
                    Laravel Eloquent:
                  </span>
                  <code className="text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900/50">
                    {log.eloquentEquivalent}
                  </code>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

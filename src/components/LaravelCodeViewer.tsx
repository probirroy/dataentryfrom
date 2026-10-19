import React, { useState } from 'react';
import { 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  FolderTree, 
  ExternalLink, 
  Sparkles, 
  Terminal,
  Database,
  Layers,
  BookOpen
} from 'lucide-react';
import { LARAVEL_PROJECT_SNIPPETS, CodeSnippetFile } from '../data/laravelCodeSnippets';

export const LaravelCodeViewer: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState<string>('controller');
  const [copied, setCopied] = useState(false);

  const activeFile = LARAVEL_PROJECT_SNIPPETS.find((f) => f.id === selectedFileId) || LARAVEL_PROJECT_SNIPPETS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    // Generate downloadable text bundle
    const content = LARAVEL_PROJECT_SNIPPETS.map(
      (f) => `// ====================================================================\n// FILE: ${f.path}\n// DESC: ${f.description}\n// ====================================================================\n\n${f.code}\n\n`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'laravel-inventory-system-code.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Intro Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                Laravel 11 • PHP 8.2+ • MySQL 8
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Full CRUD MVC Architecture
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2 tracking-tight">
              Production PHP, Laravel & MySQL Implementation
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Every feature demonstrated in this dashboard (Data Entry form, show view, edit modal, delete confirmation, and KPI metrics) mapped directly to canonical Laravel 11 files ready for your project.
            </p>
          </div>

          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download All Code (.txt)</span>
          </button>
        </div>
      </div>

      {/* Main Code Explorer Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col lg:flex-row">
        {/* Left: File Tree / File List */}
        <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 px-2">
            <FolderTree className="w-4 h-4 text-indigo-600" />
            Laravel Files
          </div>

          <div className="space-y-1">
            {LARAVEL_PROJECT_SNIPPETS.map((file) => {
              const isSelected = file.id === selectedFileId;
              return (
                <button
                  key={file.id}
                  onClick={() => setSelectedFileId(file.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between group ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200/60 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                    <span className="truncate">{file.filename}</span>
                  </div>
                  <span
                    className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded font-bold shrink-0 ${
                      isSelected
                        ? 'bg-indigo-700 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {file.language}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Architecture Cheatsheet */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              CRUD Flow in Laravel
            </span>
            <div className="space-y-1 text-[11px]">
              <div><strong className="text-indigo-600">GET /inventory:</strong> Index Dashboard</div>
              <div><strong className="text-emerald-600">POST /inventory:</strong> Store Data Entry</div>
              <div><strong className="text-amber-600">PUT /inventory/{'{id}'}:</strong> Update Edit</div>
              <div><strong className="text-rose-600">DELETE /inventory/{'{id}'}:</strong> Destroy</div>
            </div>
          </div>
        </div>

        {/* Right: Code Viewer & Header */}
        <div className="flex-1 flex flex-col bg-slate-950 min-w-0">
          {/* File Header Bar */}
          <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-indigo-400">
                  {activeFile.path}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeFile.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy File</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Code Body with syntax styling */}
          <div className="p-4 overflow-x-auto max-h-[680px] overflow-y-auto font-mono text-xs leading-relaxed text-slate-200 selection:bg-indigo-500/30">
            <pre className="space-y-0.5">
              {activeFile.code.split('\n').map((line, idx) => (
                <div key={idx} className="table-row">
                  <span className="table-cell pr-4 text-right text-slate-600 select-none text-[11px] w-8">
                    {idx + 1}
                  </span>
                  <span className="table-cell text-slate-300">
                    {line}
                  </span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

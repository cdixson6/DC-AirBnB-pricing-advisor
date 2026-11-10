import React from 'react';
import { Building, Database, ChevronRight, BarChart2, Home } from 'lucide-react';
import { SourceLink } from './SourceLink';

interface HeaderProps {
  currentScreen: 'intake' | 'recommendation';
  onNavigate: (screen: 'intake' | 'recommendation') => void;
  onOpenUpload: () => void;
  datasetCount: number;
  snapshotDate: string;
  isCustomLoaded: boolean;
  onOpenDatasetSource?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  onOpenUpload,
  datasetCount,
  snapshotDate,
  isCustomLoaded,
  onOpenDatasetSource,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest uppercase text-blue-400">
                  Capitol Premier Properties
                </span>
                <span className="hidden sm:inline-block text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
                  Washington, DC
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                DC Airbnb Pricing Advisor
              </h1>
            </div>
          </div>

          {/* Stepper / Breadcrumbs */}
          <div className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => onNavigate('intake')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
                currentScreen === 'intake'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>1. Property Intake</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <button
              onClick={() => onNavigate('recommendation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
                currentScreen === 'recommendation'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>2. Comp Analysis & Pricing</span>
            </button>
          </div>

          {/* Right Tools: Dataset Badge & Upload replacement CSV */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:block text-right text-xs">
              <div className="flex items-center justify-end gap-1 text-slate-300 font-medium">
                <span>{datasetCount.toLocaleString()} listings</span>
                {onOpenDatasetSource && (
                  <SourceLink
                    variant="white"
                    size="xs"
                    onClick={onOpenDatasetSource}
                  />
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Snapshot: {snapshotDate} {isCustomLoaded ? '(Custom)' : ''}
              </div>
            </div>

            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-md text-[11px] font-medium border border-slate-800 hover:border-slate-700 transition cursor-pointer"
              title="Administrative tool: Update active Inside Airbnb market dataset"
            >
              <Database className="w-3 h-3 text-slate-400" />
              <span>Admin: Update Dataset</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

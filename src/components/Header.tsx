import React from 'react';
import { Building, ChevronRight, BarChart2, Home } from 'lucide-react';
import { SourceLink } from './SourceLink';

interface HeaderProps {
  currentScreen: 'intake' | 'recommendation';
  onNavigate: (screen: 'intake' | 'recommendation') => void;
  onOpenUpload?: () => void;
  datasetCount: number;
  snapshotDate: string;
  isCustomLoaded: boolean;
  onOpenDatasetSource?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  datasetCount,
  snapshotDate,
  isCustomLoaded,
  onOpenDatasetSource,
}) => {
  return (
    <header className="bg-[#1877A3] text-white border-b border-[#125C7E] sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#E76F51] flex items-center justify-center text-white font-bold shadow-sm">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#D8EEF5]">
                  Capitol Premier Properties
                </span>
                <span className="hidden sm:inline-block text-[10px] bg-[#125C7E] text-[#D8EEF5] px-1.5 py-0.2 rounded font-mono">
                  Washington, DC
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                DC Airbnb Pricing Advisor
              </h1>
            </div>
          </div>

          {/* Stepper / Breadcrumbs */}
          <div className="hidden md:flex items-center gap-1 bg-[#125C7E]/70 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => onNavigate('intake')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
                currentScreen === 'intake'
                  ? 'bg-[#E76F51] text-white shadow-xs font-bold'
                  : 'text-[#D8EEF5] hover:text-white hover:bg-[#1877A3]'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>1. Property Intake</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#D8EEF5]/60" />
            <button
              onClick={() => onNavigate('recommendation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
                currentScreen === 'recommendation'
                  ? 'bg-[#E76F51] text-white shadow-xs font-bold'
                  : 'text-[#D8EEF5] hover:text-white hover:bg-[#1877A3]'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>2. Comp Analysis & Pricing</span>
            </button>
          </div>

          {/* Right Tools: Dataset Badge */}
          <div className="text-right text-xs">
            <div className="flex items-center justify-end gap-1 text-[#FFF8F3] font-medium">
              <span>{datasetCount.toLocaleString()} listings</span>
              {onOpenDatasetSource && (
                <SourceLink
                  variant="white"
                  size="xs"
                  onClick={onOpenDatasetSource}
                />
              )}
            </div>
            <div className="text-[10px] text-[#D8EEF5] font-mono">
              Snapshot: {snapshotDate} {isCustomLoaded ? '(Custom)' : ''}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { Info } from 'lucide-react';

interface SourceLinkProps {
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  variant?: 'badge' | 'text' | 'subtle' | 'pill' | 'white';
  size?: 'xs' | 'sm';
}

export const SourceLink: React.FC<SourceLinkProps> = ({
  onClick,
  className = '',
  variant = 'badge',
  size = 'xs',
}) => {
  if (variant === 'white') {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        className={`inline-flex items-center gap-1 font-semibold text-blue-200 bg-slate-800/90 hover:bg-blue-900/60 hover:text-white border border-slate-700 px-1.5 py-0.5 rounded transition cursor-pointer ${
          size === 'xs' ? 'text-[10px]' : 'text-xs'
        } ${className}`}
        title="View calculation formula, comp count, filters, and comp IDs"
        aria-label="View data source and comp registry"
      >
        <Info className="w-2.5 h-2.5 text-blue-300" />
        <span>Source</span>
      </button>
    );
  }

  if (variant === 'text') {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        className={`inline-flex items-center gap-0.5 font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer transition ${
          size === 'xs' ? 'text-[10.5px]' : 'text-xs'
        } ${className}`}
        title="View calculation formula, comp count, filters, and comp IDs"
        aria-label="View data source and comp registry"
      >
        <Info className="w-3 h-3 text-blue-600" />
        <span>Source</span>
      </button>
    );
  }

  if (variant === 'subtle') {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        className={`inline-flex items-center gap-0.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 px-1 py-0.5 rounded cursor-pointer transition text-[10px] font-medium ${className}`}
        title="View source audit data"
        aria-label="View data source and comp registry"
      >
        <Info className="w-2.5 h-2.5" />
        <span>Source</span>
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        className={`inline-flex items-center gap-1 font-bold text-blue-800 bg-blue-100 hover:bg-blue-200 px-2 py-0.5 rounded-full cursor-pointer transition text-[10px] ${className}`}
        title="View calculation formula, comp count, filters, and comp IDs"
        aria-label="View data source and comp registry"
      >
        <Info className="w-2.5 h-2.5 text-blue-700" />
        <span>Source</span>
      </button>
    );
  }

  // Default badge variant
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className={`inline-flex items-center gap-1 font-bold text-blue-800 bg-blue-50/90 hover:bg-blue-100 hover:text-blue-950 border border-blue-200/90 px-1.5 py-0.5 rounded transition cursor-pointer shadow-2xs ${
        size === 'xs' ? 'text-[10px]' : 'text-xs'
      } ${className}`}
      title="View calculation formula, comp count, filters, and comp IDs"
      aria-label="View data source and comp registry"
    >
      <Info className="w-2.5 h-2.5 text-blue-600 shrink-0" />
      <span>Source</span>
    </button>
  );
};

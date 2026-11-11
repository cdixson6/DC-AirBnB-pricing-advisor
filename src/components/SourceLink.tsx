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
        className={`inline-flex items-center gap-1 font-semibold text-[#D8EEF5] bg-[#1F3442] hover:bg-[#1877A3] hover:text-white border border-[#2C4759] px-1.5 py-0.5 rounded transition cursor-pointer ${
          size === 'xs' ? 'text-[10px]' : 'text-xs'
        } ${className}`}
        title="View calculation formula, comp count, filters, and comp IDs"
        aria-label="View data source and comp registry"
      >
        <Info className="w-2.5 h-2.5 text-[#39B8A2]" />
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
        className={`inline-flex items-center gap-0.5 font-bold text-[#1877A3] hover:text-[#125C7E] hover:underline cursor-pointer transition ${
          size === 'xs' ? 'text-[10.5px]' : 'text-xs'
        } ${className}`}
        title="View calculation formula, comp count, filters, and comp IDs"
        aria-label="View data source and comp registry"
      >
        <Info className="w-3 h-3 text-[#1877A3]" />
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
        className={`inline-flex items-center gap-0.5 text-[#4A6375] hover:text-[#1877A3] hover:bg-[#D8EEF5]/50 px-1 py-0.5 rounded cursor-pointer transition text-[10px] font-medium ${className}`}
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
        className={`inline-flex items-center gap-1 font-bold text-[#1877A3] bg-[#D8EEF5] hover:bg-[#C5E6F0] px-2 py-0.5 rounded-full cursor-pointer transition text-[10px] ${className}`}
        title="View calculation formula, comp count, filters, and comp IDs"
        aria-label="View data source and comp registry"
      >
        <Info className="w-2.5 h-2.5 text-[#1877A3]" />
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
      className={`inline-flex items-center gap-1 font-bold text-[#1877A3] bg-[#D8EEF5]/70 hover:bg-[#D8EEF5] hover:text-[#125C7E] border border-[#1877A3]/30 px-1.5 py-0.5 rounded transition cursor-pointer shadow-2xs ${
        size === 'xs' ? 'text-[10px]' : 'text-xs'
      } ${className}`}
      title="View calculation formula, comp count, filters, and comp IDs"
      aria-label="View data source and comp registry"
    >
      <Info className="w-2.5 h-2.5 text-[#1877A3] shrink-0" />
      <span>Source</span>
    </button>
  );
};

import React from 'react';

import { SourceLink } from './SourceLink';

interface FooterProps {
  snapshotDate: string;
  rowCount: number;
  onOpenSource?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ snapshotDate, rowCount, onOpenSource }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div>
          <p className="font-medium text-slate-300 inline-flex flex-wrap items-center gap-1">
            <span>
              Data: Inside Airbnb, Washington, D.C., snapshot {snapshotDate}, CC BY 4.0 —{' '}
              <a
                href="https://insideairbnb.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
              >
                insideairbnb.com
              </a>
              . {rowCount.toLocaleString()} active listings after cleaning.
            </span>
            {onOpenSource && (
              <SourceLink
                variant="white"
                size="xs"
                onClick={onOpenSource}
              />
            )}
          </p>
        </div>
        <div className="text-[11px] text-slate-500">
          Capitol Premier Properties STR Advisory Engine • Washington, D.C.
        </div>
      </div>
    </footer>
  );
};

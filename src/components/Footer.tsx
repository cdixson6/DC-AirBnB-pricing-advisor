import React from 'react';
import { Database } from 'lucide-react';
import { SourceLink } from './SourceLink';

interface FooterProps {
  snapshotDate: string;
  rowCount: number;
  onOpenUpload?: () => void;
  onOpenSource?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  snapshotDate,
  rowCount,
  onOpenUpload,
  onOpenSource,
}) => {
  return (
    <footer className="bg-[#1F3442] text-[#D8EEF5]/80 text-xs py-6 border-t border-[#15242E] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <p className="font-medium text-[#FFF8F3] inline-flex flex-wrap items-center gap-1 justify-center sm:justify-start">
            <span>
              Data: Inside Airbnb, Washington, D.C., snapshot {snapshotDate}, CC BY 4.0 —{' '}
              <a
                href="https://insideairbnb.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#39B8A2] hover:text-[#2A9381] underline underline-offset-2 font-semibold"
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

        {/* Right side: Admin Update Dataset button just above Capitol Premier Properties */}
        <div className="flex flex-col items-center sm:items-end gap-1.5">
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[#D8EEF5] hover:text-white hover:bg-[#1877A3] bg-[#15242E] rounded-md text-[11px] font-medium border border-[#2C4759] hover:border-[#1877A3] transition cursor-pointer"
              title="Administrative tool: Update active Inside Airbnb market dataset"
            >
              <Database className="w-3 h-3 text-[#39B8A2]" />
              <span>Admin: Update Dataset</span>
            </button>
          )}
          <div className="text-[11px] text-[#D8EEF5]/60">
            Capitol Premier Properties STR Advisory Engine • Washington, D.C.
          </div>
        </div>
      </div>
    </footer>
  );
};

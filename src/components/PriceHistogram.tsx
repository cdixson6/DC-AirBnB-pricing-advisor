import React, { useState } from 'react';
import { CompAnalysisResult, SourceInspectorData } from '../types/listing';
import { buildSourceData } from '../utils/analytics';
import { SourceLink } from './SourceLink';
import { BarChart3 } from 'lucide-react';

interface PriceHistogramProps {
  analysis: CompAnalysisResult;
  onOpenSource: (data: SourceInspectorData) => void;
}

export const PriceHistogram: React.FC<PriceHistogramProps> = ({ analysis, onOpenSource }) => {
  const [hoveredBucket, setHoveredBucket] = useState<number | null>(null);

  const buckets = analysis.histogramBuckets;
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  // Find min and max price of dataset for positioning recommended and percentile markers
  const minPrice = buckets[0]?.min ?? 0;
  const maxPrice = buckets[buckets.length - 1]?.max ?? 500;
  const priceRange = Math.max(1, maxPrice - minPrice);

  // Position of recommendation marker in percentage
  const recPosPercent = Math.min(100, Math.max(0, ((analysis.recommendedPrice - minPrice) / priceRange) * 100));
  const p25PosPercent = Math.min(100, Math.max(0, ((analysis.p25Price - minPrice) / priceRange) * 100));
  const p75PosPercent = Math.min(100, Math.max(0, ((analysis.p75Price - minPrice) / priceRange) * 100));

  const handleSourceClick = () => {
    onOpenSource(buildSourceData(analysis, 'recommended_price'));
  };

  const handleBucketSourceClick = (bucketIdx: number) => {
    onOpenSource(buildSourceData(analysis, 'histogram_bucket', { bucketIndex: bucketIdx }));
  };

  return (
    <div className="bg-white rounded-xl border border-[#EFE3D8] shadow-xs p-5 flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE3D8]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#D8EEF5] text-[#1877A3] rounded-lg">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1877A3]">Comp Nightly Price Distribution</h3>
              <div className="flex items-center gap-1.5 text-xs text-[#4B6375]">
                <span>Frequency distribution across</span>
                <strong className="text-[#1F3442] font-mono">{analysis.compCount}</strong>
                <span>filtered comps</span>
                <SourceLink
                  variant="subtle"
                  onClick={() => onOpenSource(buildSourceData(analysis, 'comp_count'))}
                />
              </div>
            </div>
          </div>
          <SourceLink onClick={handleSourceClick} />
        </div>

        {/* Legend & Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-3 text-xs text-[#4B6375]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#39B8A2] inline-block" />
              <span className="font-medium text-[#1F3442]">Comp Volume</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-[#D8EEF5] border border-[#BBE0EC] inline-block" />
              <span className="text-[#4B6375]">Middle 50%</span>
              <SourceLink
                variant="subtle"
                onClick={() => onOpenSource(buildSourceData(analysis, 'iqr_band'))}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E76F51] inline-block" />
              <span className="font-bold text-[#E76F51]">Rec: ${analysis.recommendedPrice}</span>
              <SourceLink
                variant="subtle"
                onClick={() => onOpenSource(buildSourceData(analysis, 'recommended_price'))}
              />
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-[#4B6375]">
            <span>IQR: ${analysis.p25Price} – ${analysis.p75Price}</span>
            <SourceLink
              variant="subtle"
              onClick={() => onOpenSource(buildSourceData(analysis, 'iqr_band'))}
            />
          </div>
        </div>

        {/* Chart visualization */}
        <div className="relative mt-2 pt-6 pb-2">
          {/* Shaded Middle 50% Band */}
          <div
            className="absolute top-6 bottom-8 bg-[#D8EEF5]/40 border-x border-[#BBE0EC] pointer-events-none rounded-xs"
            style={{
              left: `${p25PosPercent}%`,
              width: `${Math.max(2, p75PosPercent - p25PosPercent)}%`,
            }}
            title={`Interquartile Range: $${analysis.p25Price} - $${analysis.p75Price}`}
          />

          {/* Vertical Recommended Line */}
          <div
            className="absolute top-0 bottom-8 z-20 flex flex-col items-center pointer-events-none"
            style={{ left: `${recPosPercent}%`, transform: 'translateX(-50%)' }}
          >
            <div className="bg-[#E76F51] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap">
              Rec: ${analysis.recommendedPrice}
            </div>
            <div className="w-0.5 flex-1 bg-[#E76F51]" />
          </div>

          {/* Bars Container */}
          <div className="flex items-end gap-1.5 h-36 px-2 border-b border-[#EFE3D8]">
            {buckets.map((bucket, idx) => {
              const heightPct = Math.max(8, (bucket.count / maxCount) * 100);
              const isHovered = hoveredBucket === idx;
              const containsRec = analysis.recommendedPrice >= bucket.min && analysis.recommendedPrice <= bucket.max;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  onMouseEnter={() => setHoveredBucket(idx)}
                  onMouseLeave={() => setHoveredBucket(null)}
                  onClick={() => handleBucketSourceClick(idx)}
                  title={`Click to inspect source for bucket ${bucket.label} (${bucket.count} comps)`}
                >
                  {/* Count tooltip on hover */}
                  {isHovered && (
                    <div className="absolute -top-10 z-30 bg-[#1F3442] text-white text-[11px] rounded px-2 py-1 shadow-lg whitespace-nowrap flex items-center gap-1.5 border border-[#2C4759]">
                      <span className="font-bold text-[#39B8A2]">{bucket.count}</span> listings ({bucket.label})
                      <span className="text-[10px] text-[#D8EEF5] underline">[Source]</span>
                    </div>
                  )}

                  {/* The Bar */}
                  <div
                    className={`w-full rounded-t transition-all duration-200 ${
                      containsRec
                        ? 'bg-[#1877A3] hover:bg-[#125C7E] ring-2 ring-[#E76F51]'
                        : isHovered
                        ? 'bg-[#2EA38F]'
                        : 'bg-[#39B8A2]/85 hover:bg-[#39B8A2]'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  >
                    <div className="text-center text-[10px] text-white font-mono font-medium pt-1 opacity-95 group-hover:opacity-100">
                      {bucket.count > 0 ? bucket.count : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between items-center text-[10px] text-[#4B6375] font-mono mt-1.5 px-1">
            <span>${minPrice}</span>
            <span>${Math.round(minPrice + priceRange * 0.25)}</span>
            <span>${Math.round(minPrice + priceRange * 0.5)}</span>
            <span>${Math.round(minPrice + priceRange * 0.75)}</span>
            <span>${maxPrice}+</span>
          </div>
        </div>
      </div>

      {/* Sub-caption with individual Source links */}
      <div className="mt-3 pt-2 border-t border-[#EFE3D8] text-xs text-[#4B6375] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <span>Median comp sits at</span>
          <strong className="text-[#1877A3] font-mono">${analysis.recommendedPrice}</strong>
          <SourceLink
            variant="subtle"
            onClick={() => onOpenSource(buildSourceData(analysis, 'recommended_price'))}
          />
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[#4B6375]">
          <span>Range:</span>
          <span className="font-mono text-[#1F3442]">${analysis.minPrice}</span>
          <SourceLink
            variant="subtle"
            onClick={() => onOpenSource(buildSourceData(analysis, 'min_price'))}
          />
          <span>–</span>
          <span className="font-mono text-[#1F3442]">${analysis.maxPrice}</span>
          <SourceLink
            variant="subtle"
            onClick={() => onOpenSource(buildSourceData(analysis, 'max_price'))}
          />
        </div>
      </div>
    </div>
  );
};

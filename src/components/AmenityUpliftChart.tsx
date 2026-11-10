import React from 'react';
import { CompAnalysisResult, SourceInspectorData, AmenityUplift } from '../types/listing';
import { buildSourceData } from '../utils/analytics';
import { SourceLink } from './SourceLink';
import { Sparkles, CheckCircle2, XCircle, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface AmenityUpliftChartProps {
  analysis: CompAnalysisResult;
  onOpenSource: (data: SourceInspectorData) => void;
}

export const AmenityUpliftChart: React.FC<AmenityUpliftChartProps> = ({ analysis, onOpenSource }) => {
  const uplifts = analysis.amenityUplifts;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Amenity Value Uplift in {analysis.intake.neighborhood}</h3>
              <p className="text-xs text-slate-500">
                Median price difference between comps with vs. without amenity (requires ≥5 comps per group)
              </p>
            </div>
          </div>
          <SourceLink
            onClick={() => onOpenSource(buildSourceData(analysis, 'amenity_uplift', { amenityKey: uplifts[0]?.key }))}
          />
        </div>

        {/* Grid of Amenities */}
        <div className="divide-y divide-slate-100 mt-1">
          {uplifts.map((uplift) => {
            const isEligible = uplift.eligible;
            const diff = uplift.dollarDiff;
            const pct = uplift.percentDiff;
            const isPositive = (diff ?? 0) >= 0;

            return (
              <div key={uplift.key} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left: Amenity name & Subject Property Status */}
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {uplift.propertyHasIt ? (
                      <span title="Subject property has this amenity">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </span>
                    ) : (
                      <span title="Subject property does not have this amenity">
                        <XCircle className="w-4 h-4 text-slate-300" />
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{uplift.label}</span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          uplift.propertyHasIt
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {uplift.propertyHasIt ? 'Equipped' : 'Missing'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span>With:</span>
                        <strong className="text-slate-700 font-mono">{uplift.hasAmenityCount}</strong>
                        <span>comps</span>
                        <SourceLink
                          variant="subtle"
                          onClick={() => onOpenSource(buildSourceData(analysis, 'amenity_with_count', { amenityKey: uplift.key }))}
                        />
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <span>Without:</span>
                        <strong className="text-slate-700 font-mono">{uplift.withoutAmenityCount}</strong>
                        <span>comps</span>
                        <SourceLink
                          variant="subtle"
                          onClick={() => onOpenSource(buildSourceData(analysis, 'amenity_without_count', { amenityKey: uplift.key }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Uplift result or Insufficient Data warning */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5 self-end sm:self-center">
                  {isEligible ? (
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5 font-bold text-sm">
                        {isPositive ? (
                          <span className="text-emerald-600 flex items-center font-mono">
                            <ArrowUpRight className="w-4 h-4" />
                            +${diff}/night
                          </span>
                        ) : (
                          <span className="text-rose-600 flex items-center font-mono">
                            <ArrowDownRight className="w-4 h-4" />
                            -${Math.abs(diff || 0)}/night
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-normal">
                          ({isPositive ? `+${pct}%` : `${pct}%`})
                        </span>
                        <SourceLink
                          variant="badge"
                          onClick={() => onOpenSource(buildSourceData(analysis, 'amenity_uplift', { amenityKey: uplift.key }))}
                        />
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center justify-end gap-1 mt-0.5">
                        <span>${uplift.hasAmenityMedianPrice}</span>
                        <SourceLink
                          variant="subtle"
                          onClick={() => onOpenSource(buildSourceData(analysis, 'amenity_with_price', { amenityKey: uplift.key }))}
                        />
                        <span>vs.</span>
                        <span>${uplift.withoutAmenityMedianPrice}</span>
                        <SourceLink
                          variant="subtle"
                          onClick={() => onOpenSource(buildSourceData(analysis, 'amenity_without_price', { amenityKey: uplift.key }))}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Sample &lt; 5 comps in group</span>
                      <SourceLink
                        variant="subtle"
                        onClick={() => onOpenSource(buildSourceData(analysis, 'amenity_uplift', { amenityKey: uplift.key }))}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Strategic insight: Adding dedicated parking or in-unit laundry yields the highest median rate premium in D.C.</span>
      </div>
    </div>
  );
};

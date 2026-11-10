import React, { useState } from 'react';
import { CompAnalysisResult, SourceInspectorData } from '../types/listing';
import { buildSourceData } from '../utils/analytics';
import { PriceHistogram } from './PriceHistogram';
import { AmenityUpliftChart } from './AmenityUpliftChart';
import { CompMap } from './CompMap';
import { ComplianceChecklist } from './ComplianceChecklist';
import { OwnerMemoModal } from './OwnerMemoModal';
import { SourceLink } from './SourceLink';
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  CheckCircle2,
} from 'lucide-react';

interface RecommendationScreenProps {
  analysis: CompAnalysisResult;
  onBackToIntake: () => void;
  onOpenSource: (data: SourceInspectorData) => void;
}

export const RecommendationScreen: React.FC<RecommendationScreenProps> = ({
  analysis,
  onBackToIntake,
  onOpenSource,
}) => {
  const [isMemoOpen, setIsMemoOpen] = useState(false);

  const {
    intake,
    recommendedPrice,
    p25Price,
    p75Price,
    medianOccupancy,
    projectedAnnualRevenue,
    isOwnerAbsent,
    cappedAnnualRevenue,
    revenueReductionFromCap,
    compCount,
    filterExplanation,
  } = analysis;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar: Navigation & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={onBackToIntake}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 transition cursor-pointer mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Edit Property Intake Parameters</span>
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pricing Recommendation &amp; Comp Analysis
            </h1>
            <span className="text-xs bg-blue-100 text-blue-900 font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
              {intake.neighborhood}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {intake.roomType} • {intake.bedrooms === 0 ? 'Studio' : `${intake.bedrooms} Bedroom`} • {intake.bathrooms} Bath • Max {intake.accommodates} Guests {intake.isCondo ? '• Condominium' : ''}
          </p>
        </div>

        {/* Executive Action: Owner Memo Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMemoOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>Generate Owner Memo (Gemini)</span>
          </button>
        </div>
      </div>

      {/* 1. Comp Set Banner with Condo Rule Explanation */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
              Comp Filter Status
            </span>
            <div className="inline-flex items-center gap-1">
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                N = {compCount} Comps
              </span>
              <SourceLink
                variant="white"
                onClick={() => onOpenSource(buildSourceData(analysis, 'comp_count'))}
              />
            </div>
          </div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Comp Set: {intake.neighborhood} • {intake.roomType} • {intake.bedrooms}BR</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            {filterExplanation}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 bg-slate-800/80 p-3 rounded-lg border border-slate-700">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-2xl font-extrabold text-blue-400 font-mono">{compCount}</span>
              <SourceLink
                variant="white"
                onClick={() => onOpenSource(buildSourceData(analysis, 'comp_count'))}
              />
            </div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Matching Comps</div>
          </div>
          <div className="h-8 w-px bg-slate-700" />
          <div className="text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5">
              <span>Median Price:</span>
              <strong className="text-white font-mono">${recommendedPrice}</strong>
              <SourceLink
                variant="white"
                onClick={() => onOpenSource(buildSourceData(analysis, 'recommended_price'))}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span>Avg Rating:</span>
              <strong className="text-amber-400 font-mono">{analysis.avgRating}★</strong>
              <SourceLink
                variant="white"
                onClick={() => onOpenSource(buildSourceData(analysis, 'avg_rating'))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2 & 3. Primary KPI Cards: Price Card & Revenue Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 2. Price Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                Nightly Rate Recommendation
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                <span>Derived from median of {compCount} verified comps</span>
                <SourceLink
                  variant="subtle"
                  onClick={() => onOpenSource(buildSourceData(analysis, 'comp_count'))}
                />
              </div>
            </div>
            <SourceLink
              variant="badge"
              size="sm"
              onClick={() => onOpenSource(buildSourceData(analysis, 'recommended_price'))}
            />
          </div>

          {/* Large Hero Price Number */}
          <div className="my-5">
            <div className="flex items-baseline flex-wrap gap-2.5">
              <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight font-mono">
                ${recommendedPrice}
              </span>
              <span className="text-sm sm:text-base font-semibold text-slate-500">/ night</span>
              <SourceLink
                variant="badge"
                size="sm"
                onClick={() => onOpenSource(buildSourceData(analysis, 'recommended_price'))}
              />
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Recommended base listing price based on market median.
            </p>
          </div>

          {/* Percentile Quartiles (25th - 75th percentile) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Competitive Band (25th – 75th Percentile)</span>
              <div className="flex items-center gap-1.5 font-mono text-slate-900">
                <span>${p25Price} – ${p75Price}</span>
                <SourceLink
                  variant="subtle"
                  onClick={() => onOpenSource(buildSourceData(analysis, 'iqr_band'))}
                />
              </div>
            </div>

            {/* Visual range bar */}
            <div className="w-full bg-slate-200 h-2.5 rounded-full relative overflow-hidden">
              <div
                className="bg-blue-700 h-full rounded-full"
                style={{
                  marginLeft: '20%',
                  width: '60%',
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block">25th Percentile (Conservative)</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="font-bold text-slate-800 font-mono text-sm">${p25Price}</span>
                    <SourceLink
                      variant="subtle"
                      onClick={() => onOpenSource(buildSourceData(analysis, 'p25_price'))}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block">75th Percentile (Peak / Premium)</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="font-bold text-slate-800 font-mono text-sm">${p75Price}</span>
                    <SourceLink
                      variant="subtle"
                      onClick={() => onOpenSource(buildSourceData(analysis, 'p75_price'))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Revenue Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                Annual Revenue Projection
              </span>
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                <span>${recommendedPrice}/nt</span>
                <SourceLink
                  variant="subtle"
                  onClick={() => onOpenSource(buildSourceData(analysis, 'recommended_price'))}
                />
                <span>× {medianOccupancy} days</span>
                <SourceLink
                  variant="subtle"
                  onClick={() => onOpenSource(buildSourceData(analysis, 'occupancy'))}
                />
              </div>
            </div>
            <SourceLink
              variant="badge"
              size="sm"
              onClick={() => onOpenSource(buildSourceData(analysis, 'annual_revenue'))}
            />
          </div>

          {/* Large Hero Revenue Number */}
          <div className="my-5">
            <div className="flex items-baseline flex-wrap gap-2.5">
              <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight font-mono">
                ${projectedAnnualRevenue.toLocaleString()}
              </span>
              <span className="text-sm sm:text-base font-semibold text-slate-500">/ year</span>
              <SourceLink
                variant="badge"
                size="sm"
                onClick={() => onOpenSource(buildSourceData(analysis, 'annual_revenue'))}
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
              <span>Gross booking revenue at median occupancy ({medianOccupancy} nights/yr).</span>
              <SourceLink
                variant="subtle"
                onClick={() => onOpenSource(buildSourceData(analysis, 'occupancy'))}
              />
            </div>
          </div>

          {/* DC Vacation-Rental Cap (Owner Absent) Condition */}
          {isOwnerAbsent ? (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs uppercase tracking-wide">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>DC vacation-rental cap (owner absent): 90 nights/year</span>
                  <SourceLink
                    variant="subtle"
                    onClick={() => onOpenSource(buildSourceData(analysis, 'capped_revenue'))}
                  />
                </div>
                <SourceLink
                  variant="badge"
                  onClick={() => onOpenSource(buildSourceData(analysis, 'capped_revenue'))}
                />
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs text-rose-800 font-medium">Capped Statutory Maximum:</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-rose-950 font-mono">
                    ${cappedAnnualRevenue.toLocaleString()}
                  </span>
                  <span className="text-xs font-normal text-rose-800">/ yr</span>
                  <SourceLink
                    variant="badge"
                    onClick={() => onOpenSource(buildSourceData(analysis, 'capped_revenue'))}
                  />
                </div>
              </div>

              <div className="text-[11px] text-rose-900 leading-snug border-t border-rose-200 pt-2">
                <span>Under DC Short-Term Rental Act, unhosted stays are capped at 90 nights. Revenue reduction: </span>
                <span className="font-bold font-mono">-${revenueReductionFromCap.toLocaleString()}</span>
                <span className="ml-1">
                  <SourceLink
                    variant="subtle"
                    onClick={() => onOpenSource(buildSourceData(analysis, 'revenue_reduction'))}
                  />
                </span>
                <span> compared to full market occupancy ({medianOccupancy} nights).</span>
                <span className="ml-1">
                  <SourceLink
                    variant="subtle"
                    onClick={() => onOpenSource(buildSourceData(analysis, 'occupancy'))}
                  />
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Hosted Status (Owner Lives On-Site)
                </span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                  No 90-Day Cap
                </span>
              </div>
              <div className="text-xs text-emerald-800 leading-relaxed flex items-center flex-wrap gap-1">
                <span>Homeowner lives on-site during stays. Unrestricted 365-day access capturing full market occupancy of</span>
                <strong className="font-mono">{medianOccupancy} nights/year</strong>
                <SourceLink
                  variant="subtle"
                  onClick={() => onOpenSource(buildSourceData(analysis, 'occupancy'))}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4 & 5. Price Distribution Histogram & Amenity Uplift Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 4. Price Distribution Histogram */}
        <PriceHistogram analysis={analysis} onOpenSource={onOpenSource} />

        {/* 5. Amenity Uplift Chart */}
        <AmenityUpliftChart analysis={analysis} onOpenSource={onOpenSource} />
      </div>

      {/* 6. Leaflet Map of Comps */}
      <CompMap analysis={analysis} onOpenSource={onOpenSource} />

      {/* 8. Static DC Compliance Checklist */}
      <ComplianceChecklist isOwnerAbsent={isOwnerAbsent} isCondo={intake.isCondo} />

      {/* Gemini Owner Memo Modal */}
      <OwnerMemoModal
        analysis={analysis}
        isOpen={isMemoOpen}
        onClose={() => setIsMemoOpen(false)}
      />
    </div>
  );
};

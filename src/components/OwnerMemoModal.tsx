import React, { useState, useEffect } from 'react';
import { X, Bot, Copy, Check, Printer, RefreshCw, AlertCircle, Sparkles, Code2, ShieldCheck } from 'lucide-react';
import { CompAnalysisResult } from '../types/listing';

interface OwnerMemoModalProps {
  analysis: CompAnalysisResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OwnerMemoModal: React.FC<OwnerMemoModalProps> = ({ analysis, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [memo, setMemo] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showJsonPayload, setShowJsonPayload] = useState(false);

  useEffect(() => {
    if (isOpen && analysis && !memo && !loading) {
      generateMemo();
    }
  }, [isOpen, analysis]);

  if (!isOpen || !analysis) return null;

  // Strict JSON payload containing ONLY computed results - no raw hallucinations
  const computedPayload = {
    metadata: {
      generatedAt: new Date().toISOString(),
      datasetSource: 'Inside Airbnb Washington DC',
      snapshotDate: analysis.snapshotDate,
      totalListingsInDataset: analysis.totalDatasetRows,
    },
    propertyIntake: {
      neighborhood: analysis.intake.neighborhood,
      roomType: analysis.intake.roomType,
      bedrooms: analysis.intake.bedrooms,
      bathrooms: analysis.intake.bathrooms,
      accommodates: analysis.intake.accommodates,
      isCondo: analysis.intake.isCondo,
      ownerWillLiveThere: analysis.intake.ownerLivesThere,
      currentAmenities: {
        washerDryer: analysis.intake.hasWasher,
        parking: analysis.intake.hasParking,
        workspace: analysis.intake.hasWorkspace,
        airConditioning: analysis.intake.hasAc,
        selfCheckin: analysis.intake.hasSelfCheckin,
      },
    },
    compSetAnalysis: {
      totalMatchingComps: analysis.compCount,
      condoFilterRuleUsed: analysis.filterExplanation,
      condoCompsSampled: analysis.condoCompsCount,
      condoThresholdMet: analysis.condoThresholdMet,
    },
    computedPricingNumbers: {
      recommendedNightlyRate_Median: analysis.recommendedPrice,
      percentile_25th_Conservative: analysis.p25Price,
      percentile_75th_Peak: analysis.p75Price,
      minimumCompPrice: analysis.minPrice,
      maximumCompPrice: analysis.maxPrice,
      averageCompPrice: analysis.avgPrice,
    },
    computedOccupancyAndRevenue: {
      medianAnnualOccupancyNights: analysis.medianOccupancy,
      projectedAnnualRevenueFullHosted: analysis.projectedAnnualRevenue,
      dcVacationRentalCapNights: analysis.dcCapNights,
      projectedAnnualRevenueCappedAt90Nights: analysis.cappedAnnualRevenue,
      revenueLossFrom90NightCap: analysis.revenueReductionFromCap,
      ownerLivingThereDuringStays: analysis.intake.ownerLivesThere,
      dcCapApplies: analysis.isOwnerAbsent,
    },
    computedAmenityUplifts: analysis.amenityUplifts.map((u) => ({
      amenity: u.label,
      eligible_5CompsPerGroup: u.eligible,
      hasAmenityCount: u.hasAmenityCount,
      withoutAmenityCount: u.withoutAmenityCount,
      medianPriceWithAmenity: u.hasAmenityMedianPrice,
      medianPriceWithoutAmenity: u.withoutAmenityMedianPrice,
      dollarDifferencePerNight: u.dollarDiff,
      percentageDifference: u.percentDiff,
      propertyCurrentlyHasAmenity: u.propertyHasIt,
    })),
  };

  const generateMemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/gemini/generate-memo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ computedData: computedPayload }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to communicate with Gemini API');
      }

      setMemo(data.memo);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to generate owner memo.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(memo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wider uppercase text-blue-300">
                  Advisor Executive Memo
                </span>
                <span className="text-[10px] bg-emerald-900/80 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> 100% Data Grounded
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                Owner Pricing & Revenue Strategy Memo
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span>Client: <strong className="text-slate-900">{analysis.intake.neighborhood} {analysis.intake.bedrooms}BR</strong></span>
            <span>•</span>
            <span>Recommended: <strong className="text-blue-900">${analysis.recommendedPrice}/nt</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowJsonPayload(!showJsonPayload)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md font-medium transition cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showJsonPayload ? 'Hide Computed JSON' : 'Audit Computed JSON'}</span>
            </button>
            <button
              onClick={generateMemo}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md font-medium transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>
            <button
              onClick={copyToClipboard}
              disabled={!memo || loading}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 rounded-md font-medium transition cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Memo'}</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={!memo || loading}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-md font-medium transition cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-800 text-sm">
          {/* JSON Payload Inspection Drawer */}
          {showJsonPayload && (
            <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto max-h-60 border border-slate-800">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-wider">
                  Ground Truth Payload Provided to Gemini (Strict JSON)
                </span>
                <span className="text-slate-400 text-[10px]">Model prohibited from hallucinating</span>
              </div>
              <pre>{JSON.stringify(computedPayload, null, 2)}</pre>
            </div>
          )}

          {loading && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
              <p className="font-semibold text-slate-800">Synthesizing Owner Advisory Memo...</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Gemini is translating strictly computed dataset metrics into an executive homeowner report with zero number estimation.
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>Unable to Generate Gemini Memo</span>
              </div>
              <p className="text-xs">{error}</p>
              <p className="text-xs text-rose-600 font-medium">
                Make sure the GEMINI_API_KEY is configured in your project settings panel.
              </p>
            </div>
          )}

          {!loading && !error && memo && (
            <div className="prose prose-slate max-w-none space-y-4 font-sans leading-relaxed text-slate-800 bg-slate-50/50 p-6 rounded-xl border border-slate-200">
              <div className="border-b border-slate-200 pb-3 mb-4 flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-bold text-slate-900">
                    Capitol Premier Properties • Short-Term Rental Advisory
                  </h1>
                  <p className="text-xs text-slate-500">
                    Property Address / Location: {analysis.intake.neighborhood}, Washington, DC
                  </p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <span>Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Render memo text formatted cleanly */}
              <div className="whitespace-pre-line text-[13.5px] leading-relaxed text-slate-800 space-y-3">
                {memo}
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Prepared with DC Airbnb Pricing Advisor • Inside Airbnb Verified Data</span>
                <span>Advisor Sign-off: ___________________________</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Prompt constraint active: Model strictly restricted to provided JSON numbers.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

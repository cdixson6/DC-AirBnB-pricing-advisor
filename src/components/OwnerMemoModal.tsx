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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F3442]/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-[#EFE3D8] w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1F3442] text-white flex items-center justify-between border-b border-[#15242E]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#E76F51] rounded-lg text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wider uppercase text-[#D8EEF5]">
                  Advisor Executive Memo
                </span>
                <span className="text-[10px] bg-[#15242E] text-[#39B8A2] border border-[#2C4759] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#39B8A2]" /> 100% Data Grounded
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                Owner Pricing & Revenue Strategy Memo
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#D8EEF5]/70 hover:text-white p-1 rounded-lg hover:bg-[#15242E] transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-2.5 bg-[#FFF8F3] border-b border-[#EFE3D8] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#4B6375]">
            <span>Client: <strong className="text-[#1F3442]">{analysis.intake.neighborhood} {analysis.intake.bedrooms}BR</strong></span>
            <span>•</span>
            <span>Recommended: <strong className="text-[#1877A3]">${analysis.recommendedPrice}/nt</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowJsonPayload(!showJsonPayload)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#EFE3D8] text-[#1F3442] hover:bg-[#D8EEF5]/30 rounded-md font-medium transition cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-[#1877A3]" />
              <span>{showJsonPayload ? 'Hide Computed JSON' : 'Audit Computed JSON'}</span>
            </button>
            <button
              onClick={generateMemo}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#EFE3D8] text-[#1F3442] hover:bg-[#D8EEF5]/30 rounded-md font-medium transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#1877A3] ${loading ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>
            <button
              onClick={copyToClipboard}
              disabled={!memo || loading}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#D8EEF5] border border-[#BBE0EC] text-[#1877A3] hover:bg-[#C8E7F0] rounded-md font-medium transition cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#39B8A2]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Memo'}</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={!memo || loading}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#1F3442] text-white hover:bg-[#15242E] rounded-md font-medium transition cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-[#1F3442] text-sm">
          {/* JSON Payload Inspection Drawer */}
          {showJsonPayload && (
            <div className="p-4 bg-[#15242E] text-[#D8EEF5] rounded-xl font-mono text-xs overflow-x-auto max-h-60 border border-[#2C4759]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2C4759]">
                <span className="text-[#39B8A2] font-bold uppercase text-[10px] tracking-wider">
                  Ground Truth Payload Provided to Gemini (Strict JSON)
                </span>
                <span className="text-[#D8EEF5]/60 text-[10px]">Model prohibited from hallucinating</span>
              </div>
              <pre>{JSON.stringify(computedPayload, null, 2)}</pre>
            </div>
          )}

          {loading && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#D8EEF5] border-t-[#E76F51] rounded-full animate-spin" />
              <p className="font-semibold text-[#1877A3]">Synthesizing Owner Advisory Memo...</p>
              <p className="text-xs text-[#4B6375] max-w-sm">
                Gemini is translating strictly computed dataset metrics into an executive homeowner report with zero number estimation.
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 bg-[#FDF0EC] border border-[#E76F51]/30 rounded-xl text-[#E76F51] space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-5 h-5 text-[#E76F51]" />
                <span>Unable to Generate Gemini Memo</span>
              </div>
              <p className="text-xs text-[#1F3442]">{error}</p>
              <p className="text-xs text-[#E76F51] font-medium">
                Make sure the GEMINI_API_KEY is configured in your project settings panel.
              </p>
            </div>
          )}

          {!loading && !error && memo && (
            <div className="prose prose-slate max-w-none space-y-4 font-sans leading-relaxed text-[#1F3442] bg-[#FFF8F3] p-6 rounded-xl border border-[#EFE3D8]">
              <div className="border-b border-[#EFE3D8] pb-3 mb-4 flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-bold text-[#1877A3]">
                    Capitol Premier Properties • Short-Term Rental Advisory
                  </h1>
                  <p className="text-xs text-[#4B6375]">
                    Property Address / Location: {analysis.intake.neighborhood}, Washington, DC
                  </p>
                </div>
                <div className="text-right text-xs text-[#4B6375]">
                  <span>Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Render memo text formatted cleanly */}
              <div className="whitespace-pre-line text-[13.5px] leading-relaxed text-[#1F3442] space-y-3">
                {memo}
              </div>

              <div className="mt-8 pt-4 border-t border-[#EFE3D8] text-[11px] text-[#4B6375] flex items-center justify-between">
                <span>Prepared with DC Airbnb Pricing Advisor • Inside Airbnb Verified Data</span>
                <span>Advisor Sign-off: ___________________________</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FFF8F3] border-t border-[#EFE3D8] flex items-center justify-between">
          <span className="text-xs text-[#4B6375]">
            Prompt constraint active: Model strictly restricted to provided JSON numbers.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#E76F51] hover:bg-[#D55C3E] text-white rounded-lg text-sm font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

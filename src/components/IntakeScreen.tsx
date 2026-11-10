import React from 'react';
import { PropertyIntake, Listing } from '../types/listing';
import {
  Building2,
  Home,
  Users,
  Bed,
  Bath,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Car,
  Tv,
  Wind,
  KeyRound,
  Briefcase,
  Sliders,
} from 'lucide-react';
import { SourceLink } from './SourceLink';
import { SourceInspectorData } from '../types/listing';
import { IntakePropertyMap } from './IntakePropertyMap';

interface IntakeScreenProps {
  intake: PropertyIntake;
  onChange: (updated: PropertyIntake) => void;
  onSubmit: () => void;
  neighborhoods: string[];
  roomTypes: string[];
  dataset: Listing[];
  onOpenSource?: (data: SourceInspectorData) => void;
}

export const IntakeScreen: React.FC<IntakeScreenProps> = ({
  intake,
  onChange,
  onSubmit,
  neighborhoods,
  roomTypes,
  dataset,
  onOpenSource,
}) => {
  const updateField = <K extends keyof PropertyIntake>(key: K, value: PropertyIntake[K]) => {
    onChange({ ...intake, [key]: value });
  };

  // Compute immediate preview count of matching comps
  const previewComps = dataset.filter(
    (item) =>
      item.neighbourhood_cleansed.toLowerCase() === intake.neighborhood.toLowerCase() &&
      item.room_type.toLowerCase() === intake.roomType.toLowerCase() &&
      Number(item.bedrooms) === Number(intake.bedrooms)
  );
  const condoPreviewCount = previewComps.filter((c) => c.is_condo).length;

  const handlePresetSelect = (preset: Partial<PropertyIntake>) => {
    onChange({ ...intake, ...preset });
  };

  const handleApplyPropertyToIntake = (property: Listing) => {
    onChange({
      ...intake,
      neighborhood: property.neighbourhood_cleansed,
      roomType: property.room_type,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      accommodates: property.accommodates,
      isCondo: property.is_condo,
      hasWasher: property.has_washer,
      hasParking: property.has_parking,
      hasWorkspace: property.has_workspace,
      hasAc: property.has_ac,
      hasSelfCheckin: property.has_self_checkin,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Title & Intro */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              Screen 1 • Client Property Intake
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Property Consultation & Intake
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Enter the homeowner&apos;s property details to build a verified Inside Airbnb comp set, calculate recommended nightly rates, and project annual returns under Washington, DC municipal regulations.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5 self-start sm:self-center">
            <span className="text-[11px] font-semibold text-slate-400 self-center mr-1">Presets:</span>
            <button
              type="button"
              onClick={() =>
                handlePresetSelect({
                  neighborhood: 'Dupont Circle',
                  roomType: 'Entire home/apt',
                  bedrooms: 1,
                  bathrooms: 1,
                  accommodates: 3,
                  isCondo: true,
                  hasWasher: true,
                  hasParking: false,
                  hasWorkspace: true,
                  hasAc: true,
                  hasSelfCheckin: true,
                  ownerLivesThere: false,
                })
              }
              className="text-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-1 rounded-md font-medium transition cursor-pointer"
            >
              Dupont 1BR Condo
            </button>
            <button
              type="button"
              onClick={() =>
                handlePresetSelect({
                  neighborhood: 'Capitol Hill',
                  roomType: 'Entire home/apt',
                  bedrooms: 2,
                  bathrooms: 2,
                  accommodates: 5,
                  isCondo: false,
                  hasWasher: true,
                  hasParking: true,
                  hasWorkspace: true,
                  hasAc: true,
                  hasSelfCheckin: true,
                  ownerLivesThere: true,
                })
              }
              className="text-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-1 rounded-md font-medium transition cursor-pointer"
            >
              Capitol Hill 2BR (Hosted)
            </button>
            <button
              type="button"
              onClick={() =>
                handlePresetSelect({
                  neighborhood: 'Georgetown',
                  roomType: 'Entire home/apt',
                  bedrooms: 3,
                  bathrooms: 2.5,
                  accommodates: 7,
                  isCondo: false,
                  hasWasher: true,
                  hasParking: true,
                  hasWorkspace: true,
                  hasAc: true,
                  hasSelfCheckin: true,
                  ownerLivesThere: false,
                })
              }
              className="text-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-1 rounded-md font-medium transition cursor-pointer"
            >
              Georgetown 3BR Luxury
            </button>
          </div>
        </div>
      </div>

      {/* Top Map Feature: Interactive Google Map on Left, Selected Property Details on Right */}
      <IntakePropertyMap
        dataset={dataset}
        currentIntake={intake}
        onApplyPropertyToIntake={handleApplyPropertyToIntake}
        onOpenSource={onOpenSource}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-6"
      >
        {/* Section 1: Location & Property Type */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-blue-700" />
            <h2 className="text-base font-bold text-slate-900">Location & Structure</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Neighborhood Dropdown */}
            <div>
              <label htmlFor="neighborhood" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Neighborhood (DC Cleansed) <span className="text-rose-600">*</span>
              </label>
              <select
                id="neighborhood"
                value={intake.neighborhood}
                onChange={(e) => updateField('neighborhood', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
                required
              >
                {neighborhoods.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Matches official Inside Airbnb Washington, D.C. neighborhood boundary.
              </p>
            </div>

            {/* Room Type */}
            <div>
              <label htmlFor="roomType" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Room Type <span className="text-rose-600">*</span>
              </label>
              <select
                id="roomType"
                value={intake.roomType}
                onChange={(e) => updateField('roomType', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
                required
              >
                {roomTypes.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Entire home/apt, Private room, or Shared room.
              </p>
            </div>
          </div>

          {/* Condo Toggle */}
          <div className="pt-2">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  Is this property a Condominium?
                </span>
                <p className="text-xs text-slate-600 mt-0.5">
                  Rule: Advisor will filter strictly to Condos only if 15+ comps exist; otherwise includes all property types.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateField('isCondo', true)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    intake.isCondo
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Yes (Condo)
                </button>
                <button
                  type="button"
                  onClick={() => updateField('isCondo', false)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    !intake.isCondo
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  No (Townhouse / Unit)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Capacity & Specifications */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Home className="w-5 h-5 text-blue-700" />
            <h2 className="text-base font-bold text-slate-900">Capacity & Floor Plan</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Bedrooms */}
            <div>
              <label htmlFor="bedrooms" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1">
                  <Bed className="w-3.5 h-3.5" /> Bedrooms
                </span>
              </label>
              <select
                id="bedrooms"
                value={intake.bedrooms}
                onChange={(e) => updateField('bedrooms', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
              >
                <option value={0}>0 (Studio)</option>
                <option value={1}>1 Bedroom</option>
                <option value={2}>2 Bedrooms</option>
                <option value={3}>3 Bedrooms</option>
                <option value={4}>4 Bedrooms</option>
                <option value={5}>5+ Bedrooms</option>
              </select>
            </div>

            {/* Bathrooms */}
            <div>
              <label htmlFor="bathrooms" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1">
                  <Bath className="w-3.5 h-3.5" /> Bathrooms
                </span>
              </label>
              <select
                id="bathrooms"
                value={intake.bathrooms}
                onChange={(e) => updateField('bathrooms', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
              >
                <option value={1}>1 Bath</option>
                <option value={1.5}>1.5 Baths</option>
                <option value={2}>2 Baths</option>
                <option value={2.5}>2.5 Baths</option>
                <option value={3}>3 Baths</option>
                <option value={3.5}>3.5+ Baths</option>
              </select>
            </div>

            {/* Guests (Accommodates) */}
            <div>
              <label htmlFor="accommodates" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Max Guests
                </span>
              </label>
              <select
                id="accommodates"
                value={intake.accommodates}
                onChange={(e) => updateField('accommodates', parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((g) => (
                  <option key={g} value={g}>
                    {g} {g === 1 ? 'Guest' : 'Guests'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Amenities Checkboxes */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-700" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Amenities</h2>
                <p className="text-xs text-slate-500">
                  Select available features to benchmark against neighborhood amenity uplifts
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Washer */}
            <label
              className={`p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                intake.hasWasher
                  ? 'bg-blue-50/70 border-blue-400 text-blue-950 font-semibold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={intake.hasWasher}
                  onChange={(e) => updateField('hasWasher', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs">Washer & Dryer</span>
              </div>
            </label>

            {/* Parking */}
            <label
              className={`p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                intake.hasParking
                  ? 'bg-blue-50/70 border-blue-400 text-blue-950 font-semibold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={intake.hasParking}
                  onChange={(e) => updateField('hasParking', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs">Dedicated Parking</span>
              </div>
            </label>

            {/* Workspace */}
            <label
              className={`p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                intake.hasWorkspace
                  ? 'bg-blue-50/70 border-blue-400 text-blue-950 font-semibold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={intake.hasWorkspace}
                  onChange={(e) => updateField('hasWorkspace', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs">Dedicated Workspace</span>
              </div>
            </label>

            {/* AC */}
            <label
              className={`p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                intake.hasAc
                  ? 'bg-blue-50/70 border-blue-400 text-blue-950 font-semibold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={intake.hasAc}
                  onChange={(e) => updateField('hasAc', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs">Air Conditioning (AC)</span>
              </div>
            </label>

            {/* Self check-in */}
            <label
              className={`p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                intake.hasSelfCheckin
                  ? 'bg-blue-50/70 border-blue-400 text-blue-950 font-semibold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={intake.hasSelfCheckin}
                  onChange={(e) => updateField('hasSelfCheckin', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs">Self Check-in Keypad</span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 4: Critical DC Municipal Regulation: Owner Residency */}
        <div className="bg-slate-900 text-white rounded-xl shadow-md p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-600 rounded-lg text-white mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-rose-300">
                DC Municipal Regulation • DLCP Compliance
              </span>
              <h2 className="text-base font-bold text-white mt-0.5">
                Will the owner live there during stays?
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Under the Washington DC Short-Term Rental Regulation Act, if the owner is <strong>absent</strong> during guest stays (Vacation Rental endorsement), the listing is legally capped at a strict maximum of <strong>90 nights per calendar year</strong>. Hosted properties with the owner residing on-site have unlimited nights.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => updateField('ownerLivesThere', true)}
              className={`p-4 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
                intake.ownerLivesThere
                  ? 'bg-blue-600/30 border-blue-400 ring-2 ring-blue-500 text-white'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="mt-0.5">
                {intake.ownerLivesThere ? (
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-slate-500" />
                )}
              </div>
              <div>
                <span className="text-sm font-bold block text-white">Yes — Owner Lives There (Hosted)</span>
                <span className="text-[11px] text-slate-300 block mt-1">
                  Full 365-day potential. No statutory 90-night cap applies under DC Short-Term Rental endorsement.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => updateField('ownerLivesThere', false)}
              className={`p-4 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
                !intake.ownerLivesThere
                  ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500 text-white'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="mt-0.5">
                {!intake.ownerLivesThere ? (
                  <CheckCircle className="w-5 h-5 text-rose-400" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-slate-500" />
                )}
              </div>
              <div>
                <span className="text-sm font-bold block text-white">No — Owner Absent (Vacation Rental)</span>
                <span className="text-[11px] text-rose-200 block mt-1">
                  Strict 90-night statutory cap applies. Revenue projections will calculate both full vs. capped earnings.
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Live Filter Summary & Submit Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-md p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-600 space-y-0.5">
            <div className="flex items-center flex-wrap gap-1.5 font-bold text-slate-900 text-sm">
              <span>Ready to benchmark</span>
              <span className="font-mono text-blue-800 font-extrabold">{previewComps.length}</span>
              <span>active comps in {intake.neighborhood}</span>
              {onOpenSource && (
                <SourceLink
                  variant="badge"
                  onClick={() =>
                    onOpenSource({
                      title: `Preview Benchmark Comps (${intake.neighborhood})`,
                      valueDescription: `${previewComps.length} listings match ${intake.neighborhood}, ${intake.roomType}, ${intake.bedrooms}BR`,
                      metricValue: `${previewComps.length} comps`,
                      formula: `COUNT(*) WHERE neighbourhood_cleansed = '${intake.neighborhood}' AND room_type = '${intake.roomType}' AND bedrooms = ${intake.bedrooms}`,
                      filtersUsed: [
                        { label: 'Neighbourhood', value: intake.neighborhood },
                        { label: 'Room Type', value: intake.roomType },
                        { label: 'Bedrooms', value: `${intake.bedrooms} BR` },
                        { label: 'Dataset', value: 'Inside Airbnb Washington DC' },
                      ],
                      compCount: previewComps.length,
                      comps: previewComps,
                      suggestedFilename: `dc_comps_${intake.neighborhood.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${intake.bedrooms}br_preview.csv`,
                    })
                  }
                />
              )}
            </div>
            <div className="text-slate-500 flex items-center flex-wrap gap-1 mt-0.5">
              {intake.isCondo ? (
                <>
                  <span>Condo sample:</span>
                  <strong className="font-mono text-slate-700">{condoPreviewCount} listings</strong>
                  {onOpenSource && (
                    <SourceLink
                      variant="subtle"
                      onClick={() => {
                        const condoComps = previewComps.filter((c) => c.is_condo);
                        onOpenSource({
                          title: `Condo Comps Subset (${intake.neighborhood})`,
                          valueDescription: `${condoComps.length} condo listings in ${intake.neighborhood}`,
                          metricValue: `${condoComps.length} condos`,
                          formula: `COUNT(*) WHERE is_condo = true AND neighbourhood_cleansed = '${intake.neighborhood}' AND room_type = '${intake.roomType}' AND bedrooms = ${intake.bedrooms}`,
                          filtersUsed: [
                            { label: 'Neighbourhood', value: intake.neighborhood },
                            { label: 'Room Type', value: intake.roomType },
                            { label: 'Bedrooms', value: `${intake.bedrooms} BR` },
                            { label: 'Property Type', value: 'Condo Only (is_condo = true)' },
                          ],
                          compCount: condoComps.length,
                          comps: condoComps,
                          suggestedFilename: `dc_condos_${intake.neighborhood.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${intake.bedrooms}br.csv`,
                        });
                      }}
                    />
                  )}
                  <span>({condoPreviewCount >= 15 ? 'meets 15+ threshold: will use condo-only filter' : 'below 15 threshold: will broaden to all types'})</span>
                </>
              ) : (
                <span>Evaluating all property types for matching bedroom size.</span>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <span>Generate Comp Analysis &amp; Price Advisory</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

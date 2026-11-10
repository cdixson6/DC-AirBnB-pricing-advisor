/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Listing, PropertyIntake, CompAnalysisResult, SourceInspectorData } from './types/listing';
import { loadDefaultCsv } from './utils/csvLoader';
import { analyzeComps } from './utils/analytics';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { IntakeScreen } from './components/IntakeScreen';
import { RecommendationScreen } from './components/RecommendationScreen';
import { SourceModal } from './components/SourceModal';
import { CsvUploadModal } from './components/CsvUploadModal';
import { Building2, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [dataset, setDataset] = useState<Listing[]>([]);
  const [snapshotDate, setSnapshotDate] = useState<string>('2024-09-22');
  const [totalRows, setTotalRows] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCustomLoaded, setIsCustomLoaded] = useState<boolean>(false);

  // Active view: 'intake' (Screen 1) or 'recommendation' (Screen 2)
  const [currentScreen, setCurrentScreen] = useState<'intake' | 'recommendation'>('intake');
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Property intake state
  const [intake, setIntake] = useState<PropertyIntake>({
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
    ownerLivesThere: false, // Default to absent so user can see DC 90-night cap immediately!
  });

  // Modals state
  const [activeSourceData, setActiveSourceData] = useState<SourceInspectorData | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  // Load default Inside Airbnb CSV at startup
  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);
        setError(null);
        const data = await loadDefaultCsv();
        setDataset(data.listings);
        setSnapshotDate(data.snapshotDate);
        setTotalRows(data.totalRows);
      } catch (err: any) {
        console.error('Failed to load dataset:', err);
        setError(err?.message || 'Unable to load /data/dc_listings_clean.csv. Please upload a replacement CSV.');
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  // Compute unique neighborhoods & room types from the dataset
  const neighborhoods = useMemo(() => {
    const set = new Set<string>();
    dataset.forEach((d) => {
      if (d.neighbourhood_cleansed) set.add(d.neighbourhood_cleansed);
    });
    const list = Array.from(set).sort();
    return list.length > 0 ? list : ['Dupont Circle', 'Capitol Hill', 'Georgetown', 'Logan Circle', 'Adams Morgan'];
  }, [dataset]);

  const roomTypes = useMemo(() => {
    const set = new Set<string>();
    dataset.forEach((d) => {
      if (d.room_type) set.add(d.room_type);
    });
    const list = Array.from(set).sort();
    return list.length > 0 ? list : ['Entire home/apt', 'Private room', 'Shared room'];
  }, [dataset]);

  // Ensure selected neighborhood and roomType exist in dataset when dataset changes
  useEffect(() => {
    if (neighborhoods.length > 0 && !neighborhoods.includes(intake.neighborhood)) {
      setIntake((prev) => ({ ...prev, neighborhood: neighborhoods[0] }));
    }
  }, [neighborhoods]);

  // Compute Comp Analysis whenever intake or dataset changes
  const compAnalysis: CompAnalysisResult | null = useMemo(() => {
    if (dataset.length === 0) return null;
    return analyzeComps(dataset, intake, snapshotDate);
  }, [dataset, intake, snapshotDate]);

  const handleDatasetLoaded = (data: {
    listings: Listing[];
    snapshotDate: string;
    totalRows: number;
    isCustom: boolean;
  }) => {
    setDataset(data.listings);
    setSnapshotDate(data.snapshotDate);
    setTotalRows(data.totalRows);
    setIsCustomLoaded(data.isCustom);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      {/* Global Navigation Header */}
      <Header
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        onOpenUpload={() => setIsUploadOpen(true)}
        datasetCount={totalRows}
        snapshotDate={snapshotDate}
        isCustomLoaded={isCustomLoaded}
        onOpenDatasetSource={() =>
          setActiveSourceData({
            title: 'Washington, D.C. Active Listings Dataset',
            valueDescription: `${totalRows.toLocaleString()} active listings in Inside Airbnb snapshot`,
            metricValue: `${totalRows.toLocaleString()} listings`,
            formula: 'COUNT(*) of all valid rows in active dataset after cleaning.',
            filtersUsed: [
              { label: 'Data Source', value: 'Inside Airbnb Washington, D.C.' },
              { label: 'Snapshot Date', value: snapshotDate },
              { label: 'Status', value: isCustomLoaded ? 'Custom Uploaded CSV' : 'Default /data/dc_listings_clean.csv' },
            ],
            compCount: dataset.length,
            comps: dataset,
            suggestedFilename: `dc_all_listings_${snapshotDate}.csv`,
          })
        }
      />

      {/* Main Body */}
      <main className="flex-1">
        {loading && (
          <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-slate-900">Loading Washington, DC Dataset...</h2>
            <p className="text-xs text-slate-500">
              Reading and parsing /data/dc_listings_clean.csv with PapaParse.
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="max-w-2xl mx-auto my-12 p-6 bg-rose-50 border border-rose-200 rounded-xl space-y-4 text-center">
            <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
            <h2 className="text-lg font-bold text-rose-950">Data Source Initialization Error</h2>
            <p className="text-sm text-rose-800">{error}</p>
            <div className="pt-2">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-xs shadow-sm transition cursor-pointer"
              >
                Upload Replacement CSV File
              </button>
            </div>
          </div>
        )}

        {!loading && !error && compAnalysis && (
          <>
            {currentScreen === 'intake' ? (
              <IntakeScreen
                intake={intake}
                onChange={setIntake}
                onSubmit={() => setCurrentScreen('recommendation')}
                neighborhoods={neighborhoods}
                roomTypes={roomTypes}
                dataset={dataset}
                onOpenSource={(sourceData) => setActiveSourceData(sourceData)}
              />
            ) : (
              <RecommendationScreen
                analysis={compAnalysis}
                onBackToIntake={() => setCurrentScreen('intake')}
                onOpenSource={(sourceData) => setActiveSourceData(sourceData)}
              />
            )}
          </>
        )}
      </main>

      {/* Static Footer with required Inside Airbnb attribution */}
      <Footer
        snapshotDate={snapshotDate}
        rowCount={totalRows}
        onOpenSource={() =>
          setActiveSourceData({
            title: 'Washington, D.C. Cleaned Dataset Registry',
            valueDescription: `${totalRows.toLocaleString()} listings currently active in memory`,
            metricValue: `${totalRows.toLocaleString()} listings`,
            formula: 'COUNT(*) of verified rows loaded from Inside Airbnb snapshot.',
            filtersUsed: [
              { label: 'Data Source', value: 'Inside Airbnb Washington, D.C.' },
              { label: 'Snapshot Date', value: snapshotDate },
              { label: 'Attribution', value: 'CC BY 4.0' },
            ],
            compCount: dataset.length,
            comps: dataset,
            suggestedFilename: `dc_active_listings_${snapshotDate}.csv`,
          })
        }
      />

      {/* Source Audit Drawer / Modal */}
      <SourceModal data={activeSourceData} onClose={() => setActiveSourceData(null)} />

      {/* CSV Replacement Upload Modal */}
      <CsvUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDatasetLoaded={handleDatasetLoaded}
        currentRowsCount={totalRows}
        currentSnapshotDate={snapshotDate}
        isCustomLoaded={isCustomLoaded}
      />
    </div>
  );
}

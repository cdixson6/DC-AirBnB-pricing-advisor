import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { Listing } from '../types/listing';
import { parseCsvString, loadDefaultCsv } from '../utils/csvLoader';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetLoaded: (data: { listings: Listing[]; snapshotDate: string; totalRows: number; isCustom: boolean }) => void;
  currentRowsCount: number;
  currentSnapshotDate: string;
  isCustomLoaded: boolean;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  isOpen,
  onClose,
  onDatasetLoaded,
  currentRowsCount,
  currentSnapshotDate,
  isCustomLoaded,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (!file.name.endsWith('.csv')) {
        throw new Error('Please upload a valid .csv file.');
      }

      const text = await file.text();
      const parsed = await parseCsvString(text);

      if (parsed.listings.length === 0) {
        throw new Error('The uploaded CSV file contained no valid listing rows.');
      }

      onDatasetLoaded({
        ...parsed,
        isCustom: true,
      });

      setSuccessMsg(`Successfully loaded ${parsed.listings.length.toLocaleString()} listings from "${file.name}"!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to parse CSV file. Ensure columns match Inside Airbnb format.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = async () => {
    setLoading(true);
    setError(null);
    try {
      const defaultData = await loadDefaultCsv();
      onDatasetLoaded({
        ...defaultData,
        isCustom: false,
      });
      setSuccessMsg(`Reloaded default Washington DC dataset (${defaultData.listings.length.toLocaleString()} listings).`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to reload default dataset.');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Admin: Update Dataset</h2>
              <p className="text-xs text-slate-400">Administrative tool to upload Inside Airbnb snapshot or reset to default</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-slate-800 text-xs">
          {/* Current status */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex items-center justify-between">
            <div>
              <span className="text-slate-500 font-medium block">Current Active Data</span>
              <span className="font-bold text-slate-900 text-sm">
                {currentRowsCount.toLocaleString()} listings • Snapshot {currentSnapshotDate}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {isCustomLoaded ? 'Custom uploaded CSV active' : 'Default /data/dc_listings_clean.csv'}
              </span>
            </div>
            {isCustomLoaded && (
              <button
                onClick={handleResetToDefault}
                disabled={loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md font-medium transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>
            )}
          </div>

          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div className="p-3 bg-blue-100 text-blue-700 rounded-full">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">Upload replacement DC listings CSV</p>
              <p className="text-slate-500 mt-1">Drag and drop here, or click to browse</p>
            </div>
            <p className="text-[11px] text-slate-400">
              Columns: id, neighbourhood_cleansed, latitude, longitude, property_type, room_type, accommodates, bedrooms, bathrooms, price, etc.
            </p>
          </div>

          {/* Status feedback */}
          {loading && (
            <div className="flex items-center gap-2 text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Parsing and validating CSV data with PapaParse...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

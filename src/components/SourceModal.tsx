import React, { useState, useEffect } from 'react';
import {
  X,
  Calculator,
  Filter,
  Database,
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  ArrowUpDown,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { SourceInspectorData, Listing } from '../types/listing';

interface SourceModalProps {
  data: SourceInspectorData | null;
  onClose: () => void;
}

export const SourceModal: React.FC<SourceModalProps> = ({ data, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'price' | 'rating' | 'reviews' | 'occupancy' | 'id'>('price');
  const [sortAsc, setSortAsc] = useState(false);

  // User Prompt State for CSV Download
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
  const [downloadFilename, setDownloadFilename] = useState('');
  const [exportMode, setExportMode] = useState<'all' | 'id_and_price'>('all');
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  // Initialize or update prompt filename when modal data changes
  useEffect(() => {
    if (data) {
      const defaultName =
        data.suggestedFilename ||
        `dc_comps_${data.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)}.csv`;
      setDownloadFilename(defaultName);
      setShowDownloadPrompt(false);
      setSearchTerm('');
    }
  }, [data]);

  if (!data) return null;

  const copyFormulaAndIds = () => {
    const text = `Metric: ${data.title}\nValue: ${data.metricValue}\nFormula: ${data.formula}\nComp Count: ${data.compCount}\nComp IDs & Prices:\n${data.comps.map((c) => `ID ${c.id}: $${c.price}/night (${c.property_type})`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePromptOpen = () => {
    setShowDownloadPrompt(true);
  };

  const executeCsvDownload = () => {
    if (!data.comps || data.comps.length === 0) return;

    let csvContent = '';
    const cleanFilename = downloadFilename.trim().endsWith('.csv')
      ? downloadFilename.trim()
      : `${downloadFilename.trim() || 'dc_comps'}.csv`;

    if (exportMode === 'id_and_price') {
      const headers = ['listing_id', 'nightly_price', 'neighbourhood', 'property_type', 'bedrooms'];
      const rows = data.comps.map((c) => [
        `"${c.id}"`,
        c.price,
        `"${c.neighbourhood_cleansed}"`,
        `"${c.property_type}"`,
        c.bedrooms,
      ]);
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else {
      const headers = [
        'id',
        'price',
        'neighbourhood_cleansed',
        'property_type',
        'room_type',
        'bedrooms',
        'bathrooms',
        'accommodates',
        'estimated_occupancy_l365d',
        'estimated_revenue_l365d',
        'review_scores_rating',
        'number_of_reviews_ltm',
        'is_condo',
        'has_washer',
        'has_parking',
        'has_workspace',
        'has_ac',
        'has_self_checkin',
        'latitude',
        'longitude',
      ];
      const rows = data.comps.map((c) => [
        `"${c.id}"`,
        c.price,
        `"${c.neighbourhood_cleansed}"`,
        `"${c.property_type}"`,
        `"${c.room_type}"`,
        c.bedrooms,
        c.bathrooms,
        c.accommodates,
        c.estimated_occupancy_l365d,
        c.estimated_revenue_l365d,
        c.review_scores_rating,
        c.number_of_reviews_ltm,
        c.is_condo ? 't' : 'f',
        c.has_washer ? 't' : 'f',
        c.has_parking ? 't' : 'f',
        c.has_workspace ? 't' : 'f',
        c.has_ac ? 't' : 'f',
        c.has_self_checkin ? 't' : 'f',
        c.latitude,
        c.longitude,
      ]);
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', cleanFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowDownloadPrompt(false);
    setDownloadSuccessToast(`Downloaded ${cleanFilename} (${data.comps.length} comps)`);
    setTimeout(() => setDownloadSuccessToast(null), 3500);
  };

  const filteredComps = data.comps
    .filter(
      (c) =>
        c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.property_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(c.price).includes(searchTerm)
    )
    .sort((a, b) => {
      let aVal: number = a.price;
      let bVal: number = b.price;
      if (sortField === 'id') {
        return sortAsc ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
      } else if (sortField === 'rating') {
        aVal = a.review_scores_rating;
        bVal = b.review_scores_rating;
      } else if (sortField === 'reviews') {
        aVal = a.number_of_reviews_ltm;
        bVal = b.number_of_reviews_ltm;
      } else if (sortField === 'occupancy') {
        aVal = a.estimated_occupancy_l365d;
        bVal = b.estimated_occupancy_l365d;
      }
      return sortAsc ? aVal - bVal : bVal - aVal;
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-blue-300">
                  Data Source Audit Panel
                </span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
                  100% Calculated
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">{data.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 flex-1">
          {/* Download Success Notification */}
          {downloadSuccessToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{downloadSuccessToast}</span>
            </div>
          )}

          {/* Prompt Dialog for CSV Download */}
          {showDownloadPrompt && (
            <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-4 sm:p-5 shadow-sm space-y-3 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-700" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Prompt: Download Comp Set CSV ({data.compCount} Listings)
                  </h3>
                </div>
                <button
                  onClick={() => setShowDownloadPrompt(false)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Please confirm or customize the CSV export filename and columns for this comp set:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Filename (.csv)
                  </label>
                  <input
                    type="text"
                    value={downloadFilename}
                    onChange={(e) => setDownloadFilename(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                    placeholder="dc_comps_export.csv"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Column Scope
                  </label>
                  <select
                    value={exportMode}
                    onChange={(e) => setExportMode(e.target.value as 'all' | 'id_and_price')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="all">All Attributes (20 Cols)</option>
                    <option value="id_and_price">Comp ID &amp; Price Only</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDownloadPrompt(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeCsvDownload}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Confirm &amp; Download CSV</span>
                </button>
              </div>
            </div>
          )}

          {/* Metric Highlight Box */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase font-bold text-blue-900 tracking-wider">Computed Metric Result</p>
              <p className="text-3xl font-black text-blue-950 mt-0.5 tracking-tight font-mono">{data.metricValue}</p>
              <p className="text-xs text-blue-800 mt-0.5">{data.valueDescription}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handlePromptOpen}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                title="Download CSV table of comp listing IDs and prices (prompt to user)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Comps CSV</span>
              </button>
              <button
                onClick={copyFormulaAndIds}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-blue-900 border border-blue-300 hover:bg-blue-100 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Audit Trail' : 'Copy Audit Trail'}</span>
              </button>
            </div>
          </div>

          {/* Filters Used */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filters Used on Inside Airbnb Dataset</span>
              </div>
              <span className="text-[11px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                Comp Count: {data.compCount} Listings
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {data.filtersUsed.map((f, idx) => (
                <div key={idx} className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs">
                  <span className="text-slate-500 font-medium block text-[11px]">{f.label}:</span>
                  <span className="font-bold text-slate-900">{f.value}</span>
                </div>
              ))}
              <div className="bg-blue-100/70 px-3 py-2 rounded-lg border border-blue-300 text-xs sm:col-span-2 md:col-span-1 flex items-center justify-between">
                <div>
                  <span className="text-blue-800 font-semibold block text-[11px]">Comp Count Filtered:</span>
                  <span className="font-extrabold text-blue-950 text-sm font-mono">{data.compCount} listings</span>
                </div>
                <button
                  onClick={handlePromptOpen}
                  className="text-blue-800 hover:text-blue-950 p-1"
                  title="Download CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mathematical Formula */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              <Calculator className="w-3.5 h-3.5 text-slate-500" />
              <span>Exact Mathematical Formula Applied</span>
            </div>
            <p className="font-mono text-xs sm:text-sm bg-white p-3 rounded-lg border border-slate-200 text-slate-900 break-words leading-relaxed">
              {data.formula}
            </p>
          </div>

          {/* Comps List Table (Comp IDs & Prices) */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Comp Listings Table: IDs &amp; Nightly Prices ({filteredComps.length} of {data.comps.length} listings)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Search ID, price, or type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-2.5 py-1 text-xs border border-slate-300 rounded-lg w-52 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
                <button
                  onClick={handlePromptOpen}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 cursor-pointer"
                  title="Download CSV of this comp table"
                >
                  <Download className="w-3 h-3 text-blue-700" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 sticky top-0 border-b border-slate-200 z-10 font-semibold">
                  <tr>
                    <th
                      className="py-2 px-3 cursor-pointer hover:bg-slate-200"
                      onClick={() => {
                        setSortField('id');
                        setSortAsc(!sortAsc);
                      }}
                    >
                      <div className="flex items-center gap-1">
                        <span>Comp ID</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      className="py-2 px-3 text-right cursor-pointer hover:bg-slate-200"
                      onClick={() => {
                        setSortField('price');
                        setSortAsc(!sortAsc);
                      }}
                    >
                      <div className="flex items-center justify-end gap-1 font-bold text-slate-900">
                        <span>Nightly Price</span>
                        <ArrowUpDown className="w-3 h-3 text-blue-700" />
                      </div>
                    </th>
                    <th className="py-2 px-3">Property Type</th>
                    <th className="py-2 px-3 text-center">Beds</th>
                    <th
                      className="py-2 px-3 text-right cursor-pointer hover:bg-slate-200"
                      onClick={() => {
                        setSortField('occupancy');
                        setSortAsc(!sortAsc);
                      }}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Occupancy</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      className="py-2 px-3 text-right cursor-pointer hover:bg-slate-200"
                      onClick={() => {
                        setSortField('rating');
                        setSortAsc(!sortAsc);
                      }}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Rating</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-2 px-3 text-center">Condo</th>
                    <th className="py-2 px-3 text-center">Washer</th>
                    <th className="py-2 px-3 text-center">Parking</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredComps.map((c) => (
                    <tr key={c.id} className="hover:bg-blue-50/50 transition">
                      <td className="py-2 px-3 font-bold text-blue-700">#{c.id}</td>
                      <td className="py-2 px-3 text-right font-black text-slate-900 text-sm">
                        ${c.price}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-700 max-w-[150px] truncate" title={c.property_type}>
                        {c.property_type}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-700 font-sans">
                        {c.bedrooms === 0 ? 'Studio' : `${c.bedrooms} BR`}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600">{c.estimated_occupancy_l365d} nights</td>
                      <td className="py-2 px-3 text-right text-amber-600 font-bold">{c.review_scores_rating.toFixed(2)}★</td>
                      <td className="py-2 px-3 text-center text-slate-600">{c.is_condo ? '✓' : '—'}</td>
                      <td className="py-2 px-3 text-center text-slate-600">{c.has_washer ? '✓' : '—'}</td>
                      <td className="py-2 px-3 text-center text-slate-600">{c.has_parking ? '✓' : '—'}</td>
                    </tr>
                  ))}
                  {filteredComps.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 font-sans">
                        No comp listings match your search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
              <span>All comp IDs and prices are verifiable in raw Inside Airbnb snapshot data.</span>
              <button
                onClick={handlePromptOpen}
                className="text-blue-700 hover:text-blue-900 font-semibold underline cursor-pointer"
              >
                Download this table as CSV
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={handlePromptOpen}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Comps CSV (Prompt)</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Close Audit Panel
          </button>
        </div>
      </div>
    </div>
  );
};

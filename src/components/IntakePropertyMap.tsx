/// <reference types="google.maps" />
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import L from 'leaflet';
import { Listing, PropertyIntake, SourceInspectorData } from '../types/listing';
import { SourceLink } from './SourceLink';
import {
  MapPin,
  Compass,
  RefreshCw,
  Home,
  Check,
  X,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Bed,
  Bath,
  Users,
  Calendar,
  DollarSign,
  Filter,
  TrendingUp,
  BarChart2,
  Award,
} from 'lucide-react';

interface IntakePropertyMapProps {
  dataset: Listing[];
  currentIntake: PropertyIntake;
  onApplyPropertyToIntake: (listing: Listing) => void;
  onOpenSource?: (data: SourceInspectorData) => void;
}

// Auto bounds fitter component for Google Maps
const MapBoundsFitter: React.FC<{ listings: Listing[]; trigger: number }> = ({ listings, trigger }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || listings.length === 0) return;
    try {
      const bounds = new google.maps.LatLngBounds();
      listings.forEach((item) => {
        bounds.extend({ lat: item.latitude, lng: item.longitude });
      });
      map.fitBounds(bounds, { top: 30, right: 30, bottom: 30, left: 30 });
    } catch (e) {
      console.warn('Error fitting bounds:', e);
    }
  }, [map, listings, trigger]);

  return null;
};

export const IntakePropertyMap: React.FC<IntakePropertyMapProps> = ({
  dataset,
  currentIntake,
  onApplyPropertyToIntake,
  onOpenSource,
}) => {
  // Selected property to display on the right
  const [selectedProperty, setSelectedProperty] = useState<Listing | null>(null);

  // Filter properties on map: 'all' or by specific neighborhood
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>('all');

  // Map mode: Roadmap vs Satellite vs CARTO
  const [mapEngine, setMapEngine] = useState<'google' | 'leaflet'>('google');
  const [googleMapType, setGoogleMapType] = useState<'roadmap' | 'hybrid'>('roadmap');

  // Trigger to refit bounds
  const [fitTrigger, setFitTrigger] = useState<number>(0);

  // Google Maps API Key
  const [apiKey, setApiKey] = useState<string>(
    (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || ''
  );

  // Leaflet backup refs
  const leafletContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  // Unique list of neighborhoods with counts
  const neighborhoodOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    dataset.forEach((d) => {
      if (d.neighbourhood_cleansed) {
        counts[d.neighbourhood_cleansed] = (counts[d.neighbourhood_cleansed] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [dataset]);

  // Filtered dataset for the map
  const displayedListings = useMemo(() => {
    if (neighborhoodFilter === 'all') {
      return dataset;
    }
    return dataset.filter(
      (d) => d.neighbourhood_cleansed.toLowerCase() === neighborhoodFilter.toLowerCase()
    );
  }, [dataset, neighborhoodFilter]);

  // Live market metrics produced by the current map viewport/filter
  const marketMetrics = useMemo(() => {
    if (displayedListings.length === 0) return null;
    const sortedPrices = [...displayedListings].map((l) => l.price).sort((a, b) => a - b);
    const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)] || 0;
    const p25Price = sortedPrices[Math.floor(sortedPrices.length * 0.25)] || 0;
    const p75Price = sortedPrices[Math.floor(sortedPrices.length * 0.75)] || 0;
    const licensedCount = displayedListings.filter((l) => l.has_license).length;
    const licensedPercent = Math.round((licensedCount / displayedListings.length) * 100);
    const avgOccupancy = Math.round(
      displayedListings.reduce((acc, l) => acc + l.estimated_occupancy_l365d, 0) /
        displayedListings.length
    );
    return {
      count: displayedListings.length,
      medianPrice,
      p25Price,
      p75Price,
      licensedPercent,
      avgOccupancy,
    };
  }, [displayedListings]);

  // Default to selecting the first listing in the current intake neighborhood if none selected
  useEffect(() => {
    if (!selectedProperty && dataset.length > 0) {
      const match = dataset.find(
        (d) => d.neighbourhood_cleansed.toLowerCase() === currentIntake.neighborhood.toLowerCase()
      );
      setSelectedProperty(match || dataset[0]);
    }
  }, [dataset, currentIntake.neighborhood, selectedProperty]);

  // Center coordinate of displayed listings
  const center = useMemo(() => {
    if (displayedListings.length === 0) {
      return { lat: 38.9072, lng: -77.0369 };
    }
    const lat = displayedListings.reduce((acc, c) => acc + c.latitude, 0) / displayedListings.length;
    const lng = displayedListings.reduce((acc, c) => acc + c.longitude, 0) / displayedListings.length;
    return { lat, lng };
  }, [displayedListings]);

  // Fetch API key from server if not already in client env
  useEffect(() => {
    if (!apiKey) {
      fetch('/api/config/maps')
        .then((res) => res.json())
        .then((data) => {
          if (data?.apiKey) {
            setApiKey(data.apiKey);
          }
        })
        .catch((err) => {
          console.warn('Could not load Google Maps API key from config endpoint:', err);
        });
    }
  }, [apiKey]);

  const handleResetBounds = () => {
    setFitTrigger((prev) => prev + 1);
    if (mapEngine === 'leaflet' && leafletMapRef.current && displayedListings.length > 0) {
      const markers = displayedListings.slice(0, 500).map((c) => L.marker([c.latitude, c.longitude]));
      const group = L.featureGroup(markers);
      leafletMapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  };

  // Open Source Inspector for the selected property
  const handleInspectSource = (listing: Listing) => {
    if (!onOpenSource) return;
    onOpenSource({
      title: `Listing Record #${listing.id}`,
      valueDescription: `${listing.property_type} in ${listing.neighbourhood_cleansed}`,
      metricValue: `$${listing.price} / night`,
      formula: 'Verified raw record from Inside Airbnb Washington, D.C. public dataset.',
      filtersUsed: [
        { label: 'Listing ID', value: listing.id },
        { label: 'Neighborhood', value: listing.neighbourhood_cleansed },
        { label: 'Property Type', value: listing.property_type },
        { label: 'Bedrooms', value: listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} BR` },
        { label: 'DC License Status', value: listing.has_license ? 'Licensed' : 'Unlicensed / Exempt' },
        { label: 'Snapshot Date', value: listing.snapshot_date || '2024-09-22' },
      ],
      compCount: 1,
      comps: [listing],
      suggestedFilename: `listing_${listing.id}_record.csv`,
    });
  };

  // Open Source Inspector for the filtered market metrics
  const handleInspectMarketSource = () => {
    if (!onOpenSource || !marketMetrics) return;
    onOpenSource({
      title: `Market Benchmark Metrics: ${neighborhoodFilter === 'all' ? 'Washington, D.C. All' : neighborhoodFilter}`,
      valueDescription: `Median price $${marketMetrics.medianPrice}/night across ${marketMetrics.count} active listings`,
      metricValue: `$${marketMetrics.medianPrice} / night median`,
      formula: 'MEDIAN(price) and IQR 25th-75th percentiles of listings matching map filter.',
      filtersUsed: [
        { label: 'Neighborhood Filter', value: neighborhoodFilter === 'all' ? 'All DC' : neighborhoodFilter },
        { label: 'Total Listings in Set', value: `${marketMetrics.count}` },
        { label: 'Core Market Band (IQR)', value: `$${marketMetrics.p25Price} – $${marketMetrics.p75Price}` },
        { label: 'DC License Rate', value: `${marketMetrics.licensedPercent}%` },
      ],
      compCount: displayedListings.length,
      comps: displayedListings,
      suggestedFilename: `dc_map_metrics_${neighborhoodFilter}.csv`,
    });
  };

  // Leaflet backup map renderer
  useEffect(() => {
    if (mapEngine !== 'leaflet') return;
    if (!leafletContainerRef.current) return;

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    const map = L.map(leafletContainerRef.current, {
      center: [center.lat, center.lng],
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    }).addTo(map);

    const markers: L.Marker[] = [];
    const subset = displayedListings.slice(0, 600);

    subset.forEach((listing) => {
      let bgColor = '#1e40af';
      if (listing.price < 120) bgColor = '#059669';
      else if (listing.price > 220) bgColor = '#7c3aed';

      const customIcon = L.divIcon({
        className: 'custom-comp-marker',
        html: `
          <div style="
            background-color: ${bgColor};
            color: #ffffff;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 9999px;
            border: 1.5px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
            white-space: nowrap;
            cursor: pointer;
            transform: translate(-50%, -50%);
          ">
            $${listing.price}
          </div>
        `,
        iconSize: [40, 20],
        iconAnchor: [20, 10],
      });

      const marker = L.marker([listing.latitude, listing.longitude], { icon: customIcon });
      marker.on('click', () => setSelectedProperty(listing));
      marker.addTo(map);
      markers.push(marker);
    });

    leafletMapRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [mapEngine, displayedListings, center]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 mb-7">
      {/* Top Section Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-900">
                Washington, D.C. Property Explorer
              </h2>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Compass className="w-2.5 h-2.5" />
                Google Maps
              </span>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {displayedListings.length.toLocaleString()} listings
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          {/* Quick neighborhood filter */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
            <Filter className="w-3 h-3 text-slate-400 shrink-0" />
            <select
              value={neighborhoodFilter}
              onChange={(e) => {
                setNeighborhoodFilter(e.target.value);
                setFitTrigger((prev) => prev + 1);
              }}
              className="bg-transparent text-xs text-slate-800 font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="all">All DC Neighborhoods ({dataset.length})</option>
              {neighborhoodOptions.map(([nh, count]) => (
                <option key={nh} value={nh}>
                  {nh} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Jump to current intake neighborhood */}
          {neighborhoodFilter !== currentIntake.neighborhood && (
            <button
              type="button"
              onClick={() => {
                setNeighborhoodFilter(currentIntake.neighborhood);
                setFitTrigger((prev) => prev + 1);
              }}
              className="text-[11px] font-medium text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200 transition cursor-pointer"
              title="Filter to currently selected intake neighborhood"
            >
              Focus {currentIntake.neighborhood}
            </button>
          )}

          {/* Map Layer Switcher */}
          <div className="inline-flex rounded-md border border-slate-200 bg-slate-100 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => {
                setMapEngine('google');
                setGoogleMapType('roadmap');
              }}
              className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                mapEngine === 'google' && googleMapType === 'roadmap'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Roadmap
            </button>
            <button
              type="button"
              onClick={() => {
                setMapEngine('google');
                setGoogleMapType('hybrid');
              }}
              className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                mapEngine === 'google' && googleMapType === 'hybrid'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setMapEngine('leaflet')}
              className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                mapEngine === 'leaflet'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              CARTO
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetBounds}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition cursor-pointer border border-slate-200"
            title="Recenter and fit all properties into view"
          >
            <RefreshCw className="w-3 h-3 text-slate-500" />
            <span>Fit All</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Section: Smaller Compact Map on Left (approx 42-45%), Rich Metrics Dashboard on Right (approx 55-58%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-3.5">
        {/* Left Column: Smaller, compact Google Map */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="relative w-full h-[340px] rounded-lg overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
            {mapEngine === 'google' ? (
              <APIProvider apiKey={apiKey} libraries={['marker']}>
                <Map
                  mapId="DEMO_MAP_ID"
                  mapTypeId={googleMapType}
                  defaultCenter={center}
                  defaultZoom={12}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%' }}
                >
                  <MapBoundsFitter listings={displayedListings} trigger={fitTrigger} />

                  {/* Render pins for displayed listings */}
                  {displayedListings.map((listing) => {
                    let badgeColor = 'bg-blue-700 hover:bg-blue-800 text-white border-white';
                    if (listing.price < 120) {
                      badgeColor = 'bg-emerald-600 hover:bg-emerald-700 text-white border-white';
                    } else if (listing.price > 220) {
                      badgeColor = 'bg-purple-700 hover:bg-purple-800 text-white border-white';
                    }

                    const isSelected = selectedProperty?.id === listing.id;

                    return (
                      <AdvancedMarker
                        key={listing.id}
                        position={{ lat: listing.latitude, lng: listing.longitude }}
                        onClick={() => setSelectedProperty(listing)}
                        title={`#${listing.id} - $${listing.price}/night - ${listing.property_type}`}
                      >
                        <div
                          className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full border shadow-2xs cursor-pointer transition transform ${badgeColor} ${
                            isSelected
                              ? 'scale-125 ring-2 ring-amber-400 z-50 shadow-md'
                              : 'hover:scale-110'
                          }`}
                        >
                          ${listing.price}
                        </div>
                      </AdvancedMarker>
                    );
                  })}

                  {/* InfoWindow for currently selected property on map */}
                  {selectedProperty && (
                    <InfoWindow
                      position={{ lat: selectedProperty.latitude, lng: selectedProperty.longitude }}
                      onCloseClick={() => {}}
                      maxWidth={220}
                    >
                      <div className="p-0.5 font-sans text-slate-800">
                        <div className="flex items-baseline justify-between border-b border-slate-200 pb-0.5 mb-1">
                          <span className="font-extrabold text-xs text-slate-900">
                            ${selectedProperty.price} <span className="text-[9px] text-slate-500 font-normal">/ nt</span>
                          </span>
                          <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1 py-0.2 rounded">
                            #{selectedProperty.id}
                          </span>
                        </div>
                        <div className="text-[10px] font-semibold text-slate-900 truncate">
                          {selectedProperty.property_type}
                        </div>
                        <div className="text-[9px] text-slate-500 truncate">
                          {selectedProperty.neighbourhood_cleansed}
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>
            ) : (
              <div ref={leafletContainerRef} className="w-full h-full min-h-[340px]" />
            )}

            {/* Quick Map Legend Overlay */}
            <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs px-2 py-1 rounded border border-slate-200 text-[9px] text-slate-600 shadow-2xs flex items-center gap-2.5 z-10">
              <span className="font-semibold text-slate-800">Tiers:</span>
              <span className="flex items-center gap-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> &lt;$120
              </span>
              <span className="flex items-center gap-0.5">
                <span className="w-2 h-2 rounded-full bg-blue-700 inline-block" /> $120–$220
              </span>
              <span className="flex items-center gap-0.5">
                <span className="w-2 h-2 rounded-full bg-purple-700 inline-block" /> &gt;$220
              </span>
            </div>
          </div>

          <div className="mt-1.5 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Click any pin to inspect property metrics.</span>
            <span>Google Maps Platform</span>
          </div>
        </div>

        {/* Right Column: Prominent Metrics Dashboard produced by the Map */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-slate-50 border border-slate-200 rounded-lg p-4 min-h-[340px]">
          {selectedProperty ? (
            <div className="space-y-3.5">
              {/* Selected Property Header */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-2.5">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded">
                      Listing #{selectedProperty.id}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                      {selectedProperty.room_type}
                    </span>
                    {selectedProperty.is_condo && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded">
                        Condo
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {selectedProperty.property_type}
                  </h3>
                  <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span>{selectedProperty.neighbourhood_cleansed}, Washington, DC</span>
                  </div>
                </div>

                {/* Nightly Rate Highlight */}
                <div className="text-right shrink-0 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
                  <div className="text-xl font-black font-mono text-slate-900">
                    ${selectedProperty.price}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">nightly rate</div>
                </div>
              </div>

              {/* 4 Key Performance Metrics Grid */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
                  <span>Selected Listing Performance Metrics</span>
                  <span className="font-normal text-[10px] text-slate-400">Inside Airbnb Verified</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Metric 1: Nightly Price */}
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center shadow-2xs">
                    <div className="text-[10px] text-slate-500 font-medium">Nightly Rate</div>
                    <div className="text-base font-black font-mono text-slate-900 mt-0.5">
                      ${selectedProperty.price}
                    </div>
                    <div className="text-[9px] text-blue-700 font-semibold mt-0.5">
                      {marketMetrics && selectedProperty.price >= marketMetrics.medianPrice
                        ? `+${Math.round(((selectedProperty.price - marketMetrics.medianPrice) / marketMetrics.medianPrice) * 100)}% vs Area`
                        : `${marketMetrics ? Math.round(((selectedProperty.price - marketMetrics.medianPrice) / marketMetrics.medianPrice) * 100) : 0}% vs Area`}
                    </div>
                  </div>

                  {/* Metric 2: Est. Annual Revenue */}
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center shadow-2xs">
                    <div className="text-[10px] text-slate-500 font-medium">Est. Revenue</div>
                    <div className="text-base font-black font-mono text-emerald-700 mt-0.5">
                      ${(selectedProperty.price * selectedProperty.estimated_occupancy_l365d).toLocaleString()}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">annual gross</div>
                  </div>

                  {/* Metric 3: Occupancy Booked */}
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center shadow-2xs">
                    <div className="text-[10px] text-slate-500 font-medium">Booked Nights</div>
                    <div className="text-base font-black font-mono text-slate-900 mt-0.5">
                      {selectedProperty.estimated_occupancy_l365d}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      {Math.round((selectedProperty.estimated_occupancy_l365d / 365) * 100)}% occupancy
                    </div>
                  </div>

                  {/* Metric 4: Guest Rating */}
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center shadow-2xs">
                    <div className="text-[10px] text-slate-500 font-medium">Guest Rating</div>
                    <div className="text-base font-black font-mono text-amber-700 mt-0.5">
                      {selectedProperty.review_scores_rating.toFixed(2)} ★
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      {selectedProperty.number_of_reviews_ltm} reviews past yr
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Area Market Benchmark Produced by the Map */}
              {marketMetrics && (
                <div className="bg-white rounded-lg border border-slate-200 p-2.5 shadow-2xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-[10px]">
                    <span className="font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                      <BarChart2 className="w-3.5 h-3.5 text-blue-700" />
                      Area Benchmark ({neighborhoodFilter === 'all' ? 'All DC' : neighborhoodFilter})
                    </span>
                    <button
                      type="button"
                      onClick={handleInspectMarketSource}
                      className="text-blue-700 hover:text-blue-900 font-semibold underline text-[10px] cursor-pointer"
                    >
                      View Source ({marketMetrics.count} comps)
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 pt-1.5 text-center text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500">Median Rate</div>
                      <div className="font-bold font-mono text-slate-900">${marketMetrics.medianPrice}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Core Range (IQR)</div>
                      <div className="font-semibold font-mono text-slate-800 text-[11px]">
                        ${marketMetrics.p25Price}–${marketMetrics.p75Price}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Avg Occupancy</div>
                      <div className="font-semibold text-slate-800">{marketMetrics.avgOccupancy} d/yr</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Licensed Share</div>
                      <div className="font-semibold text-emerald-700">{marketMetrics.licensedPercent}%</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Property Specs & Amenities row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-3 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">
                    {selectedProperty.bedrooms === 0 ? 'Studio' : `${selectedProperty.bedrooms} BR`}
                  </span>
                  <span>&bull;</span>
                  <span>{selectedProperty.bathrooms} BA</span>
                  <span>&bull;</span>
                  <span>Accommodates {selectedProperty.accommodates}</span>
                </div>

                <div className="flex items-center gap-1.5 text-[10px]">
                  {selectedProperty.has_license ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      DC Licensed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-medium">
                      <ShieldAlert className="w-3 h-3 text-amber-600" />
                      Unlicensed
                    </span>
                  )}

                  {selectedProperty.has_washer && (
                    <span className="bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded">Washer</span>
                  )}
                  {selectedProperty.has_parking && (
                    <span className="bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded">Parking</span>
                  )}
                  {selectedProperty.has_workspace && (
                    <span className="bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded">Workspace</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onApplyPropertyToIntake(selectedProperty)}
                  className="w-full sm:w-auto flex-1 py-2 px-3 bg-blue-800 hover:bg-blue-900 text-white rounded-lg font-bold text-xs shadow-2xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Adopt This Property's Parameters For Intake</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {onOpenSource && (
                  <button
                    type="button"
                    onClick={() => handleInspectSource(selectedProperty)}
                    className="text-xs text-blue-700 hover:text-blue-900 font-semibold underline px-2 py-1 cursor-pointer shrink-0"
                  >
                    Inspect Source
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <MapPin className="w-8 h-8 text-blue-700 animate-bounce mb-2" />
              <div className="text-sm font-bold text-slate-800">Select Any Property on the Map</div>
              <div className="text-xs text-slate-500 max-w-sm mt-1">
                Click any price pin on the compact Google Map to produce complete performance metrics, revenue projections, and DC regulatory benchmarks on this panel.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

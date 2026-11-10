/// <reference types="google.maps" />
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import L from 'leaflet';
import { CompAnalysisResult, SourceInspectorData, Listing } from '../types/listing';
import { buildSourceData } from '../utils/analytics';
import { SourceLink } from './SourceLink';
import { MapPin, Layers, RefreshCw, Compass, ExternalLink, ShieldCheck, Home } from 'lucide-react';

interface CompMapProps {
  analysis: CompAnalysisResult;
  onOpenSource: (data: SourceInspectorData) => void;
}

// Helper component to auto-fit bounds on comp update or reset view click
const MapBoundsFitter: React.FC<{ comps: Listing[]; trigger: number }> = ({ comps, trigger }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || comps.length === 0) return;
    try {
      const bounds = new google.maps.LatLngBounds();
      comps.forEach((c) => {
        bounds.extend({ lat: c.latitude, lng: c.longitude });
      });
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    } catch (e) {
      console.warn('Error fitting bounds:', e);
    }
  }, [map, comps, trigger]);

  return null;
};

export const CompMap: React.FC<CompMapProps> = ({ analysis, onOpenSource }) => {
  const { comps, p25Price, p75Price, recommendedPrice } = analysis;

  // Selected comp for popup info
  const [selectedComp, setSelectedComp] = useState<Listing | null>(null);

  // Trigger counter to force auto-fit bounds
  const [fitTrigger, setFitTrigger] = useState<number>(0);

  // Map view mode: Google Roadmap vs Google Satellite/Hybrid vs OpenStreetMap fallback
  const [mapEngine, setMapEngine] = useState<'google' | 'leaflet'>('google');
  const [googleMapType, setGoogleMapType] = useState<'roadmap' | 'hybrid' | 'terrain'>('roadmap');

  // Google Maps API Key state (reads from env or /api/config/maps endpoint)
  const [apiKey, setApiKey] = useState<string>(
    (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || ''
  );

  // Fallback Leaflet refs
  const leafletContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  // Compute centroid of comps or DC center (38.9072, -77.0369)
  const center = useMemo(() => {
    if (comps.length === 0) {
      return { lat: 38.9072, lng: -77.0369 };
    }
    const lat = comps.reduce((acc, c) => acc + c.latitude, 0) / comps.length;
    const lng = comps.reduce((acc, c) => acc + c.longitude, 0) / comps.length;
    return { lat, lng };
  }, [comps]);

  // Fetch API key from backend if not directly in client env
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

  const handleSourceClick = () => {
    onOpenSource(buildSourceData(analysis, 'comp_count'));
  };

  const handleResetView = () => {
    setFitTrigger((prev) => prev + 1);
    if (mapEngine === 'leaflet' && leafletMapRef.current && comps.length > 0) {
      const markers = comps.map((c) => L.marker([c.latitude, c.longitude]));
      const group = L.featureGroup(markers);
      leafletMapRef.current.fitBounds(group.getBounds().pad(0.15));
    }
  };

  // Leaflet backup map renderer when Leaflet mode is selected or if Google Maps key unavailable
  useEffect(() => {
    if (mapEngine !== 'leaflet') return;
    if (!leafletContainerRef.current) return;

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    const map = L.map(leafletContainerRef.current, {
      center: [center.lat, center.lng],
      zoom: 14,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    }).addTo(map);

    const markers: L.Marker[] = [];

    comps.forEach((comp) => {
      let bgColor = '#1e40af'; // Blue: Core market
      if (comp.price < p25Price) {
        bgColor = '#059669'; // Green: Value tier
      } else if (comp.price > p75Price) {
        bgColor = '#7c3aed'; // Purple: Premium tier
      }

      const customIcon = L.divIcon({
        className: 'custom-comp-marker',
        html: `
          <div style="
            background-color: ${bgColor};
            color: #ffffff;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 11px;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 9999px;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transform: translate(-50%, -50%);
          ">
            $${comp.price}
          </div>
        `,
        iconSize: [44, 24],
        iconAnchor: [22, 12],
      });

      const marker = L.marker([comp.latitude, comp.longitude], { icon: customIcon });
      marker.on('click', () => setSelectedComp(comp));
      marker.addTo(map);
      markers.push(marker);
    });

    leafletMapRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.15));
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [mapEngine, comps, p25Price, p75Price, center]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-800 rounded-lg">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Geographic Comp Distribution</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Compass className="w-3 h-3" />
                Google Maps Platform
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Interactive map of</span>
              <strong className="text-slate-800 font-mono">{comps.length}</strong>
              <span>comps in {analysis.intake.neighborhood}</span>
              <SourceLink
                variant="subtle"
                onClick={handleSourceClick}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          {/* Map Type / Engine controls */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-[11px]">
            <button
              onClick={() => {
                setMapEngine('google');
                setGoogleMapType('roadmap');
              }}
              className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                mapEngine === 'google' && googleMapType === 'roadmap'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Roadmap
            </button>
            <button
              onClick={() => {
                setMapEngine('google');
                setGoogleMapType('hybrid');
              }}
              className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                mapEngine === 'google' && googleMapType === 'hybrid'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapEngine('leaflet')}
              className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                mapEngine === 'leaflet'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              CARTO
            </button>
          </div>

          <button
            onClick={handleResetView}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition cursor-pointer border border-slate-200"
            title="Recenter and fit all comps into view"
          >
            <RefreshCw className="w-3 h-3 text-slate-500" />
            <span>Fit All</span>
          </button>
          <SourceLink onClick={handleSourceClick} />
        </div>
      </div>

      {/* Price Legend with Source links beside every tier */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 py-2.5 px-3 bg-slate-50 border-b border-slate-100 text-xs text-slate-600">
        <span className="font-semibold text-slate-800 flex items-center gap-1 text-[11px]">
          <Layers className="w-3.5 h-3.5 text-slate-500" /> Price Tiers:
        </span>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block shrink-0" />
          <span>Value Tier (&lt; ${p25Price})</span>
          <SourceLink
            variant="subtle"
            onClick={() => onOpenSource(buildSourceData(analysis, 'p25_price'))}
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-700 inline-block shrink-0" />
          <span>Core Market (${p25Price} – ${p75Price})</span>
          <SourceLink
            variant="subtle"
            onClick={() => onOpenSource(buildSourceData(analysis, 'iqr_band'))}
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-purple-600 inline-block shrink-0" />
          <span>Premium Tier (&gt; ${p75Price})</span>
          <SourceLink
            variant="subtle"
            onClick={() => onOpenSource(buildSourceData(analysis, 'p75_price'))}
          />
        </div>
      </div>

      {/* Map Canvas Container */}
      <div className="relative w-full h-[460px] rounded-b-lg overflow-hidden border border-slate-200 z-0 bg-slate-100">
        {mapEngine === 'google' ? (
          <APIProvider apiKey={apiKey} libraries={['marker']}>
            <Map
              mapId="DEMO_MAP_ID"
              mapTypeId={googleMapType}
              defaultCenter={center}
              defaultZoom={14}
              gestureHandling="greedy"
              disableDefaultUI={false}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
            >
              <MapBoundsFitter comps={comps} trigger={fitTrigger} />

              {/* Advanced Markers for each comp with custom price badges */}
              {comps.map((comp) => {
                let badgeColor = 'bg-blue-700 hover:bg-blue-800 text-white border-white';
                if (comp.price < p25Price) {
                  badgeColor = 'bg-emerald-600 hover:bg-emerald-700 text-white border-white';
                } else if (comp.price > p75Price) {
                  badgeColor = 'bg-purple-700 hover:bg-purple-800 text-white border-white';
                }

                const isSelected = selectedComp?.id === comp.id;

                return (
                  <AdvancedMarker
                    key={comp.id}
                    position={{ lat: comp.latitude, lng: comp.longitude }}
                    onClick={() => setSelectedComp(comp)}
                    title={`#${comp.id} - $${comp.price}/night - ${comp.property_type}`}
                  >
                    <div
                      className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border-2 shadow-md cursor-pointer transition transform ${badgeColor} ${
                        isSelected ? 'scale-125 ring-2 ring-amber-400 z-50' : 'hover:scale-110'
                      }`}
                    >
                      ${comp.price}
                    </div>
                  </AdvancedMarker>
                );
              })}

              {/* Info Window for selected comp */}
              {selectedComp && (
                <InfoWindow
                  position={{ lat: selectedComp.latitude, lng: selectedComp.longitude }}
                  onCloseClick={() => setSelectedComp(null)}
                  maxWidth={300}
                >
                  <div className="p-1 font-sans text-slate-800">
                    <div className="flex items-baseline justify-between border-b border-slate-200 pb-1.5 mb-2">
                      <div className="text-base font-extrabold text-slate-900">
                        ${selectedComp.price}
                        <span className="text-xs font-normal text-slate-500"> / night</span>
                      </div>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                        #{selectedComp.id}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-900 mb-1 flex items-center gap-1">
                      <Home className="w-3.5 h-3.5 text-slate-500" />
                      {selectedComp.property_type}
                    </div>

                    <div className="text-[11px] text-slate-600 mb-2">
                      {selectedComp.bedrooms === 0 ? 'Studio' : `${selectedComp.bedrooms} BR`} •{' '}
                      {selectedComp.bathrooms} BA • Accommodates {selectedComp.accommodates}
                    </div>

                    <div className="bg-slate-50 p-2 rounded border border-slate-100 text-[11px] space-y-1 mb-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Rating:</span>
                        <span className="font-bold text-amber-700">
                          {selectedComp.review_scores_rating.toFixed(2)} ★ ({selectedComp.number_of_reviews_ltm} reviews LTM)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Est. Occupancy:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedComp.estimated_occupancy_l365d} nights/year
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Est. Revenue:</span>
                        <span className="font-bold font-mono text-emerald-700">
                          ${(selectedComp.price * selectedComp.estimated_occupancy_l365d).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 text-[10px]">
                      {selectedComp.is_condo && (
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">Condo</span>
                      )}
                      {selectedComp.has_washer && (
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">Washer</span>
                      )}
                      {selectedComp.has_parking && (
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">Parking</span>
                      )}
                      {selectedComp.has_workspace && (
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">Workspace</span>
                      )}
                      {selectedComp.has_license && (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          DC License
                        </span>
                      )}
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        ) : (
          <div ref={leafletContainerRef} className="w-full h-full min-h-[460px]" />
        )}
      </div>

      {/* Map Footer Note */}
      <div className="mt-2.5 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <span>Click any price badge on the Google Map to inspect full listing specifications and revenue metrics.</span>
        <div className="flex items-center gap-2">
          <span>Powered by Google Maps Platform (Maps JavaScript API &amp; Advanced Markers)</span>
          <SourceLink onClick={handleSourceClick} />
        </div>
      </div>
    </div>
  );
};

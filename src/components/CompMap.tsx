import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { CompAnalysisResult, SourceInspectorData, Listing } from '../types/listing';
import { buildSourceData } from '../utils/analytics';
import { SourceLink } from './SourceLink';
import { MapPin, Layers, RefreshCw, Home, ShieldCheck } from 'lucide-react';

interface CompMapProps {
  analysis: CompAnalysisResult;
  onOpenSource: (data: SourceInspectorData) => void;
}

type TileStyle = 'osm' | 'osm-hot' | 'opentopo';

const TILE_LAYERS: Record<TileStyle, { name: string; url: string; attribution: string; maxZoom: number }> = {
  osm: {
    name: 'OpenStreetMap Standard',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  'osm-hot': {
    name: 'Humanitarian OSM',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors, Tiles courtesy of Humanitarian OpenStreetMap Team',
    maxZoom: 19,
  },
  opentopo: {
    name: 'OpenTopoMap',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors, &copy; <a href="https://opentopomap.org" target="_blank" rel="noopener noreferrer">OpenTopoMap</a>',
    maxZoom: 17,
  },
};

export const CompMap: React.FC<CompMapProps> = ({ analysis, onOpenSource }) => {
  const { comps, p25Price, p75Price } = analysis;

  // Selected comp for popup info
  const [selectedComp, setSelectedComp] = useState<Listing | null>(null);

  // Active OpenStreetMap tile style (Default to OpenStreetMap Standard - 100% free, no key required)
  const [tileStyle, setTileStyle] = useState<TileStyle>('osm');

  // Leaflet DOM ref and instance refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Compute centroid of comps or DC center (38.9072, -77.0369)
  const center = useMemo(() => {
    if (comps.length === 0) {
      return { lat: 38.9072, lng: -77.0369 };
    }
    const lat = comps.reduce((acc, c) => acc + c.latitude, 0) / comps.length;
    const lng = comps.reduce((acc, c) => acc + c.longitude, 0) / comps.length;
    return { lat, lng };
  }, [comps]);

  const handleSourceClick = () => {
    onOpenSource(buildSourceData(analysis, 'comp_count'));
  };

  const handleResetView = () => {
    if (leafletMapRef.current && comps.length > 0) {
      const markers = comps.map((c) => L.marker([c.latitude, c.longitude]));
      const group = L.featureGroup(markers);
      leafletMapRef.current.fitBounds(group.getBounds().pad(0.15));
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    const activeTile = TILE_LAYERS[tileStyle];
    const tileLayer = L.tileLayer(activeTile.url, {
      maxZoom: activeTile.maxZoom,
      attribution: activeTile.attribution,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    leafletMapRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update tile layer when tileStyle changes
  useEffect(() => {
    if (!leafletMapRef.current) return;
    if (tileLayerRef.current) {
      leafletMapRef.current.removeLayer(tileLayerRef.current);
    }
    const activeTile = TILE_LAYERS[tileStyle];
    const newTileLayer = L.tileLayer(activeTile.url, {
      maxZoom: activeTile.maxZoom,
      attribution: activeTile.attribution,
    }).addTo(leafletMapRef.current);
    tileLayerRef.current = newTileLayer;
  }, [tileStyle]);

  // Update comp markers when comps or selectedComp changes
  useEffect(() => {
    if (!leafletMapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    const markers: L.Marker[] = [];

    comps.forEach((comp) => {
      let bgColor = '#1877A3'; // Ocean Blue: Core market
      if (comp.price < p25Price) {
        bgColor = '#39B8A2'; // Fresh Teal: Value tier
      } else if (comp.price > p75Price) {
        bgColor = '#E76F51'; // Terracotta: Premium tier
      }

      const isSelected = selectedComp?.id === comp.id;

      const customIcon = L.divIcon({
        className: 'custom-comp-marker',
        html: `
          <div style="
            background-color: ${bgColor};
            color: #ffffff;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 9.5px;
            font-weight: 700;
            line-height: 1;
            padding: 2px 4.5px;
            border-radius: 9999px;
            border: ${isSelected ? '2px solid #FFF8F3' : '1px solid #ffffff'};
            box-shadow: ${isSelected ? '0 0 0 2px #E76F51, 0 3px 6px rgba(31,52,66,0.4)' : '0 1px 3px rgba(31, 52, 66, 0.3)'};
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transform: translate(-50%, -50%) ${isSelected ? 'scale(1.25)' : 'scale(1)'};
            transition: transform 0.15s ease-in-out;
          ">
            $${comp.price}
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([comp.latitude, comp.longitude], { icon: customIcon });

      marker.on('click', () => {
        setSelectedComp(comp);
      });

      // Bind detailed popup
      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 2px; min-width: 200px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #EFE3D8; padding-bottom: 6px; margin-bottom: 6px;">
            <div style="font-size: 16px; font-weight: 800; color: #1F3442;">
              $${comp.price} <span style="font-size: 11px; font-weight: normal; color: #4B6375;">/ night</span>
            </div>
            <span style="font-size: 10px; font-weight: 700; background-color: #D8EEF5; color: #1877A3; padding: 1px 6px; border-radius: 4px;">#${comp.id}</span>
          </div>

          <div style="font-size: 12px; font-weight: 700; color: #1877A3; margin-bottom: 2px;">
            ${comp.property_type}
          </div>
          <div style="font-size: 11px; color: #4B6375; margin-bottom: 6px;">
            ${comp.bedrooms === 0 ? 'Studio' : `${comp.bedrooms} BR`} • ${comp.bathrooms} BA • Accommodates ${comp.accommodates}
          </div>

          <div style="background-color: #FFF8F3; padding: 6px; border-radius: 6px; border: 1px solid #EFE3D8; font-size: 11px; margin-bottom: 6px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #4B6375;">Rating:</span>
              <span style="font-weight: 700; color: #E76F51;">${comp.review_scores_rating.toFixed(2)} ★ (${comp.number_of_reviews_ltm} LTM)</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #4B6375;">Est. Occupancy:</span>
              <span style="font-weight: 600; color: #1F3442;">${comp.estimated_occupancy_l365d} nights/yr</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #4B6375;">Est. Annual Gross:</span>
              <span style="font-weight: 700; color: #39B8A2;">$${(comp.price * comp.estimated_occupancy_l365d).toLocaleString()}</span>
            </div>
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 4px; font-size: 10px;">
            ${comp.is_condo ? '<span style="background-color: #D8EEF5; color: #1877A3; padding: 1px 5px; border-radius: 3px;">Condo</span>' : ''}
            ${comp.has_washer ? '<span style="background-color: #D8EEF5; color: #1877A3; padding: 1px 5px; border-radius: 3px;">Washer</span>' : ''}
            ${comp.has_parking ? '<span style="background-color: #D8EEF5; color: #1877A3; padding: 1px 5px; border-radius: 3px;">Parking</span>' : ''}
            ${comp.has_workspace ? '<span style="background-color: #D8EEF5; color: #1877A3; padding: 1px 5px; border-radius: 3px;">Workspace</span>' : ''}
            ${comp.has_license ? '<span style="background-color: #D8EEF5; color: #1877A3; border: 1px solid #BBE0EC; padding: 1px 5px; border-radius: 3px; font-weight: 600;">✓ DC Licensed</span>' : ''}
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml, { maxWidth: 260, closeButton: false });

      markersLayerRef.current?.addLayer(marker);
      markers.push(marker);
    });

    if (markers.length > 0 && leafletMapRef.current) {
      const group = L.featureGroup(markers);
      leafletMapRef.current.fitBounds(group.getBounds().pad(0.15));
    }
  }, [comps, p25Price, p75Price, selectedComp]);

  return (
    <div className="bg-white rounded-xl border border-[#EFE3D8] shadow-xs p-5 flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#EFE3D8] gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#D8EEF5] text-[#1877A3] rounded-lg">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-[#1877A3]">Geographic Comp Distribution</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#D8EEF5] text-[#1877A3] border border-[#BBE0EC]">
                <Layers className="w-3 h-3 text-[#1877A3]" />
                Leaflet &amp; OpenStreetMap
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#4B6375]">
              <span>Interactive map of</span>
              <strong className="text-[#1F3442] font-mono">{comps.length}</strong>
              <span>comps in {analysis.intake.neighborhood}</span>
              <SourceLink
                variant="subtle"
                onClick={handleSourceClick}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          {/* Tile Layer switcher */}
          <div className="inline-flex rounded-lg border border-[#EFE3D8] bg-[#FFF8F3] p-0.5 text-[11px]">
            <button
              onClick={() => setTileStyle('osm')}
              className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                tileStyle === 'osm'
                  ? 'bg-[#1877A3] text-white shadow-2xs font-semibold'
                  : 'text-[#1F3442] hover:text-[#1877A3]'
              }`}
              title="Official OpenStreetMap Standard tile server"
            >
              OSM Standard
            </button>
            <button
              onClick={() => setTileStyle('osm-hot')}
              className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                tileStyle === 'osm-hot'
                  ? 'bg-[#1877A3] text-white shadow-2xs font-semibold'
                  : 'text-[#1F3442] hover:text-[#1877A3]'
              }`}
              title="Humanitarian OpenStreetMap Team high-contrast style"
            >
              Humanitarian
            </button>
            <button
              onClick={() => setTileStyle('opentopo')}
              className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                tileStyle === 'opentopo'
                  ? 'bg-[#1877A3] text-white shadow-2xs font-semibold'
                  : 'text-[#1F3442] hover:text-[#1877A3]'
              }`}
              title="OpenTopoMap topographic elevation layer"
            >
              Topographic
            </button>
          </div>

          <button
            onClick={handleResetView}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1F3442] bg-[#D8EEF5]/60 hover:bg-[#D8EEF5] px-2.5 py-1 rounded-md transition cursor-pointer border border-[#BBE0EC]"
            title="Recenter and fit all comps into view"
          >
            <RefreshCw className="w-3 h-3 text-[#1877A3]" />
            <span>Fit All</span>
          </button>
          <SourceLink onClick={handleSourceClick} />
        </div>
      </div>

      {/* Price Legend with Source links beside every tier */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 py-2.5 px-3 bg-[#D8EEF5]/25 border-b border-[#BBE0EC] text-xs text-[#1F3442]">
        <span className="font-semibold text-[#1877A3] flex items-center gap-1 text-[11px]">
          <Layers className="w-3.5 h-3.5 text-[#1877A3]" /> Price Tiers:
        </span>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-[#39B8A2] inline-block shrink-0" />
          <span>Value Tier (&lt; ${p25Price})</span>
          <SourceLink
            variant="subtle"
            onClick={() => onOpenSource(buildSourceData(analysis, 'p25_price'))}
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-[#1877A3] inline-block shrink-0" />
          <span>Core Market (${p25Price} – ${p75Price})</span>
          <SourceLink
            variant="subtle"
            onClick={() => onOpenSource(buildSourceData(analysis, 'iqr_band'))}
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-[#E76F51] inline-block shrink-0" />
          <span>Premium Tier (&gt; ${p75Price})</span>
          <SourceLink
            variant="subtle"
            onClick={() => onOpenSource(buildSourceData(analysis, 'p75_price'))}
          />
        </div>
      </div>

      {/* Map Canvas Container */}
      <div className="relative w-full h-[460px] rounded-b-lg overflow-hidden border border-[#EFE3D8] z-0 bg-[#FFF8F3]">
        <div ref={mapContainerRef} className="w-full h-full min-h-[460px] z-0" />
      </div>

      {/* Map Footer Note */}
      <div className="mt-2.5 text-[11px] text-[#4B6375] flex flex-wrap items-center justify-between gap-2">
        <span>Click any price badge on the map to inspect full listing specifications and revenue metrics.</span>
        <div className="flex items-center gap-2">
          <span>Powered by Open-Source Leaflet &amp; OpenStreetMap</span>
          <SourceLink onClick={handleSourceClick} />
        </div>
      </div>
    </div>
  );
};

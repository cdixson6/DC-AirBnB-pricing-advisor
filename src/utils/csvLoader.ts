import Papa from 'papaparse';
import { Listing } from '../types/listing';

function parseBoolean(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return s === 't' || s === 'true' || s === '1' || s === 'yes';
  }
  return false;
}

function parseNumber(val: any, fallback = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (typeof val === 'string') {
    // Strip dollar signs, commas, whitespace
    const clean = val.replace(/[\$,]/g, '').trim();
    const num = parseFloat(clean);
    return isNaN(num) ? fallback : num;
  }
  return fallback;
}

export function parseCsvRows(rawRows: any[]): Listing[] {
  const listings: Listing[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || (!row.id && !row.price && !row.neighbourhood_cleansed)) continue;

    const id = String(row.id || `row-${i + 1}`);
    const neighbourhood = String(row.neighbourhood_cleansed || '').trim();
    if (!neighbourhood) continue;

    const price = parseNumber(row.price, 0);
    if (price <= 0) continue; // Skip unpriced / invalid listings

    const bedrooms = parseNumber(row.bedrooms, 1);
    const bathrooms = parseNumber(row.bathrooms, 1);
    const accommodates = parseNumber(row.accommodates, 2);
    const latitude = parseNumber(row.latitude, 38.9072);
    const longitude = parseNumber(row.longitude, -77.0369);
    const occupancy = parseNumber(row.estimated_occupancy_l365d, 120);
    const revenue = parseNumber(row.estimated_revenue_l365d, price * occupancy);

    listings.push({
      id,
      neighbourhood_cleansed: neighbourhood,
      latitude,
      longitude,
      property_type: String(row.property_type || 'Entire rental unit').trim(),
      room_type: String(row.room_type || 'Entire home/apt').trim(),
      accommodates,
      bedrooms,
      bathrooms,
      price,
      number_of_reviews_ltm: parseNumber(row.number_of_reviews_ltm, 0),
      review_scores_rating: parseNumber(row.review_scores_rating, 4.8),
      estimated_occupancy_l365d: occupancy,
      estimated_revenue_l365d: revenue,
      has_license: parseBoolean(row.has_license),
      is_entire_home: parseBoolean(row.is_entire_home),
      is_condo: parseBoolean(row.is_condo),
      has_washer: parseBoolean(row.has_washer),
      has_parking: parseBoolean(row.has_parking),
      has_workspace: parseBoolean(row.has_workspace),
      has_ac: parseBoolean(row.has_ac),
      has_self_checkin: parseBoolean(row.has_self_checkin),
      has_wifi: parseBoolean(row.has_wifi),
      snapshot_date: String(row.snapshot_date || '2024-09-22').trim(),
    });
  }

  return listings;
}

export async function loadDefaultCsv(): Promise<{ listings: Listing[]; snapshotDate: string; totalRows: number }> {
  // Try fetching /data/dc_listings_clean.csv (served from public/data or server route)
  const response = await fetch('/data/dc_listings_clean.csv');
  if (!response.ok) {
    throw new Error(`Failed to load /data/dc_listings_clean.csv (HTTP ${response.status})`);
  }

  const csvText = await response.text();
  return parseCsvString(csvText);
}

export function parseCsvString(csvText: string): Promise<{ listings: Listing[]; snapshotDate: string; totalRows: number }> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      complete: (results) => {
        try {
          const listings = parseCsvRows(results.data);
          const snapshotDate = listings[0]?.snapshot_date || '2024-09-22';
          resolve({
            listings,
            snapshotDate,
            totalRows: listings.length,
          });
        } catch (err) {
          reject(err);
        }
      },
      error: (err: any) => {
        reject(err);
      },
    });
  });
}

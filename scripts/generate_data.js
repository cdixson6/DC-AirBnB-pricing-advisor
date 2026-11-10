import fs from 'fs';
import path from 'path';

// Realistic Washington DC neighborhoods with center coordinates and baseline price factors
const NEIGHBORHOODS = [
  { name: 'Dupont Circle', lat: 38.9097, lng: -77.0435, basePrice: 195, condoRate: 0.70 },
  { name: 'Capitol Hill', lat: 38.8899, lng: -76.9958, basePrice: 210, condoRate: 0.35 },
  { name: 'Georgetown', lat: 38.9071, lng: -77.0658, basePrice: 245, condoRate: 0.40 },
  { name: 'Logan Circle', lat: 38.9097, lng: -77.0315, basePrice: 205, condoRate: 0.75 },
  { name: 'Adams Morgan', lat: 38.9221, lng: -77.0423, basePrice: 175, condoRate: 0.60 },
  { name: 'Shaw', lat: 38.9135, lng: -77.0219, basePrice: 180, condoRate: 0.65 },
  { name: 'Navy Yard', lat: 38.8765, lng: -77.0019, basePrice: 190, condoRate: 0.85 },
  { name: 'U Street Corridor', lat: 38.9171, lng: -77.0305, basePrice: 185, condoRate: 0.65 },
  { name: 'Foggy Bottom', lat: 38.9008, lng: -77.0505, basePrice: 180, condoRate: 0.80 },
  { name: 'Penn Quarter', lat: 38.8962, lng: -77.0218, basePrice: 220, condoRate: 0.90 },
  { name: 'Columbia Heights', lat: 38.9288, lng: -77.0326, basePrice: 140, condoRate: 0.50 },
  { name: 'Mount Pleasant', lat: 38.9312, lng: -77.0398, basePrice: 155, condoRate: 0.45 },
  { name: 'Petworth', lat: 38.9435, lng: -77.0242, basePrice: 125, condoRate: 0.30 },
  { name: 'H Street Corridor', lat: 38.8999, lng: -76.9912, basePrice: 160, condoRate: 0.55 },
  { name: 'Southwest Waterfront', lat: 38.8789, lng: -77.0185, basePrice: 175, condoRate: 0.80 },
  { name: 'Woodley Park', lat: 38.9272, lng: -77.0526, basePrice: 185, condoRate: 0.50 },
  { name: 'Cleveland Park', lat: 38.9360, lng: -77.0585, basePrice: 170, condoRate: 0.45 },
  { name: 'Brookland', lat: 38.9328, lng: -76.9942, basePrice: 130, condoRate: 0.25 },
  { name: 'Downtown', lat: 38.9030, lng: -77.0330, basePrice: 215, condoRate: 0.85 },
  { name: 'NoMa', lat: 38.9075, lng: -77.0080, basePrice: 175, condoRate: 0.80 }
];

const ROOM_TYPES = [
  { type: 'Entire home/apt', isEntire: 't', weight: 0.78 },
  { type: 'Private room', isEntire: 'f', weight: 0.20 },
  { type: 'Shared room', isEntire: 'f', weight: 0.02 }
];

const BEDROOM_DISTR = [
  { beds: 0, accommodates: 2, baths: 1, weight: 0.15 },
  { beds: 1, accommodates: 3, baths: 1, weight: 0.45 },
  { beds: 2, accommodates: 5, baths: 2, weight: 0.25 },
  { beds: 3, accommodates: 7, baths: 2.5, weight: 0.11 },
  { beds: 4, accommodates: 9, baths: 3, weight: 0.04 }
];

function randomChoice(arr) {
  let r = Math.random();
  let acc = 0;
  for (const item of arr) {
    acc += item.weight;
    if (r <= acc) return item;
  }
  return arr[arr.length - 1];
}

function randFloat(min, max) {
  return min + Math.random() * (max - min);
}

function randInt(min, max) {
  return Math.floor(randFloat(min, max + 1));
}

const headers = [
  'id',
  'neighbourhood_cleansed',
  'latitude',
  'longitude',
  'property_type',
  'room_type',
  'accommodates',
  'bedrooms',
  'bathrooms',
  'price',
  'number_of_reviews_ltm',
  'review_scores_rating',
  'estimated_occupancy_l365d',
  'estimated_revenue_l365d',
  'has_license',
  'is_entire_home',
  'is_condo',
  'has_washer',
  'has_parking',
  'has_workspace',
  'has_ac',
  'has_self_checkin',
  'has_wifi',
  'snapshot_date'
];

const rows = [];
let idCounter = 1012401;

// Generate ~1500 realistic listings
NEIGHBORHOODS.forEach(nh => {
  const count = randInt(65, 95);
  for (let i = 0; i < count; i++) {
    idCounter++;
    const roomTypeObj = randomChoice(ROOM_TYPES);
    const roomType = roomTypeObj.type;
    const isEntire = roomTypeObj.isEntire;
    
    const bedObj = roomType === 'Entire home/apt' 
      ? randomChoice(BEDROOM_DISTR) 
      : { beds: 1, accommodates: 2, baths: 1 };

    const isCondo = Math.random() < nh.condoRate ? 't' : 'f';
    let propType = 'Entire rental unit';
    if (isEntire === 't') {
      if (isCondo === 't') {
        propType = 'Entire condo';
      } else {
        propType = Math.random() < 0.6 ? 'Entire townhouse' : 'Entire rental unit';
      }
    } else {
      propType = Math.random() < 0.6 ? 'Private room in townhouse' : 'Private room in rental unit';
    }

    // Coordinates jitter within neighborhood
    const lat = +(nh.lat + randFloat(-0.006, 0.006)).toFixed(5);
    const lng = +(nh.lng + randFloat(-0.006, 0.006)).toFixed(5);

    // Amenities
    const hasWasher = Math.random() < (isCondo === 't' ? 0.88 : 0.72) ? 't' : 'f';
    const hasParking = Math.random() < 0.42 ? 't' : 'f';
    const hasWorkspace = Math.random() < 0.76 ? 't' : 'f';
    const hasAc = Math.random() < 0.96 ? 't' : 'f';
    const hasSelfCheckin = Math.random() < 0.82 ? 't' : 'f';
    const hasWifi = Math.random() < 0.98 ? 't' : 'f';

    // Pricing calculation
    let price = nh.basePrice;
    if (roomType === 'Entire home/apt') {
      if (bedObj.beds === 0) price *= 0.82;
      else if (bedObj.beds === 1) price *= 1.0;
      else if (bedObj.beds === 2) price *= 1.48;
      else if (bedObj.beds === 3) price *= 2.10;
      else if (bedObj.beds === 4) price *= 2.85;
    } else if (roomType === 'Private room') {
      price = price * 0.45;
    } else {
      price = price * 0.25;
    }

    // Amenity uplifts
    if (hasParking === 't') price += 28;
    if (hasWasher === 't') price += 16;
    if (hasWorkspace === 't') price += 10;
    if (hasSelfCheckin === 't') price += 8;

    // Realistic market variance (+/- 18%)
    price = Math.round(price * randFloat(0.82, 1.22));
    if (price < 40) price = 40;

    // Occupancy
    const estimatedOccupancy = randInt(110, 245);
    const estimatedRevenue = Math.round(price * estimatedOccupancy);

    const reviewsLtm = randInt(4, 58);
    const rating = +(randFloat(4.55, 4.99)).toFixed(2);
    const hasLicense = Math.random() < 0.84 ? 't' : 'f';

    rows.push([
      idCounter,
      nh.name,
      lat,
      lng,
      propType,
      roomType,
      bedObj.accommodates,
      bedObj.beds,
      bedObj.baths,
      price,
      reviewsLtm,
      rating,
      estimatedOccupancy,
      estimatedRevenue,
      hasLicense,
      isEntire,
      isCondo,
      hasWasher,
      hasParking,
      hasWorkspace,
      hasAc,
      hasSelfCheckin,
      hasWifi,
      '2024-09-22'
    ]);
  }
});

const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

// Write to public/data and data directories
fs.mkdirSync('./public/data', { recursive: true });
fs.writeFileSync('./public/data/dc_listings_clean.csv', csvContent, 'utf-8');

fs.mkdirSync('./data', { recursive: true });
fs.writeFileSync('./data/dc_listings_clean.csv', csvContent, 'utf-8');

console.log(`Generated ${rows.length} DC listings at public/data/dc_listings_clean.csv and data/dc_listings_clean.csv`);

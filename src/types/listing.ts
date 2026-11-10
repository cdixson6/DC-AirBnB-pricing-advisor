export interface Listing {
  id: string;
  neighbourhood_cleansed: string;
  latitude: number;
  longitude: number;
  property_type: string;
  room_type: string;
  accommodates: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
  number_of_reviews_ltm: number;
  review_scores_rating: number;
  estimated_occupancy_l365d: number;
  estimated_revenue_l365d: number;
  has_license: boolean;
  is_entire_home: boolean;
  is_condo: boolean;
  has_washer: boolean;
  has_parking: boolean;
  has_workspace: boolean;
  has_ac: boolean;
  has_self_checkin: boolean;
  has_wifi: boolean;
  snapshot_date: string;
}

export interface PropertyIntake {
  neighborhood: string;
  roomType: string;
  bedrooms: number;
  bathrooms: number;
  accommodates: number;
  isCondo: boolean;
  hasWasher: boolean;
  hasParking: boolean;
  hasWorkspace: boolean;
  hasAc: boolean;
  hasSelfCheckin: boolean;
  ownerLivesThere: boolean; // "Will the owner live there during stays?"
}

export interface AmenityUplift {
  key: keyof Pick<Listing, 'has_washer' | 'has_parking' | 'has_workspace' | 'has_ac' | 'has_self_checkin' | 'has_wifi'>;
  label: string;
  hasAmenityCount: number;
  withoutAmenityCount: number;
  hasAmenityMedianPrice: number | null;
  withoutAmenityMedianPrice: number | null;
  dollarDiff: number | null;
  percentDiff: number | null;
  eligible: boolean; // true if both groups have >= 5 comps
  propertyHasIt: boolean;
}

export interface CompAnalysisResult {
  intake: PropertyIntake;
  totalDatasetRows: number;
  snapshotDate: string;
  comps: Listing[];
  compCount: number;
  condoFilterApplied: boolean;
  condoCompsCount: number;
  condoThresholdMet: boolean;
  filterExplanation: string;
  
  // Price stats
  recommendedPrice: number; // Median
  p25Price: number; // 25th percentile
  p75Price: number; // 75th percentile
  minPrice: number;
  maxPrice: number;
  avgPrice: number;

  // Occupancy stats
  medianOccupancy: number; // median estimated_occupancy_l365d
  p25Occupancy: number;
  p75Occupancy: number;

  // Revenue stats
  projectedAnnualRevenue: number; // recommendedPrice * medianOccupancy
  isOwnerAbsent: boolean;
  dcCapNights: number; // 90
  cappedAnnualRevenue: number; // recommendedPrice * Math.min(medianOccupancy, 90)
  revenueReductionFromCap: number;

  // Rating & Review stats
  avgRating: number;
  avgReviewsLtm: number;

  // Amenities uplifts
  amenityUplifts: AmenityUplift[];

  // Price buckets for histogram
  histogramBuckets: {
    min: number;
    max: number;
    label: string;
    count: number;
    listingIds: string[];
  }[];
}

export type SourceMetricType =
  | 'recommended_price'
  | 'p25_price'
  | 'p75_price'
  | 'iqr_band'
  | 'annual_revenue'
  | 'capped_revenue'
  | 'revenue_reduction'
  | 'occupancy'
  | 'comp_count'
  | 'avg_rating'
  | 'avg_reviews'
  | 'min_price'
  | 'max_price'
  | 'histogram_bucket'
  | 'amenity_uplift'
  | 'amenity_with_count'
  | 'amenity_without_count'
  | 'amenity_with_price'
  | 'amenity_without_price'
  | 'preview_count';

export interface SourceInspectorData {
  title: string;
  valueDescription: string;
  metricValue: string | number;
  formula: string;
  filtersUsed: {
    label: string;
    value: string;
  }[];
  compCount: number;
  comps: Listing[];
  highlightCompIds?: string[];
  suggestedFilename?: string;
}

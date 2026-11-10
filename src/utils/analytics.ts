import { Listing, PropertyIntake, CompAnalysisResult, AmenityUplift, SourceInspectorData } from '../types/listing';

export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

export function calculatePercentile(numbers: number[], percentile: number): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return Math.round(sorted[lower] * (1 - weight) + sorted[upper] * weight);
}

export function analyzeComps(
  dataset: Listing[],
  intake: PropertyIntake,
  snapshotDate: string
): CompAnalysisResult {
  // Step 1: Base filter by neighbourhood, room_type, and bedrooms
  const baseCandidates = dataset.filter(
    (item) =>
      item.neighbourhood_cleansed.toLowerCase() === intake.neighborhood.toLowerCase() &&
      item.room_type.toLowerCase() === intake.roomType.toLowerCase() &&
      Number(item.bedrooms) === Number(intake.bedrooms)
  );

  let comps: Listing[] = [];
  let condoFilterApplied = false;
  let condoCompsCount = 0;
  let condoThresholdMet = false;
  let filterExplanation = '';

  const condoCandidates = baseCandidates.filter((item) => item.is_condo);
  condoCompsCount = condoCandidates.length;

  if (intake.isCondo) {
    if (condoCandidates.length >= 15) {
      comps = condoCandidates;
      condoFilterApplied = true;
      condoThresholdMet = true;
      filterExplanation = `Condo-only filter applied (${condoCandidates.length} comps met the 15+ threshold)`;
    } else {
      comps = baseCandidates;
      condoFilterApplied = false;
      condoThresholdMet = false;
      filterExplanation = `All property types included (${baseCandidates.length} total comps; condo sample was ${condoCandidates.length}, which is below the 15-comp threshold)`;
    }
  } else {
    comps = baseCandidates;
    condoFilterApplied = false;
    condoThresholdMet = false;
    filterExplanation = `All property types matching ${intake.neighborhood}, ${intake.roomType}, ${intake.bedrooms}BR (${baseCandidates.length} comps)`;
  }

  // Fallback: If comps is empty (e.g. user selected custom combination with 0 matches),
  // gracefully fall back to same neighborhood and room type or overall neighborhood
  if (comps.length === 0) {
    comps = dataset.filter(
      (item) =>
        item.neighbourhood_cleansed.toLowerCase() === intake.neighborhood.toLowerCase() &&
        item.room_type.toLowerCase() === intake.roomType.toLowerCase()
    );
    filterExplanation = `Broadened filter: same neighborhood & room type (0 comps matched strict bedroom criteria)`;
  }
  if (comps.length === 0) {
    comps = dataset.filter(
      (item) => item.neighbourhood_cleansed.toLowerCase() === intake.neighborhood.toLowerCase()
    );
    filterExplanation = `Broadened filter: entire ${intake.neighborhood} neighborhood (0 comps matched strict criteria)`;
  }
  if (comps.length === 0) {
    comps = dataset.slice(0, 50);
    filterExplanation = `District-wide sample (no exact neighborhood matches found in dataset)`;
  }

  const prices = comps.map((c) => c.price);
  const occupancies = comps.map((c) => c.estimated_occupancy_l365d);

  const recommendedPrice = Math.round(calculateMedian(prices));
  const p25Price = calculatePercentile(prices, 25);
  const p75Price = calculatePercentile(prices, 75);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);

  const medianOccupancy = Math.round(calculateMedian(occupancies));
  const p25Occupancy = calculatePercentile(occupancies, 25);
  const p75Occupancy = calculatePercentile(occupancies, 75);

  const projectedAnnualRevenue = Math.round(recommendedPrice * medianOccupancy);
  const dcCapNights = 90;
  const isOwnerAbsent = !intake.ownerLivesThere;
  const cappedAnnualRevenue = Math.round(recommendedPrice * Math.min(medianOccupancy, dcCapNights));
  const revenueReductionFromCap = Math.max(0, projectedAnnualRevenue - cappedAnnualRevenue);

  const ratings = comps.map((c) => c.review_scores_rating).filter((r) => r > 0);
  const avgRating = ratings.length > 0 ? +(ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(2) : 4.8;
  const avgReviewsLtm = Math.round(comps.reduce((s, c) => s + c.number_of_reviews_ltm, 0) / comps.length);

  // Amenity uplifts: calculate median price with vs without amenity
  // Requirement: show only when each group has 5+ comps
  const amenityDefs: { key: AmenityUplift['key']; label: string; intakeValue: boolean }[] = [
    { key: 'has_washer', label: 'In-Unit Washer / Dryer', intakeValue: intake.hasWasher },
    { key: 'has_parking', label: 'Dedicated Parking Space', intakeValue: intake.hasParking },
    { key: 'has_workspace', label: 'Dedicated Workspace', intakeValue: intake.hasWorkspace },
    { key: 'has_ac', label: 'Air Conditioning', intakeValue: intake.hasAc },
    { key: 'has_self_checkin', label: 'Self Check-in Keypad/Lockbox', intakeValue: intake.hasSelfCheckin },
    { key: 'has_wifi', label: 'High-Speed Wi-Fi', intakeValue: true },
  ];

  const amenityUplifts: AmenityUplift[] = amenityDefs.map((amenity) => {
    const withComps = comps.filter((c) => c[amenity.key] === true);
    const withoutComps = comps.filter((c) => c[amenity.key] === false);

    const hasAmenityCount = withComps.length;
    const withoutAmenityCount = withoutComps.length;
    const eligible = hasAmenityCount >= 5 && withoutAmenityCount >= 5;

    let hasAmenityMedianPrice: number | null = null;
    let withoutAmenityMedianPrice: number | null = null;
    let dollarDiff: number | null = null;
    let percentDiff: number | null = null;

    if (eligible) {
      hasAmenityMedianPrice = Math.round(calculateMedian(withComps.map((c) => c.price)));
      withoutAmenityMedianPrice = Math.round(calculateMedian(withoutComps.map((c) => c.price)));
      dollarDiff = hasAmenityMedianPrice - withoutAmenityMedianPrice;
      if (withoutAmenityMedianPrice > 0) {
        percentDiff = +(((dollarDiff / withoutAmenityMedianPrice) * 100)).toFixed(1);
      }
    }

    return {
      key: amenity.key,
      label: amenity.label,
      hasAmenityCount,
      withoutAmenityCount,
      hasAmenityMedianPrice,
      withoutAmenityMedianPrice,
      dollarDiff,
      percentDiff,
      eligible,
      propertyHasIt: amenity.intakeValue,
    };
  });

  // Price distribution histogram buckets (7 buckets across range)
  const sortedPrices = [...prices].sort((a, b) => a - b);
  const minP = sortedPrices[0] || 50;
  const maxP = sortedPrices[sortedPrices.length - 1] || 350;
  const bucketCount = 7;
  const rawStep = (maxP - minP) / bucketCount;
  const step = Math.max(10, Math.ceil(rawStep / 5) * 5); // Round to nearest $5

  const histogramBuckets = [];
  for (let i = 0; i < bucketCount; i++) {
    const bMin = Math.round(minP + i * step);
    const bMax = i === bucketCount - 1 ? maxP + 1 : Math.round(bMin + step);
    const matchingComps = comps.filter(
      (c) => c.price >= bMin && (i === bucketCount - 1 ? c.price <= bMax : c.price < bMax)
    );
    histogramBuckets.push({
      min: bMin,
      max: bMax,
      label: `$${bMin}–$${bMax}`,
      count: matchingComps.length,
      listingIds: matchingComps.map((c) => c.id),
    });
  }

  return {
    intake,
    totalDatasetRows: dataset.length,
    snapshotDate,
    comps,
    compCount: comps.length,
    condoFilterApplied,
    condoCompsCount,
    condoThresholdMet,
    filterExplanation,
    recommendedPrice,
    p25Price,
    p75Price,
    minPrice,
    maxPrice,
    avgPrice,
    medianOccupancy,
    p25Occupancy,
    p75Occupancy,
    projectedAnnualRevenue,
    isOwnerAbsent,
    dcCapNights,
    cappedAnnualRevenue,
    revenueReductionFromCap,
    avgRating,
    avgReviewsLtm,
    amenityUplifts,
    histogramBuckets,
  };
}

export function buildSourceData(
  analysis: CompAnalysisResult,
  metricType: import('../types/listing').SourceMetricType,
  extraContext?: {
    amenityKey?: string;
    bucketIndex?: number;
    customTitle?: string;
    customValue?: string | number;
    customFormula?: string;
  }
): SourceInspectorData {
  const commonFilters = [
    { label: 'Neighbourhood', value: analysis.intake.neighborhood },
    { label: 'Room Type', value: analysis.intake.roomType },
    { label: 'Bedrooms', value: `${analysis.intake.bedrooms} BR` },
    { label: 'Condo Filter', value: analysis.filterExplanation },
    { label: 'Owner Status', value: analysis.intake.ownerLivesThere ? 'Owner lives on-site (Hosted)' : 'Owner absent (Vacation Rental)' },
  ];

  const sanitizedNh = analysis.intake.neighborhood.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const baseFilename = `dc_comps_${sanitizedNh}_${analysis.intake.bedrooms}br`;

  switch (metricType) {
    case 'recommended_price':
      return {
        title: 'Recommended Nightly Price ($ / night)',
        valueDescription: 'Median Nightly Rate of Filtered Comps',
        metricValue: `$${analysis.recommendedPrice}`,
        formula: 'Median = middle value of sorted comp prices array. If even N, average of two middle values.',
        filtersUsed: commonFilters,
        compCount: analysis.compCount,
        comps: analysis.comps,
        suggestedFilename: `${baseFilename}_median_rate.csv`,
      };

    case 'p25_price':
      return {
        title: '25th Percentile Nightly Rate (Conservative)',
        valueDescription: 'Lower Quartile of Comp Set Nightly Rates',
        metricValue: `$${analysis.p25Price}`,
        formula: '25th percentile (Q1) = value at 25% rank in sorted comp prices array. Interpolated if fractional index.',
        filtersUsed: commonFilters,
        compCount: analysis.compCount,
        comps: analysis.comps,
        suggestedFilename: `${baseFilename}_p25_rate.csv`,
      };

    case 'p75_price':
      return {
        title: '75th Percentile Nightly Rate (Premium / Peak)',
        valueDescription: 'Upper Quartile of Comp Set Nightly Rates',
        metricValue: `$${analysis.p75Price}`,
        formula: '75th percentile (Q3) = value at 75% rank in sorted comp prices array. Interpolated if fractional index.',
        filtersUsed: commonFilters,
        compCount: analysis.compCount,
        comps: analysis.comps,
        suggestedFilename: `${baseFilename}_p75_rate.csv`,
      };

    case 'iqr_band':
      return {
        title: 'Competitive Band (25th – 75th Percentile Range)',
        valueDescription: 'Interquartile Range (IQR) containing the middle 50% of the market',
        metricValue: `$${analysis.p25Price} – $${analysis.p75Price}`,
        formula: `Spread: $${analysis.p75Price - analysis.p25Price} / night. Q1 ($${analysis.p25Price}) to Q3 ($${analysis.p75Price}) calculated from sorted comp price distribution.`,
        filtersUsed: commonFilters,
        compCount: analysis.compCount,
        comps: analysis.comps,
        suggestedFilename: `${baseFilename}_competitive_band.csv`,
      };

    case 'annual_revenue':
      return {
        title: 'Projected Annual Revenue (Full Hosted Year)',
        valueDescription: 'Recommended Price × Median Annual Occupancy Days',
        metricValue: `$${analysis.projectedAnnualRevenue.toLocaleString()}`,
        formula: `$${analysis.recommendedPrice} (recommended nightly rate) × ${analysis.medianOccupancy} days (median comp estimated_occupancy_l365d) = $${analysis.projectedAnnualRevenue.toLocaleString()}`,
        filtersUsed: commonFilters,
        compCount: analysis.compCount,
        comps: analysis.comps,
        suggestedFilename: `${baseFilename}_projected_revenue.csv`,
      };

    case 'capped_revenue':
      return {
        title: 'DC Vacation-Rental Cap (Owner Absent: 90 Nights/Year)',
        valueDescription: 'Recommended Price × Math.min(Median Occupancy, 90 Nights)',
        metricValue: `$${analysis.cappedAnnualRevenue.toLocaleString()}`,
        formula: `$${analysis.recommendedPrice} × Math.min(${analysis.medianOccupancy}, 90) = $${analysis.cappedAnnualRevenue.toLocaleString()} (DC Short-Term Rental Act statutory maximum for unhosted properties)`,
        filtersUsed: commonFilters,
        compCount: analysis.compCount,
        comps: analysis.comps,
        suggestedFilename: `${baseFilename}_capped_revenue_90nights.csv`,
      };

    case 'revenue_reduction':
      return {
        title: 'Revenue Reduction Due to DC 90-Night Unhosted Cap',
        valueDescription: 'Opportunity Cost of Owner Absence vs. Full Occupancy',
        metricValue: `-$${analysis.revenueReductionFromCap.toLocaleString()}`,
        formula: `$${analysis.projectedAnnualRevenue.toLocaleString()} (Full Occupancy Revenue) - $${analysis.cappedAnnualRevenue.toLocaleString()} (Capped 90-Night Revenue) = -$${analysis.revenueReductionFromCap.toLocaleString()}`,
        filtersUsed: commonFilters,
        compCount: analysis.compCount,
        comps: analysis.comps,
        suggestedFilename: `${baseFilename}_cap_revenue_reduction.csv`,
      };

    case 'occupancy':
      return {
        title: 'Estimated Annual Occupancy (Nights / Year)',
        valueDescription: 'Median of estimated_occupancy_l365d across Comp Set',
        metricValue: `${analysis.medianOccupancy} nights/yr`,
        formula: 'Median of estimated_occupancy_l365d column across all matching comps in the dataset.',
        filtersUsed: commonFilters,
        compCount: analysis.compCount,
        comps: analysis.comps,
        suggestedFilename: `${baseFilename}_occupancy_comps.csv`,
      };

    case 'comp_count':
      return {
        title: 'Active Comp Set Size',
        valueDescription: 'Total Number of Matching Listings in Dataset',
        metricValue: `${analysis.compCount} comps`,
        formula: 'COUNT(*) WHERE neighbourhood_cleansed = selected AND room_type = selected AND bedrooms = selected [AND is_condo = true IF >= 15]',
        filtersUsed: commonFilters,
        compCount: analysis.compCount,
        comps: analysis.comps,
        suggestedFilename: `${baseFilename}_all_comps.csv`,
      };

    case 'avg_rating':
      return {
        title: 'Average Review Rating',
        valueDescription: 'Mean of review_scores_rating across active comps',
        metricValue: `${analysis.avgRating}★`,
        formula: 'Sum(review_scores_rating) / Count(comps with review scores).',
        filtersUsed: commonFilters,
        compCount: analysis.compCount,
        comps: analysis.comps,
        suggestedFilename: `${baseFilename}_ratings_comps.csv`,
      };

    case 'avg_reviews':
      return {
        title: 'Average Reviews in Last 12 Months',
        valueDescription: 'Mean of number_of_reviews_ltm across active comps',
        metricValue: `${analysis.avgReviewsLtm} reviews`,
        formula: 'Sum(number_of_reviews_ltm) / Count(comps).',
        filtersUsed: commonFilters,
        compCount: analysis.compCount,
        comps: analysis.comps,
        suggestedFilename: `${baseFilename}_reviews_ltm_comps.csv`,
      };

    case 'min_price':
      return {
        title: 'Minimum Comp Price',
        valueDescription: 'Lowest nightly price recorded in comp set',
        metricValue: `$${analysis.minPrice}`,
        formula: 'MIN(price) across all matching comps.',
        filtersUsed: commonFilters,
        compCount: analysis.compCount,
        comps: analysis.comps,
        suggestedFilename: `${baseFilename}_min_price.csv`,
      };

    case 'max_price':
      return {
        title: 'Maximum Comp Price',
        valueDescription: 'Highest nightly price recorded in comp set',
        metricValue: `$${analysis.maxPrice}`,
        formula: 'MAX(price) across all matching comps.',
        filtersUsed: commonFilters,
        compCount: analysis.compCount,
        comps: analysis.comps,
        suggestedFilename: `${baseFilename}_max_price.csv`,
      };

    case 'histogram_bucket': {
      const idx = extraContext?.bucketIndex ?? 0;
      const b = analysis.histogramBuckets[idx] || analysis.histogramBuckets[0];
      const bucketComps = analysis.comps.filter((c) => b.listingIds.includes(c.id));
      return {
        title: `Price Histogram Bucket: ${b.label}`,
        valueDescription: `Listings priced between $${b.min} and $${b.max}`,
        metricValue: `${b.count} listings`,
        formula: `COUNT(*) WHERE price >= $${b.min} AND price < $${b.max}`,
        filtersUsed: [
          ...commonFilters,
          { label: 'Bucket Price Window', value: `$${b.min} to $${b.max}` },
        ],
        compCount: bucketComps.length,
        comps: bucketComps,
        suggestedFilename: `${baseFilename}_bucket_${b.min}_${b.max}.csv`,
      };
    }

    case 'amenity_uplift': {
      const uplift = analysis.amenityUplifts.find((u) => u.key === extraContext?.amenityKey) || analysis.amenityUplifts[0];
      return {
        title: `Amenity Uplift Analysis: ${uplift.label}`,
        valueDescription: `Median price with amenity ($${uplift.hasAmenityMedianPrice || 0}) vs without amenity ($${uplift.withoutAmenityMedianPrice || 0})`,
        metricValue: uplift.eligible
          ? uplift.dollarDiff && uplift.dollarDiff >= 0
            ? `+$${uplift.dollarDiff}/night (+${uplift.percentDiff}%)`
            : `-$${Math.abs(uplift.dollarDiff || 0)}/night`
          : 'Inconclusive (<5 comps in group)',
        formula: `Uplift = MedianPrice(comps with ${uplift.label}) - MedianPrice(comps without ${uplift.label}). Requires at least 5 comps in each group. With count = ${uplift.hasAmenityCount}, Without count = ${uplift.withoutAmenityCount}.`,
        filtersUsed: [
          ...commonFilters,
          { label: 'Comps With Amenity', value: `${uplift.hasAmenityCount} listings` },
          { label: 'Comps Without Amenity', value: `${uplift.withoutAmenityCount} listings` },
        ],
        compCount: analysis.compCount,
        comps: analysis.comps,
        suggestedFilename: `${baseFilename}_amenity_${uplift.key}.csv`,
      };
    }

    case 'amenity_with_count': {
      const uplift = analysis.amenityUplifts.find((u) => u.key === extraContext?.amenityKey) || analysis.amenityUplifts[0];
      const withComps = analysis.comps.filter((c) => c[uplift.key] === true);
      return {
        title: `Comps Equipped With ${uplift.label}`,
        valueDescription: `Count of comps containing ${uplift.label}`,
        metricValue: `${uplift.hasAmenityCount} comps`,
        formula: `COUNT(*) WHERE ${uplift.key} = true across the comp set.`,
        filtersUsed: [
          ...commonFilters,
          { label: 'Amenity Condition', value: `${uplift.label} = YES` },
        ],
        compCount: withComps.length,
        comps: withComps,
        suggestedFilename: `${baseFilename}_with_${uplift.key}.csv`,
      };
    }

    case 'amenity_without_count': {
      const uplift = analysis.amenityUplifts.find((u) => u.key === extraContext?.amenityKey) || analysis.amenityUplifts[0];
      const withoutComps = analysis.comps.filter((c) => c[uplift.key] === false);
      return {
        title: `Comps Without ${uplift.label}`,
        valueDescription: `Count of comps lacking ${uplift.label}`,
        metricValue: `${uplift.withoutAmenityCount} comps`,
        formula: `COUNT(*) WHERE ${uplift.key} = false across the comp set.`,
        filtersUsed: [
          ...commonFilters,
          { label: 'Amenity Condition', value: `${uplift.label} = NO` },
        ],
        compCount: withoutComps.length,
        comps: withoutComps,
        suggestedFilename: `${baseFilename}_without_${uplift.key}.csv`,
      };
    }

    case 'amenity_with_price': {
      const uplift = analysis.amenityUplifts.find((u) => u.key === extraContext?.amenityKey) || analysis.amenityUplifts[0];
      const withComps = analysis.comps.filter((c) => c[uplift.key] === true);
      return {
        title: `Median Price for Comps With ${uplift.label}`,
        valueDescription: `Median rate for listings offering ${uplift.label}`,
        metricValue: `$${uplift.hasAmenityMedianPrice || 0}/night`,
        formula: `Median price of the ${uplift.hasAmenityCount} comps having ${uplift.label}.`,
        filtersUsed: [
          ...commonFilters,
          { label: 'Amenity Condition', value: `${uplift.label} = YES` },
        ],
        compCount: withComps.length,
        comps: withComps,
        suggestedFilename: `${baseFilename}_rate_with_${uplift.key}.csv`,
      };
    }

    case 'amenity_without_price': {
      const uplift = analysis.amenityUplifts.find((u) => u.key === extraContext?.amenityKey) || analysis.amenityUplifts[0];
      const withoutComps = analysis.comps.filter((c) => c[uplift.key] === false);
      return {
        title: `Median Price for Comps Without ${uplift.label}`,
        valueDescription: `Median rate for listings lacking ${uplift.label}`,
        metricValue: `$${uplift.withoutAmenityMedianPrice || 0}/night`,
        formula: `Median price of the ${uplift.withoutAmenityCount} comps lacking ${uplift.label}.`,
        filtersUsed: [
          ...commonFilters,
          { label: 'Amenity Condition', value: `${uplift.label} = NO` },
        ],
        compCount: withoutComps.length,
        comps: withoutComps,
        suggestedFilename: `${baseFilename}_rate_without_${uplift.key}.csv`,
      };
    }

    case 'preview_count':
      return {
        title: 'Intake Benchmark Candidates',
        valueDescription: 'Total Matching Listings Before Full Analysis',
        metricValue: extraContext?.customValue || `${analysis.compCount} comps`,
        formula: 'COUNT(*) WHERE neighbourhood_cleansed = selected AND room_type = selected AND bedrooms = selected',
        filtersUsed: commonFilters,
        compCount: analysis.compCount,
        comps: analysis.comps,
        suggestedFilename: `${baseFilename}_preview_comps.csv`,
      };

    default:
      return {
        title: extraContext?.customTitle || 'Calculated Metric Audit',
        valueDescription: 'Verified Pure Math Result',
        metricValue: extraContext?.customValue ?? 'N/A',
        formula: extraContext?.customFormula || 'Derived from active comp dataset.',
        filtersUsed: commonFilters,
        compCount: analysis.compCount,
        comps: analysis.comps,
        suggestedFilename: `${baseFilename}_comps.csv`,
      };
  }
}

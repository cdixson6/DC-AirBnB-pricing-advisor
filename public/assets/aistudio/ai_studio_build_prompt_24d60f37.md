# Google AI Studio — first Build-mode prompt

Paste this into AI Studio's Build mode as the first message, then upload `dc_listings_clean.csv`
and ask it to place the file at `/data/dc_listings_clean.csv`. Build in small steps after this:
get the comp filter and price card right before adding charts, the map, or the Gemini memo.

---

Build a React + TypeScript web app called **"DC Airbnb Pricing Advisor"** for a Washington, DC
property management firm. Advisors use it with homeowners who are deciding whether to list a
property on Airbnb and what to charge.

## Data
- The only data source is `/data/dc_listings_clean.csv` (Inside Airbnb, Washington DC, CC BY 4.0).
  Load it at startup with PapaParse. Columns include: id, neighbourhood_cleansed, latitude,
  longitude, property_type, room_type, accommodates, bedrooms, bathrooms, price,
  number_of_reviews_ltm, review_scores_rating, estimated_occupancy_l365d,
  estimated_revenue_l365d, has_license, is_entire_home, is_condo, has_washer, has_parking,
  has_workspace, has_ac, has_self_checkin, has_wifi, snapshot_date.
- Also allow the user to upload a replacement CSV with the same columns.

## Hard rule on numbers
- Every price, count, percentage, or estimate shown must be computed in TypeScript from the CSV.
- The Gemini model must NEVER produce or estimate a number. When calling Gemini, send it only the
  computed results as JSON, with this system instruction: "You explain pricing results to a
  property owner. Use only the numbers in the JSON provided. Do not add, estimate, or round any
  number differently. If something is not in the JSON, say it is not in the data."
- Every number on screen has a small "Source" link that opens a panel showing: the filters used,
  the number of comps, the formula, and the list of comp listing ids with their prices.

## Screen 1 — Property intake
Fields: neighborhood (dropdown of unique neighbourhood_cleansed values), room type, bedrooms,
bathrooms, guests, condo yes/no, amenities checkboxes (washer, parking, workspace, AC,
self check-in), and "Will the owner live there during stays?" (yes / no).

## Screen 2 — Recommendation
1. Comp set: same neighborhood, same room type, same bedrooms; condo only if that leaves 15+ rows,
   otherwise all property types (tell the user which was used). Show the comp count.
2. Price card: recommended nightly price = median comp price; also show 25th–75th percentile.
3. Revenue card: annual revenue = recommended price x median comp estimated_occupancy_l365d.
   If the owner will NOT live there, also show revenue capped at 90 nights per year, and label it
   "DC vacation-rental cap (owner absent): 90 nights/year".
4. Price distribution histogram of comp prices with the recommendation marked.
5. Amenity uplift chart: for each amenity, median price of comps with vs. without it
   (show only when each group has 5+ comps).
6. Map of comps (Leaflet + OpenStreetMap tiles), colored by price.
7. "Owner memo" button: Gemini writes a short plain-English summary from the computed JSON.
8. Compliance checklist (static text, not AI-generated): primary residence required,
   short-term rental license, condo association allows STRs, 90-night cap if owner absent.

## Footer
"Data: Inside Airbnb, Washington, D.C., snapshot {snapshot_date}, CC BY 4.0 — insideairbnb.com.
{row count} active listings after cleaning."

## Style
Clean, professional, high-contrast; a navy and white palette; cards with large numbers;
works on a laptop and on a phone.

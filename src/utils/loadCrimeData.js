import { useEffect, useState } from "react";

// API-only hook for Chicago Data Portal (Socrata SODA or v3 views)
// Usage examples:
//   useCrimeData({ apiUrl: "https://data.cityofchicago.org/resource/ijzp-q8t2.json?..." })
//   useCrimeData("https://data.cityofchicago.org/resource/ijzp-q8t2.json?...")
const useCrimeData = (arg = {}) => {
  // Normalize options; allow passing a URL string directly
  const opts = typeof arg === "string" ? { apiUrl: arg } : (arg || {});

  const {
    apiUrl,
    limit,
    startYear = 2015,
    endYear = 2025,
    appToken, // Optional Socrata app token
    perYearLimit, // Sample size per year when querying SODA; unset = no $limit
  } = opts;

  const [crimeData, setCrimeData] = useState([]);
  const [series, setSeries] = useState([]);
  const [topLocations, setTopLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFromApi = async (url) => {
      // Attach Socrata app token if provided
      let finalUrl = url;
      try {
        const u = new URL(url);
        if (appToken && /(^|\.)data\.cityofchicago\.org$/i.test(u.hostname)) {
          if (!u.searchParams.has("$$app_token")) {
            u.searchParams.set("$$app_token", appToken);
          }
        }
        finalUrl = u.toString();
      } catch (_) {
        // If URL constructor fails, fallback to original string
        finalUrl = url;
      }

      // Special case: If using SODA resource endpoint, fetch per-year samples to avoid a single year dominating the $limit
      try {
        const u = new URL(finalUrl);
        const match = u.pathname.match(/\/resource\/([a-z0-9\-]+)\.json$/i);
        const isSoda = /(^|\.)data\.cityofchicago\.org$/i.test(u.hostname) && !!match;
        if (isSoda && startYear && endYear) {
          const rid = match[1];
          const base = new URL(`https://data.cityofchicago.org/resource/${rid}.json`);

          // 1) Top 10 categories for the whole range
          const topUrl = new URL(base);
          topUrl.searchParams.set("$select", "primary_type, count(1) as c");
          topUrl.searchParams.set("$where", `year between ${startYear} and ${endYear}`);
          topUrl.searchParams.set("$group", "primary_type");
          topUrl.searchParams.set("$order", "c desc");
          topUrl.searchParams.set("$limit", "10");
          if (appToken) topUrl.searchParams.set("$$app_token", appToken);
          const topRes = await fetch(topUrl, { mode: "cors" });
          if (!topRes.ok) throw new Error(`Top categories fetch failed: ${topRes.status}`);
          const topJson = await topRes.json();
          let topCategories = (topJson || []).map((r) => r.primary_type).filter(Boolean);
          // Ensure exactly 10 with HOMICIDE included by replacing the last if needed
          const upperSet = new Set(topCategories.map((t) => String(t).toUpperCase()));
          if (!upperSet.has("HOMICIDE")) {
            if (topCategories.length >= 10) topCategories = topCategories.slice(0, 9);
            topCategories.push("HOMICIDE");
          }

          // 2) Aggregated series for charts
          const seriesUrl = new URL(base);
          seriesUrl.searchParams.set("$select", "year, primary_type, count(1) as c");
          seriesUrl.searchParams.set("$where", `year between ${startYear} and ${endYear}` + (topCategories.length ? ` AND primary_type in(${topCategories.map((t) => `'${t.replace(/'/g, "''")}'`).join(",")})` : ""));
          seriesUrl.searchParams.set("$group", "year, primary_type");
          seriesUrl.searchParams.set("$order", "year, primary_type");
          if (appToken) seriesUrl.searchParams.set("$$app_token", appToken);
          const seriesRes = await fetch(seriesUrl, { mode: "cors" });
          if (!seriesRes.ok) throw new Error(`Series fetch failed: ${seriesRes.status}`);
          const seriesJson = await seriesRes.json();
          setSeries(Array.isArray(seriesJson) ? seriesJson : []);

          // 3) Top locations for donut
          const locUrl = new URL(base);
          locUrl.searchParams.set("$select", "location_description, count(1) as c");
          locUrl.searchParams.set("$where", `year between ${startYear} and ${endYear}`);
          locUrl.searchParams.set("$group", "location_description");
          locUrl.searchParams.set("$order", "c desc");
          locUrl.searchParams.set("$limit", "10");
          if (appToken) locUrl.searchParams.set("$$app_token", appToken);
          const locRes = await fetch(locUrl, { mode: "cors" });
          if (!locRes.ok) throw new Error(`Locations fetch failed: ${locRes.status}`);
          const locJson = await locRes.json();
          setTopLocations(Array.isArray(locJson) ? locJson : []);

          // 4) Map points per-year (only top categories, with coords)
          const reqs = [];
          for (let y = startYear; y <= endYear; y += 1) {
            const p = new URL(base);
            p.searchParams.set("$select", [
              "primary_type",
              "year",
              "location_description",
              "latitude",
              "longitude",
              "location",
            ].join(","));
            const whereParts = [
              `year=${y}`,
              "latitude is not null",
              "longitude is not null",
              topCategories.length ? `primary_type in(${topCategories.map((t) => `'${t.replace(/'/g, "''")}'`).join(",")})` : null,
            ].filter(Boolean);
            p.searchParams.set("$where", whereParts.join(" AND "));
            if (Number.isFinite(perYearLimit)) {
              p.searchParams.set("$limit", String(perYearLimit));
            }
            if (appToken) p.searchParams.set("$$app_token", appToken);
            reqs.push(fetch(p.toString(), { mode: "cors" }).then((r) => {
              if (!r.ok) throw new Error(`SODA year ${y} failed: ${r.status}`);
              return r.json();
            }));
          }
          const merged = (await Promise.all(reqs)).flat();
          return merged.map((obj) => {
            const locObj = obj.location || {};
            const lat = obj.latitude ?? locObj.latitude;
            const lon = obj.longitude ?? locObj.longitude;
            return {
              year: obj.year ? parseInt(obj.year) : null,
              crimeType: obj.primary_type || obj.primaryType || "Unknown",
              location: obj.location_description || obj.locationDescription || "Unknown",
              latitude: lat != null ? parseFloat(lat) : null,
              longitude: lon != null ? parseFloat(lon) : null,
            };
          });
        }
      } catch (e) {
        console.warn("Per-year SODA sampling not applied:", e);
      }

      console.log("Fetching API:", finalUrl);
      let response = await fetch(finalUrl, { mode: "cors" });
      if (response.status === 403 && /\/api\/v3\/views\//.test(url)) {
        // Fallback: convert v3 views URL to SODA resource endpoint using view id
        const m = url.match(/\/api\/v3\/views\/(.*?)\//);
        const viewId = m && m[1];
        if (viewId) {
          const soda = new URL(`https://data.cityofchicago.org/resource/${viewId}.json`);
          // Limit fields to reduce payload; still filter client-side
          soda.searchParams.set("$select", [
            "primary_type",
            "year",
            "location_description",
            "latitude",
            "longitude",
            "location"
          ].join(","));
          soda.searchParams.set("$where", `year between ${startYear} and ${endYear}`);
          if (Number.isFinite(limit)) {
            soda.searchParams.set("$limit", String(limit));
          }
          if (appToken) soda.searchParams.set("$$app_token", appToken);
          finalUrl = soda.toString();
          console.log("Retrying via SODA resource:", finalUrl);
          response = await fetch(finalUrl, { mode: "cors" });
        }
      }
      if (!response.ok) {
        throw new Error(`Failed to fetch API: ${response.status} ${response.statusText}`);
      }
      const json = await response.json();

      // Two possible shapes: SODA resource (array of objects) or Socrata view (meta+data arrays)
      let rows = [];
      if (Array.isArray(json)) {
        // SODA resource endpoint shape: array of objects
        rows = json.map((obj) => {
          const locObj = obj.location || {};
          const lat = obj.latitude ?? locObj.latitude;
          const lon = obj.longitude ?? locObj.longitude;
          return {
            year: obj.year ? parseInt(obj.year) : null,
            crimeType: obj.primary_type || obj.primaryType || "Unknown",
            location: obj.location_description || obj.locationDescription || "Unknown",
            latitude: lat != null ? parseFloat(lat) : null,
            longitude: lon != null ? parseFloat(lon) : null,
          };
        });
      } else if (json && json.meta && json.data && Array.isArray(json.data)) {
        // Socrata views/query shape
        const cols = json.meta.view?.columns || [];
        const indexByKey = {};
        cols.forEach((c, i) => {
          const key1 = (c.fieldName || "").toLowerCase();
          const key2 = (c.name || "").toLowerCase();
          if (key1) indexByKey[key1] = i;
          if (key2 && indexByKey[key2] == null) indexByKey[key2] = i;
        });
        const iYear = indexByKey["year"];
        const iPrimary = indexByKey["primary_type"] ?? indexByKey["primary type"];
        const iLocDesc = indexByKey["location_description"] ?? indexByKey["location description"];
        const iLat = indexByKey["latitude"];
        const iLon = indexByKey["longitude"];
        const iLoc = indexByKey["location"];

        rows = json.data.map((row) => {
          let lat = iLat != null ? row[iLat] : null;
          let lon = iLon != null ? row[iLon] : null;
          if ((lat == null || lon == null) && iLoc != null && row[iLoc] != null) {
            const locVal = row[iLoc];
            if (typeof locVal === "object") {
              // Could be { latitude, longitude } or { coordinates: [lon, lat] }
              if (locVal.latitude != null && locVal.longitude != null) {
                lat = locVal.latitude;
                lon = locVal.longitude;
              } else if (Array.isArray(locVal.coordinates) && locVal.coordinates.length >= 2) {
                lon = locVal.coordinates[0];
                lat = locVal.coordinates[1];
              }
            } else if (typeof locVal === "string") {
              const matches = locVal.match(/-?\d+\.\d+/g);
              if (matches && matches.length >= 2) {
                lon = matches[0];
                lat = matches[1];
              }
            }
          }
          return {
            year: iYear != null ? (row[iYear] != null ? parseInt(row[iYear]) : null) : null,
            crimeType: iPrimary != null ? (row[iPrimary] ?? "Unknown") : "Unknown",
            location: iLocDesc != null ? (row[iLocDesc] ?? "Unknown") : "Unknown",
            latitude: lat != null ? parseFloat(lat) : null,
            longitude: lon != null ? parseFloat(lon) : null,
          };
        });
      } else {
        throw new Error("Unexpected API response shape");
      }

      // Filter and limit
      // Build top categories from the already filtered year range to avoid skew
      const filteredByYear = rows.filter(
        (d) => d.year && d.year >= startYear && d.year <= endYear
      );

      const categoryCounts = {};
      filteredByYear.forEach((d) => {
        const key = d.crimeType || "Unknown";
        categoryCounts[key] = (categoryCounts[key] || 0) + 1;
      });
      const sorted = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
      let topList = sorted.slice(0, 10).map(([k]) => k);
      const hasHomicide = new Set(topList.map((t) => String(t).toUpperCase())).has("HOMICIDE");
      if (!hasHomicide) {
        if (topList.length >= 10) topList = topList.slice(0, 9);
        topList.push("HOMICIDE");
      }
      const topCategories = new Set(topList);

      const formatted = filteredByYear
        .filter((d) =>
          topCategories.has(d.crimeType) && d.latitude != null && d.longitude != null
        );

      return formatted;
    };

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        let result = [];
        if (apiUrl) {
          result = await fetchFromApi(apiUrl);
        } else {
          throw new Error("No data source provided: set apiUrl");
        }
        console.log("Processed Top 10 Crime Data:", result);
        setCrimeData(result);
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [apiUrl, limit, startYear, endYear, appToken, perYearLimit]);

  return { crimeData, loading, error, series, topLocations };
};

export default useCrimeData;

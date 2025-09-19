import React, { useState } from "react";

const CRIME_SYNONYMS = {
  homicide: "HOMICIDE",
  murder: "HOMICIDE",
  robbery: "ROBBERY",
  robberies: "ROBBERY",
  theft: "THEFT",
  larceny: "THEFT",
  burglary: "BURGLARY",
  assault: "ASSAULT",
  battery: "BATTERY",
  "criminal damage": "CRIMINAL DAMAGE",
  narcotics: "NARCOTICS",
  weapons: "WEAPONS VIOLATION",
};

function parseQueryToFilters(text) {
  const q = (text || "").trim();
  if (!q) return { whereExtra: "" };

  const tokens = q.toLowerCase();
  const clauses = [];

  const mRange = tokens.match(/\b(20\d{2})\s*[-to]+\s*(20\d{2})\b/);
  if (mRange) {
    const y1 = parseInt(mRange[1], 10);
    const y2 = parseInt(mRange[2], 10);
    if (!Number.isNaN(y1) && !Number.isNaN(y2)) clauses.push(`year between ${Math.min(y1, y2)} and ${Math.max(y1, y2)}`);
  } else {
    const mYear = tokens.match(/\b(20\d{2})\b/);
    if (mYear) {
      const y = parseInt(mYear[1], 10);
      if (!Number.isNaN(y)) clauses.push(`year=${y}`);
    }
  }

  const matchedTypes = new Set();
  Object.keys(CRIME_SYNONYMS).forEach((k) => { if (tokens.includes(k)) matchedTypes.add(CRIME_SYNONYMS[k]); });
  if (matchedTypes.size > 0) {
    const list = [...matchedTypes].map((t) => `'${t.replace(/'/g, "''")}'`).join(",");
    clauses.push(`primary_type in(${list})`);
  }

  const locMatch = tokens.match(/\b(?:at|in|near)\s+([^,.;]+)$/);
  if (locMatch) {
    const phrase = locMatch[1].trim().replace(/'/g, "''");
    if (phrase && phrase.length >= 3) clauses.push(`location_description like '%${phrase.toUpperCase()}%'`);
  }

  return { whereExtra: clauses.join(" AND ") };
}

const NaturalQuery = ({ onChange }) => {
  const [query, setQuery] = useState("");
  const handleSubmit = (e) => { e.preventDefault(); const { whereExtra } = parseQueryToFilters(query); onChange?.({ query, whereExtra }); };
  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, alignItems: "center", margin: "8px 0 12px" }}>
      <span style={{ color: "#e5e7eb", fontSize: 12, whiteSpace: "nowrap" }}>Ask:</span>
      <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. homicide 2022 near downtown; robbery 2019-2021 at gas station" style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #888", background: "#fff", color: "#111" }} />
      <button type="submit" style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #666", background: "#111", color: "#fff", cursor: "pointer" }}>Apply</button>
    </form>
  );
};

export default NaturalQuery;


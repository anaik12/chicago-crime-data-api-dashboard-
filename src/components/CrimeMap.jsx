import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import MarkerClusterGroup from "react-leaflet-markercluster";
import L from "leaflet";
import * as d3 from "d3";

const scheme = d3.schemeObservable10 || d3.schemeTableau10 || d3.schemeCategory10;
const colorScale = d3.scaleOrdinal(scheme);

// const getMarkerIcon = (crimeType) => {
//   const color = colorScale(crimeType) || "blue";
//   return new L.Icon({
//     iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
//     iconSize: [25, 41],
//     iconAnchor: [12, 41],
//     popupAnchor: [1, -34]
//   });
// };


const getMarkerIcon = (crimeType) => {
  const color = colorScale(crimeType); // Get color from D3 scale
  return new L.DivIcon({
    html: `<div style='background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white;'>⚠</div>`,
    className: "custom-marker-icon",
    iconSize: [25, 25],
    iconAnchor: [15, 15],
    popupAnchor: [0, -12]
  });
};

const CrimeMap = ({ data = [] }) => {
  const [filter, setFilter] = useState({ year: "All", category: "All" });

  useEffect(() => {
    console.log("Crime Data in Map:", data);
  }, [data]);

  const handleFilterChange = (e) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

  const filteredData = data.filter((crime) => {
    const matchesYear = filter.year === "All" || (crime.year && parseInt(crime.year) === parseInt(filter.year));
    const matchesCategory = filter.category === "All" || (crime.crimeType && crime.crimeType === filter.category);
    return matchesYear && matchesCategory;
  });

  const uniqueYears = [...new Set(data.map((crime) => crime.year).filter(Boolean))];
  const uniqueCategories = [...new Set(data.map((crime) => crime.crimeType).filter(Boolean))];

  return (
    <div style={{ position: "relative" }}>
      <h2>Crime Distribution by Site</h2>
      {/* Filter Section Positioned on Top Right */}
      <div style={{ position: "absolute", top: "60px", right: "10px", background: "rgba(255, 255, 255, 0.9)", color: "#111", padding: "10px", borderRadius: "5px", zIndex: 1500, display: "flex", flexDirection: "column" }}>
        <h3>Filters</h3>
        <label>Year:</label>
        <select name="year" onChange={handleFilterChange} value={filter.year}>
          <option value="All">All</option>
          {uniqueYears.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        <label>Category:</label>
        <select name="category" onChange={handleFilterChange} value={filter.category}>
          <option value="All">All</option>
          {uniqueCategories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Map Section */}
      <MapContainer center={[41.8781, -87.6298]} zoom={11} style={{ height: "400px", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MarkerClusterGroup
          chunkedLoading
          showCoverageOnHover={true}
          maxClusterRadius={50}
          iconCreateFunction={(cluster) => {
            const count = cluster.getChildCount();
            return new L.DivIcon({
              html: `<div style='background-color: rgba(255,0,0,0.8); color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;'>${count}</div>`,
              className: "custom-cluster-icon",
              iconSize: [40, 40]
            });
          }}
        >
          {filteredData.map((crime, index) =>
            crime.latitude && crime.longitude ? (
              <Marker key={index} position={[crime.latitude, crime.longitude]} icon={getMarkerIcon(crime.crimeType)}>
                <Popup>
                  <strong>{crime.crimeType}</strong>
                  <br />
                  {crime.location}
                  <br />
                  Year: {crime.year}
                </Popup>
              </Marker>
            ) : null
          )}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

export default CrimeMap;

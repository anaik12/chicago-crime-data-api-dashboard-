import React, { useState } from "react";
import "./App.css";
import DonutChart from "./components/DonutChart";
// import BarChartComponent from "./components/BarChartComponent";
import CrimeMap from "./components/CrimeMap";
import useCrimeData from "./utils/loadCrimeData";
import StackedBarChart from "./components/StackedBarChart";
// import LineChart from "./components/LineChart";
import MultiLineChart from "./components/MultiLineChart";
import NaturalQuery from "./components/NaturalQuery";

function App() {
  // Dynamically compute last 15 full years
  const defaultEnd = new Date().getFullYear();
  const defaultStart = defaultEnd - 14;
  const [years, setYears] = useState({ start: defaultStart, end: defaultEnd });
  const [whereExtra, setWhereExtra] = useState("
  ");

  // Use SODA resource endpoint with optional Socrata app token to avoid 403s
  const { crimeData, loading, error, series, topLocations } = useCrimeData({
    apiUrl: `https://data.cityofchicago.org/resource/ijzp-q8t2.json`,
    startYear: years.start,
    endYear: years.end,
    perYearLimit: 5000,
    whereExtra,
    appToken: process.env.REACT_APP_SOCRATA_APP_TOKEN,
  });

  const handleNLChange = ({ query, whereExtra }) => {
    setWhereExtra(whereExtra || "");
    const m = (query || "").match(/\b(20\d{2})\s*[-to]+\s*(20\d{2})\b/);
    if (m) {
      const y1 = parseInt(m[1], 10);
      const y2 = parseInt(m[2], 10);
      if (!Number.isNaN(y1) && !Number.isNaN(y2)) {
        setYears({ start: Math.min(y1, y2), end: Math.max(y1, y2) });
      }
    } else {
      const y = (query || "").match(/\b(20\d{2})\b/);
      if (y) {
        const yy = parseInt(y[1], 10);
        if (!Number.isNaN(yy)) setYears({ start: yy, end: yy });
      }
    }
  };

  if (loading) return <h2>Loading data...</h2>;
  if (error) return <h2>Error loading data: {error}</h2>;

  return (
    <div className="container">
      <h1>Chicago Crime Data Dashboard</h1>
      <NaturalQuery onChange={handleNLChange} />

      <div className="charts-container">
        <div className="chart-item">
          <MultiLineChart data={crimeData} series={series} />
        </div>
        <div className="chart-item">
          <DonutChart data={crimeData} topLocations={topLocations} />
        </div>
        <div className="chart-item">
          <StackedBarChart data={crimeData} series={series} />
        </div>
        <div className="chart-item">
          <CrimeMap data={crimeData} />
        </div>
      </div> 
    </div>
  );
}

export default App;

import React from "react";
import "./App.css";
import DonutChart from "./components/DonutChart";
// import BarChartComponent from "./components/BarChartComponent";
import CrimeMap from "./components/CrimeMap";
import useCrimeData from "./utils/loadCrimeData";
import StackedBarChart from "./components/StackedBarChart";
// import LineChart from "./components/LineChart";
import MultiLineChart from "./components/MultiLineChart";

function App() {
  // Dynamically compute last 15 full years
  const endYear = new Date().getFullYear();
  const startYear = endYear - 14;

  // Use SODA resource endpoint with optional Socrata app token to avoid 403s
  const { crimeData, loading, error, series, topLocations } = useCrimeData({
    apiUrl: `https://data.cityofchicago.org/resource/ijzp-q8t2.json?$select=primary_type,year,location_description,latitude,longitude,location&$where=year between ${startYear} and ${endYear} AND latitude IS NOT NULL AND longitude IS NOT NULL`,
    startYear,
    endYear,
    perYearLimit: 5000,
    appToken: process.env.REACT_APP_SOCRATA_APP_TOKEN,
  });

  if (loading) return <h2>Loading data...</h2>;
  if (error) return <h2>Error loading data: {error}</h2>;

  return (
    <div className="container">
      <h1>Chicago Crime Data Dashboard</h1> 
      {/* <p>Total Records Loaded: {crimeData.length}</p> */}

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

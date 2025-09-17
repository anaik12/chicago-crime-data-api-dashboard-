import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as d3 from "d3";

const MultiLineChart = ({ data }) => {
  console.log("MultiLineChart Data:", data); // Debugging

  if (!data || data.length === 0) return <h3>No data available for Line Chart</h3>;

  const yearCategoryCounts = {};
  data.forEach(({ year, crimeType }) => {
    if (!yearCategoryCounts[year]) {
      yearCategoryCounts[year] = {};
    }
    yearCategoryCounts[year][crimeType] = (yearCategoryCounts[year][crimeType] || 0) + 1;
  });

  const formattedData = Object.entries(yearCategoryCounts).map(([year, categories]) => ({
    year,
    ...categories,
  }));

  const allCategories = [...new Set(data.map((d) => d.crimeType))];
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

  return (
    <div>
      <h2>Crime Trends by Year (Multi-Line)</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={formattedData}>
          <XAxis dataKey="year" padding={{ left: 20 }}/>
          <YAxis />
          <Tooltip />
          <Legend />
          {allCategories.map((category, index) => (
            <Line key={category} type="monotone" dataKey={category} stroke={colorScale(index)} strokeWidth={2} animationDuration={2000} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MultiLineChart;
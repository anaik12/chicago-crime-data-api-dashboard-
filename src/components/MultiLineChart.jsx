import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as d3 from "d3";

const MultiLineChart = ({ data, series }) => {
  console.log("MultiLineChart Data:", data, "Series:", series);

  // Declare hooks at the top before any conditionals
  const [visibleLines, setVisibleLines] = useState([]);

  // Declare useEffect at the top to ensure it's always called
  useEffect(() => {
    const categories = series && series.length
      ? [...new Set(series.map((r) => r.primary_type))]
      : (data && data.length ? [...new Set(data.map((d) => d.crimeType))] : []);
    if (categories.length === 0) return;
    categories.forEach((category, index) => {
      setTimeout(() => {
        setVisibleLines((prev) => [...prev, category]);
      }, index * 4000); // Adjust delay time (500ms per line)
    });
  }, [data, series]);

  // Early return after hooks are declared
  if ((!data || data.length === 0) && (!series || series.length === 0)) return <h3>No data available for Line Chart</h3>;

  // Process data for the chart
  const yearCategoryCounts = {};
  if (series && series.length) {
    series.forEach(({ year, primary_type, c }) => {
      if (!yearCategoryCounts[year]) yearCategoryCounts[year] = {};
      yearCategoryCounts[year][primary_type] = parseInt(c);
    });
  } else if (data && data.length) {
    data.forEach(({ year, crimeType }) => {
      if (!yearCategoryCounts[year]) yearCategoryCounts[year] = {};
      yearCategoryCounts[year][crimeType] = (yearCategoryCounts[year][crimeType] || 0) + 1;
    });
  }

  const formattedData = Object.entries(yearCategoryCounts).map(([year, categories]) => ({
    year,
    ...categories,
  }));

  const scheme = d3.schemeObservable10 || d3.schemeTableau10 || d3.schemeCategory10;
  const colorScale = d3.scaleOrdinal(scheme);

  return (
    <div>
      <h2>Crime Trends by Year (Multi-Line with Delayed Rendering)</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={formattedData}>
          <XAxis dataKey="year" padding={{ left: 20 }} />
          <YAxis />
          <Tooltip />
          <Legend />
          {visibleLines.map((category, index) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              stroke={colorScale(index)}
              strokeWidth={2}
              animationDuration={5000} // Smooth transition effect
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MultiLineChart;

import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as d3 from "d3";

const DonutChart = ({ data, topLocations }) => {
  console.log("DonutChart Data:", data, "TopLocations:", topLocations);

  if ((!data || data.length === 0) && (!topLocations || topLocations.length === 0)) {
    return <h3>No data available for Donut Chart</h3>;
  }

  let formattedData = [];
  if (topLocations && topLocations.length) {
    formattedData = topLocations.map((r) => ({
      name: r.location_description || "Unknown",
      value: parseInt(r.c),
    }));
  } else {
    const locationCounts = data.reduce((acc, row) => {
      const location = row.location || "Unknown";
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {});
    formattedData = Object.entries(locationCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }

  const COLORS = d3.schemeObservable10 || d3.schemeTableau10 || d3.schemeCategory10; // Observable10 or fallback

  return (
    <div>
      <h2>Crime Distribution by Location Type</h2>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={formattedData}
            cx={200}
            cy={200}
            innerRadius={80}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {formattedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend layout="vertical" align="right" verticalAlign="middle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DonutChart;

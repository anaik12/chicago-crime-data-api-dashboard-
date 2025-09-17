import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const BarChartComponent = ({ data }) => {
  console.log("BarChart Data:", data); // Debugging

  if (!data || data.length === 0) return <h3>No data available for Bar Chart</h3>;

  const yearCounts = data
    .filter(row => row.year && [2020, 2021, 2022, 2023, 2024].includes(parseInt(row.year))) // Ensure years are included
    .reduce((acc, row) => {
      acc[row.year] = (acc[row.year] || 0) + 1;
      return acc;
    }, {});

  console.log("Filtered BarChart Data:", yearCounts); // Debugging

  const formattedData = Object.entries(yearCounts).map(([year, count]) => ({ year, count }));

  if (formattedData.length === 0) return <h3>No data for selected years</h3>;

  return (
    <div>
      <h2>Crime Trends (2020-2024)</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={formattedData}>
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#82ca9d" barSize={50} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartComponent;

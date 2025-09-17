import React from "react";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const CrimeLineChart = ({ data }) => {
  console.log("LineChart Data:", data); // Debugging

  if (!data || data.length === 0) return <h3>No data available for Line Chart</h3>;

  // Count crimes per year
  const yearCounts = data.reduce((acc, row) => {
    if (row.year) {
      acc[row.year] = (acc[row.year] || 0) + 1;
    }
    return acc;
  }, {});

  // Format data for LineChart
  const formattedData = Object.entries(yearCounts)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => parseInt(a.year) - parseInt(b.year));

  return (
    <div>
      <h2>Crime Trends Over Time</h2>
      <ResponsiveContainer width="100%" height={400}>
        <RechartsLineChart data={formattedData}>
          <XAxis dataKey="year" padding={{ left: 20 }}/>
          <YAxis />
          <Tooltip />
          <Legend />
          {/* <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} dot={false} activeDot={{ r: 6 }} animationDuration={1000} /> */}
          <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} dot={false} activeDot={{ r: 6 }} animationDuration={5000} />

        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CrimeLineChart;

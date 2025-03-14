import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

import Input from "./components/ui/input";
import Button from "./components/ui/button";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {
  const [ticker, setTicker] = useState("AAPL");
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStockData = () => {
    setLoading(true);
    axios
      .get(`http://127.0.0.1:8000/stock/${ticker}`)
      .then((response) => setStockData(response.data))
      .catch((error) => console.error("Error fetching stock data:", error))
      .finally(() => setLoading(false));
  };

  // 🔄 Auto-fetch stock data every 10 seconds
  useEffect(() => {
    fetchStockData(); // Initial fetch when component mounts
    const interval = setInterval(() => {
      fetchStockData();
    }, 10000); // Fetch data every 10 sec

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [ticker]); // Re-run effect when ticker changes

  const chartData = stockData
    ? {
        labels: Object.keys(stockData["Time Series (5min)"]).reverse(),
        datasets: [
          {
            label: `${ticker} Closing Price`,
            data: Object.values(stockData["Time Series (5min)"]).map((data) => data["4. close"]).reverse(),
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderWidth: 2,
          },
        ],
      }
    : null;

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-4">MarketIQ AI Dashboard</h1>

      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="Enter Stock Ticker (e.g., AAPL)"
        />
        <Button onClick={fetchStockData} disabled={loading}>
          {loading ? "Loading..." : "Get Data"}
        </Button>
      </div>

      {stockData ? (
        <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">Stock Data</h2>
          <div className="h-96">
            <Line data={chartData} />
          </div>
        </div>
      ) : (
        <p className="text-gray-500">Enter a ticker and click "Get Data" to fetch stock info.</p>
      )}
    </div>
  );
}

export default App;

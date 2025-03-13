import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import ThemeToggle from "./components/ThemeToggle";
import Input from "./components/ui/input";
import Button from "./components/ui/button";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {
  const [ticker, setTicker] = useState("AAPL");
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  // Listen for dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const fetchStockData = () => {
    if (!ticker.trim()) return; // Prevent empty API requests

    setLoading(true);
    axios
      .get(`http://127.0.0.1:8000/stock/${ticker}`)
      .then((response) => setStockData(response.data))
      .catch((error) => {
        console.error("Error fetching stock data:", error);
        setStockData(null);
      })
      .finally(() => setLoading(false));
  };

  // Auto-fetch stock data every 10 seconds
  useEffect(() => {
    fetchStockData();
    const interval = setInterval(fetchStockData, 10000);
    return () => clearInterval(interval);
  }, [ticker]);

  // Convert stock data to Chart.js format
  const chartData = stockData?.["Time Series (5min)"]
    ? {
        labels: Object.keys(stockData["Time Series (5min)"]).reverse(),
        datasets: [
          {
            label: `${ticker} Closing Price`,
            data: Object.values(stockData["Time Series (5min)"]).map((data) => data["4. close"]).reverse(),
            borderColor: darkMode ? "rgba(255, 99, 132, 1)" : "rgba(75, 192, 192, 1)", // Red in dark mode, Teal in light mode
            backgroundColor: darkMode ? "rgba(255, 99, 132, 0.2)" : "rgba(75, 192, 192, 0.2)",
            borderWidth: 2,
          },
        ],
      }
    : null;

  // Chart.js options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: darkMode ? "white" : "black",
        },
      },
    },
    scales: {
      x: {
        ticks: { color: darkMode ? "white" : "black" },
        grid: { color: darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" },
      },
      y: {
        ticks: { color: darkMode ? "white" : "black" },
        grid: { color: darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" },
      },
    },
  };

  return (
    <div className="flex flex-col items-center p-6 dark:bg-gray-900 dark:text-white min-h-screen relative">
      {/* Top Bar with Theme Toggle */}
      <div className="w-full flex justify-end p-2">
        <ThemeToggle />
      </div>
  
      <h1 className="text-3xl font-bold mb-4">MarketIQ AI Dashboard</h1>
  
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="Enter Stock Ticker (e.g., AAPL)"
          className="p-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded"
        />
        <Button onClick={fetchStockData} disabled={loading}>
          {loading ? "Loading..." : "Get Data"}
        </Button>
      </div>
  
      {stockData ? (
        <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-4 dark:bg-gray-800 dark:text-white">
          <h2 className="text-xl font-semibold mb-2">{ticker} Stock Data</h2>
          <div className="h-96">
            {chartData ? (
              <Line data={chartData} options={options} />
            ) : (
              <p className="text-gray-500">No stock data available. Please enter a valid ticker.</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-500">Enter a ticker and click "Get Data" to fetch stock info.</p>
      )}
    </div>
  );
}

export default App;
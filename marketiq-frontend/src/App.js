import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
    const [stockData, setStockData] = useState(null);

    useEffect(() => {
        axios.get("http://127.0.0.1:8000/stock/AAPL")
            .then(response => setStockData(response.data["Time Series (5min)"]))
            .catch(error => console.error("Error fetching stock data:", error));
    }, []);

    return (
        <div>
            <h1>MarketIQ AI Dashboard</h1>
            {stockData ? (
                <table border="1">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Open</th>
                            <th>High</th>
                            <th>Low</th>
                            <th>Close</th>
                            <th>Volume</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(stockData).map(([timestamp, values]) => (
                            <tr key={timestamp}>
                                <td>{timestamp}</td>
                                <td>{values["1. open"]}</td>
                                <td>{values["2. high"]}</td>
                                <td>{values["3. low"]}</td>
                                <td>{values["4. close"]}</td>
                                <td>{values["5. volume"]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>Loading stock data...</p>
            )}
        </div>
    );
}

export default App;


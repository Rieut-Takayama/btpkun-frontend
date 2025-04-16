import React, { useState, useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";
import api from "../../services/api";
import "./ChartControls.css";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Generate dummy data directly in the component for testing
const generateDummyData = (timeframe) => {
  console.log(`Generating direct dummy data for ${timeframe}`);

  const now = Date.now();
  const candles = [];
  let lastPrice = 0.00002850;

  // Generate 100 candles
  for (let i = 0; i < 100; i++) {
    const timestamp = now - (100 - i) * 60 * 60 * 1000; // 1 hour intervals
    const changePercent = (Math.random() - 0.5) * 0.05; // Â±2.5% change
    const open = lastPrice;
    const close = open * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = 1000000 + Math.random() * 2000000;

    candles.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume
    });

    lastPrice = close;
  }

  // Create a scenario with bollinger band breakthrough
  const recent = candles.slice(-5);
  recent[1].close = recent[1].close * 0.97;
  recent[1].low = recent[1].close * 0.98;
  recent[2].open = recent[1].close;
  recent[2].close = recent[2].open * 0.97;
  recent[2].low = recent[2].close * 0.98;
  recent[3].open = recent[2].close;
  recent[3].close = recent[3].open * 1.03;
  recent[4].open = recent[3].close;
  recent[4].close = recent[4].open * 1.02;

  // Extract data series
  const timestamps = candles.map(c => c.timestamp);
  const opens = candles.map(c => c.open);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);

  // Calculate Bollinger Bands (simple moving average)
  const period = 20;
  const multiplier = 2;
  const middle = [];
  const upper = [];
  const lower = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      middle.push(null);
      upper.push(null);
      lower.push(null);
      continue;
    }

    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += closes[i - j];
    }
    const avg = sum / period;
    middle.push(avg);

    let sumSquaredDiff = 0;
    for (let j = 0; j < period; j++) {
      sumSquaredDiff += Math.pow(closes[i - j] - avg, 2);
    }
    const stdDev = Math.sqrt(sumSquaredDiff / period);

    upper.push(avg + multiplier * stdDev);
    lower.push(avg - multiplier * stdDev);
  }

  // Generate signals based on Bollinger Band breakthrough
  const signals = [
    {
      id: 1,
      type: "BB_BREAK",
      message: "Bollinger Band Lower Break Detected",
      strength: 90,
      timestamp: new Date(),
      // Add evidence data
      evidence: [
        {
          name: "Price Breached Lower Band",
          value: "Low price breached lower band by 2.3%, then recovered",
          details: [
            { name: "Recent Low", value: lows[lows.length - 2].toFixed(8) },
            { name: "Bollinger Lower", value: lower[lower.length - 2].toFixed(8) },
            { name: "Breach %", value: "-2.3%" },
            { name: "Recovery %", value: "+1.8%" }
          ]
        },
        {
          name: "Past 24h Volatility",
          value: "Low volatility (standard deviation: 0.87%)",
          details: [
            { name: "Standard Deviation", value: "0.87%" },
            { name: "Average Volume", value: "345.2 BTC" },
            { name: "vs Previous Day", value: "-12.5%" }
          ]
        },
        {
          name: "RSI Indicator",
          value: "RSI 28 - Recovery from oversold condition",
          details: [
            { name: "Current RSI", value: "28" },
            { name: "1 Hour Ago", value: "22" },
            { name: "4 Hours Ago", value: "35" }
          ]
        }
      ]
    },
    {
      id: 2,
      type: "ACCUMULATION_PHASE",
      message: "Accumulation Phase Detected: Volume increase with price stability",
      strength: 75,
      timestamp: new Date(),
      // Add evidence data
      evidence: [
        {
          name: "Volume Increase",
          value: "Volume increase of +32% compared to 7-day average",
          details: [
            { name: "Current Volume", value: "1,345,000" },
            { name: "7-day Average", value: "980,000" },
            { name: "Increase %", value: "+32%" }
          ]
        },
        {
          name: "Price Stability",
          value: "Low price volatility in past 24 hours: }0.4%",
          details: [
            { name: "Max Fluctuation", value: "}0.4%" },
            { name: "Price Range", value: "0.000028 - 0.000029" },
            { name: "MA Relation", value: "Moving near 5MA" }
          ]
        }
      ]
    }
  ];

  // Calculate buy score based on signals
  const buyScore = 85;

  return {
    timeframe,
    timestamps,
    opens,
    highs,
    lows,
    closes,
    volumes,
    candles,
    indicators: {
      bollingerBands: { upper, middle, lower }
    },
    signals,
    buyScore
  };
};

const ChartControls = ({ onBuyScoreChange, onSignalsChange }) => {
  const [timeframe, setTimeframe] = useState("1h");
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

  // Timeframe change handler
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
    setLoading(true);
    fetchChartData(newTimeframe);
  };

  // Chart data fetch function
  const fetchChartData = async (tf) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Fetching chart data for timeframe: ${tf}`);

      // Generate dummy data directly
      const data = generateDummyData(tf);
      console.log("Generated chart data:", data);

      setChartData(data);

      // Notify parent of signals and buy score
      if (onBuyScoreChange && data.buyScore !== undefined) {
        onBuyScoreChange(data.buyScore);
      }

      if (onSignalsChange && data.signals) {
        onSignalsChange(data.signals);
      }
    } catch (err) {
      console.error("Failed to load chart data:", err);
      setError("Failed to load chart data");
    } finally {
      setLoading(false);
    }
  };

  // Initialize on mount
  useEffect(() => {
    fetchChartData(timeframe);

    // Auto-update every minute
    const intervalId = setInterval(() => {
      fetchChartData(timeframe);
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  // Chart options
  const getChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      scales: {
        x: {
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
          ticks: {
            color: "rgba(255, 255, 255, 0.7)",
            maxRotation: 0,
            callback: function(value, index) {
              if (!chartData) return "";
              const date = new Date(chartData.timestamps[index]);
              return index % 10 === 0 ?
                `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}` : "";
            }
          }
        },
        y: {
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
          ticks: {
            color: "rgba(255, 255, 255, 0.7)",
            precision: 8
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: "rgba(255, 255, 255, 0.7)"
          }
        },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || "";
              if (label) {
                label += ": ";
              }
              label += context.parsed.y.toFixed(8);
              return label;
            },
            title: function(tooltipItems) {
              if (!chartData) return "";
              const index = tooltipItems[0].dataIndex;
              const date = new Date(chartData.timestamps[index]);
              return date.toLocaleString();
            }
          }
        }
      }
    };
  };

  // Prepare chart data
  const getChartDataConfig = () => {
    if (!chartData || !chartData.indicators || !chartData.indicators.bollingerBands) {
      return { datasets: [] };
    }

    const { closes, indicators } = chartData;
    const bb = indicators.bollingerBands;

    // Generate date labels
    const labels = chartData.timestamps.map(ts => new Date(ts).toLocaleString());

    return {
      labels,
      datasets: [
        {
          label: "Price",
          data: closes,
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.1,
          pointRadius: 1,
          pointHoverRadius: 5,
          pointHitRadius: 10,
        },
        {
          label: "BB Upper",
          data: bb.upper,
          borderColor: "rgba(255, 99, 132, 0.8)",
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.1,
          fill: false
        },
        {
          label: "BB Middle",
          data: bb.middle,
          borderColor: "rgba(255, 206, 86, 0.8)",
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.1,
          fill: false
        },
        {
          label: "BB Lower",
          data: bb.lower,
          borderColor: "rgba(54, 162, 235, 0.8)",
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.1,
          fill: false
        }
      ]
    };
  };

  return (
    <div className="chart-controls">
      <div className="timeframe-selector">
        <button
          className={"timeframe-button " + (timeframe === "1m" ? "active" : "")}
          onClick={() => handleTimeframeChange("1m")}
        >
          1m
        </button>
        <button
          className={"timeframe-button " + (timeframe === "3m" ? "active" : "")}
          onClick={() => handleTimeframeChange("3m")}
        >
          3m
        </button>
        <button
          className={"timeframe-button " + (timeframe === "5m" ? "active" : "")}
          onClick={() => handleTimeframeChange("5m")}
        >
          5m
        </button>
        <button
          className={"timeframe-button " + (timeframe === "10m" ? "active" : "")}
          onClick={() => handleTimeframeChange("10m")}
        >
          10m
        </button>
        <button
          className={"timeframe-button " + (timeframe === "15m" ? "active" : "")}
          onClick={() => handleTimeframeChange("15m")}
        >
          15m
        </button>
        <button
          className={"timeframe-button " + (timeframe === "30m" ? "active" : "")}
          onClick={() => handleTimeframeChange("30m")}
        >
          30m
        </button>
        <button
          className={"timeframe-button " + (timeframe === "1h" ? "active" : "")}
          onClick={() => handleTimeframeChange("1h")}
        >
          1h
        </button>
        <button
          className={"timeframe-button " + (timeframe === "4h" ? "active" : "")}
          onClick={() => handleTimeframeChange("4h")}
        >
          4h
        </button>
        <button
          className={"timeframe-button " + (timeframe === "1d" ? "active" : "")}
          onClick={() => handleTimeframeChange("1d")}
        >
          1d
        </button>
      </div>

      <div className="chart-container">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <div>Loading data...</div>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {chartData && !loading && !error ? (
          <div className="chart-wrapper">
            <Line
              ref={chartRef}
              options={getChartOptions()}
              data={getChartDataConfig()}
            />
          </div>
        ) : (!loading && !error) && (
          <div className="chart-placeholder">
            <div>No chart data available</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartControls;

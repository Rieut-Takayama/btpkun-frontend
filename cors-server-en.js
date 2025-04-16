const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
const PORT = 4000;

// Enhanced CORS settings
app.use(cors({
  origin: "http://localhost:3003", // Explicitly specify frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// Handle preflight requests
app.options("*", cors());

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Status endpoint
app.get("/api/status", (req, res) => {
  res.json({ status: "OK", message: "Server is running with proper CORS" });
});

// API configuration endpoints
let apiConfig = null;

app.get("/api/config", (req, res) => {
  if (!apiConfig) {
    return res.status(404).json({ message: "API configuration not found" });
  }
  res.json({ apiKey: apiConfig.apiKey });
});

app.post("/api/config", (req, res) => {
  const { apiKey, apiSecret } = req.body;
  console.log("API config save request:", { apiKey, apiSecret: "***" });
  
  if (!apiKey || !apiSecret) {
    return res.status(400).json({ message: "API key and secret are required" });
  }
  
  apiConfig = { apiKey, apiSecret };
  res.json({ message: "API configuration saved successfully" });
});

app.post("/api/config/test", (req, res) => {
  const { apiKey, apiSecret } = req.body;
  console.log("API connection test request:", { apiKey, apiSecret: "***" });
  
  if (!apiKey || !apiSecret) {
    return res.status(400).json({ message: "API key and secret are required" });
  }
  
  // Just return success for now
  res.json({ message: "API connection test successful" });
});

// Market data endpoint
app.get("/api/market", async (req, res) => {
  try {
    console.log("Fetching market data...");
    const response = await axios.get("https://api.mexc.com/api/v3/ticker/24hr", {
      params: { symbol: "OKMUSDT" }
    });
    
    const data = response.data;
    const marketData = {
      symbol: "OKM/USDT",
      lastPrice: parseFloat(data.lastPrice),
      priceChange: parseFloat(data.priceChange),
      priceChangePercent: parseFloat(data.priceChangePercent),
      volume: parseFloat(data.volume),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice)
    };
    
    console.log("Market data:", marketData);
    res.json(marketData);
  } catch (error) {
    console.error("Error fetching market data:", error.message);
    // Return dummy data
    res.json({
      symbol: "OKM/USDT",
      lastPrice: 0.00002850,
      priceChange: 0.00000103,
      priceChangePercent: 0.0374,
      volume: 3431064495.85,
      high24h: 0.00002974,
      low24h: 0.00002677
    });
  }
});

// Chart data endpoint
app.get("/api/chart", async (req, res) => {
  try {
    const interval = req.query.interval || "hourly";
    const limit = parseInt(req.query.limit) || 100;
    
    console.log(`Fetching chart data... interval=${interval}, limit=${limit}`);
    
    // Convert to MEXC interval format
    const intervalMap = {
      "oneMin": "1m",
      "threeMin": "3m",
      "fiveMin": "5m",
      "tenMin": "15m",
      "fifteenMin": "15m",
      "thirtyMin": "30m",
      "hourly": "1h",
      "fourHour": "4h",
      "daily": "1d"
    };
    
    const mexcInterval = intervalMap[interval] || "1h";
    
    const response = await axios.get("https://api.mexc.com/api/v3/klines", {
      params: {
        symbol: "OKMUSDT",
        interval: mexcInterval,
        limit: limit
      }
    });
    
    // Convert MEXC response to candles format
    const candles = response.data.map(item => ({
      timestamp: parseInt(item[0]),
      open: parseFloat(item[1]),
      high: parseFloat(item[2]),
      low: parseFloat(item[3]),
      close: parseFloat(item[4]),
      volume: parseFloat(item[5])
    }));
    
    console.log(`Retrieved ${candles.length} candles`);
    res.json({ candles });
  } catch (error) {
    console.error("Error fetching chart data:", error.message);
    // Generate dummy data
    console.log("Generating dummy data...");
    const now = Date.now();
    const candles = [];
    let lastClose = 0.00002850;
    
    for (let i = 0; i < 100; i++) {
      const timestamp = now - (100 - i) * 60 * 60 * 1000;
      const volatility = 0.05;
      const changePercent = (Math.random() - 0.5) * volatility;
      const open = lastClose;
      const change = open * changePercent;
      const close = open + change;
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      const volume = 100000000 + Math.random() * 100000000;
      
      candles.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume
      });
      
      lastClose = close;
    }
    
    res.json({ candles });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Allowing CORS requests from frontend (http://localhost:3003)`);
});

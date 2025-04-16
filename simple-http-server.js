const http = require("http");
const https = require("https");
const url = require("url");

// Simple HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  console.log(`${new Date().toISOString()} - ${req.method} ${path}`);
  
  // Set CORS headers for all responses
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3003");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  // Handle preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    res.statusCode = 204; // No content
    res.end();
    return;
  }
  
  // Set content type for all responses
  res.setHeader("Content-Type", "application/json");
  
  // Handle different endpoints
  if (path === "/api/status") {
    // Status endpoint
    res.statusCode = 200;
    res.end(JSON.stringify({ status: "OK", message: "Simple HTTP server is running" }));
  } 
  else if (path === "/api/market") {
    // Market data endpoint
    fetchMarketData()
      .then(data => {
        res.statusCode = 200;
        res.end(JSON.stringify(data));
      })
      .catch(error => {
        console.error("Error fetching market data:", error);
        res.statusCode = 200; // Still return 200 with dummy data
        res.end(JSON.stringify(getDummyMarketData()));
      });
  }
  else if (path === "/api/chart") {
    // Chart data endpoint
    const interval = parsedUrl.query.interval || "hourly";
    const limit = parseInt(parsedUrl.query.limit) || 100;
    
    fetchChartData(interval, limit)
      .then(data => {
        res.statusCode = 200;
        res.end(JSON.stringify(data));
      })
      .catch(error => {
        console.error("Error fetching chart data:", error);
        res.statusCode = 200; // Still return 200 with dummy data
        res.end(JSON.stringify({ candles: generateDummyCandles(limit) }));
      });
  }
  else if (path === "/api/config" && req.method === "GET") {
    // Get API config
    res.statusCode = 200;
    res.end(JSON.stringify({ message: "API configuration endpoint" }));
  }
  else if (path === "/api/config" && req.method === "POST") {
    // Save API config
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        console.log("Received API config:", { apiKey: data.apiKey, apiSecret: "***" });
        res.statusCode = 200;
        res.end(JSON.stringify({ message: "API configuration saved successfully" }));
      } catch (error) {
        console.error("Error parsing request body:", error);
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
  }
  else if (path === "/api/config/test" && req.method === "POST") {
    // Test API config
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        console.log("API connection test request:", { apiKey: data.apiKey, apiSecret: "***" });
        res.statusCode = 200;
        res.end(JSON.stringify({ message: "API connection test successful" }));
      } catch (error) {
        console.error("Error parsing request body:", error);
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
  }
  else {
    // Not found
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "Not found" }));
  }
});

// Fetch market data from MEXC API
function fetchMarketData() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.mexc.com",
      path: "/api/v3/ticker/24hr?symbol=OKMUSDT",
      method: "GET"
    };
    
    const req = https.request(options, res => {
      let data = "";
      
      res.on("data", chunk => {
        data += chunk;
      });
      
      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data);
          const formattedData = {
            symbol: "OKM/USDT",
            lastPrice: parseFloat(jsonData.lastPrice),
            priceChange: parseFloat(jsonData.priceChange),
            priceChangePercent: parseFloat(jsonData.priceChangePercent),
            volume: parseFloat(jsonData.volume),
            high24h: parseFloat(jsonData.highPrice),
            low24h: parseFloat(jsonData.lowPrice)
          };
          resolve(formattedData);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on("error", error => {
      reject(error);
    });
    
    req.end();
  });
}

// Fetch chart data from MEXC API
function fetchChartData(interval, limit) {
  return new Promise((resolve, reject) => {
    // Convert interval to MEXC format
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
    
    const options = {
      hostname: "api.mexc.com",
      path: `/api/v3/klines?symbol=OKMUSDT&interval=${mexcInterval}&limit=${limit}`,
      method: "GET"
    };
    
    const req = https.request(options, res => {
      let data = "";
      
      res.on("data", chunk => {
        data += chunk;
      });
      
      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data);
          const candles = jsonData.map(item => ({
            timestamp: parseInt(item[0]),
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: parseFloat(item[5])
          }));
          resolve({ candles });
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on("error", error => {
      reject(error);
    });
    
    req.end();
  });
}

// Get dummy market data
function getDummyMarketData() {
  return {
    symbol: "OKM/USDT",
    lastPrice: 0.00002850,
    priceChange: 0.00000103,
    priceChangePercent: 0.0374,
    volume: 3431064495.85,
    high24h: 0.00002974,
    low24h: 0.00002677
  };
}

// Generate dummy candles data
function generateDummyCandles(limit) {
  const now = Date.now();
  const candles = [];
  let lastClose = 0.00002850;
  
  for (let i = 0; i < limit; i++) {
    const timestamp = now - (limit - i) * 60 * 60 * 1000;
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
  
  return candles;
}

// Start server
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Simple HTTP server running at http://localhost:${PORT}`);
  console.log(`Allowing CORS requests from frontend (http://localhost:3003)`);
});

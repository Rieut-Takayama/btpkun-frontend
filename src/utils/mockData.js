// Dummy market data
export const dummyMarketData = {
  symbol: "OKM/USDT",
  lastPrice: 0.00002850,
  priceChange: 0.00000103,
  priceChangePercent: 0.0374,
  volume: 3431064495.85,
  high24h: 0.00002974,
  low24h: 0.00002677
};

// Generate dummy candles
export function generateDummyCandles(timeframe, count = 100) {
  const now = Date.now();
  const candles = [];
  let lastClose = 0.00002850;
  
  // Timeframe intervals (ms)
  const intervalMap = {
    "1m": 60 * 1000,
    "3m": 3 * 60 * 1000,
    "5m": 5 * 60 * 1000,
    "10m": 10 * 60 * 1000,
    "15m": 15 * 60 * 1000,
    "30m": 30 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "4h": 4 * 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000
  };
  
  const interval = intervalMap[timeframe] || 60 * 60 * 1000;
  
  for (let i = 0; i < count; i++) {
    const timestamp = now - (count - i) * interval;
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
  
  // Create Bollinger Band breakthrough scenario (recent candles)
  const recent = candles.slice(-5);
  recent[1].close = recent[1].close * 0.98;
  recent[1].low = recent[1].close * 0.97;
  recent[2].open = recent[1].close;
  recent[2].close = recent[2].open * 0.97;
  recent[2].low = recent[2].close * 0.96;
  recent[2].high = recent[2].open;
  
  recent[3].open = recent[2].close;
  recent[3].close = recent[3].open * 1.02;
  recent[3].low = recent[3].open * 0.99;
  recent[3].high = recent[3].close * 1.01;
  
  recent[4].open = recent[3].close;
  recent[4].close = recent[4].open * 1.01;
  recent[4].low = recent[4].open * 0.995;
  recent[4].high = recent[4].close * 1.005;
  
  return candles;
}

// Get dummy chart data
export function getDummyChartData(timeframe = "1h") {
  const candles = generateDummyCandles(timeframe);
  
  // Split into arrays
  const timestamps = candles.map(c => c.timestamp);
  const opens = candles.map(c => c.open);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);
  
  return {
    timeframe,
    timestamps,
    opens,
    highs,
    lows,
    closes,
    volumes,
    candles
  };
}

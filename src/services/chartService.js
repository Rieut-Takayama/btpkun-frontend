// Chart data service
import api from './api';
import {
  calculateBollingerBands,
  calculateRSI,
  calculateMACD
} from '../utils/indicators';
import {
  detectAccumulationPhase,
  detectVReversal,
  detectBollingerBreakout,
  calculateTotalBuyScore
} from '../utils/signals';

// Data cache
const dataCache = {};
const indicatorCache = {};

/**
 * Get API parameters based on timeframe
 */
const getTimeframeParams = (timeframe) => {
  const intervalMap = {
    "1m": "oneMin",
    "3m": "threeMin",
    "5m": "fiveMin",
    "10m": "tenMin",
    "15m": "fifteenMin",
    "30m": "thirtyMin",
    "1h": "hourly",
    "4h": "fourHour",
    "1d": "daily"
  };

  return {
    interval: intervalMap[timeframe] || "hourly",
    limit: 100
  };
};

/**
 * Get chart data
 */
export const getChartData = async (timeframe = "1h", forceRefresh = false) => {
  // Current time
  const now = Date.now();

  // Cache validity periods
  const cacheValidityMap = {
    "1m": 30 * 1000,
    "3m": 60 * 1000,
    "5m": 60 * 1000,
    "10m": 2 * 60 * 1000,
    "15m": 2 * 60 * 1000,
    "30m": 5 * 60 * 1000,
    "1h": 10 * 60 * 1000,
    "4h": 30 * 60 * 1000,
    "1d": 60 * 60 * 1000
  };

  const cacheValidity = cacheValidityMap[timeframe] || 60 * 1000;

  // Check cache
  if (
    !forceRefresh &&
    dataCache[timeframe] &&
    dataCache[timeframe].lastUpdated > now - cacheValidity
  ) {
    return {
      ...dataCache[timeframe],
      ...indicatorCache[timeframe]
    };
  }

  try {
    // Get API parameters
    const params = getTimeframeParams(timeframe);
    
    console.log(`Fetching chart data for timeframe: ${timeframe}`);
    
    // Get data from API
    const data = await api.get(api.endpoints.chart, params);
    
    console.log("Chart data received:", data);
    
    // If data doesn't have the expected format, format it
    let formattedData = data;
    if (!data.timestamps && data.candles) {
      formattedData = formatChartData(data, timeframe);
    }
    
    // Calculate technical indicators
    const indicators = calculateIndicators(formattedData);
    
    // Detect signals if not already provided by API
    let signals = data.signals;
    let buyScore = data.buyScore;
    
    if (!signals) {
      signals = detectSignals(formattedData, indicators);
      buyScore = calculateTotalBuyScore(Object.values(signals));
    }
    
    // Save to cache
    dataCache[timeframe] = {
      ...formattedData,
      lastUpdated: now
    };
    
    indicatorCache[timeframe] = {
      indicators,
      signals,
      buyScore
    };
    
    return {
      ...formattedData,
      indicators,
      signals,
      buyScore
    };
  } catch (error) {
    console.error("Chart data fetch error:", error);
    throw error;
  }
};

/**
 * Format chart data from API
 */
const formatChartData = (data, timeframe) => {
  const candles = data.candles || [];
  
  // Extract arrays of data
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
};

/**
 * Calculate technical indicators
 */
const calculateIndicators = (data) => {
  const { closes, volumes } = data;
  
  // Bollinger Bands (period 20, stdDev 2)
  const bollingerBands = calculateBollingerBands(closes, 20, 2);
  
  // RSI (period 14)
  const rsi = calculateRSI(closes, 14);
  
  // MACD (short 12, long 26, signal 9)
  const macd = calculateMACD(closes);
  
  return {
    bollingerBands,
    rsi,
    macd
  };
};

/**
 * Detect signals
 */
const detectSignals = (data, indicators) => {
  const { closes, lows, volumes } = data;
  
  // Signal 1: Accumulation Phase
  const accumulationSignal = detectAccumulationPhase(closes, volumes);
  
  // Signal 2: V-Reversal
  const vReversalSignal = detectVReversal(closes);
  
  // Signal 3: Bollinger Band Lower Break
  const bbBreakSignal = detectBollingerBreakout(closes, lows);
  
  return {
    accumulationSignal,
    vReversalSignal,
    bbBreakSignal
  };
};

/**
 * Get latest market data
 */
export const getLatestMarketData = async () => {
  try {
    console.log("Fetching market data from API");
    const data = await api.get(api.endpoints.marketData);
    return data;
  } catch (error) {
    console.log("Returning dummy market data");
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
};
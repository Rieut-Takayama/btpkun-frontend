// チャートデータ取得と加工のサービス
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

// データキャッシュ
const dataCache = {
  // タイムフレームごとのデータ
  // 例: '1m': { candles: [...], lastUpdated: timestamp }
};

// 指標とシグナルのキャッシュ
const indicatorCache = {
  // タイムフレームごとの指標
};

/**
 * タイムフレームに応じたAPIパラメータを取得
 * @param {string} timeframe - タイムフレーム ('1m', '5m', '1h'など)
 * @returns {Object} APIパラメータ
 */
const getTimeframeParams = (timeframe) => {
  const intervalMap = {
    '1m': 'oneMin',
    '3m': 'threeMin',
    '5m': 'fiveMin',
    '10m': 'tenMin', 
    '15m': 'fifteenMin',
    '30m': 'thirtyMin',
    '1h': 'hourly',
    '4h': 'fourHour',
    '1d': 'daily'
  };
  
  return {
    interval: intervalMap[timeframe] || 'hourly',
    limit: 100 // 取得するデータポイント数
  };
};

/**
 * ローソク足データの取得
 * @param {string} timeframe - タイムフレーム ('1m', '5m', '1h'など)
 * @param {boolean} forceRefresh - キャッシュを無視して再取得するかどうか
 * @returns {Promise<Object>} ローソク足データとテクニカル指標
 */
export const getChartData = async (timeframe = '1h', forceRefresh = false) => {
  // 現在時刻
  const now = Date.now();
  
  // キャッシュ有効期限（タイムフレームに応じて調整）
  const cacheValidityMap = {
    '1m': 30 * 1000, // 30秒
    '3m': 60 * 1000, // 1分
    '5m': 60 * 1000, // 1分
    '10m': 2 * 60 * 1000, // 2分
    '15m': 2 * 60 * 1000, // 2分
    '30m': 5 * 60 * 1000, // 5分
    '1h': 10 * 60 * 1000, // 10分
    '4h': 30 * 60 * 1000, // 30分
    '1d': 60 * 60 * 1000 // 1時間
  };
  
  const cacheValidity = cacheValidityMap[timeframe] || 60 * 1000; // デフォルト1分
  
  // キャッシュチェック
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
    // APIパラメータ取得
    const params = getTimeframeParams(timeframe);
    
    // APIからデータ取得
    const data = await api.get(api.endpoints.chart, params);
    
    // データフォーマット
    const formattedData = formatChartData(data, timeframe);
    
    // テクニカル指標の計算
    const indicators = calculateIndicators(formattedData);
    
    // シグナル検出
    const signals = detectSignals(formattedData, indicators);
    
    // 買い度計算
    const buyScore = calculateTotalBuyScore(Object.values(signals));
    
    // キャッシュに保存
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
    console.error('チャートデータ取得エラー:', error);
    throw error;
  }
};

/**
 * APIから取得したデータを整形
 * @param {Object} data - APIレスポンスデータ
 * @param {string} timeframe - タイムフレーム
 * @returns {Object} 整形されたチャートデータ
 */
const formatChartData = (data, timeframe) => {
  // APIレスポンスの形式によって調整が必要
  // 仮のデータ形式を想定して実装
  const candles = data.candles || [];
  
  // 各配列データを抽出
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
 * テクニカル指標の計算
 * @param {Object} data - フォーマット済みのチャートデータ
 * @returns {Object} 計算されたテクニカル指標
 */
const calculateIndicators = (data) => {
  const { closes, volumes } = data;
  
  // ボリンジャーバンド（期間20、標準偏差2）
  const bollingerBands = calculateBollingerBands(closes, 20, 2);
  
  // RSI（期間14）
  const rsi = calculateRSI(closes, 14);
  
  // MACD（短期12、長期26、シグナル9）
  const macd = calculateMACD(closes);
  
  return {
    bollingerBands,
    rsi,
    macd
  };
};

/**
 * シグナル検出
 * @param {Object} data - フォーマット済みのチャートデータ
 * @param {Object} indicators - 計算済みのテクニカル指標
 * @returns {Object} 検出されたシグナル
 */
const detectSignals = (data, indicators) => {
  const { closes, lows, volumes } = data;
  
  // シグナル①: 仕込みフェーズ（出来高増加×ローソク横ばい）
  const accumulationSignal = detectAccumulationPhase(closes, volumes);
  
  // シグナル②: V字反発（RSI+MACD）
  const vReversalSignal = detectVReversal(closes);
  
  // シグナル③: ボリンジャーバンド下限ブレイク
  const bbBreakSignal = detectBollingerBreakout(closes, lows);
  
  return {
    accumulationSignal,
    vReversalSignal,
    bbBreakSignal
  };
};

/**
 * 最新の市場データを取得
 * @returns {Promise<Object>} 最新の市場データ
 */
export const getLatestMarketData = async () => {
  try {
    const data = await api.get(api.endpoints.marketData);
    return data;
  } catch (error) {
    console.error('市場データ取得エラー:', error);
    throw error;
  }
};

// テスト用のダミーデータ生成（開発中のみ使用）
export const generateDummyData = (timeframe = '1h') => {
  console.warn('Warning: Using dummy chart data');
  
  const now = Date.now();
  const candles = [];
  const pointCount = 100;
  
  // タイムフレームごとの間隔（ミリ秒）
  const intervalMs = {
    '1m': 60 * 1000,
    '3m': 3 * 60 * 1000,
    '5m': 5 * 60 * 1000,
    '10m': 10 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000
  }[timeframe] || 60 * 60 * 1000;
  
  // ベース価格
  let basePrice = 0.02134;
  let lastClose = basePrice;
  
  // 各ローソク足を生成
  for (let i = 0; i < pointCount; i++) {
    const timestamp = now - (pointCount - i) * intervalMs;
    
    // 価格変動をシミュレート
    const volatility = 0.005; // 0.5%の変動
    const changePercent = (Math.random() - 0.5) * volatility;
    const open = lastClose;
    const change = open * changePercent;
    const close = open + change;
    
    // 高値と安値は始値と終値からランダムに広げる
    const high = Math.max(open, close) + (Math.random() * open * 0.002);
    const low = Math.min(open, close) - (Math.random() * open * 0.002);
    
    // 出来高もランダムに生成
    const volume = 1000000 + Math.random() * 1000000;
    
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
  
  // ボリンジャーバンド下限ブレイクのシナリオを作成（最新の数本）
  const recent = candles.slice(-5);
  
  // 下方への急落
  recent[1].close = recent[1].close * 0.98;
  recent[1].low = recent[1].close * 0.97;
  recent[2].open = recent[1].close;
  recent[2].close = recent[2].open * 0.97;
  recent[2].low = recent[2].close * 0.96;
  recent[2].high = recent[2].open;
  
  // 回復
  recent[3].open = recent[2].close;
  recent[3].close = recent[3].open * 1.02;
  recent[3].low = recent[3].open * 0.99;
  recent[3].high = recent[3].close * 1.01;
  
  recent[4].open = recent[3].close;
  recent[4].close = recent[4].open * 1.01;
  recent[4].low = recent[4].open * 0.995;
  recent[4].high = recent[4].close * 1.005;
  
  // データを整形して返す
  const timestamps = candles.map(c => c.timestamp);
  const opens = candles.map(c => c.open);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const closes = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);
  
  const formattedData = {
    timeframe,
    timestamps,
    opens,
    highs,
    lows,
    closes,
    volumes,
    candles
  };
  
  // テクニカル指標の計算
  const indicators = calculateIndicators(formattedData);
  
  // シグナル検出
  const signals = detectSignals(formattedData, indicators);
  
  // 買い度計算
  const buyScore = calculateTotalBuyScore(Object.values(signals));
  
  return {
    ...formattedData,
    indicators,
    signals,
    buyScore,
    lastUpdated: now,
    isDummyData: true
  };
};
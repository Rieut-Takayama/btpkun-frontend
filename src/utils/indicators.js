// テクニカル指標の計算用ユーティリティ
import {
  BollingerBands,
  RSI,
  MACD
} from 'technicalindicators';

/**
 * ボリンジャーバンドの計算
 * @param {Array} prices - 価格データの配列
 * @param {number} period - 期間（デフォルト: 20）
 * @param {number} stdDev - 標準偏差の倍率（デフォルト: 2）
 * @returns {Object} ボリンジャーバンドの値（upper, middle, lower）
 */
export const calculateBollingerBands = (prices, period = 20, stdDev = 2) => {
  if (!prices || prices.length < period) {
    return { upper: [], middle: [], lower: [] };
  }

  const input = {
    period: period,
    values: prices,
    stdDev: stdDev
  };

  return BollingerBands.calculate(input);
};

/**
 * RSIの計算
 * @param {Array} prices - 価格データの配列
 * @param {number} period - 期間（デフォルト: 14）
 * @returns {Array} RSI値の配列
 */
export const calculateRSI = (prices, period = 14) => {
  if (!prices || prices.length < period + 1) {
    return [];
  }

  const input = {
    values: prices,
    period: period
  };

  return RSI.calculate(input);
};

/**
 * MACDの計算
 * @param {Array} prices - 価格データの配列
 * @param {number} fastPeriod - 短期EMAの期間（デフォルト: 12）
 * @param {number} slowPeriod - 長期EMAの期間（デフォルト: 26）
 * @param {number} signalPeriod - シグナルEMAの期間（デフォルト: 9）
 * @returns {Object} MACD値（MACD, signal, histogram）
 */
export const calculateMACD = (prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  if (!prices || prices.length < slowPeriod + signalPeriod) {
    return { MACD: [], signal: [], histogram: [] };
  }

  const input = {
    values: prices,
    fastPeriod: fastPeriod,
    slowPeriod: slowPeriod,
    signalPeriod: signalPeriod,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  };

  return MACD.calculate(input);
};

/**
 * 出来高の変動率を計算
 * @param {Array} volumes - 出来高データの配列
 * @param {number} period - 比較する期間（デフォルト: 5）
 * @returns {Array} 期間ごとの出来高変動率(%)
 */
export const calculateVolumeChange = (volumes, period = 5) => {
  if (!volumes || volumes.length < period + 1) {
    return [];
  }

  const result = [];
  
  // 最初のperiod分はデータ不足のため計算できない
  for (let i = 0; i < period; i++) {
    result.push(0);
  }
  
  // i番目の出来高と、(i-period)番目からi-1番目までの平均出来高を比較
  for (let i = period; i < volumes.length; i++) {
    let avgPrevVolume = 0;
    for (let j = i - period; j < i; j++) {
      avgPrevVolume += volumes[j];
    }
    avgPrevVolume /= period;
    
    // 変動率を百分率で計算 ((現在値 / 過去平均) - 1) * 100
    const changePercent = ((volumes[i] / avgPrevVolume) - 1) * 100;
    result.push(changePercent);
  }
  
  return result;
};

/**
 * 価格の安定性（横ばい度）を計算
 * @param {Array} prices - 価格データの配列
 * @param {number} period - 期間（デフォルト: 5）
 * @returns {Array} 価格安定性の値（0〜100、100が最も安定）
 */
export const calculatePriceStability = (prices, period = 5) => {
  if (!prices || prices.length < period) {
    return [];
  }

  const result = [];
  
  // 最初のperiod-1分はデータ不足のため計算できない
  for (let i = 0; i < period - 1; i++) {
    result.push(0);
  }
  
  for (let i = period - 1; i < prices.length; i++) {
    // 期間内の最大値と最小値を求める
    let max = prices[i - (period - 1)];
    let min = prices[i - (period - 1)];
    
    for (let j = i - (period - 1); j <= i; j++) {
      if (prices[j] > max) max = prices[j];
      if (prices[j] < min) min = prices[j];
    }
    
    // 期間の平均価格
    let avg = 0;
    for (let j = i - (period - 1); j <= i; j++) {
      avg += prices[j];
    }
    avg /= period;
    
    // 価格変動率 = (最大値 - 最小値) / 平均価格
    const volatility = (max - min) / avg;
    
    // 安定性 = 100 - (変動率 * 100)、最小値は0に制限
    const stability = Math.max(0, 100 - (volatility * 100));
    
    result.push(stability);
  }
  
  return result;
};
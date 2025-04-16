const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 4000;

// CORS設定とJSONパーサーを追加
app.use(cors());
app.use(express.json());

// メモリ内にAPI設定を保存（デモ用）
let apiConfig = null;

// ステータスエンドポイント
app.get('/api/status', (req, res) => {
  res.json({ status: 'OK', message: 'BTP-kun backend is running' });
});

// API設定取得エンドポイント
app.get('/api/config', (req, res) => {
  if (!apiConfig) {
    return res.status(404).json({ message: 'API configuration not found' });
  }
  // APIシークレットは返さない
  res.json({ apiKey: apiConfig.apiKey });
});

// API設定保存エンドポイント
app.post('/api/config', (req, res) => {
  const { apiKey, apiSecret } = req.body;
  
  if (!apiKey || !apiSecret) {
    return res.status(400).json({ message: 'API key and secret are required' });
  }
  
  // メモリに保存（実際の実装ではデータベースに保存すべき）
  apiConfig = { apiKey, apiSecret };
  
  res.json({ message: 'API configuration saved successfully' });
});

// API接続テストエンドポイント
app.post('/api/config/test', (req, res) => {
  const { apiKey, apiSecret } = req.body;
  
  if (!apiKey || !apiSecret) {
    return res.status(400).json({ message: 'API key and secret are required' });
  }
  
  // ここでMEXC APIへの実際のテスト接続を実装できます
  // 簡単のため、常に成功を返します
  res.json({ message: 'API connection test successful' });
});

// 市場データエンドポイント（ダミーデータ）
app.get('/api/market', (req, res) => {
  // ダミーの市場データを返す
  res.json({
    symbol: 'OKM/USDT',
    lastPrice: 0.02134,
    priceChange: -0.00023,
    priceChangePercent: -1.07,
    volume: 12456789,
    high24h: 0.02210,
    low24h: 0.02100
  });
});

// チャートデータエンドポイント（ダミーデータ）
app.get('/api/chart', (req, res) => {
  const timeframe = req.query.interval || 'hourly';
  const limit = parseInt(req.query.limit) || 100;
  
  // ダミーのチャートデータを生成
  const now = Date.now();
  const candles = [];
  
  // 基準価格
  let basePrice = 0.02134;
  let lastClose = basePrice;
  
  // タイムフレームに応じた時間間隔（ミリ秒）
  const intervalMap = {
    'oneMin': 60 * 1000,
    'threeMin': 3 * 60 * 1000,
    'fiveMin': 5 * 60 * 1000,
    'tenMin': 10 * 60 * 1000,
    'fifteenMin': 15 * 60 * 1000,
    'thirtyMin': 30 * 60 * 1000,
    'hourly': 60 * 60 * 1000,
    'fourHour': 4 * 60 * 60 * 1000,
    'daily': 24 * 60 * 60 * 1000
  };
  
  const intervalMs = intervalMap[timeframe] || 60 * 60 * 1000;
  
  // ダミーローソク足データを生成
  for (let i = 0; i < limit; i++) {
    const timestamp = now - (limit - i) * intervalMs;
    
    // 価格変動のシミュレーション
    const volatility = 0.005; // 0.5%の変動
    const changePercent = (Math.random() - 0.5) * volatility;
    const open = lastClose;
    const change = open * changePercent;
    const close = open + change;
    
    // 高値と安値
    const high = Math.max(open, close) + (Math.random() * open * 0.002);
    const low = Math.min(open, close) - (Math.random() * open * 0.002);
    
    // 出来高
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
  
  res.json({ candles });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

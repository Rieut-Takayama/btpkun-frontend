const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
const PORT = 4000;

// CORS設定
app.use(cors());
app.use(express.json());

// ログミドルウェア
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ステータスエンドポイント
app.get("/api/status", (req, res) => {
  res.json({ status: "OK", message: "Simple server is running" });
});

// 市場データ（実際のMEXC APIから取得）
app.get("/api/market", async (req, res) => {
  try {
    const response = await axios.get("https://api.mexc.com/api/v3/ticker/24hr", {
      params: { symbol: "OKMUSDT" }
    });
    
    const data = response.data;
    
    // フロントエンドが期待する形式に変換
    const marketData = {
      symbol: "OKM/USDT",
      lastPrice: parseFloat(data.lastPrice),
      priceChange: parseFloat(data.priceChange),
      priceChangePercent: parseFloat(data.priceChangePercent),
      volume: parseFloat(data.volume),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice)
    };
    
    res.json(marketData);
  } catch (error) {
    console.error("市場データ取得エラー:", error.message);
    
    // エラー時はダミーデータを返す
    res.json({
      symbol: "OKM/USDT",
      lastPrice: 0.02134,
      priceChange: -0.00023,
      priceChangePercent: -1.07,
      volume: 12456789,
      high24h: 0.02210,
      low24h: 0.02100
    });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Simple server running at http://localhost:${PORT}`);
});

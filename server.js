require('dotenv').config();
const mongoose = require('mongoose');
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const crypto = require("crypto");
const path = require("path");

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('[BTP-kun] MongoDB接続成功 ✅');
}).catch((err) => {
    console.error('[BTP-kun] MongoDB接続失敗 ❌:', err);
});

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
app.use(express.static(path.join(__dirname, "build")));

let apiConfig = null;

app.get("/api/status", (req, res) => {
    res.json({ status: "OK", message: "BTP-kun backend is running" });
});

app.get("/api/config", (req, res) => {
    if (!apiConfig) {
        return res.status(404).json({ message: "API configuration not found" });
    }
    res.json({ apiKey: apiConfig.apiKey });
});

app.post("/api/config", (req, res) => {
    const { apiKey, apiSecret } = req.body;
    if (!apiKey || !apiSecret) {
        return res.status(400).json({ message: "API key and secret are required" });
    }
    apiConfig = { apiKey, apiSecret };
    res.json({ message: "API configuration saved successfully" });
});

async function mexcRequest(endpoint, params = {}, method = "GET") {
    if (!apiConfig) throw new Error("API configuration not found");

    const baseUrl = "https://api.mexc.com";
    const url = baseUrl + endpoint;
    const headers = {
        "Content-Type": "application/json",
        "X-MEXC-APIKEY": apiConfig.apiKey
    };

    if (endpoint.startsWith("/api/v3")) {
        params.timestamp = Date.now();
        const queryString = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join("&");
        const signature = crypto.createHmac("sha256", apiConfig.apiSecret).update(queryString).digest("hex");
        params.signature = signature;
    }

    try {
        const response = method === "GET"
            ? await axios.get(url, { params, headers })
            : await axios.post(url, params, { headers });
        return response.data;
    } catch (error) {
        console.error("MEXC API error:", error.response ? error.response.data : error.message);
        throw error;
    }
}

app.post("/api/config/test", async (req, res) => {
    const { apiKey, apiSecret } = req.body;
    if (!apiKey || !apiSecret) {
        return res.status(400).json({ message: "API key and secret are required" });
    }

    const tempConfig = { apiKey, apiSecret };
    const originalConfig = apiConfig;
    apiConfig = tempConfig;

    try {
        const testData = await axios.get("https://api.mexc.com/api/v3/ticker/24hr", {
            params: { symbol: "OKMUSDT" },
            headers: { "X-MEXC-APIKEY": apiKey }
        });
        if (testData.status === 200) {
            apiConfig = tempConfig;
            res.json({ message: "API connection successful", data: testData.data });
        } else {
            apiConfig = originalConfig;
            res.status(400).json({ message: "API connection failed" });
        }
    } catch (error) {
        apiConfig = originalConfig;
        res.status(400).json({
            message: "API connection failed",
            error: error.response ? error.response.data : error.message
        });
    }
});

app.get("/api/chart", async (req, res) => {
    try {
        const interval = req.query.interval || "hourly";
        const limit = parseInt(req.query.limit) || 100;
        const map = {
            oneMin: "1m", threeMin: "3m", fiveMin: "5m", tenMin: "15m",
            fifteenMin: "15m", thirtyMin: "30m", hourly: "1h", fourHour: "4h", daily: "1d"
        };
        const mexcInterval = map[interval] || "1h";

        let candles = [];
        if (apiConfig) {
            try {
                const response = await axios.get("https://api.mexc.com/api/v3/klines", {
                    params: { symbol: "OKMUSDT", interval: mexcInterval, limit }
                });
                candles = response.data.map(item => ({
                    timestamp: parseInt(item[0]),
                    open: parseFloat(item[1]),
                    high: parseFloat(item[2]),
                    low: parseFloat(item[3]),
                    close: parseFloat(item[4]),
                    volume: parseFloat(item[5])
                }));
            } catch (e) {
                candles = generateDummyCandles(limit);
            }
        } else {
            candles = generateDummyCandles(limit);
        }

        res.json({ candles });
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch chart data" });
    }
});

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// ================== AI通知・ログ保存 ===================

const User = require("./models/User");
const NotificationLog = require("./models/NotificationLog");

const notifyInterval = 30; // 分
let lastNotifiedAt = null;

setInterval(async () => {
    try {
        const { generateSignal } = require('./frontend/src/utils/signals');
        const signal = await generateSignal();
        const now = new Date();

        const canNotify = !lastNotifiedAt || (now - lastNotifiedAt) >= notifyInterval * 60 * 1000;

        if (signal && signal.strength >= 85 && canNotify) {
            console.log(`[BTP-kun] 強シグナル（${signal.strength}%）→ 通知送信`);

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_TARGET,
                subject: '【BTP-kun】強い買いシグナル通知',
                text: `強い買いシグナル（${signal.strength}%）が検出されました。`
            };

            await transporter.sendMail(mailOptions);
            lastNotifiedAt = now;

            await logNotification(process.env.EMAIL_TARGET, signal.strength);
            console.log('[BTP-kun] 通知送信完了');
        }
    } catch (err) {
        console.error('[BTP-kun] 通知処理エラー:', err);
    }
}, 1000);

// 通知ログ記録関数
async function logNotification(email, strength) {
    try {
        await NotificationLog.create({ email, strength });
        console.log('[BTP-kun] 通知ログを記録しました');
    } catch (err) {
        console.error('[BTP-kun] 通知ログ記録エラー:', err);
    }
}

// ダミーデータ生成（省略可）
function generateDummyCandles(limit) {
    const now = Date.now();
    const candles = [];
    let base = 0.02134;
    let close = base;

    for (let i = 0; i < limit; i++) {
        const ts = now - (limit - i) * 60 * 60 * 1000;
        const vol = 0.005, p = (Math.random() - 0.5) * vol;
        const open = close;
        const chg = open * p;
        const newClose = open + chg;
        const high = Math.max(open, newClose) + Math.random() * open * 0.002;
        const low = Math.min(open, newClose) - Math.random() * open * 0.002;
        const volume = 1000000 + Math.random() * 1000000;

        candles.push({ timestamp: ts, open, high, low, close: newClose, volume });
        close = newClose;
    }

    return candles;
}
setTimeout(async () => {
  const nodemailer = require("nodemailer");

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_TARGET,
    subject: '【BTP-kun】テスト通知',
    text: 'これはBTP-kunのメール通知テストです📩',
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('[BTP-kun] 📩 テスト通知メール送信完了');
  } catch (err) {
    console.error('[BTP-kun] ❌ テスト通知失敗:', err);
  }
}, 3000);

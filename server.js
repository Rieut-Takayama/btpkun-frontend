const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 4000;

// CORS�ݒ��JSON�p�[�T�[��ǉ�
app.use(cors());
app.use(express.json());

// ����������API�ݒ��ۑ��i�f���p�j
let apiConfig = null;

// �X�e�[�^�X�G���h�|�C���g
app.get('/api/status', (req, res) => {
  res.json({ status: 'OK', message: 'BTP-kun backend is running' });
});

// API�ݒ�擾�G���h�|�C���g
app.get('/api/config', (req, res) => {
  if (!apiConfig) {
    return res.status(404).json({ message: 'API configuration not found' });
  }
  // API�V�[�N���b�g�͕Ԃ��Ȃ�
  res.json({ apiKey: apiConfig.apiKey });
});

// API�ݒ�ۑ��G���h�|�C���g
app.post('/api/config', (req, res) => {
  const { apiKey, apiSecret } = req.body;
  
  if (!apiKey || !apiSecret) {
    return res.status(400).json({ message: 'API key and secret are required' });
  }
  
  // �������ɕۑ��i���ۂ̎����ł̓f�[�^�x�[�X�ɕۑ����ׂ��j
  apiConfig = { apiKey, apiSecret };
  
  res.json({ message: 'API configuration saved successfully' });
});

// API�ڑ��e�X�g�G���h�|�C���g
app.post('/api/config/test', (req, res) => {
  const { apiKey, apiSecret } = req.body;
  
  if (!apiKey || !apiSecret) {
    return res.status(400).json({ message: 'API key and secret are required' });
  }
  
  // ������MEXC API�ւ̎��ۂ̃e�X�g�ڑ��������ł��܂�
  // �ȒP�̂��߁A��ɐ�����Ԃ��܂�
  res.json({ message: 'API connection test successful' });
});

// �s��f�[�^�G���h�|�C���g�i�_�~�[�f�[�^�j
app.get('/api/market', (req, res) => {
  // �_�~�[�̎s��f�[�^��Ԃ�
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

// �`���[�g�f�[�^�G���h�|�C���g�i�_�~�[�f�[�^�j
app.get('/api/chart', (req, res) => {
  const timeframe = req.query.interval || 'hourly';
  const limit = parseInt(req.query.limit) || 100;
  
  // �_�~�[�̃`���[�g�f�[�^�𐶐�
  const now = Date.now();
  const candles = [];
  
  // ����i
  let basePrice = 0.02134;
  let lastClose = basePrice;
  
  // �^�C���t���[���ɉ��������ԊԊu�i�~���b�j
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
  
  // �_�~�[���[�\�N���f�[�^�𐶐�
  for (let i = 0; i < limit; i++) {
    const timestamp = now - (limit - i) * intervalMs;
    
    // ���i�ϓ��̃V�~�����[�V����
    const volatility = 0.005; // 0.5%�̕ϓ�
    const changePercent = (Math.random() - 0.5) * volatility;
    const open = lastClose;
    const change = open * changePercent;
    const close = open + change;
    
    // ���l�ƈ��l
    const high = Math.max(open, close) + (Math.random() * open * 0.002);
    const low = Math.min(open, close) - (Math.random() * open * 0.002);
    
    // �o����
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
  
  // �{�����W���[�o���h�����u���C�N�̃V�i���I���쐬�i�ŐV�̐��{�j
  const recent = candles.slice(-5);
  
  // �����ւ̋}��
  recent[1].close = recent[1].close * 0.98;
  recent[1].low = recent[1].close * 0.97;
  recent[2].open = recent[1].close;
  recent[2].close = recent[2].open * 0.97;
  recent[2].low = recent[2].close * 0.96;
  recent[2].high = recent[2].open;
  
  // ��
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

// �T�[�o�[�N��
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

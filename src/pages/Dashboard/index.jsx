﻿import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { getLatestMarketData } from '../../services/chartService';
import { formatNumber } from '../../utils/formatters';
import ChartControls from '../../components/ChartControls';
import './Dashboard.css';

const Dashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [marketData, setMarketData] = useState(null);
  const [error, setError] = useState(null);
  const [buySignals, setBuySignals] = useState([]);
  const [buyMeter, setBuyMeter] = useState(0);

  // ログアウト処理
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // コンポーネントマウント時にAPIステータスを確認
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        await api.get(api.endpoints.status);
        setConnectionStatus('connected');
        
        // API接続成功したら市場データを取得
        try {
          const data = await getLatestMarketData();
          setMarketData(data);
        } catch (marketError) {
          console.error('Market data fetch error:', marketError);
          // 市場データ取得エラー時はダミーデータを使用
          setMarketData({
            symbol: 'OKM/USDT',
            lastPrice: 0.02134,
            priceChange: -0.00023,
            priceChangePercent: -1.07,
            volume: 12456789,
            high24h: 0.02210,
            low24h: 0.02100
          });
        }
      } catch (err) {
        setConnectionStatus('disconnected');
        setError('APIサーバーに接続できません。');
        console.error('API status check error:', err);
        
        // API接続エラー時もダミーデータを使用
        setMarketData({
          symbol: 'OKM/USDT',
          lastPrice: 0.02134,
          priceChange: -0.00023,
          priceChangePercent: -1.07,
          volume: 12456789,
          high24h: 0.02210,
          low24h: 0.02100
        });
      }
    };

    checkApiStatus();

    // 定期的にAPIステータスをチェック
    const intervalId = setInterval(checkApiStatus, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // シグナル更新ハンドラー（ChartControlsから呼び出される）
  const handleSignalsChange = (signals) => {
    setBuySignals(signals);
  };

  // 買い度更新ハンドラー（ChartControlsから呼び出される）
  const handleBuyScoreChange = (score) => {
    setBuyMeter(score);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-logo">
          <h1>BTP-kun</h1>
          <div className="subtitle">ウルフハンター</div>
        </div>

        <nav className="dashboard-nav">
          <Link to="/dashboard" className="nav-item active">ダッシュボード</Link>
          <Link to="/settings" className="nav-item">API設定</Link>
          <button onClick={handleLogout} className="logout-button">ログアウト</button>
        </nav>
      </header>

      <main className="dashboard-content">
        {error && <div className="error-message">{error}</div>}

        <div className="dashboard-grid">
          {/* 市場データパネル */}
          <div className="dashboard-card market-data-grid">
            <div className="card-header">
              <h2 className="card-title">市場データ</h2>
              <div className="card-actions">
                <span className={"status-indicator status-" + connectionStatus}></span>
                <span>{connectionStatus === 'connected' ? '接続中' : '未接続'}</span>
              </div>
            </div>

            {marketData ? (
              <div className="market-data">
                <div className="data-row">
                  <span className="data-label">銘柄:</span>
                  <span className="data-value">{marketData.symbol}</span>
                </div>
                <div className="data-row">
                  <span className="data-label">現在値:</span>
                  <span className="data-value">{formatNumber(marketData.lastPrice, 6)}</span>
                </div>
                <div className="data-row">
                  <span className="data-label">変動額:</span>
                  <span className="data-value" style={{
                    color: marketData.priceChange >= 0 ? 'var(--success-color)' : 'var(--error-color)'
                  }}>
                    {formatNumber(marketData.priceChange, 6)} ({marketData.priceChangePercent}%)
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">出来高:</span>
                  <span className="data-value">{formatNumber(marketData.volume)}</span>
                </div>
                <div className="data-row">
                  <span className="data-label">高値:</span>
                  <span className="data-value">{formatNumber(marketData.high24h, 6)}</span>
                </div>
                <div className="data-row">
                  <span className="data-label">安値:</span>
                  <span className="data-value">{formatNumber(marketData.low24h, 6)}</span>
                </div>
              </div>
            ) : (
              <div className="loading-message">データ読み込み中...</div>
            )}
          </div>

          {/* チャートエリア */}
          <div className="dashboard-card chart-container">
            <div className="card-header">
              <h2 className="card-title">ボリンジャーバンドチャート</h2>
            </div>
            <ChartControls 
              marketData={marketData} 
              onSignalsChange={handleSignalsChange}
              onBuyScoreChange={handleBuyScoreChange}
            />
          </div>

          {/* シグナル一覧 */}
          <div className="dashboard-card signals-container">
            <div className="card-header">
              <h2 className="card-title">シグナル検出</h2>
            </div>
            <div className="signals-list">
              {buySignals.length > 0 ? (
                buySignals.map((signal) => (
                  <div key={signal.id} className="signal-item">
                    <div className="signal-type">
                      {signal.type === 'ACCUMULATION_PHASE' ? '仕込みフェーズ' :
                       signal.type === 'V_REVERSAL' ? 'V字反発' :
                       signal.type === 'BB_BREAK' ? 'BB下限ブレイク' : signal.type}
                    </div>
                    <div className="signal-message">{signal.message}</div>
                    <div className="signal-strength">買い度: +{signal.strength}</div>
                  </div>
                ))
              ) : (
                <div className="no-signals">検出されたシグナルはありません</div>
              )}
            </div>
          </div>

          {/* 買い度メーター */}
          <div className="dashboard-card buy-meter-container">
            <div className="card-header">
              <h2 className="card-title">買い度メーター</h2>
            </div>
            <div className="buy-meter">
              <div
                className="buy-meter-progress"
                style={{ 
                  width: buyMeter + "%",
                  backgroundColor: 
                    buyMeter < 30 ? 'var(--error-color)' :
                    buyMeter < 50 ? 'var(--warning-color)' :
                    buyMeter < 70 ? 'var(--info-color)' : 'var(--success-color)'
                }}
              ></div>
              <div className="buy-meter-value">{buyMeter}%</div>
            </div>
            <div className="buy-meter-legend">
              <div>0%</div>
              <div>弱</div>
              <div>中</div>
              <div>強</div>
              <div>100%</div>
            </div>
          </div>

          {/* アクションパネル - 買い度が70%以上の場合のみ表示 */}
          {buyMeter >= 70 && (
            <div className="dashboard-card actions-panel">
              <div className="card-header">
                <h2 className="card-title">推奨アクション</h2>
              </div>
              <div className="action-item">
                <div className="action-title">推奨買い指値</div>
                <div className="action-description">
                  {marketData && formatNumber(marketData.lastPrice * 0.99, 6)} (現在価格の-1%)
                </div>
              </div>
              <div className="action-item">
                <div className="action-title">利確目安</div>
                <div className="action-description">
                  {marketData && formatNumber(marketData.lastPrice * 1.07, 6)} (現在価格の+7%)
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
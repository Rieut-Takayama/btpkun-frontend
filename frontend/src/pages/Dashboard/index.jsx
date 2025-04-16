import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { getLatestMarketData } from '../../services/chartService';
import { formatNumber } from '../../utils/formatters';
import ChartControls from '../../components/ChartControls';
import notificationService from '../../services/notification';
import './Dashboard.css';

const Dashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [marketData, setMarketData] = useState(null);
  const [error, setError] = useState(null);
  const [buySignals, setBuySignals] = useState([]);
  const [buyMeter, setBuyMeter] = useState(0);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [notificationSettings, setNotificationSettings] = useState(null);
  const previousSignalsRef = useRef([]);

  // Logout handler
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch notification settings
  useEffect(() => {
    const fetchNotificationSettings = async () => {
      try {
        const settings = await notificationService.getSettings();
        setNotificationSettings(settings);
      } catch (err) {
        console.error('Failed to load notification settings:', err);
      }
    };

    fetchNotificationSettings();
  }, []);

  // Check API status on component mount
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        await api.get(api.endpoints.status);
        setConnectionStatus('connected');

        // Fetch market data on successful API connection
        try {
          const data = await getLatestMarketData();
          setMarketData(data);
        } catch (marketError) {
          console.error('Market data fetch error:', marketError);
          // Use dummy data on error
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
        setError('Failed to connect to API server');
        console.error('API status check error:', err);

        // Use dummy data on API connection error
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

    // Check API status periodically
    const intervalId = setInterval(checkApiStatus, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // Signal update handler (called from ChartControls)
  const handleSignalsChange = (signals) => {
    setBuySignals(signals);
    
    // Detect and notify new signals
    if (notificationSettings?.enabled) {
      const prevSignalIds = previousSignalsRef.current.map(s => s.id);
      const newSignals = signals.filter(signal => 
        !prevSignalIds.includes(signal.id) && 
        signal.strength >= (notificationSettings.minStrength || 0)
      );
      
      // Show notification for new signals
      newSignals.forEach(signal => {
        let signalTypeName = '';
        switch(signal.type) {
          case 'ACCUMULATION_PHASE': 
            signalTypeName = 'Accumulation Phase'; 
            break;
          case 'V_REVERSAL': 
            signalTypeName = 'V Reversal'; 
            break;
          case 'BB_BREAK': 
            signalTypeName = 'BB Lower Break'; 
            break;
          default: 
            signalTypeName = signal.type;
        }
        
        notificationService.showBrowserNotification(
          `New Signal Detected: ${signalTypeName}`,
          {
            body: `Buy Score: ${signal.strength}% - ${signal.message}`,
            icon: '/favicon.ico'
          }
        );
      });
    }
    
    // Save current signals
    previousSignalsRef.current = [...signals];
    
    // Deselect if selected signal is updated or removed
    if (selectedSignal && !signals.find(s => s.id === selectedSignal.id)) {
      setSelectedSignal(null);
    }
  };

  // Buy score update handler (called from ChartControls)
  const handleBuyScoreChange = (score) => {
    setBuyMeter(score);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-logo">
          <h1>BTP-kun</h1>
          <div className="subtitle">Wolf Hunter</div>
        </div>

        <nav className="dashboard-nav">
          <Link to="/dashboard" className="nav-item active">Dashboard</Link>
          <Link to="/settings" className="nav-item">API Settings</Link>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </nav>
      </header>

      <main className="dashboard-content">
        {error && <div className="error-message">{error}</div>}

        <div className="dashboard-grid">
          {/* Market Data Panel */}
          <div className="dashboard-card market-data-grid">
            <div className="card-header">
              <h2 className="card-title">Market Data</h2>
              <div className="card-actions">
                <span className={"status-indicator status-" + connectionStatus}></span>
                <span>{connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>

            {marketData ? (
              <div className="market-data">
                <div className="data-row">
                  <span className="data-label">Symbol:</span>
                  <span className="data-value">{marketData.symbol}</span>
                </div>
                <div className="data-row">
                  <span className="data-label">Current Price:</span>
                  <span className="data-value">{formatNumber(marketData.lastPrice, 6)}</span>
                </div>
                <div className="data-row">
                  <span className="data-label">Change:</span>
                  <span className="data-value" style={{
                    color: marketData.priceChange >= 0 ? 'var(--success-color)' : 'var(--error-color)'
                  }}>
                    {formatNumber(marketData.priceChange, 6)} ({marketData.priceChangePercent}%)
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">Volume:</span>
                  <span className="data-value">{formatNumber(marketData.volume)}</span>
                </div>
                <div className="data-row">
                  <span className="data-label">High:</span>
                  <span className="data-value">{formatNumber(marketData.high24h, 6)}</span>
                </div>
                <div className="data-row">
                  <span className="data-label">Low:</span>
                  <span className="data-value">{formatNumber(marketData.low24h, 6)}</span>
                </div>
              </div>
            ) : (
              <div className="loading-message">Loading data...</div>
            )}
          </div>

          {/* Chart Area */}
          <div className="dashboard-card chart-container">
            <div className="card-header">
              <h2 className="card-title">Bollinger Band Chart</h2>
            </div>
            <ChartControls
              marketData={marketData}
              onSignalsChange={handleSignalsChange}
              onBuyScoreChange={handleBuyScoreChange}
            />
          </div>

          {/* Signal List */}
          <div className="dashboard-card signals-container">
            <div className="card-header">
              <h2 className="card-title">Signal Detection</h2>
            </div>
            <div className="signals-list">
              {buySignals.length > 0 ? (
                buySignals.map((signal) => (
                  <React.Fragment key={signal.id}>
                    <div
                      className="signal-item"
                      onClick={() => setSelectedSignal(selectedSignal?.id === signal.id ? null : signal)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="signal-type">
                        {signal.type === 'ACCUMULATION_PHASE' ? 'Accumulation Phase' :
                         signal.type === 'V_REVERSAL' ? 'V Reversal' :
                         signal.type === 'BB_BREAK' ? 'BB Lower Break' : signal.type}
                      </div>
                      <div className="signal-message">{signal.message}</div>
                      <div className="signal-strength">Buy Score: +{signal.strength}</div>
                      <div className="signal-more-info">
                        {selectedSignal?.id === signal.id ? ' Hide Details' : ' Show Details'}
                      </div>
                    </div>

                    {selectedSignal?.id === signal.id && signal.evidence && (
                      <div className="signal-evidence">
                        <h4>Evidence:</h4>
                        {signal.evidence.map((ev, idx) => (
                          <div key={idx} className="evidence-item">
                            <div className="evidence-name">{ev.name}:</div>
                            <div className="evidence-value">{ev.value}</div>

                            {ev.details && (
                              <div className="evidence-details">
                                <h5>Detailed Data:</h5>
                                <ul>
                                  {ev.details.map((detail, detailIdx) => (
                                    <li key={detailIdx}>
                                      <span className="detail-name">{detail.name}:</span>
                                      <span className="detail-value">{detail.value}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <div className="no-signals">No signals detected</div>
              )}
            </div>
          </div>

          {/* Buy Meter */}
          <div className="dashboard-card buy-meter-container">
            <div className="card-header">
              <h2 className="card-title">Buy Score Meter</h2>
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
              <div>Low</div>
              <div>Med</div>
              <div>High</div>
              <div>100%</div>
            </div>
          </div>

          {/* Action Panel - only shown when buy score is 70% or higher */}
          {buyMeter >= 70 && (
            <div className="dashboard-card actions-panel">
              <div className="card-header">
                <h2 className="card-title">Recommended Actions</h2>
              </div>
              <div className="action-item">
                <div className="action-title">Suggested Buy Price</div>
                <div className="action-description">
                  {marketData && formatNumber(marketData.lastPrice * 0.99, 6)} (Current price -1%)
                </div>
              </div>
              <div className="action-item">
                <div className="action-title">Target Take Profit</div>
                <div className="action-description">
                  {marketData && formatNumber(marketData.lastPrice * 1.07, 6)} (Current price +7%)
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

import React, { useState } from 'react';
import './ChartControls.css';

const ChartControls = ({ marketData }) => {
  const [timeframe, setTimeframe] = useState('1h'); // デフォルトは1時間足
  
  // タイムフレーム変更ハンドラー
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };
  
  return (
    <div className="chart-controls">
      <div className="timeframe-selector">
        <button 
          className={"timeframe-button " + (timeframe === '1m' ? 'active' : '')}
          onClick={() => handleTimeframeChange('1m')}
        >
          1分
        </button>
        <button 
          className={"timeframe-button " + (timeframe === '3m' ? 'active' : '')}
          onClick={() => handleTimeframeChange('3m')}
        >
          3分
        </button>
        <button 
          className={"timeframe-button " + (timeframe === '5m' ? 'active' : '')}
          onClick={() => handleTimeframeChange('5m')}
        >
          5分
        </button>
        <button 
          className={"timeframe-button " + (timeframe === '10m' ? 'active' : '')}
          onClick={() => handleTimeframeChange('10m')}
        >
          10分
        </button>
        <button 
          className={"timeframe-button " + (timeframe === '15m' ? 'active' : '')}
          onClick={() => handleTimeframeChange('15m')}
        >
          15分
        </button>
        <button 
          className={"timeframe-button " + (timeframe === '30m' ? 'active' : '')}
          onClick={() => handleTimeframeChange('30m')}
        >
          30分
        </button>
        <button 
          className={"timeframe-button " + (timeframe === '1h' ? 'active' : '')}
          onClick={() => handleTimeframeChange('1h')}
        >
          1時間
        </button>
        <button 
          className={"timeframe-button " + (timeframe === '4h' ? 'active' : '')}
          onClick={() => handleTimeframeChange('4h')}
        >
          4時間
        </button>
        <button 
          className={"timeframe-button " + (timeframe === '1d' ? 'active' : '')}
          onClick={() => handleTimeframeChange('1d')}
        >
          1日
        </button>
      </div>
      
      <div className="chart-placeholder">
        <div style={{ 
          height: '250px', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 20px'
        }}>
          <div style={{ marginBottom: '10px', color: 'var(--primary-color)' }}>
            現在の時間足: <span style={{ fontWeight: 'bold' }}>{
              timeframe === '1m' ? '1分' :
              timeframe === '3m' ? '3分' :
              timeframe === '5m' ? '5分' :
              timeframe === '10m' ? '10分' :
              timeframe === '15m' ? '15分' :
              timeframe === '30m' ? '30分' :
              timeframe === '1h' ? '1時間' :
              timeframe === '4h' ? '4時間' :
              timeframe === '1d' ? '1日' : '不明'
            }</span>
          </div>
          <div>
            Chart.jsでボリンジャーバンドチャートを実装予定です。現在は表示切替のデモのみ動作します。
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartControls;

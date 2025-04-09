import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getChartData, generateDummyData } from '../../services/chartService';
import './ChartControls.css';

// Chart.jsの登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ChartControls = ({ onBuyScoreChange, onSignalsChange }) => {
  const [timeframe, setTimeframe] = useState('1h'); // デフォルトは1時間足
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

  // タイムフレーム変更ハンドラー
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
    setLoading(true);
    // タイムフレーム変更時にデータを再取得
    fetchChartData(newTimeframe);
  };

  // チャートデータの取得
  const fetchChartData = async (tf) => {
    try {
      setLoading(true);
      setError(null);

      // データの取得（実際のAPIかダミーデータ）
      let data;
      
      try {
        // 実際のAPIからデータを取得
        data = await getChartData(tf);
      } catch (apiError) {
        console.error('API data fetch failed, using dummy data:', apiError);
        // APIエラー時はダミーデータを使用
        data = generateDummyData(tf);
      }
      
      setChartData(data);
      
      // 親コンポーネントに買い度とシグナルの変更を通知
      if (onBuyScoreChange && data.buyScore !== undefined) {
        onBuyScoreChange(data.buyScore);
      }
      
      if (onSignalsChange && data.signals) {
        const signalsList = Object.values(data.signals)
          .filter(signal => signal.detected)
          .map((signal, index) => ({
            id: index + 1,
            type: signal.type,
            message: signal.message,
            strength: signal.strength,
            timestamp: new Date()
          }));
        
        onSignalsChange(signalsList);
      }
    } catch (err) {
      console.error('Failed to load chart data:', err);
      setError('チャートデータの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // コンポーネント初期化時にデータを取得
  useEffect(() => {
    fetchChartData(timeframe);
    
    // 定期的なデータ更新（1分ごと）
    const intervalId = setInterval(() => {
      fetchChartData(timeframe);
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  // チャートオプションとデータの設定
  const getChartOptions = () => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            maxRotation: 0,
            callback: function(value, index) {
              // X軸のラベルを間引いて表示
              if (!chartData) return '';
              const date = new Date(chartData.timestamps[index]);
              return index % 10 === 0 ? 
                `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}` : '';
            }
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            precision: 6
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: 'rgba(255, 255, 255, 0.7)'
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += context.parsed.y.toFixed(6);
              return label;
            },
            title: function(tooltipItems) {
              if (!chartData) return '';
              const index = tooltipItems[0].dataIndex;
              const date = new Date(chartData.timestamps[index]);
              return date.toLocaleString();
            }
          }
        }
      }
    };
  };

  const getChartData = () => {
  if (!chartData || !chartData.indicators || !chartData.indicators.bollingerBands) {
    return { datasets: [] };
  }

    const { closes, indicators } = chartData;
    const bb = indicators.bollingerBands;
    
    // 日付ラベルの生成
    const labels = chartData.timestamps.map(ts => new Date(ts).toLocaleString());

    return {
      labels,
      datasets: [
        {
          label: '価格',
          data: closes,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          pointRadius: 1,
          pointHoverRadius: 5,
          pointHitRadius: 10,
        },
        {
          label: 'BB上限',
          data: bb.upper,
          borderColor: 'rgba(255, 99, 132, 0.8)',
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.1,
          fill: false
        },
        {
          label: 'BB中央',
          data: bb.middle,
          borderColor: 'rgba(255, 206, 86, 0.8)',
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.1,
          fill: false
        },
        {
          label: 'BB下限',
          data: bb.lower,
          borderColor: 'rgba(54, 162, 235, 0.8)',
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.1,
          fill: false
        }
      ]
    };
  };

  return (
    <div className="chart-controls">
      <div className="timeframe-selector">
                <button
          className={"timeframe-button " + (timeframe === '1m' ? 'active' : '')}
          onClick={() => handleTimeframeChange('1m')}
          style={{ fontFamily: 'sans-serif' }}
        >
          1分
        </button>
                <button
          className={"timeframe-button " + (timeframe === '3m' ? 'active' : '')}
          onClick={() => handleTimeframeChange('3m')}
          style={{ fontFamily: 'sans-serif' }}
        >
          3分
        </button>
                <button
          className={"timeframe-button " + (timeframe === '5m' ? 'active' : '')}
          onClick={() => handleTimeframeChange('5m')}
          style={{ fontFamily: 'sans-serif' }}
        >
          5分
        </button>
                <button
          className={"timeframe-button " + (timeframe === '10m' ? 'active' : '')}
          onClick={() => handleTimeframeChange('10m')}
          style={{ fontFamily: 'sans-serif' }}
        >
          10分
        </button>
                <button
          className={"timeframe-button " + (timeframe === '15m' ? 'active' : '')}
          onClick={() => handleTimeframeChange('15m')}
          style={{ fontFamily: 'sans-serif' }}
        >
          15分
        </button>
                <button
          className={"timeframe-button " + (timeframe === '30m' ? 'active' : '')}
          onClick={() => handleTimeframeChange('30m')}
          style={{ fontFamily: 'sans-serif' }}
        >
          30分
        </button>
                <button
          className={"timeframe-button " + (timeframe === '1h' ? 'active' : '')}
          onClick={() => handleTimeframeChange('1h')}
          style={{ fontFamily: 'sans-serif' }}
        >
          1時間
        </button>
                <button
          className={"timeframe-button " + (timeframe === '4h' ? 'active' : '')}
          onClick={() => handleTimeframeChange('4h')}
          style={{ fontFamily: 'sans-serif' }}
        >
          4時間
        </button>
                <button
          className={"timeframe-button " + (timeframe === '1d' ? 'active' : '')}
          onClick={() => handleTimeframeChange('1d')}
          style={{ fontFamily: 'sans-serif' }}
        >
          1日
        </button>
      </div>

      <div className="chart-container">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <div>データ読み込み中...</div>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {chartData && !loading && !error ? (
          <div className="chart-wrapper">
            <Line 
              ref={chartRef}
              options={getChartOptions()} 
              data={getChartData()} 
            />
          </div>
        ) : (!loading && !error) && (
          <div className="chart-placeholder">
            <div>チャートデータがありません</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartControls;



import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import './ApiSettings.css';

const ApiSettings = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  // ログアウト処理
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // 保存済みAPI設定の取得
  useEffect(() => {
    const fetchApiConfig = async () => {
      try {
        setIsLoading(true);
        const config = await api.get(api.endpoints.apiConfig);
        
        if (config && config.apiKey) {
          setApiKey(config.apiKey);
          // APIシークレットはセキュリティ上の理由で表示しない
          // プレースホルダとして「*」を表示
          setApiSecret('********');
        }
      } catch (err) {
        console.error('Error fetching API config:', err);
        setError('API設定の取得に失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApiConfig();
  }, []);
  
  // API設定の保存
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!apiKey || !apiSecret || apiSecret === '********') {
      setError('APIキーとシークレットを入力してください。');
      return;
    }
    
    try {
      setIsSaving(true);
      setError('');
      
      await api.post(api.endpoints.apiConfig, {
        apiKey,
        apiSecret: apiSecret === '********' ? null : apiSecret // プレースホルダの場合は更新しない
      });
      
      setTestResult({
        status: 'success',
        message: 'API設定を保存しました。'
      });
      
      // APIシークレットをプレースホルダに戻す
      setApiSecret('********');
    } catch (err) {
      console.error('Error saving API config:', err);
      setError('API設定の保存に失敗しました。');
      setTestResult({
        status: 'error',
        message: '保存に失敗しました。: ' + (err.response?.data?.message || err.message)
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // API接続テスト
  const handleTest = async () => {
    if (!apiKey || !apiSecret || apiSecret === '********') {
      setError('APIキーとシークレットを入力してください。');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      setTestResult(null);
      
      const result = await api.post(api.endpoints.testApiConnection, {
        apiKey,
        apiSecret: apiSecret === '********' ? null : apiSecret
      });
      
      setTestResult({
        status: 'success',
        message: '接続テスト成功！MEXCと正常に通信できました。'
      });
    } catch (err) {
      console.error('API test error:', err);
      setTestResult({
        status: 'error',
        message: '接続テスト失敗: ' + (err.response?.data?.message || err.message)
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="settings-container">
      <header className="settings-header">
        <div className="settings-logo">
          <h1>BTP-kun</h1>
          <div className="subtitle">ウルフハンター</div>
        </div>
        
        <nav className="settings-nav">
          <Link to="/dashboard" className="nav-item">ダッシュボード</Link>
          <Link to="/settings" className="nav-item active">API設定</Link>
          <button onClick={handleLogout} className="logout-button">ログアウト</button>
        </nav>
      </header>
      
      <main className="settings-content">
        <div className="settings-card">
          <h2 className="settings-title">MEXC API設定</h2>
          
          <p className="settings-description">
            MEXCの取引所APIキーとシークレットを設定してください。これらはデータ取得とアラート生成に使用されます。
            APIキーの作成方法は <a href="https://www.mexc.com/api/setting/spot" target="_blank" rel="noopener noreferrer" className="guide-link">MEXC API設定ガイド</a> を参照してください。
          </p>
          
          {error && <div className="test-result test-error">{error}</div>}
          
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="apiKey">APIキー</label>
              <input
                id="apiKey"
                type="text"
                className="form-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isLoading || isSaving}
                placeholder="MEXCのAPIキーを入力"
              />
              <p className="form-description">
                APIキーはMEXCアカウントの「API管理」ページで作成できます。
              </p>
            </div>
            
            <div className="form-group">
              <label htmlFor="apiSecret">APIシークレット</label>
              <input
                id="apiSecret"
                type="password"
                className="form-input"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                disabled={isLoading || isSaving}
                placeholder="MEXCのAPIシークレットを入力"
              />
              <p className="form-description">
                セキュリティのため、APIシークレットは暗号化して保存されます。
              </p>
            </div>
            
            {testResult && (
              <div className={"test-result test-" + testResult.status}>
                {testResult.message}
              </div>
            )}
            
            <div className="form-buttons">
              <button 
                type="button" 
                className="button-secondary"
                onClick={handleTest}
                disabled={isLoading || isSaving}
              >
                {isLoading ? '接続テスト中...' : '接続テスト'}
              </button>
              
              <button 
                type="submit" 
                className="button-primary"
                disabled={isLoading || isSaving}
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="settings-card">
          <h2 className="settings-title">設定ガイド</h2>
          
          <p className="settings-description">
            <strong>APIキーの作成手順:</strong>
          </p>
          <ol className="settings-description">
            <li>MEXCにログインし、アカウント設定ページに移動</li>
            <li>「API管理」を選択</li>
            <li>「APIキーの作成」をクリック</li>
            <li>必要な権限を選択（読み取り権限のみ推奨）</li>
            <li>セキュリティ認証を完了</li>
            <li>作成されたAPIキーとシークレットをこのページに入力</li>
          </ol>
          
          <p className="settings-description">
            <strong>注意:</strong> APIシークレットは一度しか表示されません。必ず安全な場所に保管してください。
          </p>
        </div>
      </main>
    </div>
  );
};

export default ApiSettings;

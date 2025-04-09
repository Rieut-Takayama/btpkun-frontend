import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  
  // すでに認証済みの場合はダッシュボードにリダイレクト
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 入力チェック
    if (!username || !password) {
      setError('ユーザー名とパスワードを入力してください');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // 簡易認証（開発用）
      // 後で実際のバックエンドAPIと連携する際に置き換え
      if (username === 'admin' && password === 'password') {
        // 認証成功
        const userData = {
          id: 1,
          username: 'admin',
          name: '管理者',
          role: 'admin'
        };
        
        // ローカルストレージにトークンを保存（実際のAPIでは返されるトークン）
        localStorage.setItem('token', 'dummy-token-for-development');
        
        // 認証コンテキストを更新
        login(userData);
        
        // ダッシュボードにリダイレクト
        navigate('/dashboard');
      } else {
        // 認証失敗
        setError('ユーザー名またはパスワードが正しくありません');
      }
    } catch (err) {
      // エラーメッセージの設定
      setError('ログインに失敗しました。ネットワーク接続を確認してください。');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <h1>BTP-kun</h1>
          <div className="subtitle">ウルフハンター</div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">ユーザー名</label>
            <input
              id="username"
              type="text"
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              autoComplete="username"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              id="password"
              type="password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
        
        <div style={{ marginTop: '15px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          開発用: ユーザー名 "admin" / パスワード "password"
        </div>
      </div>
    </div>
  );
};

export default Login;

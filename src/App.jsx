import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './styles.css';

// 実際のページコンポーネントをインポート
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ApiSettings from './pages/ApiSettings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* ログインページ - 認証不要 */}
            <Route path="/login" element={<Login />} />
            
            {/* ダッシュボード - 認証必須 */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* API設定 - 認証必須 */}
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <ApiSettings />
                </ProtectedRoute>
              } 
            />
            
            {/* ルートURLはダッシュボードにリダイレクト */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 404ページ - マッチしないすべてのルート */}
            <Route path="*" element={<div className="container"><h2>404 - ページが見つかりません</h2></div>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

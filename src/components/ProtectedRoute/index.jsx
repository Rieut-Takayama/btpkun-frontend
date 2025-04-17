import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// 保護されたルートコンポーネント
// このコンポーネントは認証済みユーザーのみアクセス可能なルートをラップします
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // 認証されていない場合、ログインページにリダイレクト
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 認証されている場合は子コンポーネントをレンダリング
  return children;
};

export default ProtectedRoute;

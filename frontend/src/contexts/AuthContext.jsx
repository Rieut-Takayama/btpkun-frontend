import React, { createContext, useState, useEffect, useContext } from 'react';

// 認証コンテキストの作成
const AuthContext = createContext();

// 認証プロバイダーコンポーネント
export const AuthProvider = ({ children }) => {
  // ローカルストレージから認証状態を取得
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user') || 'null')
  );

  // 認証状態が変更されたらローカルストレージを更新
  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated);
    localStorage.setItem('user', JSON.stringify(user));
  }, [isAuthenticated, user]);

  // ログイン関数
  const login = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  // ログアウト関数
  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  // コンテキスト値の定義
  const contextValue = {
    isAuthenticated,
    user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 認証コンテキストを使用するためのフック
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

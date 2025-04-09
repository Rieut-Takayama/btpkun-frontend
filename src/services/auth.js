import api from './api';

// 認証サービス
const authService = {
  // ログイン処理
  async login(username, password) {
    try {
      const response = await api.post(api.endpoints.login, {
        username,
        password
      });
      
      // レスポンスからトークンを取得して保存
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // ログアウト処理
  logout() {
    // ローカルストレージからトークンを削除
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    
    // サーバーサイドのログアウト処理も呼び出せる（オプション）
    try {
      return api.post(api.endpoints.logout);
    } catch (error) {
      console.error('Logout error:', error);
      // サーバーサイドのログアウトが失敗しても、ローカルの状態はクリアしているので
      // エラーを投げる必要はない場合が多い
    }
  },
  
  // 現在のユーザー情報を取得
  async getCurrentUser() {
    try {
      const response = await api.get('/api/user/profile');
      return response;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },
  
  // 認証状態のチェック
  isAuthenticated() {
    return localStorage.getItem('token') !== null;
  }
};

export default authService;

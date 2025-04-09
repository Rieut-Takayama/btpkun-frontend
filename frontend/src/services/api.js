import axios from 'axios';

// APIのベースURLを環境変数から取得、ない場合はデフォルト値を使用
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://btpkun-backend.onrender.com';

// Axiosインスタンスの作成
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10秒タイムアウト
  headers: {
    'Content-Type': 'application/json',
  }
});

// リクエストインターセプター（すべてのリクエストの前に実行される）
apiClient.interceptors.request.use(
  (config) => {
    // ローカルストレージからトークンを取得
    const token = localStorage.getItem('token');
    
    // トークンがあればヘッダーに追加
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター（すべてのレスポンスの後に実行される）
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // エラーレスポンスの処理
    if (error.response) {
      // サーバーからのエラーレスポンス
      console.error('API Error:', error.response.data);
      
      // 認証エラー(401)の場合はログアウト処理など
      if (error.response.status === 401) {
        // ここにログアウト処理を入れることもできる
        console.warn('Authentication required');
      }
    } else if (error.request) {
      // リクエストは送信されたがレスポンスがなかった
      console.error('No response received:', error.request);
    } else {
      // リクエスト作成中にエラー
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// APIエンドポイント
const endpoints = {
  // ステータス確認
  status: '/api/status',
  
  // 認証関連
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  
  // API設定関連
  apiConfig: '/api/config',
  testApiConnection: '/api/config/test',
  
  // 市場データ関連
  marketData: '/api/market',
  chart: '/api/chart',
  
  // 通知関連
  notifications: '/api/notifications',
  notificationSettings: '/api/notifications/settings',
};

// エクスポートする関数
export default {
  // GETリクエスト
  async get(endpoint, params = {}) {
    try {
      const response = await apiClient.get(endpoint, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // POSTリクエスト
  async post(endpoint, data = {}) {
    try {
      const response = await apiClient.post(endpoint, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // PUTリクエスト
  async put(endpoint, data = {}) {
    try {
      const response = await apiClient.put(endpoint, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // DELETEリクエスト
  async delete(endpoint) {
    try {
      const response = await apiClient.delete(endpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // エンドポイント一覧
  endpoints,
};

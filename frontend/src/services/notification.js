import api from './api';

// 通知サービス（簡略版）
const notificationService = {
  // 通知設定を取得
  async getSettings() {
    try {
      const response = await api.get(api.endpoints.notificationSettings);
      return response;
    } catch (error) {
      console.error('Get notification settings error:', error);
      throw error;
    }
  },

  // 通知設定を更新
  async updateSettings(settings) {
    try {
      const response = await api.put(api.endpoints.notificationSettings, settings);
      return response;
    } catch (error) {
      console.error('Update notification settings error:', error);
      throw error;
    }
  },

  // 通知履歴を取得
  async getNotifications(limit = 10) {
    try {
      const response = await api.get(api.endpoints.notifications, { limit });
      return response;
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  },

  // 通知を既読にする
  async markAsRead(notificationId) {
    try {
      const response = await api.put(`${api.endpoints.notifications}/read`);
      return response;
    } catch (error) {
      console.error('Mark notification as read error:', error);
      throw error;
    }
  },

  // ブラウザ通知を表示（PWA機能）
  showBrowserNotification(title, options = {}) {
    // ブラウザ通知APIのサポートチェック
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return;
    }

    // 通知の許可状態をチェック
    if (Notification.permission === 'granted') {
      // 通知を表示
      new Notification(title, options);
    } else if (Notification.permission !== 'denied') {
      // 許可を求める
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, options);
        }
      });
    }
  }
};

export default notificationService;

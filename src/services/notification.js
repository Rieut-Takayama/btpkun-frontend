import api from './api';

// �ʒm�T�[�r�X�i�ȗ��Łj
const notificationService = {
  // �ʒm�ݒ���擾
  async getSettings() {
    try {
      const response = await api.get(api.endpoints.notificationSettings);
      return response;
    } catch (error) {
      console.error('Get notification settings error:', error);
      throw error;
    }
  },

  // �ʒm�ݒ���X�V
  async updateSettings(settings) {
    try {
      const response = await api.put(api.endpoints.notificationSettings, settings);
      return response;
    } catch (error) {
      console.error('Update notification settings error:', error);
      throw error;
    }
  },

  // �ʒm�������擾
  async getNotifications(limit = 10) {
    try {
      const response = await api.get(api.endpoints.notifications, { limit });
      return response;
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  },

  // �ʒm�����ǂɂ���
  async markAsRead(notificationId) {
    try {
      const response = await api.put(`${api.endpoints.notifications}/read`);
      return response;
    } catch (error) {
      console.error('Mark notification as read error:', error);
      throw error;
    }
  },

  // �u���E�U�ʒm��\���iPWA�@�\�j
  showBrowserNotification(title, options = {}) {
    // �u���E�U�ʒmAPI�̃T�|�[�g�`�F�b�N
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return;
    }

    // �ʒm�̋���Ԃ��`�F�b�N
    if (Notification.permission === 'granted') {
      // �ʒm��\��
      new Notification(title, options);
    } else if (Notification.permission !== 'denied') {
      // �������߂�
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, options);
        }
      });
    }
  }
};

export default notificationService;

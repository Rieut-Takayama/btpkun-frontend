// Empty notification service (disabled)
const notificationService = {
  getSettings() {
    return Promise.resolve({ enabled: false });
  },
  updateSettings() {
    return Promise.resolve({});
  },
  getNotifications() {
    return Promise.resolve([]);
  },
  markAsRead() {
    return Promise.resolve({});
  },
  showBrowserNotification() {
    // Disabled
  }
};

export default notificationService;

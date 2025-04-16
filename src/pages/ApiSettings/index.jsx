import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import notificationService from "../../services/notification";
import "./ApiSettings.css";

const ApiSettings = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  
  // 通知設定用のステート
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [minStrength, setMinStrength] = useState(70);
  const [notificationSaveStatus, setNotificationSaveStatus] = useState(null);

  // Logout handler
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Fetch saved API config and notification settings
  useEffect(() => {
    const fetchApiConfig = async () => {
      try {
        setIsLoading(true);
        const config = await api.get(api.endpoints.apiConfig);

        if (config && config.apiKey) {
          setApiKey(config.apiKey);
          // Hide secret for security
          setApiSecret(config.apiSecret || "");
        }
      } catch (err) {
        console.error("Error fetching API config:", err);
        setError("Failed to load API configuration. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchNotificationSettings = async () => {
      try {
        const settings = await notificationService.getSettings();
        if (settings) {
          setNotificationsEnabled(settings.enabled || false);
          setMinStrength(settings.minStrength || 70);
        }
      } catch (err) {
        console.error("Error fetching notification settings:", err);
      }
    };

    fetchApiConfig();
    fetchNotificationSettings();
  }, []);

  // Save API config
  const handleSave = async (e) => {
    e.preventDefault();

    if (!apiKey) {
      setError("API Key is required");
      return;
    }

    if (!apiSecret && apiSecret !== "********") {
      setError("API Secret is required");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      await api.post(api.endpoints.apiConfig, {
        apiKey,
        apiSecret
      });

      setTestResult({
        status: "success",
        message: "API configuration saved successfully."
      });

      // 既存のシークレットを保持
      if (apiSecret !== "********") {
        setApiSecret("********");
      }
    } catch (err) {
      console.error("Error saving API config:", err);
      setTestResult({
        status: "error",
        message: "Failed to save: " + (err.response?.data?.message || err.message)
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Test API connection
  const handleTest = async () => {
    if (!apiKey) {
      setError("API Key is required for testing");
      return;
    }

    if (!apiSecret) {
      setError("API Secret is required for testing");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setTestResult(null);

      const result = await api.post(api.endpoints.testApiConnection, {
        apiKey,
        apiSecret
      });

      setTestResult({
        status: result.success ? "success" : "error",
        message: result.message || "Connection test completed."
      });
    } catch (err) {
      console.error("API test error:", err);
      setTestResult({
        status: "error",
        message: "Connection test failed: " + (err.response?.data?.message || err.message)
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 通知設定保存ハンドラー
  const handleSaveNotificationSettings = async () => {
    try {
      setNotificationSaveStatus(null);
      
      // ブラウザ通知の許可を確認
      if (notificationsEnabled && Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }
      
      // 通知設定を保存
      await notificationService.updateSettings({
        enabled: notificationsEnabled,
        minStrength: minStrength
      });
      
      setNotificationSaveStatus({
        status: "success",
        message: "Notification settings saved successfully."
      });
      
      // 3秒後にステータスメッセージを消去
      setTimeout(() => {
        setNotificationSaveStatus(null);
      }, 3000);
      
    } catch (err) {
      console.error("Error saving notification settings:", err);
      setNotificationSaveStatus({
        status: "error",
        message: "Failed to save notification settings: " + err.message
      });
    }
  };

  return (
    <div className="settings-container">
      <header className="settings-header">
        <div className="settings-logo">
          <h1>BTP-kun</h1>
          <div className="subtitle">Wolf Hunter</div>
        </div>

        <nav className="settings-nav">
          <Link to="/dashboard" className="nav-item">Dashboard</Link>
          <Link to="/settings" className="nav-item active">API Settings</Link>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </nav>
      </header>

      <main className="settings-content">
        <div className="settings-card">
          <h2 className="settings-title">MEXC API Settings</h2>

          <p className="settings-description">
            Enter your MEXC API Key and Secret. These are used for data retrieval and alert generation.
            For instructions on creating API keys, refer to the <a href="https://www.mexc.com/api/setting/spot" target="_blank" rel="noopener noreferrer" className="guide-link">MEXC API Guide</a>.
          </p>

          {error && <div className="test-result test-error">{error}</div>}

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="apiKey">API Key</label>
              <input
                id="apiKey"
                type="text"
                className="form-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isLoading || isSaving}
                placeholder="Enter your MEXC API Key"
              />
              <p className="form-description">
                API Keys can be created in the "API Management" section of your MEXC account.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="apiSecret">API Secret</label>
              <input
                id="apiSecret"
                type="password"
                className="form-input"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                disabled={isLoading || isSaving}
                placeholder="Enter your MEXC API Secret"
              />
              <p className="form-description">
                For security, your API Secret is stored in your browser's local storage.
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
                {isLoading ? "Testing..." : "Test Connection"}
              </button>

              <button
                type="submit"
                className="button-primary"
                disabled={isLoading || isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>

        <div className="settings-card">
          <h2 className="settings-title">Notification Settings</h2>

          <p className="settings-description">
            Configure browser notifications for signal detection. When enabled,
            you'll receive desktop notifications when new signals are detected.
          </p>

          <div className="form-group">
            <div className="switch-container">
              <label htmlFor="notificationsEnabled" className="switch-label">Enable Notifications</label>
              <label className="switch">
                <input
                  id="notificationsEnabled"
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>
            <p className="form-description">
              When turned on, you'll receive desktop notifications for detected signals.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="minStrength">Minimum Signal Strength</label>
            <div className="range-container">
              <input
                id="minStrength"
                type="range"
                min="0"
                max="100"
                step="5"
                value={minStrength}
                onChange={(e) => setMinStrength(parseInt(e.target.value))}
                className="strength-slider"
                disabled={!notificationsEnabled}
              />
              <span className="range-value">{minStrength}%</span>
            </div>
            <p className="form-description">
              Only signals with strength at or above this threshold will trigger notifications.
            </p>
          </div>

          {notificationSaveStatus && (
            <div className={`test-result test-${notificationSaveStatus.status}`}>
              {notificationSaveStatus.message}
            </div>
          )}

          <div className="form-buttons">
            <button
              type="button"
              className="button-primary"
              onClick={handleSaveNotificationSettings}
            >
              Save Notification Settings
            </button>
          </div>
        </div>

        <div className="settings-card">
          <h2 className="settings-title">Setup Guide</h2>

          <p className="settings-description">
            <strong>Steps to create API Keys:</strong>
          </p>
          <ol className="settings-description">
            <li>Log in to MEXC and go to account settings</li>
            <li>Select "API Management"</li>
            <li>Click "Create API Key"</li>
            <li>Select required permissions (read-only recommended)</li>
            <li>Complete security verification</li>
            <li>Enter the created API Key and Secret on this page</li>
          </ol>

          <p className="settings-description">
            <strong>Note:</strong> API Secret is shown only once. Keep it in a secure location.
          </p>
        </div>
      </main>
    </div>
  );
};

export default ApiSettings;

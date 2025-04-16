import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
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

  // Logout handler
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Fetch saved API config
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
        setError("API設定の読み込みに失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiConfig();
  }, []);

  // Save API config
  const handleSave = async (e) => {
    e.preventDefault();

    if (!apiKey) {
      setError("APIキーが必要です");
      return;
    }

    if (!apiSecret && apiSecret !== "********") {
      setError("APIシークレットが必要です");
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
        message: "API設定が正常に保存されました"
      });

      // Mask secret after saving
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
      setError("テストにはAPIキーが必要です");
      return;
    }

    if (!apiSecret) {
      setError("テストにはAPIシークレットが必要です");
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
        message: result.message || "接続テスト完了"
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

  return (
    <div className="settings-container">
      <header className="settings-header">
        <div className="settings-logo">
          <h1>BTP-kun</h1>
          <div className="subtitle">Wolf Hunter</div>
        </div>

        <nav className="settings-nav">
          <Link to="/dashboard" className="nav-item">ダッシュボード</Link>
          <Link to="/settings" className="nav-item active">API設定</Link>
          <button onClick={handleLogout} className="logout-button">ログアウト</button>
        </nav>
      </header>

      <main className="settings-content">
        <div className="settings-card">
          <h2 className="settings-title">MEXC API設定</h2>

          <p className="settings-description">MEXCのAPIキーとシークレットを入力してください。これらはデータ取得とシグナル生成に使用されます。APIキーの作成方法については、<a href="https://www.mexc.com/api/setting/spot" target="_blank" rel="noopener noreferrer" className="guide-link">MEXC APIガイド</a>を参照してください。</p>

          {error && <div className="test-result test-error">{error}</div>}

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="apiKey">APIキー</label>
              <input
                id="apiKey"
                type="text"
                className="form-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isLoading || isSaving}
                placeholder="MEXCのAPIキーを入力"
              />
              <p className="form-description">APIキーはMEXCアカウントの「API管理」セクションで作成できます。</p>
            </div>

            <div className="form-group">
              <label htmlFor="apiSecret">APIシークレット</label>
              <input
                id="apiSecret"
                type="password"
                className="form-input"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                disabled={isLoading || isSaving}
                placeholder="MEXCのAPIシークレットを入力"
              />
              <p className="form-description">セキュリティのため、APIシークレットは安全に保存されます。</p>
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
                {isLoading ? "テスト中..." : "接続テスト"}
              </button>

              <button
                type="submit"
                className="button-primary"
                disabled={isLoading || isSaving}
              >
                {isSaving ? "保存中..." : "保存"}
              </button>
            </div>
          </form>
        </div>

        <div className="settings-card">
          <h2 className="settings-title">セットアップガイド</h2>

          <p className="settings-description">
            <strong>APIキーを作成する手順:</strong>
          </p>
          <ol className="settings-description">
            <li>MEXCにログインしてアカウント設定に移動</li>
            <li>「API管理」を選択</li>
            <li>「APIキーを作成」をクリック</li>
            <li>必要な権限を選択（読み取り専用推奨）</li>
            <li>セキュリティ認証を完了</li>
            <li>作成したAPIキーとシークレットをこのページに入力</li>
          </ol>

          <p className="settings-description">
            <strong>注意:</strong> APIシークレットは一度だけ表示されます。安全な場所に保管してください。
          </p>
        </div>
      </main>
    </div>
  );
};

export default ApiSettings;


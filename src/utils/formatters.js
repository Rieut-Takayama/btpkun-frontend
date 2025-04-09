// 日付フォーマッター
export const formatDate = (dateString, includeTime = true) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.second = '2-digit';
    options.hour12 = false;
  }
  
  return new Intl.DateTimeFormat('ja-JP', options).format(date);
};

// 通貨フォーマッター
export const formatCurrency = (value, currency = 'USD', decimals = 2) => {
  if (value === null || value === undefined) return '';
  
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

// 数値フォーマッター
export const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined) return '';
  
  return new Intl.NumberFormat('ja-JP', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

// パーセンテージフォーマッター
export const formatPercent = (value, decimals = 2) => {
  if (value === null || value === undefined) return '';
  
  return new Intl.NumberFormat('ja-JP', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

// 短縮数値フォーマッター（例: 1000 -> 1K）
export const formatShortNumber = (value) => {
  if (value === null || value === undefined) return '';
  
  const absValue = Math.abs(value);
  
  if (absValue >= 1000000000) {
    return (value / 1000000000).toFixed(1) + 'G';
  }
  
  if (absValue >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  
  if (absValue >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  
  return value.toString();
};

// 経過時間フォーマッター
export const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) {
    return '今';
  }
  
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return diffMin + '分前';
  }
  
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return diffHour + '時間前';
  }
  
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) {
    return diffDay + '日前';
  }
  
  return formatDate(dateString, false);
};

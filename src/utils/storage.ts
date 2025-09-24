import { Schedule, AppSettings } from '../types';

const STORAGE_KEYS = {
  SCHEDULES: 'remindflow_schedules',
  SETTINGS: 'remindflow_settings',
  BACKUP: 'remindflow_backup'
};

// デフォルト設定
const DEFAULT_SETTINGS: AppSettings = {
  notification: {
    enabled: true,
    defaultMinutesBefore: 15,
    defaultSound: 'chime',
    displayDuration: 10,
    repeatInterval: 5
  },
  display: {
    fontSize: 'medium',
    theme: 'light',
    colorScheme: {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#10b981'
    }
  }
};

// 予定データの保存
export const saveSchedules = (schedules: Schedule[]): void => {
  try {
    const encrypted = btoa(JSON.stringify(schedules));
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, encrypted);
  } catch (error) {
    console.error('予定データの保存に失敗しました:', error);
  }
};

// 予定データの読み込み
export const loadSchedules = (): Schedule[] => {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    if (!encrypted) return [];
    
    const decrypted = atob(encrypted);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('予定データの読み込みに失敗しました:', error);
    return [];
  }
};

// 設定の保存
export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('設定の保存に失敗しました:', error);
  }
};

// 設定の読み込み
export const loadSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!stored) return DEFAULT_SETTINGS;
    
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch (error) {
    console.error('設定の読み込みに失敗しました:', error);
    return DEFAULT_SETTINGS;
  }
};

// バックアップの作成
export const createBackup = (): void => {
  try {
    const schedules = loadSchedules();
    const settings = loadSettings();
    const backup = {
      schedules,
      settings,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify(backup));
  } catch (error) {
    console.error('バックアップの作成に失敗しました:', error);
  }
};

// データのエクスポート（CSV形式）
export const exportToCSV = (schedules: Schedule[]): string => {
  const headers = ['件名', '日付', '時間', 'カテゴリ', '優先度', '詳細'];
  const rows = schedules.map(schedule => [
    schedule.title,
    schedule.date,
    schedule.time,
    schedule.category,
    schedule.priority,
    schedule.description || ''
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
    
  return csvContent;
};

// ストレージ使用量の取得
export const getStorageUsage = (): { used: number; total: number } => {
  let used = 0;
  
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length;
    }
  }
  
  // ブラウザの制限は通常5-10MB程度
  const total = 5 * 1024 * 1024; // 5MB
  
  return { used, total };
};


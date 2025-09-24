import { Schedule, AppSettings, NotificationHistoryEntry } from '../types';

const STORAGE_KEYS = {
  SCHEDULES: 'remindflow_schedules',
  SETTINGS: 'remindflow_settings',
  BACKUP: 'remindflow_backup',
  NOTIFICATION_HISTORY: 'remindflow_notification_history'
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

// UTF-8対応のBase64エンコード/デコード
const encodeBase64 = (input: string): string => {
  const utf8 = new TextEncoder().encode(input);
  let binary = '';
  utf8.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

const decodeBase64 = (b64: string): string => {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
};

// 予定データの保存
export const saveSchedules = (schedules: Schedule[]): void => {
  try {
    const encrypted = encodeBase64(JSON.stringify(schedules));
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
    
    const decrypted = decodeBase64(encrypted);
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
  const headers = ['件名', '日付', '開始時間', '終了時間', 'カテゴリ', '優先度', 'ステータス', '詳細'];
  const rows = schedules.map(schedule => [
    schedule.title,
    schedule.date,
    schedule.time,
    schedule.endTime || '',
    schedule.category,
    schedule.priority,
    schedule.status || 'pending',
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
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const value = localStorage.getItem(key);
      used += (value?.length || 0) + key.length;
    }
  } catch {}
  
  // ブラウザの制限は通常5-10MB程度
  const total = 5 * 1024 * 1024; // 5MB
  
  return { used, total };
};

// ICS（iCalendar）エクスポート
export const exportToICS = (schedules: Schedule[]): string => {
  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//RemindFlow//JP');

  const toDateTime = (date: string, time?: string) => {
    if (!time) {
      // 終日扱い
      return `${date.replace(/-/g, '')}`;
    }
    const [hh, mm] = time.split(':');
    return `${date.replace(/-/g, '')}T${hh}${mm}00`;
  };

  schedules.forEach((s) => {
    const uid = s.id || `rf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const dtStart = toDateTime(s.date, s.time);
    const dtEnd = toDateTime(s.date, s.endTime || s.time);
    const summary = (s.title || '').replace(/\n/g, ' ');
    const description = (s.description || '').replace(/\n/g, ' ');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}@remindflow`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '')}Z`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${summary}`);
    if (description) lines.push(`DESCRIPTION:${description}`);
    lines.push(`CATEGORIES:${s.category}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

// 通知履歴の保存/読み込み
export const loadNotificationHistory = (): NotificationHistoryEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('通知履歴の読み込みに失敗しました:', e);
    return [];
  }
};

export const saveNotificationHistory = (entries: NotificationHistoryEntry[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATION_HISTORY, JSON.stringify(entries));
  } catch (e) {
    console.error('通知履歴の保存に失敗しました:', e);
  }
};

export const addNotificationHistory = (entry: NotificationHistoryEntry): void => {
  const entries = loadNotificationHistory();
  entries.unshift(entry);
  // 上限（直近100件）
  const capped = entries.slice(0, 100);
  saveNotificationHistory(capped);
};


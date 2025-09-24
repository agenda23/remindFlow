// 予定データの型定義
export interface Schedule {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD形式
  time: string; // HH:MM形式
  endTime?: string; // HH:MM形式（終了時刻）
  category: 'work' | 'personal' | 'family' | 'other';
  priority: 'high' | 'medium' | 'low';
  status?: 'pending' | 'completed';
  archived?: boolean; // 自動/手動アーカイブ判定用
  reminder: {
    enabled: boolean;
    minutesBefore: number;
    sound: string;
    repeat: boolean;
  };
  recurrence: {
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    endDate?: string;
  };
}

// 通知設定の型定義
export interface NotificationSettings {
  enabled: boolean;
  defaultMinutesBefore: number;
  defaultSound: string;
  displayDuration: number; // 秒
  repeatInterval: number; // 分
}

// 表示設定の型定義
export interface DisplaySettings {
  fontSize: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark' | 'custom';
  colorScheme: {
    high: string;
    medium: string;
    low: string;
  };
}

// アプリケーション設定の型定義
export interface AppSettings {
  notification: NotificationSettings;
  display: DisplaySettings;
  defaults?: DefaultSettings;
}

// ビューモードの型定義
export type ViewMode = 'day' | 'week' | 'month' | 'list';

// ソート順の型定義
export type SortOrder = 'time' | 'priority' | 'title';

// フィルター条件の型定義
export interface FilterConditions {
  category?: string;
  priority?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// 通知履歴の型定義
export interface NotificationHistoryEntry {
  id: string;
  scheduleId?: string;
  title: string;
  body: string;
  createdAt: string; // ISO string
  read: boolean;
}

// 高度検索の型定義
export interface AdvancedSearchFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  searchMode: 'AND' | 'OR';
}

// 作成時デフォルト設定
export interface DefaultSettings {
  category: 'work' | 'personal' | 'family' | 'other';
}


import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  requestNotificationPermission, 
  showNotification, 
  checkTodayReminders,
  startReminderService,
  primeNotificationSounds
} from '../utils/notifications';
import { loadSettings, saveSettings } from '../utils/storage';
import { formatLocalDateYYYYMMDD } from '@/lib/utils';

export const useNotifications = (schedules) => {
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [settings, setSettings] = useState(null);
  const reminderIntervalRef = useRef(null);

  // 設定の読み込み
  useEffect(() => {
    const loadedSettings = loadSettings();
    setSettings(loadedSettings);
  }, []);

  // 通知許可の確認と要求
  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    // 許可後に音源をアンロック
    if (granted) {
      try { await primeNotificationSounds(settings?.notification); } catch {}
    }
    return granted;
  }, []);

  // 設定の更新
  const updateNotificationSettings = useCallback((newSettings) => {
    // 常にストレージの最新をベースにマージして、他セクション（display/defaults）を上書きしない
    const persisted = loadSettings();
    const updatedSettings = {
      ...persisted,
      notification: {
        ...(persisted?.notification || {}),
        ...newSettings
      }
    };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  }, []);

  // リマインダーサービスの開始
  const startReminders = useCallback(() => {
    if (!settings?.notification.enabled || notificationPermission !== 'granted') {
      return;
    }

    // 既存のインターバルをクリア
    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
    }

    // 新しいインターバルを設定
    reminderIntervalRef.current = startReminderService(schedules, settings.notification);
  }, [schedules, settings, notificationPermission]);

  // リマインダーサービスの停止
  const stopReminders = useCallback(() => {
    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
      reminderIntervalRef.current = null;
    }
  }, []);

  // 手動で通知をテスト
  const testNotification = useCallback(() => {
    if (notificationPermission !== 'granted') {
      return false;
    }

    const testSchedule = {
      id: 'test',
      title: 'テスト通知',
      description: 'これはテスト通知です',
      date: formatLocalDateYYYYMMDD(new Date()),
      time: new Date().toTimeString().slice(0, 5)
    };

    // テストはユーザー操作イベント発火中なので、ここで音源アンロックも実施
    try { primeNotificationSounds(settings?.notification); } catch {}
    showNotification(testSchedule, settings?.notification || {});
    return true;
  }, [notificationPermission, settings]);

  // 即座にリマインダーをチェック
  const checkReminders = useCallback(() => {
    if (!settings?.notification.enabled || notificationPermission !== 'granted') {
      return;
    }

    checkTodayReminders(schedules, settings.notification);
  }, [schedules, settings, notificationPermission]);

  // 特定の予定の通知を表示
  const showScheduleNotification = useCallback((schedule) => {
    if (notificationPermission !== 'granted' || !settings?.notification.enabled) {
      return false;
    }

    showNotification(schedule, settings.notification);
    return true;
  }, [notificationPermission, settings]);

  // 通知の有効/無効を切り替え
  const toggleNotifications = useCallback(async (enabled) => {
    if (enabled && notificationPermission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        return false;
      }
    }

    updateNotificationSettings({ enabled });
    
    if (enabled) {
      // 有効化直後に音源アンロック
      try { await primeNotificationSounds(settings?.notification); } catch {}
      startReminders();
    } else {
      stopReminders();
    }

    return true;
  }, [notificationPermission, requestPermission, updateNotificationSettings, startReminders, stopReminders, settings]);

  // 予定が変更されたときにリマインダーを再開
  useEffect(() => {
    if (settings?.notification.enabled && notificationPermission === 'granted') {
      startReminders();
    }

    return () => {
      stopReminders();
    };
  }, [schedules, settings, notificationPermission, startReminders, stopReminders]);

  // コンポーネントのアンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      stopReminders();
    };
  }, [stopReminders]);

  return {
    notificationPermission,
    settings: settings?.notification,
    requestPermission,
    updateNotificationSettings,
    startReminders,
    stopReminders,
    testNotification,
    checkReminders,
    showScheduleNotification,
    toggleNotifications,
    isSupported: typeof Notification !== 'undefined'
  };
};


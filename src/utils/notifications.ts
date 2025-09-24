import { Schedule, NotificationSettings, NotificationHistoryEntry } from '../types';
import { addNotificationHistory } from './storage';

// 通知許可の要求
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('このブラウザは通知をサポートしていません');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// 通知の表示
export const showNotification = (
  schedule: Schedule,
  settings: NotificationSettings
): void => {
  if (!settings.enabled || Notification.permission !== 'granted') {
    return;
  }

  const notification = new Notification(`リマインダー: ${schedule.title}`, {
    body: schedule.description || `${schedule.date} ${schedule.time}の予定です`,
    icon: '/favicon.ico',
    tag: schedule.id,
    requireInteraction: true
  });

  try {
    const soundName = schedule?.reminder?.sound || settings?.defaultSound || 'chime';
    playNotificationSound(soundName);
  } catch {}

  // 履歴に追加
  try {
    const entry: NotificationHistoryEntry = {
      id: `nh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      scheduleId: schedule.id,
      title: `リマインダー: ${schedule.title}`,
      body: notification.body || '',
      createdAt: new Date().toISOString(),
      read: false
    };
    addNotificationHistory(entry);
  } catch {}

  // 通知クリック時の処理
  notification.onclick = () => {
    window.focus();
    notification.close();
    // 該当予定の詳細表示などの処理をここに追加
  };

  // 自動で閉じる
  setTimeout(() => {
    notification.close();
  }, settings.displayDuration * 1000);
};

// 予定のリマインダー時刻を計算
export const calculateReminderTime = (schedule: Schedule): Date => {
  const scheduleDateTime = new Date(`${schedule.date}T${schedule.time}`);
  const reminderTime = new Date(
    scheduleDateTime.getTime() - schedule.reminder.minutesBefore * 60 * 1000
  );
  return reminderTime;
};

// 今日のリマインダーをチェック
export const checkTodayReminders = (
  schedules: Schedule[],
  settings: NotificationSettings
): void => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  schedules
    .filter(schedule => 
      schedule.date === today && 
      schedule.reminder.enabled
    )
    .forEach(schedule => {
      const reminderTime = calculateReminderTime(schedule);
      const timeDiff = reminderTime.getTime() - now.getTime();

      // リマインダー時刻が現在時刻から5分以内の場合
      if (timeDiff > 0 && timeDiff <= 5 * 60 * 1000) {
        setTimeout(() => {
          showNotification(schedule, settings);
        }, timeDiff);
      }
    });
};

// 通知音の再生
export const playNotificationSound = (soundName: string): void => {
  try {
    // 実際の実装では音声ファイルを用意する必要があります
    const audio = new Audio(`/sounds/${soundName}.mp3`);
    audio.volume = 0.5;
    audio.play().catch(error => {
      console.warn('通知音の再生に失敗しました:', error);
    });
  } catch (error) {
    console.warn('通知音の再生に失敗しました:', error);
  }
};

// 定期的なリマインダーチェック
export const startReminderService = (
  schedules: Schedule[],
  settings: NotificationSettings
): NodeJS.Timeout => {
  return setInterval(() => {
    checkTodayReminders(schedules, settings);
  }, 60 * 1000); // 1分ごとにチェック
};


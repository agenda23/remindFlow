import { Schedule, NotificationSettings, NotificationHistoryEntry } from '../types';
import { addNotificationHistory } from './storage';

// ベースURL（GitHub Pagesなどでのサブパス配信に対応）
const BASE_URL = (import.meta as any)?.env?.BASE_URL || '/';

// 音源候補（フォールバック順）
const SOUND_CANDIDATES = ['chime', 'bell', 'notification'] as const;

// 共有Audio要素（ブラウザの自動再生制限の緩和に利用）
let sharedAudio: HTMLAudioElement | null = null;
let audioUnlocked = false;

const getSoundUrlCandidates = (soundName: string): string[] => {
  const primary = `${BASE_URL}sounds/${soundName}.mp3`; // 例: /remindFlow/sounds/x.mp3
  const absoluteRoot = `/sounds/${soundName}.mp3`;      // 例: /sounds/x.mp3
  const relative = `sounds/${soundName}.mp3`;           // 例: sounds/x.mp3（現在パスに相対）
  return Array.from(new Set([primary, absoluteRoot, relative]));
};

// ユーザー操作由来のイベントで呼び出し、オーディオを「解放」しておく
export const primeNotificationSounds = async (settings?: NotificationSettings): Promise<void> => {
  try {
    if (!sharedAudio) {
      sharedAudio = new Audio();
    }
    // 可能なら軽量の音源をミュートで一度再生→停止してアンロック
    const candidate = (settings?.defaultSound && SOUND_CANDIDATES.includes(settings.defaultSound as any)) ? settings.defaultSound : SOUND_CANDIDATES[0];
    const urls = getSoundUrlCandidates(candidate as string);
    sharedAudio.src = urls[0];
    sharedAudio.muted = true;
    await sharedAudio.play().catch(() => {});
    sharedAudio.pause();
    sharedAudio.currentTime = 0;
    sharedAudio.muted = false;
    audioUnlocked = true;
  } catch {
    // noop（アンロックはベストエフォート）
  }
};

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
  console.log('Notifications: 通知表示開始', {
    scheduleId: schedule.id,
    title: schedule.title,
    settingsEnabled: settings.enabled,
    permission: Notification.permission
  });

  if (!settings.enabled || Notification.permission !== 'granted') {
    console.log('Notifications: 通知をスキップ', {
      reason: !settings.enabled ? '設定で無効' : '許可されていない',
      settingsEnabled: settings.enabled,
      permission: Notification.permission
    });
    return;
  }

  try {
    const notification = new Notification(`リマインダー: ${schedule.title}`, {
      body: schedule.description || `${schedule.date} ${schedule.time}の予定です`,
      icon: `${BASE_URL}favicon.ico`,
      tag: schedule.id,
      requireInteraction: true
    });

    console.log('Notifications: 通知オブジェクト作成成功', { scheduleId: schedule.id });

    try {
      const soundName = schedule?.reminder?.sound || settings?.defaultSound || 'chime';
      console.log('Notifications: 通知音再生開始', { soundName });
      playNotificationSound(soundName);
    } catch (error) {
      console.warn('Notifications: 通知音再生失敗', error);
    }

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
      console.log('Notifications: 通知履歴追加', { entryId: entry.id });
    } catch (error) {
      console.warn('Notifications: 通知履歴追加失敗', error);
    }

    // 通知クリック時の処理
    notification.onclick = () => {
      console.log('Notifications: 通知クリック', { scheduleId: schedule.id });
      window.focus();
      notification.close();
      // 該当予定の詳細表示などの処理をここに追加
    };

    // 自動で閉じる
    setTimeout(() => {
      console.log('Notifications: 通知自動クローズ', { scheduleId: schedule.id });
      notification.close();
    }, settings.displayDuration * 1000);

    console.log('Notifications: 通知表示完了', { scheduleId: schedule.id });
  } catch (error) {
    console.error('Notifications: 通知表示失敗', { scheduleId: schedule.id, error });
  }
};

// 予定のリマインダー時刻を計算
export const calculateReminderTime = (schedule: Schedule): Date => {
  const scheduleDateTime = new Date(`${schedule.date}T${schedule.time}`);
  const reminderTime = new Date(
    scheduleDateTime.getTime() - schedule.reminder.minutesBefore * 60 * 1000
  );
  return reminderTime;
};

// 通知の管理用Map（重複防止）
const scheduledNotifications = new Map<string, NodeJS.Timeout>();

// 今日のリマインダーをチェック
export const checkTodayReminders = (
  schedules: Schedule[],
  settings: NotificationSettings
): void => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  console.log('Notifications: リマインダーチェック開始', { now: now.toISOString(), today });

  schedules
    .filter(schedule => 
      schedule.date === today && 
      schedule.reminder.enabled
    )
    .forEach(schedule => {
      const reminderTime = calculateReminderTime(schedule);
      const timeDiff = reminderTime.getTime() - now.getTime();

      console.log('Notifications: 予定チェック', {
        scheduleId: schedule.id,
        title: schedule.title,
        scheduleTime: `${schedule.date} ${schedule.time}`,
        reminderTime: reminderTime.toISOString(),
        timeDiff: timeDiff,
        minutesBefore: schedule.reminder.minutesBefore
      });

      // リマインダー時刻が未来で、まだ通知がスケジュールされていない場合
      if (timeDiff > 0 && !scheduledNotifications.has(schedule.id)) {
        console.log('Notifications: 通知をスケジュール', {
          scheduleId: schedule.id,
          delayMs: timeDiff,
          delayMinutes: Math.round(timeDiff / (60 * 1000))
        });

        const timeoutId = setTimeout(() => {
          console.log('Notifications: 通知実行', { scheduleId: schedule.id, title: schedule.title });
          showNotification(schedule, settings);
          scheduledNotifications.delete(schedule.id);
        }, timeDiff);

        scheduledNotifications.set(schedule.id, timeoutId);
      }
      // リマインダー時刻が過去の場合（通知し忘れ）
      else if (timeDiff <= 0 && timeDiff > -60 * 1000) { // 1分以内の遅延は許容
        console.log('Notifications: 遅延通知を実行', {
          scheduleId: schedule.id,
          title: schedule.title,
          delayMs: timeDiff
        });
        showNotification(schedule, settings);
      }
    });
};

// 通知音の再生（フォールバックとBASE_URL対応、共有Audioで再生）
export const playNotificationSound = (soundName: string): void => {
  (async () => {
    try {
      if (!sharedAudio) {
        sharedAudio = new Audio();
      }

      // 再生候補のリストを作成
      const nameCandidates = [soundName, ...SOUND_CANDIDATES.filter((n) => n !== soundName)];

      for (const name of nameCandidates) {
        const urlCandidates = getSoundUrlCandidates(name);
        for (const url of urlCandidates) {
          try {
            sharedAudio.src = url;
            sharedAudio.volume = 0.5;
            await sharedAudio.play();
            return; // 成功
          } catch (err) {
            // 次のURL候補へ
          }
        }
      }
    } catch (error) {
      console.warn('通知音の再生に失敗しました:', error);
    }
  })();
};

// 定期的なリマインダーチェック
export const startReminderService = (
  schedules: Schedule[],
  settings: NotificationSettings
): NodeJS.Timeout => {
  console.log('Notifications: リマインダーサービス開始', {
    schedulesCount: schedules.length,
    settingsEnabled: settings.enabled
  });

  // 即座に1回チェック
  checkTodayReminders(schedules, settings);

  return setInterval(() => {
    checkTodayReminders(schedules, settings);
  }, 30 * 1000); // 30秒ごとにチェック（より頻繁に）
};

// 通知のクリーンアップ（予定が削除された場合など）
export const clearScheduledNotification = (scheduleId: string): void => {
  const timeoutId = scheduledNotifications.get(scheduleId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    scheduledNotifications.delete(scheduleId);
    console.log('Notifications: スケジュール済み通知をクリア', { scheduleId });
  }
};

// 全てのスケジュール済み通知をクリア
export const clearAllScheduledNotifications = (): void => {
  console.log('Notifications: 全スケジュール済み通知をクリア', { count: scheduledNotifications.size });
  scheduledNotifications.forEach((timeoutId, scheduleId) => {
    clearTimeout(timeoutId);
  });
  scheduledNotifications.clear();
};


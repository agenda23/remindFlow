import { useState, useEffect } from 'react';
import './App.css';

// Components
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Views/Dashboard';
import CalendarView from './components/Views/CalendarView';
import ListView from './components/Views/ListView';
import ScheduleForm from './components/Schedule/ScheduleForm';
import SettingsModal from './components/Settings/SettingsModal';
import NotificationHistoryModal from './components/Settings/NotificationHistoryModal';
import { calculateReminderTime } from './utils/notifications';
import { formatLocalDateYYYYMMDD } from '@/lib/utils';
import { loadSettings, countUnreadNotifications } from '@/utils/storage';

// Hooks
import { useSchedules } from './hooks/useSchedules';
import { useNotifications } from './hooks/useNotifications';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    categories: [],
    priorities: []
  });

  // カスタムフック
  const {
    schedules,
    loading,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    searchSchedules,
    filterSchedules,
    generateRecurringSchedules,
    completeSchedule
  } = useSchedules();

  const {
    notificationPermission,
    requestPermission,
    toggleNotifications,
    checkReminders,
    testNotification,
    updateNotificationSettings,
    settings: notificationSettings,
    isSupported: isNotificationSupported
  } = useNotifications(schedules);

  // 通知許可の初期要求
  useEffect(() => {
    if (notificationPermission === 'default') {
      requestPermission();
    }
  }, [notificationPermission, requestPermission]);

  // 通知バッジ用の現在時刻を更新（1分ごと）
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 今日これからのリマインダー数
  const todayStr = formatLocalDateYYYYMMDD(new Date());
  const notificationEnabled = !!notificationSettings?.enabled;
  const upcomingReminderCount = schedules.filter((s) => {
    if (!notificationEnabled) return false;
    if (!s.reminder?.enabled) return false;
    if (s.date !== todayStr) return false;
    try {
      const reminderTime = calculateReminderTime(s);
      return reminderTime.getTime() > now.getTime();
    } catch {
      return false;
    }
  }).length;

  const unreadHistoryCount = (() => {
    try {
      return countUnreadNotifications();
    } catch {
      return 0;
    }
  })();

  // フィルタリングされた予定リスト
  const filteredSchedules = filterSchedules(
    searchTerm ? searchSchedules(searchTerm) : schedules,
    filters
  );

  // 予定フォームを開く
  const handleAddSchedule = () => {
    setEditingSchedule(null);
    setScheduleFormOpen(true);
  };

  // 予定編集フォームを開く
  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setScheduleFormOpen(true);
  };

  // 予定フォームを閉じる
  const handleCloseScheduleForm = () => {
    setScheduleFormOpen(false);
    setEditingSchedule(null);
  };

  // 予定の保存
  const handleSaveSchedule = (scheduleData) => {
    if (editingSchedule) {
      updateSchedule(editingSchedule.id, scheduleData);
    } else {
      const saved = addSchedule({
        status: 'pending',
        ...scheduleData
      });
      // 繰り返し予定の生成
      if (scheduleData.recurrence && scheduleData.recurrence.type !== 'none' && scheduleData.recurrence.endDate) {
        const recurrences = generateRecurringSchedules(saved, scheduleData.recurrence.endDate);
        if (recurrences && recurrences.length > 0) {
          recurrences.forEach(s => addSchedule({ status: 'pending', ...s }));
        }
      }
    }
  };

  // 予定の削除
  const handleDeleteSchedule = (scheduleId) => {
    if (window.confirm('この予定を削除しますか？')) {
      deleteSchedule(scheduleId);
    }
  };

  // スケジュールの一括インポート（JSON）
  const handleImportSchedules = (imported) => {
    if (!Array.isArray(imported)) return;
    const normalized = imported.map(item => ({
      id: item.id || `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: item.title || '',
      description: item.description || '',
      date: item.date,
      time: item.time,
      endTime: item.endTime || '',
      category: item.category || 'personal',
      priority: item.priority || 'medium',
      status: item.status || 'pending',
      reminder: {
        enabled: item.reminder?.enabled ?? true,
        minutesBefore: item.reminder?.minutesBefore ?? 15,
        sound: item.reminder?.sound || 'chime',
        repeat: item.reminder?.repeat ?? false
      },
      recurrence: {
        type: item.recurrence?.type || 'none',
        endDate: item.recurrence?.endDate || ''
      }
    }));
    normalized.forEach(s => addSchedule(s));
  };

  // 予定の完了/未完了切替
  const handleCompleteSchedule = (scheduleId, completed) => {
    completeSchedule(scheduleId, completed);
  };

  // ビューの切り替え
  const handleViewChange = (view) => {
    setCurrentView(view);
    setSidebarOpen(false); // モバイルでサイドバーを閉じる
  };

  // サイドバーの切り替え
  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // 設定画面を開く（今後実装）
  const handleSettingsOpen = () => {
    setSettingsOpen(true);
  };

  // 日付選択時の処理（カレンダーから）
  const handleDateSelect = (date) => {
    // 選択した日付で新しい予定を作成
    const settings = (() => { try { return loadSettings(); } catch { return null; } })();
    setEditingSchedule({
      title: '',
      description: '',
      date: date,
      time: '09:00',
      category: settings?.defaults?.category || 'personal',
      priority: 'medium',
      reminder: {
        enabled: settings?.notification?.enabled ?? true,
        minutesBefore: settings?.notification?.defaultMinutesBefore ?? 15,
        sound: settings?.notification?.defaultSound || 'chime',
        repeat: false
      },
      recurrence: {
        type: 'none',
        endDate: ''
      }
    });
    setScheduleFormOpen(true);
  };

  // 現在のビューコンポーネントを取得
  const getCurrentViewComponent = () => {
    const commonProps = {
      schedules: filteredSchedules,
      onAddSchedule: handleAddSchedule,
      onEditSchedule: handleEditSchedule,
      onDeleteSchedule: handleDeleteSchedule
    };

    switch (currentView) {
      case 'dashboard':
        return <Dashboard {...commonProps} onViewChange={handleViewChange} onOpenSettings={handleSettingsOpen} onCompleteSchedule={handleCompleteSchedule} />;
      case 'calendar':
        return <CalendarView {...commonProps} onDateSelect={handleDateSelect} />;
      case 'list':
        return <ListView {...commonProps} onCompleteSchedule={handleCompleteSchedule} />;
      default:
        return <Dashboard {...commonProps} onViewChange={handleViewChange} onOpenSettings={handleSettingsOpen} onCompleteSchedule={handleCompleteSchedule} />;
    }
  };

  // 表示設定の適用（テーマ/フォントサイズ）
  const applyDisplaySettings = (settings) => {
    if (!settings) return;
    const root = document.documentElement;
    // テーマ
    const isDark = settings.display?.theme === 'dark';
    root.classList.toggle('dark', !!isDark);
    // フォントサイズ
    const sizeClassMap = { small: 'text-sm', medium: 'text-base', large: 'text-lg' };
    const classesToRemove = ['text-sm', 'text-base', 'text-lg'];
    classesToRemove.forEach((c) => root.classList.remove(c));
    const sizeKey = settings.display?.fontSize || 'medium';
    const sizeClass = sizeClassMap[sizeKey] || 'text-base';
    root.classList.add(sizeClass);
  };

  // 初回マウント時に保存済み設定を反映
  useEffect(() => {
    try {
      const s = loadSettings();
      applyDisplaySettings(s);
    } catch (e) {
      console.debug('Failed to apply display settings on mount', e);
    }
  }, []);

  // 設定保存後に即時反映するためのハンドラ
  const handleSettingsSaved = (savedSettings) => {
    applyDisplaySettings(savedSettings);
    try {
      if (savedSettings?.notification) {
        // 通知設定もフック内の状態に即時反映
        updateNotificationSettings(savedSettings.notification);
      }
    } catch (e) {
      console.debug('Failed to update notification settings after save', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ヘッダー */}
      <Header
        currentView={currentView}
        onViewChange={handleViewChange}
        onSettingsOpen={handleSettingsOpen}
        onMenuToggle={handleMenuToggle}
        notificationCount={upcomingReminderCount + unreadHistoryCount}
        notificationsEnabled={notificationEnabled}
        onCheckReminders={checkReminders}
        onTestNotification={testNotification}
        onToggleNotifications={toggleNotifications}
        onRequestPermission={requestPermission}
        notificationPermission={notificationPermission}
        isNotificationSupported={isNotificationSupported}
        onOpenNotificationHistory={() => setHistoryOpen(true)}
      />

      <div className="flex">
        {/* サイドバー */}
        <Sidebar
          isOpen={sidebarOpen}
          currentView={currentView}
          onViewChange={handleViewChange}
          onAddSchedule={handleAddSchedule}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filters}
          onFilterChange={setFilters}
        />

        {/* メインコンテンツ */}
        <main className="flex-1 p-6 md:ml-0">
          <div className="max-w-7xl mx-auto">
            {getCurrentViewComponent()}
          </div>
        </main>
      </div>

      {/* 予定フォーム */}
      <ScheduleForm
        schedule={editingSchedule}
        isOpen={scheduleFormOpen}
        onClose={handleCloseScheduleForm}
        onSave={handleSaveSchedule}
      />

      {/* 設定モーダル */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        schedules={schedules}
        notificationPermission={notificationPermission}
        onToggleNotifications={toggleNotifications}
        onImportSchedules={handleImportSchedules}
        onSaved={handleSettingsSaved}
      />

      {/* 通知履歴モーダル */}
      <NotificationHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onChanged={() => {
          // 履歴の未読件数を含むバッジ再計算のためにnowを更新
          setNow(new Date());
        }}
      />

      {/* サイドバーオーバーレイ（モバイル） */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default App;


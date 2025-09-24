import { useState, useEffect } from 'react';
import './App.css';

// Components
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Views/Dashboard';
import CalendarView from './components/Views/CalendarView';
import ListView from './components/Views/ListView';
import ScheduleForm from './components/Schedule/ScheduleForm';

// Hooks
import { useSchedules } from './hooks/useSchedules';
import { useNotifications } from './hooks/useNotifications';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
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
    filterSchedules
  } = useSchedules();

  const {
    notificationPermission,
    requestPermission,
    toggleNotifications
  } = useNotifications(schedules);

  // 通知許可の初期要求
  useEffect(() => {
    if (notificationPermission === 'default') {
      requestPermission();
    }
  }, [notificationPermission, requestPermission]);

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
      addSchedule(scheduleData);
    }
  };

  // 予定の削除
  const handleDeleteSchedule = (scheduleId) => {
    if (window.confirm('この予定を削除しますか？')) {
      deleteSchedule(scheduleId);
    }
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
    console.log('設定画面を開く');
  };

  // 日付選択時の処理（カレンダーから）
  const handleDateSelect = (date) => {
    // 選択した日付で新しい予定を作成
    setEditingSchedule({
      title: '',
      description: '',
      date: date,
      time: '09:00',
      category: 'personal',
      priority: 'medium',
      reminder: {
        enabled: true,
        minutesBefore: 15,
        sound: 'chime',
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
        return <Dashboard {...commonProps} />;
      case 'calendar':
        return <CalendarView {...commonProps} onDateSelect={handleDateSelect} />;
      case 'list':
        return <ListView {...commonProps} />;
      default:
        return <Dashboard {...commonProps} />;
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


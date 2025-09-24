import { Bell, Calendar, Settings, Menu, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

const Header = ({ 
  currentView, 
  onViewChange, 
  onSettingsOpen, 
  onMenuToggle,
  notificationCount = 0,
  notificationsEnabled = false,
  onCheckReminders,
  onTestNotification,
  onToggleNotifications,
  onRequestPermission,
  notificationPermission,
  isNotificationSupported,
  onOpenNotificationHistory
}) => {
  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴとタイトル */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={onMenuToggle}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                RemindFlow
              </h1>
            </div>
          </div>

          {/* ナビゲーション */}
          <nav className="hidden md:flex space-x-1">
            {[
              { key: 'dashboard', label: 'ダッシュボード' },
              { key: 'calendar', label: 'カレンダー' },
              { key: 'list', label: '一覧' }
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant={currentView === key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange(key)}
                className="transition-all duration-200"
              >
                {label}
              </Button>
            ))}
          </nav>

          {/* アクションボタン */}
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative"
                  title="通知"
                >
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>通知</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isNotificationSupported ? (
                  <>
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onCheckReminders?.(); }}>
                      今日のリマインダーを今すぐチェック
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onTestNotification?.(); }}>
                      テスト通知を送信
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleNotifications?.(!notificationsEnabled); }}>
                      通知を{notificationsEnabled ? '無効化' : '有効化'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onOpenNotificationHistory?.(); }}>
                      通知履歴を表示
                    </DropdownMenuItem>
                    {notificationPermission !== 'granted' && (
                      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onRequestPermission?.(); }}>
                        通知許可をリクエスト
                      </DropdownMenuItem>
                    )}
                  </>
                ) : (
                  <DropdownMenuItem disabled>
                    このブラウザは通知に未対応です
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  今日の残りリマインダー: {notificationCount}件
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettingsOpen}
              title="設定"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;


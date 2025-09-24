import { Bell, Calendar, Settings, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = ({ currentView, onViewChange, onSettingsOpen, onMenuToggle }) => {
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
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              title="通知"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
            </Button>
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


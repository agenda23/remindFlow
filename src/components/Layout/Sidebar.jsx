import { Calendar, List, Home, Plus, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Sidebar = ({ 
  isOpen, 
  currentView, 
  onViewChange, 
  onAddSchedule,
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange 
}) => {
  const menuItems = [
    { key: 'dashboard', label: 'ダッシュボード', icon: Home },
    { key: 'calendar', label: 'カレンダー', icon: Calendar },
    { key: 'list', label: '予定一覧', icon: List }
  ];

  const categories = [
    { key: 'work', label: '仕事', color: 'bg-blue-500' },
    { key: 'personal', label: '個人', color: 'bg-green-500' },
    { key: 'family', label: '家族', color: 'bg-purple-500' },
    { key: 'other', label: 'その他', color: 'bg-gray-500' }
  ];

  const priorities = [
    { key: 'high', label: '高', color: 'bg-red-500' },
    { key: 'medium', label: '中', color: 'bg-yellow-500' },
    { key: 'low', label: '低', color: 'bg-green-500' }
  ];

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:relative md:translate-x-0
    `}>
      <div className="flex flex-col h-full">
        {/* 予定追加ボタン */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Button 
            onClick={onAddSchedule}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            新しい予定
          </Button>
        </div>

        {/* 検索 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="予定を検索..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* メニュー */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={currentView === key ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => onViewChange(key)}
            >
              <Icon className="h-4 w-4 mr-3" />
              {label}
            </Button>
          ))}
        </nav>

        {/* フィルター */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                フィルター
              </span>
            </div>

            {/* カテゴリフィルター */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                カテゴリ
              </h4>
              <div className="space-y-1">
                {categories.map(({ key, label, color }) => (
                  <label key={key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.categories?.includes(key) || false}
                      onChange={(e) => {
                        const newCategories = e.target.checked
                          ? [...(filters.categories || []), key]
                          : (filters.categories || []).filter(c => c !== key);
                        onFilterChange({ ...filters, categories: newCategories });
                      }}
                      className="rounded"
                    />
                    <div className={`w-3 h-3 rounded-full ${color}`}></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 優先度フィルター */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                優先度
              </h4>
              <div className="space-y-1">
                {priorities.map(({ key, label, color }) => (
                  <label key={key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.priorities?.includes(key) || false}
                      onChange={(e) => {
                        const newPriorities = e.target.checked
                          ? [...(filters.priorities || []), key]
                          : (filters.priorities || []).filter(p => p !== key);
                        onFilterChange({ ...filters, priorities: newPriorities });
                      }}
                      className="rounded"
                    />
                    <div className={`w-3 h-3 rounded-full ${color}`}></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;


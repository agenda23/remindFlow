import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, SortAsc, Plus, Trash2, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { formatLocalDateYYYYMMDD, parseLocalDateYYYYMMDD } from '@/lib/utils';
import ScheduleCard from '../Schedule/ScheduleCard';

const ListView = ({ 
  schedules, 
  onAddSchedule, 
  onEditSchedule, 
  onDeleteSchedule,
  onCompleteSchedule
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('time');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'not_started' | 'ongoing' | 'completed' | 'archived'
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    dateRange: { start: '', end: '' },
    searchMode: 'AND'
  });
  const [timeframe, setTimeframe] = useState('all'); // 'all' | 'today' | 'week' | 'month'

  // フィルタ状態の保存/復元
  useEffect(() => {
    try {
      const raw = localStorage.getItem('remindflow_list_filters');
      if (raw) {
        const saved = JSON.parse(raw);
        setSearchTerm(saved.searchTerm || '');
        setSortBy(saved.sortBy || 'time');
        setFilterCategory(saved.filterCategory || 'all');
        setFilterPriority(saved.filterPriority || 'all');
        // 後方互換: 旧 'pending' は 'not_started' に読み替え
        const restoredStatus = saved.filterStatus === 'pending' ? 'not_started' : (saved.filterStatus || 'all');
        setFilterStatus(restoredStatus);
        setAdvancedFilters(saved.advancedFilters || { dateRange: { start: '', end: '' }, searchMode: 'AND' });
        setTimeframe(saved.timeframe || 'all');
      }
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    try {
      const toSave = {
        searchTerm,
        sortBy,
        filterCategory,
        filterPriority,
        filterStatus,
        advancedFilters,
        timeframe
      };
      localStorage.setItem('remindflow_list_filters', JSON.stringify(toSave));
    } catch {
      // noop
    }
  }, [searchTerm, sortBy, filterCategory, filterPriority, filterStatus, advancedFilters, timeframe]);

  // フィルタリングとソート済みの予定リスト
  const filteredAndSortedSchedules = useMemo(() => {
    let filtered = schedules;
    const now = new Date();

    const deriveStatus = (s) => {
      if (s.archived) return 'archived';
      if (s.status === 'completed') return 'completed';
      try {
        const start = new Date(`${s.date}T${s.time}`);
        const end = s.endTime ? new Date(`${s.date}T${s.endTime}`) : new Date(start.getTime() + 60 * 60 * 1000);
        if (now < start) return 'not_started';
        if (now >= start && now < end) return 'ongoing';
        return 'archived';
      } catch {
        return 'not_started';
      }
    };

    // 検索フィルター
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matches = (schedule) => (
        schedule.title.toLowerCase().includes(term) ||
        (schedule.description && schedule.description.toLowerCase().includes(term))
      );
      filtered = filtered.filter(matches);
    }

    // カテゴリフィルター
    if (filterCategory !== 'all') {
      filtered = filtered.filter(schedule => schedule.category === filterCategory);
    }

    // 優先度フィルター
    if (filterPriority !== 'all') {
      filtered = filtered.filter(schedule => schedule.priority === filterPriority);
    }

    // ステータスフィルター（未開始/進行中/完了/アーカイブ）
    if (filterStatus !== 'all') {
      filtered = filtered.filter((s) => deriveStatus(s) === filterStatus);
    }

    // 表示範囲（全て/今日/今週/今月）
    if (timeframe !== 'all') {
      const today = new Date();
      if (timeframe === 'today') {
        const todayStr = formatLocalDateYYYYMMDD(today);
        filtered = filtered.filter((s) => s.date === todayStr);
      } else if (timeframe === 'week') {
        // 今週: 月曜始まり〜日曜終わり
        const day = today.getDay(); // 0(日)〜6(土)
        const diffToMonday = (day + 6) % 7; // 月曜=0
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - diffToMonday);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        filtered = filtered.filter((s) => {
          const d = parseLocalDateYYYYMMDD(s.date);
          return d >= weekStart && d <= weekEnd;
        });
      } else if (timeframe === 'month') {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        filtered = filtered.filter((s) => {
          const d = parseLocalDateYYYYMMDD(s.date);
          return d >= monthStart && d <= monthEnd;
        });
      }
    }

    // 高度検索（日付範囲 + AND/OR）
    if (advancedFilters.dateRange?.start && advancedFilters.dateRange?.end) {
      const start = new Date(advancedFilters.dateRange.start);
      const end = new Date(advancedFilters.dateRange.end);
      const inRange = (d) => {
        const dd = new Date(d);
        return dd >= start && dd <= end;
      };
      // いまは日付条件のみのためAND/ORで挙動は同じ。将来条件追加に備え分岐を保持
      if (advancedFilters.searchMode === 'AND') {
        filtered = filtered.filter((s) => inRange(s.date));
      } else {
        filtered = filtered.filter((s) => inRange(s.date));
      }
    }

    // ソート
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'time': {
          const dateCompare = a.date.localeCompare(b.date);
          return dateCompare !== 0 ? dateCompare : a.time.localeCompare(b.time);
        }
        case 'priority': {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityCompare = priorityOrder[b.priority] - priorityOrder[a.priority];
          return priorityCompare !== 0 ? priorityCompare : a.title.localeCompare(b.title);
        }
        case 'title':
          return a.title.localeCompare(b.title);
        case 'category': {
          const categoryCompare = a.category.localeCompare(b.category);
          return categoryCompare !== 0 ? categoryCompare : a.title.localeCompare(b.title);
        }
        default:
          return 0;
      }
    });
  }, [schedules, searchTerm, filterCategory, filterPriority, filterStatus, sortBy, advancedFilters, timeframe]);

  // 全選択/全解除
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedSchedules(filteredAndSortedSchedules.map(s => s.id));
    } else {
      setSelectedSchedules([]);
    }
  };

  // 個別選択
  const handleSelectSchedule = (scheduleId, checked) => {
    if (checked) {
      setSelectedSchedules(prev => [...prev, scheduleId]);
    } else {
      setSelectedSchedules(prev => prev.filter(id => id !== scheduleId));
    }
  };

  // 選択した予定を削除
  const handleDeleteSelected = () => {
    if (selectedSchedules.length === 0) return;
    if (window.confirm(`選択した${selectedSchedules.length}件の予定を削除しますか？`)) {
      selectedSchedules.forEach(id => onDeleteSchedule(id));
      setSelectedSchedules([]);
    }
  };

  // フィルターをクリア
  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterPriority('all');
    setFilterStatus('all');
    setSortBy('time');
    setAdvancedFilters({ dateRange: { start: '', end: '' }, searchMode: 'AND' });
    setTimeframe('all');
  };

  // ラベル関数は未使用のため削除（必要になれば再導入）

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            予定一覧
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredAndSortedSchedules.length}件の予定
          </p>
        </div>
        <Button onClick={onAddSchedule} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          新しい予定
        </Button>
      </div>

      {/* 検索とフィルター */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
        <div className="space-y-4">
          {/* 表示範囲トグル */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">表示範囲</label>
            <ToggleGroup type="single" value={timeframe} onValueChange={(v) => v && setTimeframe(v)} variant="outline" size="sm">
              <ToggleGroupItem
                value="all"
                className="data-[state=on]:!bg-blue-600 data-[state=on]:!text-white data-[state=on]:!border-blue-600 dark:data-[state=on]:!bg-blue-500 dark:data-[state=on]:!border-blue-500"
              >
                全て
              </ToggleGroupItem>
              <ToggleGroupItem
                value="today"
                className="data-[state=on]:!bg-blue-600 data-[state=on]:!text-white data-[state=on]:!border-blue-600 dark:data-[state=on]:!bg-blue-500 dark:data-[state=on]:!border-blue-500"
              >
                今日
              </ToggleGroupItem>
              <ToggleGroupItem
                value="week"
                className="data-[state=on]:!bg-blue-600 data-[state=on]:!text-white data-[state=on]:!border-blue-600 dark:data-[state=on]:!bg-blue-500 dark:data-[state=on]:!border-blue-500"
              >
                今週
              </ToggleGroupItem>
              <ToggleGroupItem
                value="month"
                className="data-[state=on]:!bg-blue-600 data-[state=on]:!text-white data-[state=on]:!border-blue-600 dark:data-[state=on]:!bg-blue-500 dark:data-[state=on]:!border-blue-500"
              >
                今月
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* 検索バー */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="予定を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* フィルターとソート */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                フィルター
              </Button>
              {(searchTerm || filterCategory !== 'all' || filterPriority !== 'all' || filterStatus !== 'all' || sortBy !== 'time' || advancedFilters.dateRange.start || advancedFilters.dateRange.end) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  クリア
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <SortAsc className="h-4 w-4 text-gray-500" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">時間順</SelectItem>
                  <SelectItem value="priority">優先度順</SelectItem>
                  <SelectItem value="title">件名順</SelectItem>
                  <SelectItem value="category">カテゴリ順</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 詳細フィルター */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  カテゴリ
                </label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="work">仕事</SelectItem>
                    <SelectItem value="personal">個人</SelectItem>
                    <SelectItem value="family">家族</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  優先度
                </label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ステータス
                </label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="not_started">未開始</SelectItem>
                    <SelectItem value="ongoing">進行中</SelectItem>
                    <SelectItem value="completed">完了</SelectItem>
                    <SelectItem value="archived">アーカイブ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 高度検索 */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    日付範囲（開始）
                  </label>
                  <Input
                    type="date"
                    value={advancedFilters.dateRange.start}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, dateRange: { ...advancedFilters.dateRange, start: e.target.value } })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    日付範囲（終了）
                  </label>
                  <Input
                    type="date"
                    value={advancedFilters.dateRange.end}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, dateRange: { ...advancedFilters.dateRange, end: e.target.value } })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    条件モード
                  </label>
                  <Select value={advancedFilters.searchMode} onValueChange={(v) => setAdvancedFilters({ ...advancedFilters, searchMode: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND</SelectItem>
                      <SelectItem value="OR">OR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 一括操作 */}
      {selectedSchedules.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800 dark:text-blue-200">
              {selectedSchedules.length}件の予定が選択されています
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSchedules([])}
              >
                選択解除
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                削除
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 予定リスト */}
      <div className="space-y-4">
        {filteredAndSortedSchedules.length > 0 ? (
          <>
            {/* 全選択チェックボックス */}
            <div className="flex items-center space-x-2 px-4">
              <Checkbox
                checked={selectedSchedules.length === filteredAndSortedSchedules.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                すべて選択
              </span>
            </div>

            {/* 予定カードリスト */}
            {filteredAndSortedSchedules.map((schedule) => (
              <div key={schedule.id} className="flex items-start space-x-3">
                <Checkbox
                  checked={selectedSchedules.includes(schedule.id)}
                  onCheckedChange={(checked) => handleSelectSchedule(schedule.id, checked)}
                  className="mt-4"
                />
                <div className="flex-1">
                  <ScheduleCard
                    schedule={schedule}
                    onEdit={onEditSchedule}
                    onDelete={onDeleteSchedule}
                    onComplete={(id, completed) => onCompleteSchedule?.(id, completed)}
                  />
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              予定が見つかりません
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || filterCategory !== 'all' || filterPriority !== 'all'
                ? '検索条件に一致する予定がありません'
                : 'まだ予定が登録されていません'
              }
            </p>
            <Button onClick={onAddSchedule} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              新しい予定を追加
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListView;


import { useMemo, useState, useEffect } from 'react';
import { Search, RotateCcw, Trash2, Calendar, SortAsc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { formatLocalDateYYYYMMDD, parseLocalDateYYYYMMDD } from '@/lib/utils';
import ScheduleCard from '../Schedule/ScheduleCard';

const ArchiveView = ({
  schedules,
  onRestoreSchedule, // (id) => void archived=false
  onDeleteSchedule,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('time');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [advancedFilters, setAdvancedFilters] = useState({
    dateRange: { start: '', end: '' },
    searchMode: 'AND'
  });
  const [timeframe, setTimeframe] = useState('all'); // 'all' | 'today' | 'week' | 'month'

  useEffect(() => {
    try {
      const raw = localStorage.getItem('remindflow_archive_filters');
      if (raw) {
        const saved = JSON.parse(raw);
        setSearchTerm(saved.searchTerm || '');
        setSortBy(saved.sortBy || 'time');
        setFilterCategory(saved.filterCategory || 'all');
        setFilterPriority(saved.filterPriority || 'all');
        setAdvancedFilters(saved.advancedFilters || { dateRange: { start: '', end: '' }, searchMode: 'AND' });
        setTimeframe(saved.timeframe || 'all');
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('remindflow_archive_filters', JSON.stringify({
        searchTerm,
        sortBy,
        filterCategory,
        filterPriority,
        advancedFilters,
        timeframe
      }));
    } catch {}
  }, [searchTerm, sortBy, filterCategory, filterPriority, advancedFilters, timeframe]);

  const archived = useMemo(() => {
    let list = schedules.filter((s) => s.archived);

    // 検索
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((s) =>
        (s.title || '').toLowerCase().includes(term) ||
        (s.description || '').toLowerCase().includes(term)
      );
    }

    // カテゴリ
    if (filterCategory !== 'all') {
      list = list.filter((s) => s.category === filterCategory);
    }

    // 優先度
    if (filterPriority !== 'all') {
      list = list.filter((s) => s.priority === filterPriority);
    }

    // 表示範囲（全て/今日/今週/今月）
    if (timeframe !== 'all') {
      const today = new Date();
      if (timeframe === 'today') {
        const todayStr = formatLocalDateYYYYMMDD(today);
        list = list.filter((s) => s.date === todayStr);
      } else if (timeframe === 'week') {
        const day = today.getDay();
        const diffToMonday = (day + 6) % 7;
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - diffToMonday);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        list = list.filter((s) => {
          const d = parseLocalDateYYYYMMDD(s.date);
          return d >= weekStart && d <= weekEnd;
        });
      } else if (timeframe === 'month') {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        list = list.filter((s) => {
          const d = parseLocalDateYYYYMMDD(s.date);
          return d >= monthStart && d <= monthEnd;
        });
      }
    }

    // 高度検索：日付範囲
    if (advancedFilters.dateRange?.start && advancedFilters.dateRange?.end) {
      const start = new Date(advancedFilters.dateRange.start);
      const end = new Date(advancedFilters.dateRange.end);
      const inRange = (d) => {
        const dd = new Date(d);
        return dd >= start && dd <= end;
      };
      list = list.filter((s) => inRange(s.date));
    }

    // ソート
    return list.sort((a, b) => {
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
  }, [schedules, searchTerm, filterCategory, filterPriority, advancedFilters, timeframe, sortBy]);

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">アーカイブ一覧</h1>
          <p className="text-gray-600 dark:text-gray-400">{archived.length}件のアーカイブ</p>
        </div>
      </div>

      {/* 検索/フィルタ/ソート */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
        <div className="space-y-4">
          {/* 表示範囲トグル */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">表示範囲</label>
            <ToggleGroup type="single" value={timeframe} onValueChange={(v) => v && setTimeframe(v)} variant="outline" size="sm">
              <ToggleGroupItem value="all" className="data-[state=on]:!bg-blue-600 data-[state=on]:!text-white data-[state=on]:!border-blue-600 dark:data-[state=on]:!bg-blue-500 dark:data-[state=on]:!border-blue-500">全て</ToggleGroupItem>
              <ToggleGroupItem value="today" className="data-[state=on]:!bg-blue-600 data-[state=on]:!text-white data-[state=on]:!border-blue-600 dark:data-[state=on]:!bg-blue-500 dark:data-[state=on]:!border-blue-500">今日</ToggleGroupItem>
              <ToggleGroupItem value="week" className="data-[state=on]:!bg-blue-600 data-[state=on]:!text-white data-[state=on]:!border-blue-600 dark:data-[state=on]:!bg-blue-500 dark:data-[state=on]:!border-blue-500">今週</ToggleGroupItem>
              <ToggleGroupItem value="month" className="data-[state=on]:!bg-blue-600 data-[state=on]:!text-white data-[state=on]:!border-blue-600 dark:data-[state=on]:!bg-blue-500 dark:data-[state=on]:!border-blue-500">今月</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* 検索バー */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input type="text" placeholder="アーカイブを検索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>

          {/* フィルタとソート */}
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">カテゴリ</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">優先度</label>
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

          {/* 高度検索（日付範囲） */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">日付範囲（開始）</label>
              <Input type="date" value={advancedFilters.dateRange.start} onChange={(e) => setAdvancedFilters({ ...advancedFilters, dateRange: { ...advancedFilters.dateRange, start: e.target.value } })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">日付範囲（終了）</label>
              <Input type="date" value={advancedFilters.dateRange.end} onChange={(e) => setAdvancedFilters({ ...advancedFilters, dateRange: { ...advancedFilters.dateRange, end: e.target.value } })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">条件モード</label>
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
      </div>

      {/* 一覧 */}
      <div className="space-y-4">
        {archived.length > 0 ? (
          archived.map((s) => (
            <div key={s.id} className="flex items-start space-x-3">
              <div className="flex-1">
                <ScheduleCard
                  schedule={s}
                  onEdit={() => {}}
                  onDelete={onDeleteSchedule}
                  onComplete={() => {}}
                />
              </div>
              <div className="flex flex-col space-y-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => onRestoreSchedule?.(s.id)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  復元
                </Button>
                <Button variant="destructive" size="sm" onClick={() => onDeleteSchedule?.(s.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  削除
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">アーカイブは空です</h3>
            <p className="text-gray-600 dark:text-gray-400">終了後に自動でアーカイブされます</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchiveView;



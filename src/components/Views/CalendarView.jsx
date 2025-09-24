import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatLocalDateYYYYMMDD } from '@/lib/utils';

const CalendarView = ({ 
  schedules, 
  onAddSchedule, 
  onEditSchedule, 
  onDateSelect 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'

  // 月の最初と最後の日を取得
  const monthStart = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  }, [currentDate]);

  // 月末は現在未使用
  // const monthEnd = useMemo(() => {
  //   return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  // }, [currentDate]);

  // カレンダーに表示する日付の配列を生成
  const calendarDays = useMemo(() => {
    const days = [];
    const startDate = new Date(monthStart);
    
    // 月の最初の週の日曜日から開始
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // 6週間分の日付を生成（42日）
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateStr = formatLocalDateYYYYMMDD(date);
      const daySchedules = schedules.filter(schedule => schedule.date === dateStr);
      
      days.push({
        date: new Date(date),
        dateStr,
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
        isToday: dateStr === formatLocalDateYYYYMMDD(new Date()),
        schedules: daySchedules
      });
    }
    
    return days;
  }, [monthStart, currentDate, schedules]);

  // 週表示用の日付配列を生成
  const weekDays = useMemo(() => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      const dateStr = formatLocalDateYYYYMMDD(date);
      const daySchedules = schedules.filter(schedule => schedule.date === dateStr);
      
      days.push({
        date: new Date(date),
        dateStr,
        isToday: dateStr === formatLocalDateYYYYMMDD(new Date()),
        schedules: daySchedules
      });
    }
    
    return days;
  }, [currentDate, schedules]);

  const displayDays = viewMode === 'month' ? calendarDays : weekDays;
  const todayStr = formatLocalDateYYYYMMDD(new Date());

  // 前の月/週に移動
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  // 次の月/週に移動
  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  // 今日に移動
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 日付クリック時の処理
  const handleDateClick = (day) => {
    if (onDateSelect) {
      onDateSelect(day.dateStr);
    }
  };

  // 予定クリック時の処理
  const handleScheduleClick = (e, schedule) => {
    e.stopPropagation();
    onEditSchedule(schedule);
  };

  // 優先度に応じた色を取得
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDisplayDate = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long'
      });
    } else {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${startOfWeek.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}`;
    }
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            カレンダー
          </h1>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              月
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              週
            </Button>
          </div>
        </div>
        <Button onClick={onAddSchedule} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          新しい予定
        </Button>
      </div>

      {/* ナビゲーション */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            今日
          </Button>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {formatDisplayDate()}
        </h2>
      </div>

      {/* カレンダーグリッド */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
            <div
              key={day}
              className={`
                p-3 text-center text-sm font-medium
                ${index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'}
              `}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 日付グリッド */}
        <div className={`grid grid-cols-7 ${viewMode === 'month' ? 'grid-rows-6' : 'grid-rows-1'}`}>
          {displayDays.map((day) => (
            <div
              key={day.dateStr}
              className={`
                border-r border-b border-gray-200 dark:border-gray-700 p-2 cursor-pointer
                hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                ${viewMode === 'month' ? 'min-h-[120px]' : 'min-h-[200px]'}
                ${day.isCurrentMonth === false ? 'bg-gray-50 dark:bg-gray-900 text-gray-400' : ''}
                ${day.isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
              `}
              onClick={() => handleDateClick(day)}
            >
              {/* 日付 */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`
                    text-sm font-medium
                    ${day.isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}
                  `}
                >
                  {day.date.getDate()}
                </span>
                {day.schedules.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {day.schedules.length}
                  </Badge>
                )}
              </div>

              {/* 予定リスト */}
              <div className="space-y-1">
                {day.schedules.slice(0, viewMode === 'month' ? 3 : 8).map((schedule) => {
                  const now = new Date();
                  const isSameDay = day.dateStr === todayStr;
                  let isOngoing = false;
                  if (isSameDay && schedule.status !== 'completed' && !schedule.archived) {
                    try {
                      const start = new Date(`${schedule.date}T${schedule.time}`);
                      const end = schedule.endTime ? new Date(`${schedule.date}T${schedule.endTime}`) : new Date(start.getTime() + 60 * 60 * 1000);
                      isOngoing = now >= start && now < end;
                    } catch {}
                  }
                  const isArchived = !!schedule.archived;
                  return (
                    <div
                      key={schedule.id}
                      className={`
                        text-xs p-1 rounded cursor-pointer truncate
                        ${isArchived ? 'bg-gray-400 text-white' : `${getPriorityColor(schedule.priority)} text-white`}
                        hover:opacity-80 transition-opacity
                        ${isOngoing ? 'ring-2 ring-blue-300' : ''}
                      `}
                      onClick={(e) => handleScheduleClick(e, schedule)}
                      title={`${schedule.time} ${schedule.title}`}
                    >
                      <span className="font-medium">{schedule.time}</span>
                      <span className="ml-1">{schedule.title}</span>
                    </div>
                  );
                })}
                {day.schedules.length > (viewMode === 'month' ? 3 : 8) && (
                  <div className="text-xs text-gray-500 text-center">
                    +{day.schedules.length - (viewMode === 'month' ? 3 : 8)}件
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 凡例 */}
      <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>高優先度</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>中優先度</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>低優先度</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;


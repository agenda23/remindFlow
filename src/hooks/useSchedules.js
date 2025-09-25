import { useState, useEffect, useCallback } from 'react';
import { saveSchedules, loadSchedules } from '../utils/storage';
import { parseLocalDateYYYYMMDD } from '@/lib/utils';

export const useSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const DEFAULT_DURATION_MINUTES = 60; // endTimeがない場合の仮想終了時間

  const createLocalDateTime = (dateStr, timeStr) => {
    try {
      const base = parseLocalDateYYYYMMDD(dateStr);
      const [hh, mm] = (timeStr || '00:00').split(':').map((v) => parseInt(v, 10) || 0);
      base.setHours(hh, mm, 0, 0);
      return base;
    } catch {
      return new Date(`${dateStr}T${timeStr || '00:00'}`);
    }
  };

  // 初期データの読み込み
  useEffect(() => {
    const loadInitialData = () => {
      try {
        const savedSchedules = loadSchedules();
        setSchedules(savedSchedules);
      } catch (error) {
        console.error('予定データの読み込みに失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // データが変更されたときの保存
  useEffect(() => {
    if (!loading) {
      saveSchedules(schedules);
    }
  }, [schedules, loading]);

  // 終了済み予定の自動アーカイブ
  useEffect(() => {
    if (loading) return;

    const archiveEnded = () => {
      const now = new Date();
      setSchedules(prev => prev.map(schedule => {
        if (schedule.archived) return schedule;
        try {
          const start = createLocalDateTime(schedule.date, schedule.time);
          const end = schedule.endTime
            ? createLocalDateTime(schedule.date, schedule.endTime)
            : new Date(start.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000);
          if (now > end) {
            return { ...schedule, archived: true };
          }
        } catch {}
        return schedule;
      }));
    };

    // 起動時に一度実行
    archiveEnded();
    // 60秒間隔でチェック
    const timer = setInterval(archiveEnded, 60 * 1000);
    return () => clearInterval(timer);
  }, [loading]);

  // 予定の追加
  const addSchedule = useCallback((schedule) => {
    const newSchedule = {
      ...schedule,
      id: schedule.id || `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    if (newSchedule.archived === undefined) newSchedule.archived = false;
    setSchedules(prev => [...prev, newSchedule]);
    return newSchedule;
  }, []);

  // 予定の更新
  const updateSchedule = useCallback((scheduleId, updates) => {
    setSchedules(prev => 
      prev.map(schedule => 
        schedule.id === scheduleId 
          ? { ...schedule, ...updates }
          : schedule
      )
    );
  }, []);

  // 予定の完了
  const completeSchedule = useCallback((scheduleId, completed = true) => {
    setSchedules(prev => 
      prev.map(schedule => 
        schedule.id === scheduleId 
          ? { ...schedule, status: completed ? 'completed' : 'pending' }
          : schedule
      )
    );
  }, []);

  // 予定の削除
  const deleteSchedule = useCallback((scheduleId) => {
    setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
  }, []);

  // 複数予定の削除
  const deleteMultipleSchedules = useCallback((scheduleIds) => {
    setSchedules(prev => prev.filter(schedule => !scheduleIds.includes(schedule.id)));
  }, []);

  // 予定の検索
  const searchSchedules = useCallback((searchTerm) => {
    if (!searchTerm.trim()) return schedules;
    
    const term = searchTerm.toLowerCase();
    return schedules.filter(schedule => 
      schedule.title.toLowerCase().includes(term) ||
      (schedule.description && schedule.description.toLowerCase().includes(term))
    );
  }, [schedules]);

  // 予定のフィルタリング
  // 後方互換のため第1引数に配列が来た場合はその配列を対象にフィルタ、
  // そうでない場合は内部の schedules を対象にフィルタする
  const filterSchedules = useCallback((scheduleListOrFilters, maybeFilters) => {
    const targetList = Array.isArray(scheduleListOrFilters) ? scheduleListOrFilters : schedules;
    const filters = Array.isArray(scheduleListOrFilters) ? (maybeFilters || {}) : (scheduleListOrFilters || {});

    return targetList.filter(schedule => {
      // カテゴリフィルター
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(schedule.category)) {
          return false;
        }
      }

      // 優先度フィルター
      if (filters.priorities && filters.priorities.length > 0) {
        if (!filters.priorities.includes(schedule.priority)) {
          return false;
        }
      }

      // 日付範囲フィルター
      if (filters.dateRange) {
        const scheduleDate = new Date(schedule.date);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        
        if (scheduleDate < startDate || scheduleDate > endDate) {
          return false;
        }
      }

      return true;
    });
  }, [schedules]);

  // 予定のソート
  const sortSchedules = useCallback((scheduleList, sortBy = 'time') => {
    return [...scheduleList].sort((a, b) => {
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
        default:
          return 0;
      }
    });
  }, []);

  // 特定の日付の予定を取得
  const getSchedulesByDate = useCallback((date) => {
    return schedules.filter(schedule => schedule.date === date);
  }, [schedules]);

  // 特定の期間の予定を取得
  const getSchedulesByDateRange = useCallback((startDate, endDate) => {
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return scheduleDate >= start && scheduleDate <= end;
    });
  }, [schedules]);

  // 今日の予定を取得
  const getTodaySchedules = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return getSchedulesByDate(today);
  }, [getSchedulesByDate]);

  // 今後の予定を取得
  const getUpcomingSchedules = useCallback((days = 7) => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate > today && scheduleDate <= futureDate;
    });
  }, [schedules]);

  // 過去の予定を取得
  const getPastSchedules = useCallback(() => {
    const now = new Date();
    return schedules.filter(schedule => {
      const scheduleDateTime = createLocalDateTime(schedule.date, schedule.time);
      return scheduleDateTime < now;
    });
  }, [schedules]);

  // 繰り返し予定の生成
  const generateRecurringSchedules = useCallback((schedule, endDate) => {
    const recurringSchedules = [];
    const startDate = new Date(schedule.date);
    const end = new Date(endDate);
    let currentDate = new Date(startDate);

    while (currentDate <= end) {
      if (currentDate.getTime() !== startDate.getTime()) {
        const newSchedule = {
          ...schedule,
          id: `${schedule.id}_${currentDate.toISOString().split('T')[0]}`,
          date: currentDate.toISOString().split('T')[0]
        };
        recurringSchedules.push(newSchedule);
      }

      // 次の日付を計算
      switch (schedule.recurrence.type) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
        default:
          return recurringSchedules;
      }
    }

    return recurringSchedules;
  }, []);

  return {
    schedules,
    loading,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    deleteMultipleSchedules,
    searchSchedules,
    filterSchedules,
    sortSchedules,
    getSchedulesByDate,
    getSchedulesByDateRange,
    getTodaySchedules,
    getUpcomingSchedules,
    getPastSchedules,
    generateRecurringSchedules,
    completeSchedule
  };
};


import { useState, useMemo } from 'react';
import { Calendar, Clock, Bell, TrendingUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScheduleCard from '../Schedule/ScheduleCard';

const Dashboard = ({ 
  schedules, 
  onAddSchedule, 
  onEditSchedule, 
  onDeleteSchedule,
  onViewChange,
  onOpenSettings,
  onCompleteSchedule
}) => {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  // 今日の予定を取得
  const todaySchedules = useMemo(() => {
    return schedules
      .filter(schedule => schedule.date === today)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [schedules, today]);

  // 直近の予定を取得（今後7日間）
  const upcomingSchedules = useMemo(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return schedules
      .filter(schedule => {
        const scheduleDate = new Date(schedule.date);
        return scheduleDate > now && scheduleDate <= nextWeek;
      })
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        return dateCompare !== 0 ? dateCompare : a.time.localeCompare(b.time);
      })
      .slice(0, 5);
  }, [schedules, now]);

  // 統計データ
  const stats = useMemo(() => {
    const totalSchedules = schedules.length;
    const todayCount = todaySchedules.length;
    const upcomingCount = upcomingSchedules.length;
    const overdueCount = schedules.filter(schedule => {
      const scheduleDateTime = new Date(`${schedule.date}T${schedule.time}`);
      return scheduleDateTime < now;
    }).length;

    return {
      total: totalSchedules,
      today: todayCount,
      upcoming: upcomingCount,
      overdue: overdueCount
    };
  }, [schedules, todaySchedules, upcomingSchedules, now]);

  // 次の予定を取得
  const nextSchedule = useMemo(() => {
    const futureSchedules = schedules
      .filter(schedule => {
        const scheduleDateTime = new Date(`${schedule.date}T${schedule.time}`);
        return scheduleDateTime > now;
      })
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        return dateCompare !== 0 ? dateCompare : a.time.localeCompare(b.time);
      });

    return futureSchedules[0] || null;
  }, [schedules, now]);

  const formatTimeUntil = (schedule) => {
    if (!schedule) return '';
    
    const scheduleDateTime = new Date(`${schedule.date}T${schedule.time}`);
    const diff = scheduleDateTime.getTime() - now.getTime();
    
    if (diff < 0) return '過去の予定';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}日後`;
    } else if (hours > 0) {
      return `${hours}時間${minutes}分後`;
    } else {
      return `${minutes}分後`;
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            ダッシュボード
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {new Date().toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </p>
        </div>
        <Button onClick={onAddSchedule} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          新しい予定
        </Button>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日の予定</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">
              全{stats.total}件中
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今後の予定</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcoming}</div>
            <p className="text-xs text-muted-foreground">
              今後7日間
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">次の予定</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {nextSchedule ? nextSchedule.title : 'なし'}
            </div>
            <p className="text-xs text-muted-foreground">
              {nextSchedule ? formatTimeUntil(nextSchedule) : '予定なし'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">過去の予定</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              完了済み
            </p>
          </CardContent>
        </Card>
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 今日の予定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>今日の予定</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaySchedules.length > 0 ? (
              <div className="space-y-3">
                {todaySchedules.map(schedule => (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    onEdit={onEditSchedule}
                    onDelete={onDeleteSchedule}
                    onComplete={(id, completed) => onCompleteSchedule?.(id, completed)}
                    className="shadow-none border-0 bg-gray-50 dark:bg-gray-700"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>今日の予定はありません</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onAddSchedule}
                  className="mt-2"
                >
                  予定を追加
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 直近の予定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>直近の予定</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingSchedules.length > 0 ? (
              <div className="space-y-3">
                {upcomingSchedules.map(schedule => (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    onEdit={onEditSchedule}
                    onDelete={onDeleteSchedule}
                    onComplete={(id, completed) => onCompleteSchedule?.(id, completed)}
                    className="shadow-none border-0 bg-gray-50 dark:bg-gray-700"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>直近の予定はありません</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onAddSchedule}
                  className="mt-2"
                >
                  予定を追加
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* クイックアクション */}
      <Card>
        <CardHeader>
          <CardTitle>クイックアクション</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={onAddSchedule}
            >
              <Plus className="h-6 w-6" />
              <span>新しい予定</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => onViewChange?.('calendar')}
            >
              <Calendar className="h-6 w-6" />
              <span>カレンダー表示</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => onOpenSettings?.()}
            >
              <Bell className="h-6 w-6" />
              <span>通知設定</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;


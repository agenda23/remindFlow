import { Clock, Bell, Edit, Trash2, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ScheduleCard = ({ 
  schedule, 
  onEdit, 
  onDelete, 
  onClick,
  onComplete,
  className = '' 
}) => {
  const now = new Date();
  const getTimes = (s) => {
    try {
      const start = new Date(`${s.date}T${s.time}`);
      const end = s.endTime ? new Date(`${s.date}T${s.endTime}`) : new Date(start.getTime() + 60 * 60 * 1000);
      return { start, end };
    } catch {
      return { start: null, end: null };
    }
  };

  const deriveStatus = (s) => {
    if (s.archived) return 'archived';
    if (s.status === 'completed') return 'completed';
    const { start, end } = getTimes(s);
    if (!start || !end) return 'not_started';
    if (now < start) return 'not_started';
    if (now >= start && now < end) return 'ongoing';
    return 'archived';
  };

  const status = deriveStatus(schedule);
  const isOngoing = status === 'ongoing';
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'work': return 'bg-blue-100 text-blue-800';
      case 'personal': return 'bg-green-100 text-green-800';
      case 'family': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'work': return '仕事';
      case 'personal': return '個人';
      case 'family': return '家族';
      default: return 'その他';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  return (
    <div 
      className={`
        relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
        hover:shadow-md transition-all duration-200 cursor-pointer
        ${isOngoing ? 'ring-2 ring-blue-300' : ''}
        ${status === 'archived' ? 'opacity-70' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="p-4">
        {/* ヘッダー */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {schedule.title}
            </h3>
            {schedule.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {schedule.description}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onComplete?.(schedule.id, schedule.status !== 'completed');
              }}
              className={`h-8 w-8 p-0 ${schedule.status === 'completed' ? 'text-green-600' : ''}`}
              title={schedule.status === 'completed' ? '未完了に戻す' : '完了にする'}
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(schedule);
              }}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(schedule.id);
              }}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 日時情報 */}
        <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(schedule.date)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>
              {schedule.time}
              {schedule.endTime ? ` - ${schedule.endTime}` : ''}
            </span>
          </div>
          {schedule.reminder.enabled && (
            <div className="flex items-center space-x-1">
              <Bell className="h-4 w-4" />
              <span>{schedule.reminder.minutesBefore}分前</span>
            </div>
          )}
        </div>

        {/* バッジ */}
        <div className="flex items-center space-x-2">
          <Badge 
            variant="outline" 
            className={getCategoryColor(schedule.category)}
          >
            {getCategoryLabel(schedule.category)}
          </Badge>
          <Badge 
            variant="outline" 
            className={getPriorityColor(schedule.priority)}
          >
            優先度: {getPriorityLabel(schedule.priority)}
          </Badge>
          {isOngoing && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              進行中
            </Badge>
          )}
          {status === 'archived' && (
            <Badge variant="outline" className="bg-gray-100 text-gray-800">
              アーカイブ
            </Badge>
          )}
          {schedule.recurrence.type !== 'none' && (
            <Badge variant="outline" className="bg-indigo-100 text-indigo-800">
              繰り返し
            </Badge>
          )}
        </div>
      </div>

      {/* 左側の色付きボーダー（優先度/ステータス表示） */}
      <div className={`
        absolute left-0 top-0 bottom-0 w-1 rounded-l-lg
        ${status === 'archived'
          ? 'bg-gray-400'
          : schedule.status === 'completed'
            ? 'bg-green-600'
            : isOngoing
              ? 'bg-blue-600'
              : schedule.priority === 'high' ? 'bg-red-500' : 
                schedule.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}
      `} />
    </div>
  );
};

export default ScheduleCard;


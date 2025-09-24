import { useState, useEffect } from 'react';
import { X, Bell, Repeat, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const ScheduleForm = ({ 
  schedule = null, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
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

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (schedule) {
      setFormData(schedule);
    } else {
      // 新規作成時のデフォルト値
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5);
      
      setFormData(prev => ({
        ...prev,
        date: today,
        time: currentTime
      }));
    }
  }, [schedule]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '件名は必須です';
    }
    
    if (!formData.date) {
      newErrors.date = '日付は必須です';
    }
    
    if (!formData.time) {
      newErrors.time = '時間は必須です';
    }

    // 過去の日時チェック
    if (formData.date && formData.time) {
      const scheduleDateTime = new Date(`${formData.date}T${formData.time}`);
      if (scheduleDateTime < new Date()) {
        newErrors.datetime = '過去の日時は設定できません';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const scheduleData = {
      ...formData,
      id: schedule?.id || `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    onSave(scheduleData);
    onClose();
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleReminderChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      reminder: {
        ...prev.reminder,
        [field]: value
      }
    }));
  };

  const handleRecurrenceChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      recurrence: {
        ...prev.recurrence,
        [field]: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {schedule ? '予定を編集' : '新しい予定'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 基本情報 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">件名 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="予定の件名を入力"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">詳細</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="詳細な内容（オプション）"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">日付 *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className={`pl-10 ${errors.date ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.date && (
                  <p className="text-sm text-red-600 mt-1">{errors.date}</p>
                )}
              </div>

              <div>
                <Label htmlFor="time">時間 *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    className={`pl-10 ${errors.time ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.time && (
                  <p className="text-sm text-red-600 mt-1">{errors.time}</p>
                )}
              </div>
            </div>

            {errors.datetime && (
              <p className="text-sm text-red-600">{errors.datetime}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">カテゴリ</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">仕事</SelectItem>
                    <SelectItem value="personal">個人</SelectItem>
                    <SelectItem value="family">家族</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">優先度</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* リマインダー設定 */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-gray-500" />
              <Label className="text-base font-medium">リマインダー設定</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.reminder.enabled}
                onCheckedChange={(checked) => handleReminderChange('enabled', checked)}
              />
              <Label>リマインダーを有効にする</Label>
            </div>

            {formData.reminder.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                <div>
                  <Label htmlFor="minutesBefore">通知タイミング</Label>
                  <Select 
                    value={formData.reminder.minutesBefore.toString()} 
                    onValueChange={(value) => handleReminderChange('minutesBefore', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">開始時刻</SelectItem>
                      <SelectItem value="5">5分前</SelectItem>
                      <SelectItem value="10">10分前</SelectItem>
                      <SelectItem value="15">15分前</SelectItem>
                      <SelectItem value="30">30分前</SelectItem>
                      <SelectItem value="60">1時間前</SelectItem>
                      <SelectItem value="120">2時間前</SelectItem>
                      <SelectItem value="1440">1日前</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sound">通知音</Label>
                  <Select 
                    value={formData.reminder.sound} 
                    onValueChange={(value) => handleReminderChange('sound', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chime">チャイム</SelectItem>
                      <SelectItem value="bell">ベル</SelectItem>
                      <SelectItem value="notification">通知音</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* 繰り返し設定 */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center space-x-2">
              <Repeat className="h-5 w-5 text-gray-500" />
              <Label className="text-base font-medium">繰り返し設定</Label>
            </div>

            <div>
              <Label htmlFor="recurrenceType">繰り返し</Label>
              <Select 
                value={formData.recurrence.type} 
                onValueChange={(value) => handleRecurrenceChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">なし</SelectItem>
                  <SelectItem value="daily">毎日</SelectItem>
                  <SelectItem value="weekly">毎週</SelectItem>
                  <SelectItem value="monthly">毎月</SelectItem>
                  <SelectItem value="yearly">毎年</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.recurrence.type !== 'none' && (
              <div>
                <Label htmlFor="endDate">終了日</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.recurrence.endDate}
                  onChange={(e) => handleRecurrenceChange('endDate', e.target.value)}
                  min={formData.date}
                />
              </div>
            )}
          </div>

          {/* アクションボタン */}
          <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {schedule ? '更新' : '作成'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleForm;


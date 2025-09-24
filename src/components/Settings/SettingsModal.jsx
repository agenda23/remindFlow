import { useEffect, useState } from 'react';
import { X, Bell, Settings, Download, Upload, Paintbrush } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { saveSettings, loadSettings, exportToCSV, exportToICS } from '@/utils/storage';

const SettingsModal = ({ isOpen, onClose, schedules, onToggleNotifications, onImportSchedules, onSaved }) => {
  const [settingsState, setSettingsState] = useState(null);
  const [importError, setImportError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const s = loadSettings();
    setSettingsState(s);
    setImportError('');
  }, [isOpen]);

  const handleNotificationChange = (key, value) => {
    setSettingsState(prev => ({
      ...prev,
      notification: {
        ...prev.notification,
        [key]: value
      }
    }));
    // 有効/無効は即時反映（保存前でも体感を合わせる）
    if (key === 'enabled') {
      try { onToggleNotifications?.(!!value); } catch { /* noop */ }
    }
  };

  const handleDisplayChange = (key, value) => {
    setSettingsState(prev => ({
      ...prev,
      display: {
        ...prev.display,
        [key]: value
      }
    }));
  };

  const handleDefaultsChange = (key, value) => {
    setSettingsState(prev => ({
      ...prev,
      defaults: {
        ...(prev.defaults || {}),
        [key]: value
      }
    }));
  };

  const saveAll = async () => {
    if (!settingsState) return;
    saveSettings(settingsState);
    if (typeof settingsState.notification.enabled === 'boolean') {
      await onToggleNotifications?.(settingsState.notification.enabled);
    }
    onSaved?.(settingsState);
    onClose();
  };

  const handleExportCSV = () => {
    const csv = exportToCSV(schedules || []);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedules_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportICS = () => {
    const ics = exportToICS(schedules || []);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedules_${new Date().toISOString().slice(0,10)}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = {
      schedules: schedules || [],
      settings: settingsState
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `remindflow_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!json || typeof json !== 'object') throw new Error('不正なファイル形式');
      if (json.settings) {
        saveSettings(json.settings);
        setSettingsState(json.settings);
        try {
          // 通知の有効/無効を即時適用
          if (typeof json.settings?.notification?.enabled === 'boolean') {
            await onToggleNotifications?.(json.settings.notification.enabled);
          }
          // 表示/通知設定の即時反映（テーマ/フォントサイズ/音/秒数など）
          onSaved?.(json.settings);
        } catch { /* noop */ }
      }
      if (Array.isArray(json.schedules) && json.schedules.length > 0) {
        await onImportSchedules?.(json.schedules);
      }
      setImportError('');
      alert('インポートが完了しました。必要に応じて画面を確認してください。');
  } catch {
      setImportError('JSONの読み込みに失敗しました。ファイル形式を確認してください。');
    } finally {
      event.target.value = '';
    }
  };

  if (!isOpen) return null;

  // 設定ロード前はプレースホルダーを表示（既存値の未反映に見えないように）
  if (isOpen && !settingsState) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>設定</span>
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="p-6">
            <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
              <span>設定を読み込み中...</span>
            </div>
          </div>
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>閉じる</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>設定</span>
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 本文 */}
        <div className="p-6 space-y-8">
          {/* ラベル用の補助関数は不要のため削除 */}
          {/* 通知設定 */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-gray-500" />
              <h3 className="text-base font-medium text-gray-900 dark:text-white">通知設定</h3>
            </div>
            <div className="space-y-4 sm:pl-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <Label>通知を有効にする</Label>
                </div>
                <Switch
                  checked={!!settingsState?.notification.enabled}
                  onCheckedChange={(checked) => handleNotificationChange('enabled', !!checked)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>デフォルトの通知タイミング</Label>
                  <Select
                    key={`minutes-${String(settingsState?.notification.defaultMinutesBefore ?? 15)}`}
                    value={String(settingsState?.notification.defaultMinutesBefore ?? 15)}
                    onValueChange={(v) => handleNotificationChange('defaultMinutesBefore', parseInt(v))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">開始時刻</SelectItem>
                      <SelectItem value="5">5分前</SelectItem>
                      <SelectItem value="10">10分前</SelectItem>
                      <SelectItem value="15">15分前</SelectItem>
                      <SelectItem value="30">30分前</SelectItem>
                      <SelectItem value="60">1時間前</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>通知音</Label>
                  <Select
                    key={`sound-${settingsState?.notification.defaultSound || 'chime'}`}
                    value={settingsState?.notification.defaultSound || 'chime'}
                    onValueChange={(v) => handleNotificationChange('defaultSound', v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chime">チャイム</SelectItem>
                      <SelectItem value="bell">ベル</SelectItem>
                      <SelectItem value="notification">通知音</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </section>

          {/* 表示設定 */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2">
              <Paintbrush className="h-5 w-5 text-gray-500" />
              <h3 className="text-base font-medium text-gray-900 dark:text-white">表示設定</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:pl-6">
              <div className="space-y-2">
                <Label>テーマ</Label>
                <Select
                  key={`theme-${settingsState?.display.theme || 'light'}`}
                  value={settingsState?.display.theme || 'light'}
                  onValueChange={(v) => handleDisplayChange('theme', v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">ライト</SelectItem>
                    <SelectItem value="dark">ダーク</SelectItem>
                    <SelectItem value="custom">カスタム</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>フォントサイズ</Label>
                <Select
                  key={`font-${settingsState?.display.fontSize || 'medium'}`}
                  value={settingsState?.display.fontSize || 'medium'}
                  onValueChange={(v) => handleDisplayChange('fontSize', v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">小</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="large">大</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* データ管理 */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-gray-500" />
              <h3 className="text-base font-medium text-gray-900 dark:text-white">データ管理</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:pl-6">
              <div className="space-y-2">
                <Label>エクスポート</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={handleExportCSV}>CSVエクスポート</Button>
                  <Button variant="outline" onClick={handleExportICS}>ICSエクスポート</Button>
                  <Button variant="outline" onClick={handleExportJSON}>JSONバックアップ</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>インポート（JSON）</Label>
                <Input className="w-full" type="file" accept="application/json" onChange={handleImportJSON} />
                {importError && (
                  <p className="text-sm text-red-600">{importError}</p>
                )}
              </div>
            </div>
          </section>

          {/* 作成時デフォルト */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2">
              <Paintbrush className="h-5 w-5 text-gray-500" />
              <h3 className="text-base font-medium text-gray-900 dark:text-white">作成時デフォルト</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:pl-6">
              <div className="space-y-2">
                <Label>デフォルトのカテゴリ</Label>
                <Select
                  key={`defcat-${settingsState?.defaults?.category || 'personal'}`}
                  value={settingsState?.defaults?.category || 'personal'}
                  onValueChange={(v) => handleDefaultsChange('category', v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">仕事</SelectItem>
                    <SelectItem value="personal">個人</SelectItem>
                    <SelectItem value="family">家族</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        </div>

        {/* フッター */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>キャンセル</Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={saveAll}>保存</Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;



import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { loadNotificationHistory, saveNotificationHistory } from '@/utils/storage';
import { X, CheckCircle2, Trash2 } from 'lucide-react';

const NotificationHistoryModal = ({ isOpen, onClose }) => {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    const list = loadNotificationHistory();
    setEntries(list);
  }, [isOpen]);

  const markAllAsRead = () => {
    const updated = entries.map(e => ({ ...e, read: true }));
    setEntries(updated);
    saveNotificationHistory(updated);
  };

  const clearAll = () => {
    if (!window.confirm('通知履歴をすべて削除しますか？')) return;
    setEntries([]);
    saveNotificationHistory([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">通知履歴</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              すべて既読にする
            </Button>
            <Button variant="destructive" size="sm" onClick={clearAll}>
              <Trash2 className="h-4 w-4 mr-2" />
              すべて削除
            </Button>
          </div>

          {entries.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">通知履歴はありません。</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {entries.map((e) => (
                <li key={e.id} className="py-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className={`font-medium break-words ${e.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>{e.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{e.body}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(e.createdAt).toLocaleString()}</p>
                    </div>
                    {!e.read && (
                      <span className="inline-flex h-2 w-2 rounded-full bg-blue-500 mt-2" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationHistoryModal;



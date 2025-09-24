# RemindFlow リリースノート

## v0.2.0 (2025-09-24)

### 追加（Features）
- 通知履歴
  - 通知表示時に履歴へ自動追加（直近100件を保持）
  - 履歴モーダルで確認・既読化・全削除が可能
  - 導線: ヘッダー > 通知メニュー > 「通知履歴を表示」
- 高度検索（一覧）
  - 日付範囲（開始/終了）での絞り込み
  - AND/ORモード切替（将来の条件拡張に備えた実装）
  - 導線: 一覧画面 > フィルター > 高度検索
- ICSエクスポート
  - iCalendar形式（.ics）で予定を一括出力
  - 導線: 設定 > データ管理 > 「ICSエクスポート」

### 改善（Improvements）
- 予定保存の安全性
  - UTF-8対応のBase64変換に変更（日本語を含む予定の保存/復元の安定化）
- 設定の即時反映
  - 保存直後にテーマ（ライト/ダーク）・フォントサイズを`document.documentElement`へ適用
- ストレージ使用量
  - キー/値に基づく概算に修正し、表示精度を改善

### 修正（Fixes）
- `useSchedules`の二重呼び出しを解消し、保存レースの可能性を排除
- 一部例外時の処理を補強し、エラーログを明確化

### ドキュメント（Docs）
- README/仕様書/未実装方針/概要の各ドキュメントを最新実装へ更新
  - 通知履歴、ICSエクスポート、高度検索（AND/OR・日付範囲）を追記

### 画面上の確認ポイント（撮影ガイド）
- ヘッダーの通知メニュー
  - 赤ドット表示（当日これからのリマインダーがある場合）
  - 「通知履歴を表示」項目
- 設定モーダル > データ管理
  - 「CSVエクスポート」「ICSエクスポート」「JSONバックアップ」ボタン
- 一覧画面 > フィルター
  - 高度検索（開始/終了日・AND/OR）UI
- 通知履歴モーダル
  - 既読化・全削除ボタン、履歴リスト

### 開発者向けメモ（Dev Notes）
- 主要変更ファイル
  - `src/utils/storage.ts`: UTF-8 Base64、ICS出力、通知履歴API
  - `src/utils/notifications.ts`: 通知発火時の履歴追加
  - `src/components/Views/ListView.jsx`: 高度検索UI/ロジック
  - `src/components/Settings/SettingsModal.jsx`: ICSボタン追加
  - `src/components/Settings/NotificationHistoryModal.jsx`: 履歴モーダル
  - `src/App.jsx`/`src/components/Layout/Header.jsx`: 履歴導線と設定反映

---

## v0.1.x（過去）
- 初期版。予定管理、基本通知、CSV/JSONエクスポート/インポート等。

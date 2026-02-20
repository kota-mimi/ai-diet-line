# Firebase Functions - Healthy-kun LINE Bot

このディレクトリは**自己完結型のFirebase Functions環境**です。Next.jsアプリのバックエンド機能（LINE Bot, AI, 決済）を完全に移行済みです。

## 🚀 デプロイ手順

### 1. 環境変数の設定
`.env` ファイルに実際の値を設定してください（`.env.example` を参考）:

```bash
cp .env.example .env
# .env ファイルを編集して実際の値を入力
```

**重要な環境変数:**
- `LINE_CHANNEL_ACCESS_TOKEN` / `LINE_CHANNEL_SECRET`
- `GOOGLE_GEMINI_API_KEY`
- `FIREBASE_PROJECT_ID` / `FIREBASE_PRIVATE_KEY` 等
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` 等

### 2. Firebase CLI のセットアップ
```bash
npm install -g firebase-tools
firebase login
firebase init
```

### 3. プロジェクトID の設定
```bash
# Firebase プロジェクトを関連付け
firebase use YOUR_FIREBASE_PROJECT_ID
```

### 4. ビルド & デプロイ
```bash
npm run build
firebase deploy --only functions
```

### 5. Webhook URL の設定
デプロイ後、以下のURLが発行されます：

```
https://asia-northeast1-YOUR_PROJECT_ID.cloudfunctions.net/lineWebhook
https://asia-northeast1-YOUR_PROJECT_ID.cloudfunctions.net/stripeWebhook
```

**設定が必要な場所：**
1. **LINE Developers Console** → Webhook URL に `lineWebhook` のURLを設定
2. **Stripe Dashboard** → Webhook Endpoints に `stripeWebhook` のURLを設定
3. **コード内のTODOコメント箇所** → 実際のURLに変更

## ⚠️ 複製時の注意点

このコードには以下のコメントが含まれています：
```typescript
// TODO: [複製時注意] デプロイ後に発行されたURLに変更する
```

新しい環境にコピーする際は、これらの箇所を新しいデプロイURLに更新してください。

## 📁 ディレクトリ構成

```
functions/
├── src/
│   ├── index.ts          # メイン関数（lineWebhook, stripeWebhook）
│   ├── services/         # AIサービス、Flexメッセージ等
│   ├── lib/             # Firebase、ユーティリティ等
│   ├── utils/           # 計算、制限チェック等
│   └── types/           # TypeScript型定義
├── .env                 # 環境変数（実際の値）
├── .env.example        # 環境変数テンプレート
├── package.json
└── tsconfig.json
```

## 🔧 開発コマンド

```bash
# 依存関係インストール
npm install

# TypeScript ビルド
npm run build

# ローカル実行（エミュレーター）
npm run serve

# デプロイ
npm run deploy

# ログ確認
npm run logs
```

## 🎯 機能一覧

- **LINE Bot**: メッセージ処理、食事記録、AI会話
- **Stripe決済**: サブスクリプション管理、Webhook処理
- **AI機能**: Google Gemini による食事分析、健康アドバイス
- **Firebase**: Firestore データ操作、Storage 画像管理

## 📞 サポート

問題が発生した場合は、以下を確認してください：

1. **環境変数**: すべて正しく設定されているか
2. **Firebase権限**: Admin SDK の認証情報が有効か
3. **Webhook URL**: LINE/Stripe に正しいURLが設定されているか
4. **ログ**: `firebase functions:log` でエラー詳細を確認

## 📈 移行履歴

### 2026-02-20: Next.js → Firebase Functions 完全移行
- **旧環境**: 
  - Repository: https://github.com/kota-mimi/kotakun-AI-health [DEPRECATED]
  - Domain: kotakun-ai-health.vercel.app [DEPRECATED]
  - Architecture: Next.js App Router
- **新環境**:
  - Repository: https://github.com/kota-mimi/ai-diet-line
  - Domain: ai-diet-line-test.vercel.app
  - Architecture: Firebase Functions (Gen 2)

### 移行理由
- **横展開対応**: 別顧客への複製を簡素化
- **自己完結化**: 依存関係を全て内包
- **運用性向上**: Firebase Functions のスケーラビリティ活用

---

**🎉 これで別顧客環境への複製も簡単です！このfunctionsディレクトリをコピーして環境変数を設定するだけで稼働します。**
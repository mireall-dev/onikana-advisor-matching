# オニカナ顧問マッチング

企業と営業顧問をマッチングする BtoB SaaS プラットフォーム。

## 技術スタック

- **フレームワーク**: Next.js 16.2.6 (App Router) + React 19 + TypeScript
- **スタイル**: Tailwind CSS v4 + Base UI (`@base-ui/react`) ベースの shadcn 風コンポーネント
- **バックエンド**: Supabase (Auth + Postgres + Realtime)
- **決済**: Stripe (PaymentElement, Webhook)
- **テスト**: Vitest + Testing Library
- **デプロイ想定**: Vercel

## セットアップ

### 1. 依存関係

```bash
npm install
```

### 2. 環境変数

`.env.local.example` を `.env.local` にコピーして値を設定します。

```bash
cp .env.local.example .env.local
```

| 変数 | 用途 | 必須 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL | 本番のみ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon キー | 本番のみ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role キー(seed/webhook) | 本番のみ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe 公開鍵 | 決済利用時 |
| `STRIPE_SECRET_KEY` | Stripe シークレット鍵 | 決済利用時 |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook 署名鍵 | webhook 利用時 |
| `NEXT_PUBLIC_APP_URL` | デプロイ後の URL | 本番のみ |

> Supabase env が未設定の場合、組み込みのモッククライアントが自動で使われます。
> Stripe env が未設定の場合、決済画面は「擬似決済」モードになります。

### 3. 開発サーバー

```bash
npm run dev
```

`http://localhost:3000` を開きます。

## デモアカウント(モックモード)

ログイン画面の「デモアカウント」ボタンから即座にロール毎の画面に入れます。

| ロール | メール | パスワード |
|---|---|---|
| 企業 | `demo-company@example.com` | `demo1234` |
| 顧問 | `demo-advisor@example.com` | `demo1234` |
| 管理者 | `demo-admin@example.com` | `demo1234` |

## モックモードと本番モード

| | モックモード | 本番モード |
|---|---|---|
| 切替条件 | `NEXT_PUBLIC_SUPABASE_*` 未設定 | Supabase env 設定済み |
| データ | `src/lib/mock/data.ts` のシード | 実 Supabase |
| 認証 | localStorage に user_id | Supabase Auth + cookie |
| Realtime | no-op | Supabase Realtime |
| 決済 | 擬似成功ボタン | Stripe PaymentElement |
| Webhook | 503 を返す | 実 webhook 処理 |

## Supabase セットアップ(本番)

1. Supabase プロジェクトを作成
2. `supabase/schema.sql` を SQL Editor で実行
3. デモ用 auth ユーザーを seed:
   ```bash
   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-auth.mjs
   ```
4. `supabase/seed.sql` を SQL Editor で実行(マスター/サンプルデータ)

## ディレクトリ構成

```
src/
  app/                       # Next.js App Router
    (auth)/                  # ログイン・登録
    company/                 # 企業向け画面
    advisor/                 # 顧問向け画面
    admin/                   # 管理者向け画面
    api/
      auth/callback/         # Supabase OAuth callback
      stripe/
        create-payment/      # 決済 PaymentIntent 作成
        webhook/             # Stripe webhook 受信
  components/
    layout/                  # Header / Footer
    shared/                  # ドメインに依存しない再利用部品
    ui/                      # 純粋な UI プリミティブ
  hooks/
    use-auth.ts              # ロール込みの認証フック
    use-realtime-messages.ts # Realtime チャット購読
  lib/
    mock/                    # Supabase なしで動かす実装
    supabase/                # 本番 Supabase クライアント (browser/server/middleware)
    stripe.ts                # Stripe ヘルパー
    utils.ts                 # cn, getInitials, formatHourlyRate
  types/database.ts          # ドメイン型 + 定数 (INDUSTRIES など)
  proxy.ts                   # Next.js Proxy (旧 middleware)
supabase/
  schema.sql                 # RLS + トリガー含む完全スキーマ
  seed.sql                   # マスターデータ
scripts/
  seed-auth.mjs              # Supabase Auth にデモユーザー作成
```

## スクリプト

```bash
npm run dev          # 開発サーバー (Turbopack)
npm run build        # プロダクションビルド
npm run start        # ビルド成果物の起動
npm run lint         # ESLint
npm test             # Vitest 単発実行
npm run test:watch   # Vitest watch モード
```

## 主要フロー

### 企業

1. `/company/search` で検索 → `/company/advisors` で絞り込み
2. 顧問詳細から「面談リクエスト」を送信(`meeting_requests` を作成、初期 `match` レコードも作成)
3. 顧問の承認後、`/company/chat` で会話
4. 双方が「マッチ完了」を確認 → `is_matched=true`(DB トリガー)
5. `/company/payment/[matchId]` で Stripe 決済
6. `/company/review/[matchId]` でレビュー投稿(`rating_avg` は DB トリガーで自動更新)

### 顧問

1. 登録 → 管理者承認待ち
2. `/advisor/dashboard` で受信リクエスト確認
3. `/advisor/requests/[id]` で承認/見送り、承認後にチャット & マッチ完了確認
4. `/advisor/profile/edit` でプロフィール更新

### 管理者

- `/admin/approvals` 顧問承認
- `/admin/users` / `/admin/requests` / `/admin/matches` 各種一覧

## デプロイ

Vercel を推奨。リポジトリを連携し、上記の環境変数を Vercel プロジェクト設定に追加してください。

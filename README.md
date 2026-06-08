# みんなの保健室ひだまり - 相談予約アプリ

会社の保健室サービス「みんなの保健室ひだまり」の相談予約システムです。

## 技術スタック

- [Next.js 16](https://nextjs.org) (App Router)
- [Supabase](https://supabase.com) (PostgreSQL + Auth)
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- TypeScript

---

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. Supabase プロジェクトの作成とリンク

```bash
# Supabase にログイン（初回のみ）
supabase login

# リモートプロジェクトにリンク（project-ref は Supabase ダッシュボードの URL から確認）
supabase link --project-ref <your-project-ref>
```

### 3. マイグレーションの適用

```bash
# リモートDBにマイグレーションを適用
supabase db push
```

これで以下のテーブルと RLS ポリシーが作成されます：
- `system_settings` — 予約設定（受付最短日数・スロットモード）
- `available_slots` — カスタムモード用の個別スロット
- `bookings` — 予約データ

### 4. 管理者ユーザーの作成

Supabase ダッシュボード > Authentication > Users > **Add user** でメールアドレスとパスワードを登録してください。

### 5. 環境変数の設定

```bash
cp .env.local.example .env.local
```

`.env.local` を開き、Supabase ダッシュボード > Settings > API の値を記入します：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 6. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) で予約フォームが開きます。  
[http://localhost:3000/admin](http://localhost:3000/admin) が管理画面です。

---

## ローカル開発（Supabase ローカル環境）

本番 Supabase を使わずにローカルでテストする場合：

```bash
# ローカル Supabase を起動（Docker が必要）
supabase start

# 表示された API URL と anon key を .env.local に設定
# NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>

# マイグレーションを適用
supabase db reset
```

---

## Vercel へのデプロイ

```bash
vercel deploy
```

Vercel ダッシュボード > Environment Variables に以下を設定してください：

| 変数名 | 値 |
|--------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase の Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の anon key |

---

## Supabase CLI よく使うコマンド

```bash
# マイグレーションの状態確認
supabase migration list

# 新しいマイグレーションファイルを作成
supabase migration new <name>

# ローカルDBとリモートの差分確認
supabase db diff

# リモートDBにマイグレーションを適用
supabase db push
```

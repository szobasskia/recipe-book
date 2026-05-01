# Recipe Book (PWA)

スマホ向けのレシピ記録アプリです。  
フロントは `React + Vite`、データ保存は `Notion Database`、公開は `GitHub Pages`、Notion連携は `Cloudflare Workers` 経由で行います。

## 主な機能

- レシピ一覧表示（カード形式）
- 料理名・食材キーワード検索
- タグ絞り込み
- ソースバッジ表示（`ChatGPT / TikTok / その他`）
- また作りたい度（★1〜5）
- 登録ボトムシート（タブ + テキスト貼り付けパース）
- レシピ詳細表示
- PWA（`manifest.json` + `service worker`）

## 必須環境変数

フロント用（`.env`）:

```bash
VITE_NOTION_TOKEN=
VITE_NOTION_DATABASE_ID=
VITE_WORKER_API_URL=http://localhost:8787
```

> 注意: 実際にフロントから使うのは `VITE_WORKER_API_URL` です。  
> `VITE_NOTION_TOKEN` / `VITE_NOTION_DATABASE_ID` は主に Workers 側設定値です（`.env.example` と項目を揃えるため記載）。

Workers 側（Cloudflare Secrets）:

- `NOTION_TOKEN`
- `NOTION_DATABASE_ID`

## Notion DB プロパティ

- `料理名`（title）
- `食材`（rich_text）
- `手順`（rich_text）
- `タグ`（multi_select）
- `ソース`（select: `ChatGPT / TikTok / その他`）
- `また作りたい度`（number）
- `メモ`（rich_text）

## ローカル起動

```bash
npm install
npm run dev
```

テスト・検証:

```bash
npm test
npm run lint
npm run build
```

## Cloudflare Workers デプロイ

`worker/` 配下をデプロイします。

```bash
cd worker
npx wrangler secret put NOTION_TOKEN
npx wrangler secret put NOTION_DATABASE_ID
npx wrangler deploy
```

デプロイ後に表示される URL（例: `https://recipe-book-notion-proxy.<subdomain>.workers.dev`）を控えてください。

## GitHub Pages デプロイ

このリポジトリには GitHub Actions ワークフロー  
`/.github/workflows/deploy-pages.yml` を用意しています。

1. GitHub リポジトリの **Settings > Pages** で Source を **GitHub Actions** に設定
2. **Settings > Secrets and variables > Actions > Variables** に  
   `VITE_WORKER_API_URL` を追加（値は Workers の本番 URL）
3. `main` に push すると自動で Pages にデプロイ

## SPA ルーティング対応（GitHub Pages）

- `public/404.html` でルート復元
- `src/main.tsx` で復元先のパスを処理
- `vite.config.ts` で `base: "/recipe-book/"` を設定

## 補足

- `.env` は `.gitignore` に含めています
- PWA は `public/manifest.json` と `public/sw.js` で構成しています

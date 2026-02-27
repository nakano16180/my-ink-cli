# Playground

`playground/` は `my-ink-cli` の UI 検証用に追加した Vite + TypeScript + React アプリです。

## 開発

```bash
npm install --prefix playground
npm run playground:dev
```

## ビルド

```bash
npm run playground:build
```

## E2E テスト (Playwright)

初回のみブラウザをインストール:

```bash
npm --prefix playground run test:e2e:install
```

テスト実行:

```bash
npm --prefix playground run test:e2e
```

`vite.config.ts` では `base: './'` を指定しているため、GitHub Pages のサブパス配下でも配信しやすい構成です。

## 運用メモ

トラブルシュートの基準表は `playground/AGENTS.md` を参照してください。

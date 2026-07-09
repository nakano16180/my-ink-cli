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

E2E は Playwright の `webServer` から `npm run build && npm run preview` を起動し、
production build に近い状態で検証します。WebContainer の起動と sandbox 内の
`npm install` を待つため、通常の DOM テストより時間がかかります。

テストでは shell の起動完了に加えて、xterm 上で `node ink-cli.mjs` を実行し、
Ink CLI の対話操作が動くことを確認します。

`vite.config.ts` では `base: './'` を指定しているため、GitHub Pages のサブパス配下でも配信しやすい構成です。

## 運用メモ

トラブルシュートの基準表は `playground/AGENTS.md` を参照してください。

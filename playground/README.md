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

`vite.config.ts` では `base: './'` を指定しているため、GitHub Pages のサブパス配下でも配信しやすい構成です。

## 開発

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

## E2E テスト

```bash
npm run test:e2e
```

Playwright は `npm run build && npm run preview -- --host 127.0.0.1 --port 4173`
で production build を配信して検証します。`vite.config.ts` の COOP/COEP
ヘッダーは WebContainer の起動に必要なので、preview 設定を外さないでください。

WebContainer の boot、sandbox 内の `npm install`、xterm 経由の
`node ink-cli.mjs` 実行まで待つため、E2E は最大 180 秒の timeout を使います。
テスト追加時は、単なる DOM の存在ではなく、status text や terminal 出力など
ユーザーから見える状態を assert してください。

Codex の通常サンドボックスでは 127.0.0.1 への Playwright 接続が `EPERM` になる
場合があります。その場合は権限付きで `npm --prefix playground run test:e2e` を
再実行して確認します。

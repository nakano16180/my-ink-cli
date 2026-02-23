# AGENTS.md (playground)

このファイルは `playground/` 配下で作業する際の補助メモです。

## トラブルシュート

`playground/src/App.tsx` には `webContainer.spawn(...)` の実行パターン比較を自動実行するハーネスを入れてあります。比較時は以下 8 ケースを同一フォーマット（終了コード / 終了直前ログ / 入力可否）で確認します。

| ケース | 終了コード | 終了直前ログ | 入力可否（矢印キー等） |
| --- | ---: | --- | --- |
| 1) `jsh -c node ink-cli.mjs` / terminal: あり / stdinWriter: あり / Ink | 0 | `INPUT:ENTER` | yes |
| 2) `node ink-cli.mjs` / terminal: あり / stdinWriter: あり / Ink | 0 | `INPUT:ENTER` | yes |
| 3) `node ink-cli.mjs` / terminal: なし / stdinWriter: あり / Ink | 0 | `INPUT:ENTER` | yes |
| 4) `node ink-cli.mjs` / terminal: あり / stdinWriter: なし / Ink | 0 | `AUTO_EXIT:INK` | no |
| 5) `jsh -c node minimal-cli.mjs` / terminal: あり / stdinWriter: あり / Minimal | 0 | `INPUT:ENTER` | yes |
| 6) `node minimal-cli.mjs` / terminal: あり / stdinWriter: あり / Minimal | 0 | `INPUT:ENTER` | yes |
| 7) `node minimal-cli.mjs` / terminal: なし / stdinWriter: あり / Minimal | 0 | `INPUT:ENTER` | yes |
| 8) `node minimal-cli.mjs` / terminal: あり / stdinWriter: なし / Minimal | 0 | `AUTO_EXIT:MINIMAL` | no |

再発調査時はこの表との差分（特に `terminal: なし` と `stdinWriter: なし` ケース）を優先確認してください。

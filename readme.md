# my-ink-cli

`my-ink-cli` is a small Ink + React terminal UI demo. It is currently a
playground-style CLI for trying common terminal interface patterns rather than
a production workflow tool.

The CLI shows an interactive menu with examples for single selection,
multi-selection, and table rendering. The repository also includes a browser
playground that runs a sample Ink CLI inside a WebContainer.

## CLI

Run the local CLI:

```bash
npm run dev
```

The menu includes:

- `Select input`: choose one item from `Ink`, `React`, `Node.js`, and
  `TypeScript`.
- `MultiSelect input`: move with arrow keys, toggle topics with Space, and
  submit with Enter.
- `Table example`: render generated user data as a terminal table.

Press Esc from a demo to return to the main menu.

## Usage

```
$ my-ink-cli --help

  Usage
    $ my-ink-cli

  Options
    --name  Your name

  Examples
    $ my-ink-cli --name=Jane
    Hello, Jane
```

## Playground

`playground/` is a Vite + React app for testing Ink in the browser. It renders
an xterm.js terminal, boots a WebContainer, mounts a small `ink-cli.mjs`
example, installs its dependencies, and starts an interactive shell.

After the shell is ready, type:

```bash
node ink-cli.mjs
```

The browser terminal then runs a small Ink menu. Use the arrow keys and Enter
to select an item, then press `q` to quit.

## Development

```bash
npm install
npm run dev
npm run build
npm test

npm install --prefix playground
npm run playground:dev
npm run playground:build
npm --prefix playground run test:e2e
```

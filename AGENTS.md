# Repository Guidelines

## Project Structure & Module Organization

This repository contains an Ink-based TypeScript CLI and a browser playground. Core CLI source lives in `source/`, with `source/cli.tsx` as the executable entry point and React/Ink components in files such as `app.tsx`, `select.tsx`, and `table.tsx`. Build output is emitted to `dist/` by `tsc`. The `playground/` directory is a separate Vite + React app for running the CLI in a WebContainer; UI code is in `playground/src/` and Playwright tests are in `playground/tests/`.

## Build, Test, and Development Commands

- `npm install`: install root CLI dependencies.
- `npm run dev`: run the Ink CLI locally through `tsx source/cli.tsx`.
- `npm run build`: compile the TypeScript CLI to `dist/`.
- `npm test`: run Prettier checks and XO linting for the root package.
- `npm install --prefix playground`: install playground dependencies.
- `npm run playground:dev`: start the Vite playground.
- `npm run playground:build`: type-check and build the playground.
- `npm --prefix playground run test:e2e`: run Playwright end-to-end tests.

## Coding Style & Naming Conventions

Use TypeScript ESM and React function components. Follow `.editorconfig`: tabs, LF line endings, UTF-8, trimmed trailing whitespace, and final newlines. YAML files use two spaces. Formatting is governed by `@vdemedes/prettier-config`; linting uses XO with semicolons enabled and React rules. Keep source filenames lowercase with hyphenated words when needed, for example `multi-select.tsx`.

## Testing Guidelines

Root validation currently consists of formatting and linting via `npm test`; add focused tests when changing CLI behavior. Playground browser coverage uses Playwright under `playground/tests/` with `*.spec.ts` files. Tests should assert user-visible behavior, such as headings, terminal rendering, status text, and CLI interaction outcomes. Install Chromium with `npm --prefix playground run test:e2e:install` before the first local E2E run if browsers are missing.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commit-style prefixes such as `feat:` and `fix(scope):`, for example `feat: setup playwright` and `fix(playground): fallback when webcontainer CLI exits with code 13`. Keep messages imperative and scoped when helpful. Pull requests should include a behavior summary, verification commands, linked issues when applicable, and screenshots or recordings for playground UI changes.

## Agent-Specific Instructions

Do not edit generated build artifacts unless the task explicitly requires it. Prefer changing root CLI code in `source/` and playground code inside `playground/src/`. Keep the root package and playground package commands distinct by using `npm --prefix playground ...` for playground-only work.

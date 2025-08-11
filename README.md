# CodeSqueeze

A small web app that concatenates a codebase into a single, structured text file for AI usage, processed entirely in the browser.

Live site: [https://codesqueeze.vercel.app](https://codesqueeze.vercel.app)

## Why

Sharing a repo with an AI often needs one compact text file. CodeSqueeze scans folders, filters out noise, and streams a readable bundle with file boundaries and a checksum.

## Features

- **Local processing**: Runs in the browser; no uploads
- **Smart filtering**: Skips binaries, `node_modules`, build outputs, and hidden system files
- **Ignore patterns**: Add custom patterns with wildcard support
- **Memory-aware**: Streams large folders in batches
- **Export options**: Copy to clipboard or download `.txt` with SHA-256
- **Stats**: File count, line count, estimated tokens, total size

## Setup

Prerequisites

- Node.js 18+
- npm

Install

```bash
git clone https://github.com/larosafrancesco289/codesqueeze.git
cd codesqueeze
npm install
```

## Quickstart

```bash
npm run dev      # start dev server
npm run build    # build for production
npm run start    # start production server
```

Quality

```bash
npm run lint         # lint
npm run format       # format with Prettier
npm run type-check   # TypeScript check
npm run test         # unit tests (Vitest)
npm run test:e2e     # e2e tests (Playwright)
```

## Usage

1. Open the app and choose a folder (or drag and drop).
2. Review detected files and adjust selections.
3. Add ignore patterns if needed.
4. Process the files and copy or download the result.

Keyboard shortcuts

- `Cmd+O` / `Ctrl+O`: choose folder
- `Cmd+Shift+C` / `Ctrl+Shift+C`: copy result

## Architecture

- `src/app` Next.js entry, layout, and page
- `src/components` UI and feature components
- `src/lib` file scanning, processing, utils, and clipboard helpers
- `src/test` test setup

Code tree

```
src/
  app/
  components/
  lib/
  test/
```

## License

MIT. See `LICENSE`.

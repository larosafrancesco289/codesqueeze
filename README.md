# 🗜️ CodeSqueeze

**Squeeze your entire codebase into LLM-friendly format** - A modern web app that transforms folder-based codebases into single, well-structured text files perfect for AI analysis and assistance.

## ✨ Features

- **📁 Smart Folder Selection** - Drag & drop or browse to select entire directories
- **🔍 Intelligent Filtering** - Automatically excludes binary files, node_modules, and hidden files
- **⚙️ Customizable Ignore Patterns** - Configure which files to ignore with wildcard support (*.log, test_*, etc.)
- **🌳 Visual File Tree** - Interactive tree view with checkboxes for granular file selection
- **⚡ Memory Efficient** - Streams large codebases without overwhelming browser memory
- **📊 Progress Tracking** - Real-time progress bar with file-by-file processing status
- **📋 Copy to Clipboard** - One-click copy with fallback for large content
- **💾 Download Option** - Download as .txt file with SHA-256 checksum
- **🌙 Dark Mode** - Modern UI with automatic dark/light mode switching
- **⌨️ Keyboard Shortcuts** - ⌘+O (open folder), ⌘+Shift+C (copy result)
- **🔒 Privacy First** - All processing happens locally, no server uploads

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.3 + React 19 + TypeScript 5.8
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Testing**: Vitest + Playwright + React Testing Library
- **File Handling**: File System Access API + webkitdirectory fallback
- **Build**: Turbopack-powered builds with ESLint 9 + Prettier

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ or 22 LTS
- Modern browser with File API support

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/codesqueeze.git
cd codesqueeze

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm run start
```

## 📖 Usage

1. **Select a Folder**: Click "Choose Folder" or drag & drop a directory
2. **Configure Settings**: Use the settings button (⚙️) to customize ignore patterns
3. **Review Files**: Use the file tree to select/deselect specific files
4. **Process**: Click "Process Files" to concatenate selected files
5. **Export**: Copy to clipboard or download as .txt file

### Ignore Patterns

The settings dialog allows you to configure which files to ignore during processing:

- **Common Patterns**: Pre-defined patterns for log files, test files, temporary files, etc.
- **Custom Patterns**: Add your own patterns with wildcard support
- **Examples**:
  - `*.log` - matches all .log files
  - `test_*` - matches files starting with "test_"
  - `temp` - matches files/folders containing "temp"
  - `.env` - matches exact filename ".env"

### Output Format

CodeSqueeze generates structured output with:

```
/* === CODEBASE INDEX === */
/* Generated: 2025-01-20T10:30:00.000Z */
/* Total Files: 15 */

/* 1. src/index.ts (2.3 KB) */
/* 2. src/components/App.tsx (4.1 KB) */
...

/* === END INDEX === */

/* === BEGIN src/index.ts === */
// Your file content here
/* === END src/index.ts === */

/* === BEGIN src/components/App.tsx === */
// Your file content here
/* === END src/components/App.tsx === */
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

## 🔧 Development

```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Lint code
npm run lint
```

### Git Hooks

Pre-commit hooks automatically run linting and formatting via Husky + lint-staged.

## 🌐 Browser Support

- **Desktop**: Chrome 86+, Firefox 82+, Safari 14+, Edge 86+
- **Mobile**: Chrome Android 132+, Safari iOS 14+

### File System Access API Support

- **Full support**: Chrome/Edge 86+, Opera 72+
- **Fallback**: Uses `webkitdirectory` on unsupported browsers

## ⚠️ Limitations

- **Clipboard Size**: ~150KB safe limit (varies by browser)
- **File Size**: Individual files >1MB excluded for performance
- **Memory**: Designed for codebases up to ~100MB total

## 🔐 Security & Privacy

- **100% Client-Side**: No data leaves your browser
- **No Analytics**: No tracking or telemetry
- **Local Storage**: Only preferences (dark mode, ignore patterns)

## 📋 Default Ignore Patterns

CodeSqueeze automatically excludes:

- `node_modules/`, `.git/`, `.next/`, `dist/`, `build/`
- Hidden files (starting with `.`)
- Binary files (images, videos, archives, fonts)
- Files larger than 1MB

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Lucide React](https://lucide.dev/) for icons
- [Radix UI](https://www.radix-ui.com/) for accessible primitives

---

**Made with ❤️ for the AI development community**

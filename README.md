# CodeSqueeze

Transform your codebase into AI-ready format by concatenating all source files into a single, well-structured text file perfect for AI analysis and assistance.

**Live Demo:** [https://codesqueeze.vercel.app](https://codesqueeze.vercel.app)

## Features

- **Smart Filtering**: Automatically excludes binary files, `node_modules`, and other non-essential files
- **Memory Efficient**: Streams large codebases without overwhelming browser memory
- **Universal Support**: Works with all programming languages and file types
- **Local Processing**: All processing happens locally in your browser - no files are uploaded to any server
- **Export Options**: Copy to clipboard or download as `.txt` with SHA-256 checksum
- **Customizable Ignore Patterns**: Configure which files and directories to exclude

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/larosafrancesco289/codesqueeze.git
cd codesqueeze
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Select a Folder**: Choose a folder containing your codebase or drag and drop it
2. **Review Files**: The tool will automatically detect and list all text files
3. **Configure Filters**: Use the settings to customize ignore patterns if needed
4. **Generate Output**: Click to concatenate all files into a single structured format
5. **Export**: Copy to clipboard or download the result

### Keyboard Shortcuts

- `⌘+O` (Mac) / `Ctrl+O` (Windows/Linux): Choose folder
- `⌘+Shift+C` (Mac) / `Ctrl+Shift+C` (Windows/Linux): Copy result

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run unit tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:e2e` - Run end-to-end tests with Playwright
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

### Tech Stack

- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Testing**: Vitest + Playwright
- **Type Checking**: TypeScript
- **Linting**: ESLint
- **Formatting**: Prettier

## Project Structure

```
src/
├── app/          # Next.js app directory
├── components/   # React components
├── lib/          # Utility functions
└── test/         # Test files
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run the test suite: `npm run test`
5. Format your code: `npm run format`
6. Commit your changes: `git commit -m 'Add feature'`
7. Push to the branch: `git push origin feature-name`
8. Submit a pull request

## Privacy & Security

CodeSqueeze processes all files locally in your browser. No data is transmitted to external servers, ensuring your code remains private and secure.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
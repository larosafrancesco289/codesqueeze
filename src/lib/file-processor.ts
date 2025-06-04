export interface FileEntry {
  path: string;
  file: File;
  size: number;
  isIncluded: boolean;
  isText: boolean;
}

export interface ProcessingProgress {
  current: number;
  total: number;
  currentFile: string;
}

export interface ProcessingResult {
  content: string;
  stats: {
    totalFiles: number;
    totalSize: number;
    lineCount: number;
    estimatedTokens: number;
  };
  checksum: string;
}

const BINARY_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.rar',
  '.7z',
  '.mp3',
  '.mp4',
  '.avi',
  '.mov',
  '.wav',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.bin',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.otf',
]);

const DEFAULT_IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  '.vercel',
  'dist',
  'build',
  '.turbo',
  'coverage',
  '.nyc_output',
  'out',
  '.cache',
];

/**
 * Convert a glob pattern to a regular expression
 */
function globToRegex(pattern: string): RegExp {
  // Escape special regex characters except * and ?
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  
  return new RegExp(`^${escaped}$`, 'i'); // Case insensitive
}

/**
 * Check if a filename matches a pattern (supports wildcards)
 */
function matchesPattern(filename: string, pattern: string): boolean {
  // Simple string contains check for non-wildcard patterns
  if (!pattern.includes('*') && !pattern.includes('?')) {
    return filename.toLowerCase().includes(pattern.toLowerCase());
  }
  
  // Use regex for wildcard patterns
  const regex = globToRegex(pattern);
  return regex.test(filename);
}

export function shouldIgnoreFile(
  path: string,
  ignorePatterns: string[] = []
): boolean {
  const allPatterns = [...DEFAULT_IGNORE_PATTERNS, ...ignorePatterns];

  // Extract filename from path
  const fileName = path.split('/').pop() || '';
  const pathLower = path.toLowerCase();

  // Check if file is in an ignored directory 
  for (const pattern of DEFAULT_IGNORE_PATTERNS) {
    // Directory patterns - check if file is inside ignored directory
    if (
      pathLower.includes(`/${pattern.toLowerCase()}/`) ||
      pathLower.includes(`${pattern.toLowerCase()}/`) ||
      pathLower.endsWith(`/${pattern.toLowerCase()}`)
    ) {
      return true;
    }
  }
  
  // Check custom ignore patterns (support wildcards and directory checks)
  for (const pattern of ignorePatterns) {
    // Check if it's a directory pattern (contains no file extension indicators)
    if (!pattern.includes('.') && !pattern.includes('*')) {
      // Treat as directory pattern
      const patternLower = pattern.toLowerCase();
      if (
        pathLower.includes(`/${patternLower}/`) ||
        pathLower.includes(`${patternLower}/`) ||
        pathLower.endsWith(`/${patternLower}`)
      ) {
        return true;
      }
    } else {
      // Check against filename with wildcard support
      if (matchesPattern(fileName, pattern)) {
        return true;
      }
      
      // Also check against full path for patterns that might include path separators
      if (pattern.includes('/') && matchesPattern(path, pattern)) {
        return true;
      }
    }
  }

  // List of allowed config files (should not be ignored even though they're hidden)
  const allowedHiddenFiles = [
    '.gitignore',
    '.gitattributes',
    '.gitmodules',
    '.gitkeep',
    '.eslintrc',
    '.eslintrc.js',
    '.eslintrc.json',
    '.eslintrc.yml',
    '.eslintrc.yaml',
    '.prettierrc',
    '.prettierrc.js',
    '.prettierrc.json',
    '.prettierrc.yml',
    '.prettierrc.yaml',
    '.babelrc',
    '.babelrc.js',
    '.babelrc.json',
    '.editorconfig',
    '.nvmrc',
    '.yarnrc',
    '.npmrc',
    '.dockerignore',
    '.stylelintrc',
    '.postcssrc',
    '.husky',
  ];

  // List of allowed hidden directories
  const allowedHiddenDirs = [
    '.github',  // GitHub workflows and templates
    '.husky',   // Git hooks
  ];

  // Check each part of the path for hidden directories/files
  const pathParts = path.split('/');
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    
    if (part.startsWith('.') && part !== '.' && part !== '..') {
      // This is a hidden directory or file
      
      if (i === pathParts.length - 1) {
        // This is the filename (last part) - check if it's allowed
        const isAllowed = allowedHiddenFiles.some(
          (allowed) => part === allowed || part.startsWith(allowed + '.')
        );
        return !isAllowed; // If allowed, don't ignore (false), if not allowed, ignore (true)
      } else {
        // This is a directory name - check if it's allowed
        if (!allowedHiddenDirs.includes(part)) {
          return true; // Ignore files in hidden directories
        }
      }
    }
  }

  // Handle special cases for '.' and '..' at root level
  if (path === '.' || path === '..') {
    return true;
  }

  return false;
}

export function isTextFile(file: File): boolean {
  // Files larger than 1MB are considered binary for safety
  if (file.size > 1024 * 1024) return false;

  // Check file extension
  const lastDotIndex = file.name.lastIndexOf('.');
  const ext = lastDotIndex === -1 ? '' : file.name.toLowerCase().substring(lastDotIndex);

  // Check for common text file extensions
  const TEXT_EXTENSIONS = new Set([
    '.txt',
    '.md',
    '.js',
    '.mjs',
    '.cjs',
    '.ts',
    '.jsx',
    '.tsx',
    '.vue',
    '.svelte',
    '.css',
    '.scss',
    '.sass',
    '.less',
    '.stylus',
    '.html',
    '.htm',
    '.xml',
    '.svg',
    '.json',
    '.json5',
    '.jsonc',
    '.yml',
    '.yaml',
    '.toml',
    '.ini',
    '.cfg',
    '.conf',
    '.properties',
    '.py',
    '.pyw',
    '.rb',
    '.php',
    '.java',
    '.c',
    '.cpp',
    '.cc',
    '.cxx',
    '.h',
    '.hpp',
    '.hxx',
    '.cs',
    '.fs',
    '.fsx',
    '.fsi',
    '.go',
    '.rs',
    '.swift',
    '.kt',
    '.kts',
    '.scala',
    '.clj',
    '.cljs',
    '.sh',
    '.bash',
    '.zsh',
    '.fish',
    '.ps1',
    '.bat',
    '.cmd',
    '.sql',
    '.r',
    '.R',
    '.m',
    '.pl',
    '.pm',
    '.lua',
    '.vim',
    '.vimrc',
    '.dockerfile',
    '.dockerignore',
    '.makefile',
    '.cmake',
    '.gradle',
    '.lock',
    '.log',
    '.env',
    '.envrc',
    '.editorconfig',
    '.prettierrc',
    '.eslintrc',
    '.babelrc',
    '.tsconfig',
    '.jsconfig',
    // Add common dotfiles here
    '.gitignore',
    '.gitattributes',
    '.gitmodules',
    '.gitkeep',
    '.dockerignore',
    '.npmignore',
    '.yarnrc',
    '.nvmrc',
    // Files without extensions that are commonly text
    'readme',
    'license',
    'changelog',
    'contributing',
    'authors',
    'todo',
    'makefile',
    'dockerfile',
    'gemfile',
    'rakefile',
    'gruntfile',
    'gulpfile',
  ]);

  // Check against binary extensions first
  if (BINARY_EXTENSIONS.has(ext)) {
    return false;
  }

  // Check against known text extensions
  if (TEXT_EXTENSIONS.has(ext)) {
    return true;
  }

  // Files without extensions - check against common text filenames
  if (lastDotIndex === -1) {
    const nameCheck = file.name.toLowerCase();
    const commonTextFiles = [
      'readme',
      'license',
      'changelog',
      'contributing',
      'authors',
      'todo',
      'makefile',
      'dockerfile',
      'gemfile',
      'rakefile',
      'gruntfile',
      'gulpfile',
      '.gitignore',
      '.gitattributes',
      '.gitmodules',
      '.gitkeep',
      '.dockerignore',
      '.npmignore',
      '.yarnrc',
      '.nvmrc',
    ];

    if (commonTextFiles.some((name) => nameCheck.includes(name))) {
      return true;
    }
  }

  return false;
}

export async function* processFiles(
  files: FileEntry[],
  onProgress?: (progress: ProcessingProgress) => void
): AsyncGenerator<string, ProcessingResult> {
  const includedFiles = files.filter((f) => f.isIncluded && f.isText);
  const totalSize = includedFiles.reduce((sum, f) => sum + f.size, 0);
  let processedSize = 0;
  let fullContent = '';
  let lineCount = 0;

  // Generate header with file index
  const indexHeader = generateIndexHeader(includedFiles);
  fullContent += indexHeader;
  yield indexHeader;

  for (let i = 0; i < includedFiles.length; i++) {
    const entry = includedFiles[i];

    onProgress?.({
      current: processedSize,
      total: totalSize,
      currentFile: entry.path,
    });

    try {
      // Validate file is still accessible
      if (!entry.file || entry.file.size === undefined) {
        throw new Error('File object is no longer valid');
      }

      // Add timeout to prevent hanging operations
      const fileContent = await Promise.race([
        entry.file.text(),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('File read timeout')), 10000)
        ),
      ]);
      const fileLines = fileContent.split('\n').length;
      lineCount += fileLines;

      const fileSection = generateFileSection(entry.path, fileContent);
      fullContent += fileSection;
      yield fileSection;
    } catch (fileError) {
      console.warn(`Failed to read file ${entry.path}:`, fileError);
      // Create a placeholder for failed files
      const errorMessage =
        fileError instanceof Error ? fileError.message : 'Unknown error';
      const errorSection = generateFileSection(
        entry.path,
        `/* Error reading file: ${errorMessage} */`
      );
      fullContent += errorSection;
      yield errorSection;
      lineCount += 1;
    }

    processedSize += entry.size;
  }

  onProgress?.({
    current: totalSize,
    total: totalSize,
    currentFile: 'Complete',
  });

  const estimatedTokens = Math.ceil(fullContent.length / 4);
  const checksum = await generateChecksum(fullContent);

  return {
    content: fullContent,
    stats: {
      totalFiles: includedFiles.length,
      totalSize,
      lineCount,
      estimatedTokens,
    },
    checksum,
  };
}

function generateIndexHeader(files: FileEntry[]): string {
  let header = '/* === CODEBASE INDEX === */\n';
  header += `/* Generated: ${new Date().toISOString()} */\n`;
  header += `/* Total Files: ${files.length} */\n\n`;

  files.forEach((file, index) => {
    header += `/* ${index + 1}. ${file.path} (${formatBytes(file.size)}) */\n`;
  });

  header += '\n/* === END INDEX === */\n\n';
  return header;
}

function generateFileSection(path: string, content: string): string {
  return `/* === BEGIN ${path} === */\n${content}\n/* === END ${path} === */\n\n`;
}

async function generateChecksum(content: string): Promise<string> {
  // Fallback if crypto.subtle is not available
  if (!crypto || !crypto.subtle) {
    return generateSimpleHash(content);
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.warn('crypto.subtle failed, using fallback hash:', error);
    return generateSimpleHash(content);
  }
}

function generateSimpleHash(content: string): string {
  // Simple hash implementation for environments without crypto.subtle
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to hex and pad to simulate SHA-256 format
  const hashHex = Math.abs(hash).toString(16).padStart(8, '0');
  return hashHex.repeat(8); // Simulate 64-character hash
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

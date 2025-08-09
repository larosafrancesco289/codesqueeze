'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilePicker } from '@/components/file-picker';
import { FileTree } from '@/components/file-tree';
import { ProcessingPanel } from '@/components/processing-panel';
import { SettingsDialog } from '@/components/settings-dialog';
import { FileEntry } from '@/lib/file-processor';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Zap, Code, FileText, Download, Github } from 'lucide-react';

export default function Home() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [ignorePatterns, setIgnorePatterns] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  // Load ignore patterns from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('codesqueeze-ignore-patterns');
    if (stored) {
      try {
        setIgnorePatterns(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse stored ignore patterns:', error);
      }
    }

    // Check for dark mode preference
    const darkModeStored = localStorage.getItem('codesqueeze-dark-mode');
    if (darkModeStored) {
      setDarkMode(JSON.parse(darkModeStored));
    } else {
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('codesqueeze-dark-mode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Save ignore patterns to localStorage
  useEffect(() => {
    localStorage.setItem('codesqueeze-ignore-patterns', JSON.stringify(ignorePatterns));
  }, [ignorePatterns]);

  const handleFilesSelected = useCallback((newFiles: FileEntry[]) => {
    setFiles(newFiles);
  }, []);

  const handleFileToggle = useCallback((index: number) => {
    setFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, isIncluded: !file.isIncluded } : file
    ));
  }, []);

  const handleSelectAll = useCallback(() => {
    setFiles(prev => prev.map(file => 
      file.isText ? { ...file, isIncluded: true } : file
    ));
  }, []);

  const handleSelectNone = useCallback(() => {
    setFiles(prev => prev.map(file => ({ ...file, isIncluded: false })));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const handleIgnorePatternsChange = useCallback((newPatterns: string[]) => {
    setIgnorePatterns(newPatterns);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault();
        // Trigger file picker
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        input?.click();
      }
      
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        // Trigger copy to clipboard if result is available
        const copyButton = document.querySelector('[data-copy-button]') as HTMLButtonElement;
        copyButton?.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-fg">
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="border-b border-border backdrop-blur-sm bg-surface/95"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="flex items-center gap-1">
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut"
                }}
              >
                <Zap className="h-6 w-6 text-accent" />
              </motion.div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-fg to-fg/70 bg-clip-text text-transparent">
                CodeSqueeze
              </h1>
            </div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="hidden md:block text-sm text-fg-muted"
            >
              Squeeze your codebase into LLM-friendly format
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <SettingsDialog 
              ignorePatterns={ignorePatterns}
              onIgnorePatternsChange={handleIgnorePatternsChange}
            />
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open('https://github.com/larosafrancesco289/codesqueeze', '_blank')}
                aria-label="View source code on GitHub"
              >
                <Github className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <AnimatePresence mode="wait">
                  {!darkMode ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon className="h-4 w-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-2 space-y-4 max-w-5xl">
        <AnimatePresence mode="wait">
          {files.length === 0 ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center space-y-4"
            >
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="space-y-2"
              >
                <motion.h2 
                  className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-fg via-fg/80 to-fg/60 bg-clip-text text-transparent"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  Transform your codebase into AI-ready format
                </motion.h2>
                <motion.p 
                  className="text-sm text-fg-muted max-w-xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  Select a folder and CodeSqueeze will concatenate all your source files 
                  into a single, well-structured text file perfect for AI analysis and assistance.
                </motion.p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="max-w-2xl mx-auto"
              >
                <FilePicker 
                  onFilesSelected={handleFilesSelected}
                  ignorePatterns={ignorePatterns}
                />
              </motion.div>
              
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl mx-auto text-xs"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.8 }}
              >
                {[
                  {
                    icon: <Code className="h-4 w-4 text-accent" />,
                    title: "Smart Filtering",
                    description: "Automatically excludes binary files, node_modules, and other non-essential files. Use settings to customize ignore patterns."
                  },
                  {
                    icon: <FileText className="h-4 w-4 text-accent" />,
                    title: "Memory Efficient",
                    description: "Streams large codebases without overwhelming your browser memory"
                  },
                  {
                    icon: <Download className="h-4 w-4 text-accent" />,
                    title: "Export Options",
                    description: "Copy to clipboard or download as .txt with SHA-256 checksum"
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 + index * 0.1, duration: 0.6 }}
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                    className="space-y-2 p-3 rounded-2xl border border-border bg-surface/50 backdrop-blur-sm transition-colors hover:bg-surface text-center shadow-[var(--shadow-card)]"
                  >
                    <div className="flex flex-col items-center gap-1">
                      {feature.icon}
                      <h3 className="font-medium text-xs">{feature.title}</h3>
                    </div>
                    <p className="text-fg-muted text-xs leading-snug">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="files"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-8"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                 className="flex items-center justify-between"
              >
                <div>
                  <h2 className="text-2xl font-bold">Selected Files</h2>
                  <p className="text-fg-muted">
                    Review and select files to include in your codebase export
                    {ignorePatterns.length > 0 && (
                      <span className="ml-2 text-sm">
                        • {ignorePatterns.length} ignore pattern{ignorePatterns.length !== 1 ? 's' : ''} active
                      </span>
                    )}
                  </p>
                </div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="flex items-center gap-2"
                >
                  <SettingsDialog 
                    ignorePatterns={ignorePatterns}
                    onIgnorePatternsChange={handleIgnorePatternsChange}
                  />
                   <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      onClick={() => setFiles([])}
                      className="gap-2"
                    >
                      Start Over
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <FileTree
                  files={files}
                  onFileToggle={handleFileToggle}
                  onSelectAll={handleSelectAll}
                  onSelectNone={handleSelectNone}
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <ProcessingPanel files={files} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <motion.footer 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
         className="border-t border-border mt-16"
      >
        <div className="container mx-auto px-4 py-6 text-center text-sm text-fg-muted">
          <p>
            All processing happens locally in your browser. No files are uploaded to any server.
          </p>
          <p className="mt-2">
            Keyboard shortcuts: ⌘+O (Choose folder), ⌘+Shift+C (Copy result)
          </p>
        </div>
      </motion.footer>
    </div>
  );
}

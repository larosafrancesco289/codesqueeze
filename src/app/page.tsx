'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FilePicker } from '@/components/file-picker';
import { FileTree } from '@/components/file-tree';
import { ProcessingPanel } from '@/components/processing-panel';
import { SettingsDialog } from '@/components/settings-dialog';
import { FileEntry } from '@/lib/file-processor';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Zap } from 'lucide-react';

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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">CodeSqueeze</h1>
            </div>
            <div className="text-sm text-muted-foreground">
              Squeeze your codebase into LLM-friendly format
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <SettingsDialog 
              ignorePatterns={ignorePatterns}
              onIgnorePatternsChange={handleIgnorePatternsChange}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-12">
        {files.length === 0 ? (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">
                Transform your codebase into AI-ready format
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Select a folder and CodeSqueeze will concatenate all your source files 
                into a single, well-structured text file perfect for AI analysis and assistance.
              </p>
            </div>
            
            <FilePicker 
              onFilesSelected={handleFilesSelected}
              ignorePatterns={ignorePatterns}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-sm">
              <div className="space-y-2">
                <h3 className="font-semibold">Smart Filtering</h3>
                <p className="text-muted-foreground">
                  Automatically excludes binary files, node_modules, and other non-essential files.
                  Use settings to customize ignore patterns.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Memory Efficient</h3>
                <p className="text-muted-foreground">
                  Streams large codebases without overwhelming your browser memory
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Export Options</h3>
                <p className="text-muted-foreground">
                  Copy to clipboard or download as .txt with SHA-256 checksum
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Selected Files</h2>
                <p className="text-muted-foreground">
                  Review and select files to include in your codebase export
                  {ignorePatterns.length > 0 && (
                    <span className="ml-2 text-sm">
                      • {ignorePatterns.length} ignore pattern{ignorePatterns.length !== 1 ? 's' : ''} active
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <SettingsDialog 
                  ignorePatterns={ignorePatterns}
                  onIgnorePatternsChange={handleIgnorePatternsChange}
                />
                <Button
                  variant="outline"
                  onClick={() => setFiles([])}
                  className="gap-2"
                >
                  Start Over
                </Button>
              </div>
            </div>
            
            <FileTree
              files={files}
              onFileToggle={handleFileToggle}
              onSelectAll={handleSelectAll}
              onSelectNone={handleSelectNone}
            />
            
            <ProcessingPanel files={files} />
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            All processing happens locally in your browser. No files are uploaded to any server.
          </p>
          <p className="mt-2">
            Keyboard shortcuts: ⌘+O (Choose folder), ⌘+Shift+C (Copy result)
          </p>
        </div>
      </footer>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FilePicker } from "@/components/file-picker";
import { FileTree } from "@/components/file-tree";
import { ProcessingPanel } from "@/components/processing-panel";
import { SettingsDialog } from "@/components/settings-dialog";
import { FileEntry } from "@/lib/file-processor";
import { Button } from "@/components/ui/button";
import {
  Moon,
  Sun,
  Github,
  Shield,
  Zap,
  FileCode,
  ArrowLeft,
} from "lucide-react";

export default function Home() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [ignorePatterns, setIgnorePatterns] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("codesqueeze-ignore-patterns");
    if (stored) {
      try {
        setIgnorePatterns(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to parse stored ignore patterns:", error);
      }
    }

    const darkModeStored = localStorage.getItem("codesqueeze-dark-mode");
    if (darkModeStored) {
      setDarkMode(JSON.parse(darkModeStored));
    } else {
      setDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("codesqueeze-dark-mode", JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem(
      "codesqueeze-ignore-patterns",
      JSON.stringify(ignorePatterns)
    );
  }, [ignorePatterns]);

  const handleFilesSelected = useCallback((newFiles: FileEntry[]) => {
    setFiles(newFiles);
  }, []);

  const handleFileToggle = useCallback((index: number) => {
    setFiles((prev) =>
      prev.map((file, i) =>
        i === index ? { ...file, isIncluded: !file.isIncluded } : file
      )
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setFiles((prev) =>
      prev.map((file) => (file.isText ? { ...file, isIncluded: true } : file))
    );
  }, []);

  const handleSelectNone = useCallback(() => {
    setFiles((prev) => prev.map((file) => ({ ...file, isIncluded: false })));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  const handleIgnorePatternsChange = useCallback((newPatterns: string[]) => {
    setIgnorePatterns(newPatterns);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "o") {
        e.preventDefault();
        const input = document.querySelector(
          'input[type="file"]'
        ) as HTMLInputElement;
        input?.click();
      }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "C") {
        e.preventDefault();
        const copyButton = document.querySelector(
          "[data-copy-button]"
        ) as HTMLButtonElement;
        copyButton?.click();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-fg flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 border-b border-border-subtle glass"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFiles([])}
                  className="gap-1.5 text-fg-muted hover:text-fg"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              </motion.div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                <FileCode className="h-4 w-4 text-accent" />
              </div>
              <span className="font-display font-semibold text-base tracking-tight">
                CodeSqueeze
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <SettingsDialog
              ignorePatterns={ignorePatterns}
              onIgnorePatternsChange={handleIgnorePatternsChange}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                window.open(
                  "https://github.com/larosafrancesco289/codesqueeze",
                  "_blank"
                )
              }
              aria-label="View source on GitHub"
              className="text-fg-muted hover:text-fg"
            >
              <Github className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              className="text-fg-muted hover:text-fg"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={darkMode ? "moon" : "sun"}
                  initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  {darkMode ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </motion.div>
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {files.length === 0 ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12"
            >
              {/* Hero Section */}
              <div className="w-full max-w-2xl mx-auto text-center space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="space-y-3"
                >
                  <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-fg">
                    Squeeze your codebase
                    <br />
                    <span className="text-accent">for AI</span>
                  </h1>
                  <p className="text-fg-muted text-base sm:text-lg max-w-md mx-auto">
                    Transform your entire codebase into a single, structured file
                    ready for LLM analysis.
                  </p>
                </motion.div>

                {/* Drop Zone */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="w-full"
                >
                  <FilePicker
                    onFilesSelected={handleFilesSelected}
                    ignorePatterns={ignorePatterns}
                  />
                </motion.div>

                {/* Feature Pills */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="flex flex-wrap items-center justify-center gap-2 pt-2"
                >
                  {[
                    { icon: Shield, label: "100% Local Processing" },
                    { icon: Zap, label: "Instant Results" },
                    { icon: FileCode, label: "All Languages" },
                  ].map((feature, index) => (
                    <motion.div
                      key={feature.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border-subtle text-xs text-fg-muted"
                    >
                      <feature.icon className="h-3 w-3 text-accent" />
                      <span>{feature.label}</span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Keyboard Shortcuts */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                  className="text-xs text-fg-muted/60 flex items-center justify-center gap-4"
                >
                  <span className="flex items-center gap-1">
                    <kbd className="kbd">⌘</kbd>
                    <kbd className="kbd">O</kbd>
                    <span className="ml-1">Open folder</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="kbd">⌘</kbd>
                    <kbd className="kbd">⇧</kbd>
                    <kbd className="kbd">C</kbd>
                    <span className="ml-1">Copy result</span>
                  </span>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6"
            >
              {/* Workspace Header */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <h2 className="font-display text-xl font-semibold">
                    Review Files
                  </h2>
                  <p className="text-sm text-fg-muted">
                    Select the files you want to include in your export
                    {ignorePatterns.length > 0 && (
                      <span className="text-accent">
                        {" "}
                        · {ignorePatterns.length} ignore pattern
                        {ignorePatterns.length !== 1 ? "s" : ""} active
                      </span>
                    )}
                  </p>
                </div>
              </motion.div>

              {/* File Tree */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FileTree
                  files={files}
                  onFileToggle={handleFileToggle}
                  onSelectAll={handleSelectAll}
                  onSelectNone={handleSelectNone}
                />
              </motion.div>

              {/* Processing Panel */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <ProcessingPanel files={files} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="border-t border-border-subtle py-4"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-center">
          <p className="text-xs text-fg-muted/60 flex items-center gap-1.5">
            <Shield className="h-3 w-3" />
            All processing happens locally in your browser
          </p>
        </div>
      </motion.footer>
    </div>
  );
}

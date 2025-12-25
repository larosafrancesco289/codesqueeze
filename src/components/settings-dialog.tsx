"use client";

import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, Plus, Trash2, RotateCcw, Info } from "lucide-react";

interface SettingsDialogProps {
  ignorePatterns: string[];
  onIgnorePatternsChange: (patterns: string[]) => void;
}

const COMMON_IGNORE_PATTERNS = [
  {
    pattern: "*.log",
    label: "Log files (*.log)",
    description: "Application and system log files",
  },
  {
    pattern: "*.tmp",
    label: "Temporary files (*.tmp)",
    description: "Temporary and cache files",
  },
  {
    pattern: "*.test.*",
    label: "Test files (*.test.*)",
    description: "Unit and integration test files",
  },
  {
    pattern: "*.spec.*",
    label: "Spec files (*.spec.*)",
    description: "Test specification files",
  },
  {
    pattern: "*.config.*",
    label: "Config files (*.config.*)",
    description: "Configuration files (keep if needed)",
  },
  {
    pattern: "LICENSE*",
    label: "License files",
    description: "License and legal files",
  },
  {
    pattern: "README*",
    label: "README files",
    description: "Documentation files (useful for context)",
  },
  {
    pattern: "*.md",
    label: "Markdown files (*.md)",
    description: "Documentation files (useful for context)",
  },
  {
    pattern: "package-lock.json",
    label: "Package lock files",
    description: "Auto-generated dependency files",
  },
  {
    pattern: "yarn.lock",
    label: "Yarn lock files",
    description: "Auto-generated dependency files",
  },
  {
    pattern: "composer.lock",
    label: "Composer lock files",
    description: "PHP dependency lock files",
  },
  {
    pattern: "Cargo.lock",
    label: "Cargo lock files",
    description: "Rust dependency lock files",
  },
  {
    pattern: "*.min.*",
    label: "Minified files (*.min.*)",
    description: "Minified CSS/JS files",
  },
  {
    pattern: "*.bundle.*",
    label: "Bundle files (*.bundle.*)",
    description: "Bundled/compiled files",
  },
  {
    pattern: "__pycache__",
    label: "Python cache (__pycache__)",
    description: "Python bytecode cache",
  },
  {
    pattern: "*.pyc",
    label: "Python bytecode (*.pyc)",
    description: "Compiled Python files",
  },
  {
    pattern: "vendor",
    label: "Vendor directory",
    description: "Third-party dependencies",
  },
  {
    pattern: ".DS_Store",
    label: "macOS metadata (.DS_Store)",
    description: "macOS system files",
  },
  {
    pattern: "Thumbs.db",
    label: "Windows thumbnails",
    description: "Windows system files",
  },
];

export function SettingsDialog({
  ignorePatterns,
  onIgnorePatternsChange,
}: SettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customPattern, setCustomPattern] = useState("");
  const [selectedCommonPatterns, setSelectedCommonPatterns] = useState<
    Set<string>
  >(new Set());

  // Update selected common patterns when dialog opens
  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (open) {
        const selected = new Set<string>();
        COMMON_IGNORE_PATTERNS.forEach(({ pattern }) => {
          if (ignorePatterns.includes(pattern)) {
            selected.add(pattern);
          }
        });
        setSelectedCommonPatterns(selected);
      }
    },
    [ignorePatterns],
  );

  const addCustomPattern = useCallback(() => {
    const pattern = customPattern.trim();
    if (pattern && !ignorePatterns.includes(pattern)) {
      onIgnorePatternsChange([...ignorePatterns, pattern]);
      setCustomPattern("");
    }
  }, [customPattern, ignorePatterns, onIgnorePatternsChange]);

  const removePattern = useCallback(
    (pattern: string) => {
      onIgnorePatternsChange(ignorePatterns.filter((p) => p !== pattern));
      setSelectedCommonPatterns((prev) => {
        const next = new Set(prev);
        next.delete(pattern);
        return next;
      });
    },
    [ignorePatterns, onIgnorePatternsChange],
  );

  const toggleCommonPattern = useCallback(
    (pattern: string, checked: boolean) => {
      setSelectedCommonPatterns((prev) => {
        const next = new Set(prev);
        if (checked) {
          next.add(pattern);
        } else {
          next.delete(pattern);
        }
        return next;
      });

      if (checked && !ignorePatterns.includes(pattern)) {
        onIgnorePatternsChange([...ignorePatterns, pattern]);
      } else if (!checked && ignorePatterns.includes(pattern)) {
        onIgnorePatternsChange(ignorePatterns.filter((p) => p !== pattern));
      }
    },
    [ignorePatterns, onIgnorePatternsChange],
  );

  const resetToDefaults = useCallback(() => {
    onIgnorePatternsChange([]);
    setSelectedCommonPatterns(new Set());
  }, [onIgnorePatternsChange]);

  const customPatterns = ignorePatterns.filter(
    (pattern) =>
      !COMMON_IGNORE_PATTERNS.some((common) => common.pattern === pattern),
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="gap-2">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-surface text-fg border border-border-subtle shadow-[var(--shadow-elevated)] rounded-xl">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Settings className="h-4 w-4 text-accent" />
            Ignore Patterns
          </DialogTitle>
          <DialogDescription>
            Configure patterns to ignore files and directories when processing
            your codebase. Ignored files won&apos;t appear in the file tree or
            final output.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info box */}
          <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-fg mb-1">Pattern examples:</p>
                <ul className="space-y-0.5 text-xs text-fg-muted">
                  <li><code className="font-mono bg-muted/50 px-1 rounded">*.log</code> matches all .log files</li>
                  <li><code className="font-mono bg-muted/50 px-1 rounded">test_*</code> matches files starting with &quot;test_&quot;</li>
                  <li><code className="font-mono bg-muted/50 px-1 rounded">.env</code> matches exact filename</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Common patterns */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold">Common Patterns</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetToDefaults}
                className="gap-1.5 text-fg-muted"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto border border-border-subtle rounded-lg p-3 bg-muted/20">
              {COMMON_IGNORE_PATTERNS.map(({ pattern, label, description }) => {
                const isSelected = selectedCommonPatterns.has(pattern);
                return (
                  <div key={pattern} className="flex items-start space-x-3">
                    <Checkbox
                      id={pattern}
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        toggleCommonPattern(pattern, checked === true)
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={pattern}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {label}
                      </label>
                      <p className="text-xs text-fg-muted mt-1">
                        {description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom patterns */}
          <div className="space-y-3">
            <h3 className="font-display text-sm font-semibold">Custom Patterns</h3>

            <div className="flex gap-2">
              <Input
                placeholder="e.g., *.backup, temp_*"
                value={customPattern}
                onChange={(e) => setCustomPattern(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomPattern()}
                className="text-sm"
              />
              <Button onClick={addCustomPattern} size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>

            {customPatterns.length > 0 && (
              <div className="space-y-2">
                {customPatterns.map((pattern) => (
                  <div
                    key={pattern}
                    className="flex items-center justify-between bg-muted/30 rounded-md px-3 py-1.5 border border-border-subtle"
                  >
                    <code className="text-xs font-mono">{pattern}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePattern(pattern)}
                      className="h-6 w-6 p-0 text-fg-muted hover:text-fg"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current count */}
          <div className="text-xs text-fg-muted border-t border-border-subtle pt-3">
            <p>
              Currently ignoring <strong>{ignorePatterns.length}</strong>{" "}
              pattern{ignorePatterns.length !== 1 ? "\u2019s" : ""}
              {ignorePatterns.length > 0 && (
                <span className="ml-2">
                  ({selectedCommonPatterns.size} common, {customPatterns.length}{" "}
                  custom)
                </span>
              )}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FileEntry } from "@/lib/file-processor";
import { formatBytes } from "@/lib/utils";
import {
  Folder,
  FolderOpen,
  CheckSquare,
  Square,
  FileText,
  FileX,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileTreeProps {
  files: FileEntry[];
  onFileToggle: (index: number) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}

interface TreeNode {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
  file?: FileEntry;
  index?: number;
}

export function FileTree({
  files,
  onFileToggle,
  onSelectAll,
  onSelectNone,
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  const tree = useMemo(() => {
    const root = new Map<string, TreeNode>();

    files.forEach((file, index) => {
      const parts = file.path.split("/").filter(Boolean);
      let current = root;
      let currentPath = "";

      parts.forEach((part, i) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!current.has(part)) {
          current.set(part, {
            name: part,
            path: currentPath,
            children: new Map(),
          });
        }

        const node = current.get(part)!;

        if (i === parts.length - 1) {
          node.file = file;
          node.index = index;
        }

        current = node.children;
      });
    });

    return root;
  }, [files]);

  const stats = useMemo(() => {
    const included = files.filter((f) => f.isIncluded);
    const textFiles = files.filter((f) => f.isText);
    const binaryFiles = files.filter((f) => !f.isText);

    return {
      total: files.length,
      textFiles: textFiles.length,
      binaryFiles: binaryFiles.length,
      included: included.length,
      totalSize: included.reduce((sum, f) => sum + f.size, 0),
      totalTextSize: textFiles.reduce((sum, f) => sum + f.size, 0),
    };
  }, [files]);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const renderNode = (node: TreeNode, level = 0, index = 0) => {
    const isFile = !!node.file;
    const hasChildren = node.children.size > 0;
    const isExpanded = expandedFolders.has(node.path);

    if (isFile) {
      const file = node.file!;
      const fileIndex = node.index!;

      return (
        <motion.div
          key={node.path}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: Math.min(index * 0.01, 0.3), duration: 0.2 }}
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors hover:bg-muted/50",
            !file.isText && "opacity-40"
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => file.isText && onFileToggle(fileIndex)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={file.isIncluded}
              onCheckedChange={() => onFileToggle(fileIndex)}
              disabled={!file.isText}
            />
          </div>
          <div className={cn("text-accent", !file.isText && "text-fg-muted")}>
            {file.isText ? (
              <FileText className="h-3.5 w-3.5" />
            ) : (
              <FileX className="h-3.5 w-3.5" />
            )}
          </div>
          <span
            className={cn(
              "flex-1 text-sm truncate",
              !file.isText && "text-fg-muted"
            )}
          >
            {node.name}
          </span>
          <span className="text-xs text-fg-muted tabular-nums">
            {formatBytes(file.size)}
          </span>
        </motion.div>
      );
    }

    return (
      <motion.div key={node.path}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: Math.min(index * 0.01, 0.3), duration: 0.2 }}
          className="flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors hover:bg-muted/50"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => hasChildren && toggleFolder(node.path)}
        >
          {hasChildren && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.15 }}
              className="text-fg-muted"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </motion.div>
          )}
          <div className="text-accent">
            {isExpanded ? (
              <FolderOpen className="h-3.5 w-3.5" />
            ) : (
              <Folder className="h-3.5 w-3.5" />
            )}
          </div>
          <span className="text-sm font-medium">{node.name}</span>
          {hasChildren && (
            <span className="text-xs text-fg-muted">
              {node.children.size} items
            </span>
          )}
        </motion.div>
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              {Array.from(node.children.values())
                .sort((a, b) => {
                  if (a.file && !b.file) return 1;
                  if (!a.file && b.file) return -1;
                  return a.name.localeCompare(b.name);
                })
                .map((child, childIndex) =>
                  renderNode(child, level + 1, childIndex)
                )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="font-display text-base font-semibold">Files to include</h3>
          <div className="flex items-center gap-2 text-sm text-fg-muted">
            <span className="tabular-nums">
              <span className="text-accent font-medium">{stats.included}</span>
              {" "}of {stats.textFiles} files selected
            </span>
            <span className="text-border">·</span>
            <span className="tabular-nums">{formatBytes(stats.totalSize)}</span>
            {stats.binaryFiles > 0 && (
              <>
                <span className="text-border">·</span>
                <span>{stats.binaryFiles} binary excluded</span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            className="gap-1.5"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectNone}
            className="gap-1.5"
          >
            <Square className="h-3.5 w-3.5" />
            None
          </Button>
        </div>
      </div>

      {/* File List */}
      <div className="card-elevated rounded-xl max-h-80 overflow-auto">
        <div className="p-1.5">
          {Array.from(tree.values())
            .sort((a, b) => {
              if (a.file && !b.file) return 1;
              if (!a.file && b.file) return -1;
              return a.name.localeCompare(b.name);
            })
            .map((node, index) => renderNode(node, 0, index))}
        </div>
      </div>
    </div>
  );
}

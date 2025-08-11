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
    new Set(),
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

        // If this is the last part, it's a file
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
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.02, duration: 0.3 }}
          whileHover={{
            backgroundColor:
              "color-mix(in oklab, var(--color-muted) 50%, transparent)",
            scale: 1.005,
          }}
          className={cn(
            "flex items-center gap-2 py-2 px-2 rounded-sm cursor-pointer transition-colors",
            !file.isText && "opacity-50",
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => file.isText && onFileToggle(fileIndex)}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={file.isIncluded}
              onCheckedChange={() => onFileToggle(fileIndex)}
              disabled={!file.isText}
            />
          </motion.div>
          <motion.div
            animate={{
              color: file.isText
                ? "var(--color-accent)"
                : "var(--color-fg-muted)",
              scale: file.isIncluded ? 1.1 : 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {file.isText ? (
              <FileText className="h-4 w-4" />
            ) : (
              <FileX className="h-4 w-4" />
            )}
          </motion.div>
          <span
            className={cn("flex-1 text-sm", !file.isText && "text-fg-muted")}
          >
            {node.name}
          </span>
          <motion.span
            className="text-xs text-fg-muted"
            whileHover={{ scale: 1.05 }}
          >
            {formatBytes(file.size)}
          </motion.span>
        </motion.div>
      );
    }

    return (
      <motion.div key={node.path}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.02, duration: 0.3 }}
          whileHover={{
            backgroundColor:
              "color-mix(in oklab, var(--color-muted) 30%, transparent)",
            scale: 1.005,
          }}
          className="flex items-center gap-2 py-2 px-2 rounded-sm cursor-pointer"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => hasChildren && toggleFolder(node.path)}
        >
          {hasChildren && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-4 w-4 text-fg-muted" />
            </motion.div>
          )}
          <motion.div
            animate={{
              scale: isExpanded ? 1.1 : 1,
              rotate: isExpanded ? 5 : 0,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-accent" />
            ) : (
              <Folder className="h-4 w-4 text-accent" />
            )}
          </motion.div>
          <span className="text-sm font-medium">{node.name}</span>
          {hasChildren && (
            <motion.span
              className="text-xs text-fg-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {node.children.size} items
            </motion.span>
          )}
        </motion.div>
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              {Array.from(node.children.values())
                .sort((a, b) => {
                  // Folders first, then files
                  if (a.file && !b.file) return 1;
                  if (!a.file && b.file) return -1;
                  return a.name.localeCompare(b.name);
                })
                .map((child, childIndex) =>
                  renderNode(child, level + 1, childIndex),
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
    <motion.div
      className="w-full max-w-4xl mx-auto space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Files to process</h3>
          <div className="space-y-1">
            <motion.p
              className="text-sm text-fg-muted"
              whileHover={{ scale: 1.02 }}
            >
              <motion.span
                key={stats.included}
                initial={{ scale: 1.2, color: "var(--color-accent)" }}
                animate={{ scale: 1, color: "var(--color-fg-muted)" }}
                transition={{ duration: 0.3 }}
              >
                {stats.included}
              </motion.span>{" "}
              of {stats.textFiles} text files selected (
              {formatBytes(stats.totalSize)})
            </motion.p>
            {stats.binaryFiles > 0 && (
              <motion.p
                className="text-xs text-fg-muted"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {stats.binaryFiles} binary files excluded • Total text files:{" "}
                {formatBytes(stats.totalTextSize)}
              </motion.p>
            )}
          </div>
        </div>

        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              className="gap-2"
            >
              <CheckSquare className="h-4 w-4" />
              Select All
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectNone}
              className="gap-2"
            >
              <Square className="h-4 w-4" />
              Select None
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        className="border border-border rounded-2xl max-h-96 overflow-auto bg-surface/50 backdrop-blur-sm shadow-[var(--shadow-card)]"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        whileHover={{ boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
      >
        <div className="p-2">
          {Array.from(tree.values())
            .sort((a, b) => {
              // Folders first, then files
              if (a.file && !b.file) return 1;
              if (!a.file && b.file) return -1;
              return a.name.localeCompare(b.name);
            })
            .map((node, index) => renderNode(node, 0, index))}
        </div>
      </motion.div>
    </motion.div>
  );
}

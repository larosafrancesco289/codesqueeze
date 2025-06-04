'use client';

import React, { useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FileEntry } from '@/lib/file-processor';
import { formatBytes } from '@/lib/utils';
import { 
  Folder, 
  FolderOpen, 
  CheckSquare, 
  Square,
  FileText,
  FileX
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function FileTree({ files, onFileToggle, onSelectAll, onSelectNone }: FileTreeProps) {
  const tree = useMemo(() => {
    const root = new Map<string, TreeNode>();

    files.forEach((file, index) => {
      const parts = file.path.split('/').filter(Boolean);
      let current = root;
      let currentPath = '';

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
    const included = files.filter(f => f.isIncluded);
    const textFiles = files.filter(f => f.isText);
    const binaryFiles = files.filter(f => !f.isText);
    
    return {
      total: files.length,
      textFiles: textFiles.length,
      binaryFiles: binaryFiles.length,
      included: included.length,
      totalSize: included.reduce((sum, f) => sum + f.size, 0),
      totalTextSize: textFiles.reduce((sum, f) => sum + f.size, 0),
    };
  }, [files]);

  const renderNode = (node: TreeNode, level = 0) => {
    const isFile = !!node.file;
    const hasChildren = node.children.size > 0;

    if (isFile) {
      const file = node.file!;
      const index = node.index!;
      
      return (
        <div
          key={node.path}
          className={cn(
            'flex items-center gap-2 py-1 px-2 hover:bg-muted/50 rounded-sm',
            !file.isText && 'opacity-50'
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          <Checkbox
            checked={file.isIncluded}
            onCheckedChange={() => onFileToggle(index)}
            disabled={!file.isText}
          />
          {file.isText ? (
            <FileText className="h-4 w-4 text-blue-500" />
          ) : (
            <FileX className="h-4 w-4 text-muted-foreground" />
          )}
          <span className={cn(
            'flex-1 text-sm',
            !file.isText && 'text-muted-foreground'
          )}>
            {node.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatBytes(file.size)}
          </span>
        </div>
      );
    }

    return (
      <div key={node.path}>
        <div
          className="flex items-center gap-2 py-1 px-2 hover:bg-muted/50 rounded-sm"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {hasChildren ? (
            <FolderOpen className="h-4 w-4 text-yellow-600" />
          ) : (
            <Folder className="h-4 w-4 text-yellow-600" />
          )}
          <span className="text-sm font-medium">{node.name}</span>
        </div>
        {hasChildren && (
          <div>
            {Array.from(node.children.values())
              .sort((a, b) => {
                // Folders first, then files
                if (a.file && !b.file) return 1;
                if (!a.file && b.file) return -1;
                return a.name.localeCompare(b.name);
              })
              .map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Files to process</h3>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {stats.included} of {stats.textFiles} text files selected ({formatBytes(stats.totalSize)})
            </p>
            {stats.binaryFiles > 0 && (
              <p className="text-xs text-muted-foreground">
                {stats.binaryFiles} binary files excluded • Total text files: {formatBytes(stats.totalTextSize)}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            className="gap-2"
          >
            <CheckSquare className="h-4 w-4" />
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectNone}
            className="gap-2"
          >
            <Square className="h-4 w-4" />
            Select None
          </Button>
        </div>
      </div>

      <div className="border rounded-lg max-h-96 overflow-auto">
        <div className="p-2">
          {Array.from(tree.values())
            .sort((a, b) => {
              // Folders first, then files
              if (a.file && !b.file) return 1;
              if (!a.file && b.file) return -1;
              return a.name.localeCompare(b.name);
            })
            .map(node => renderNode(node))}
        </div>
      </div>
    </div>
  );
} 
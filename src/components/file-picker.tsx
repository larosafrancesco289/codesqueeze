'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileEntry, isTextFile, shouldIgnoreFile } from '@/lib/file-processor';
import { FolderOpen, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

// Type definitions for File System Access API and webkit extensions
type WebkitFile = File & {
  webkitRelativePath?: string;
};

interface WebkitFileEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
  file(successCallback: (file: File) => void, errorCallback?: (error: DOMException) => void): void;
}

interface WebkitDirectoryEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
  createReader(): WebkitDirectoryReader;
}

interface WebkitDirectoryReader {
  readEntries(
    successCallback: (entries: (WebkitFileEntry | WebkitDirectoryEntry)[]) => void,
    errorCallback?: (error: DOMException) => void
  ): void;
}

type WebkitDataTransferItem = DataTransferItem & {
  webkitGetAsEntry?(): WebkitFileEntry | WebkitDirectoryEntry | null;
  getAsEntry?(): WebkitFileEntry | WebkitDirectoryEntry | null;
};

type WebkitHTMLInputElement = HTMLInputElement & {
  webkitdirectory?: boolean;
  directory?: boolean;
};

interface FilePickerProps {
  onFilesSelected: (files: FileEntry[]) => void;
  ignorePatterns?: string[];
}

export function FilePicker({
  onFilesSelected,
  ignorePatterns = [],
}: FilePickerProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFileList = useCallback(
    (fileList: FileList) => {
      const files: FileEntry[] = [];

      console.log(`Processing ${fileList.length} files from folder selection`);

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i] as WebkitFile;

        // Get relative path from webkitRelativePath or use name
        const path = file.webkitRelativePath || file.name;

        console.log(
          `File ${i}: ${file.name}, Path: ${path}, Size: ${file.size}, Type: ${file.type}`
        );

        // Skip if this is a directory entry (size 0 and no type, no extension)
        if (file.size === 0 && file.type === '' && !file.name.includes('.')) {
          console.log(`Skipping directory entry: ${path}`);
          continue;
        }

        // Skip ignored files
        if (shouldIgnoreFile(path, ignorePatterns)) {
          console.log(`Ignoring file: ${path}`);
          continue;
        }

        const isText = isTextFile(file);
        console.log(
          `File ${path} is text: ${isText}, size: ${file.size}, type: ${file.type}`
        );

        files.push({
          path,
          file,
          size: file.size,
          isIncluded: isText, // Include text files by default
          isText,
        });
      }

      console.log(
        `Final file count: ${files.length}, Text files: ${files.filter((f) => f.isText).length}`
      );

      // Sort files by path
      files.sort((a, b) => a.path.localeCompare(b.path));

      onFilesSelected(files);
    },
    [onFilesSelected, ignorePatterns]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const readDirectoryRecursively = useCallback(async (dirEntry: WebkitDirectoryEntry): Promise<File[]> => {
    const collectedFiles: File[] = [];

    return new Promise<File[]>((resolve, reject) => {
      const reader = dirEntry.createReader();

      const readEntries = () => {
        reader.readEntries(async (entries: (WebkitFileEntry | WebkitDirectoryEntry)[]) => {
          if (entries.length === 0) {
            resolve(collectedFiles);
            return;
          }

          const batchPromises: Promise<void>[] = [];

          for (const entry of entries) {
            if (entry.isFile) {
              const filePromise = new Promise<void>((fileResolve, fileReject) => {
                (entry as WebkitFileEntry).file((file: File) => {
                  Object.defineProperty(file, 'webkitRelativePath', {
                    value: entry.fullPath.substring(1), // Remove leading slash
                    writable: false,
                  });
                  collectedFiles.push(file);
                  fileResolve();
                }, (err: DOMException) => {
                  console.error(`[readDirectoryRecursively] Error getting file object for ${entry.name}:`, err);
                  fileReject(err);
                });
              });
              batchPromises.push(filePromise);
            } else if (entry.isDirectory) {
              const subdirPromise = readDirectoryRecursively(entry as WebkitDirectoryEntry).then(subFiles => {
                collectedFiles.push(...subFiles);
              }).catch(dirError => {
                console.error(`[readDirectoryRecursively] Error recursing into directory ${entry.name}:`, dirError);
              });
              batchPromises.push(subdirPromise);
            }
          }

          try {
            await Promise.all(batchPromises);
            readEntries();
          } catch (error) {
            reject(error);
          }
        }, (err: DOMException) => {
          console.error(`[readDirectoryRecursively] reader.readEntries error for ${dirEntry.name}:`, err);
          reject(err);
        });
      };

      readEntries();
    });
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const items = e.dataTransfer.items;
      if (!items) return;

      console.log(`Dropped ${items.length} items`);

      try {
        const allFiles: File[] = [];

        for (let i = 0; i < items.length; i++) {
          const item = items[i] as WebkitDataTransferItem;
          console.log(`Drop item ${i}:`, { kind: item.kind, type: item.type });

          if (item.kind === 'file') {
            // Try to get directory entry if available
            const entry =
              item.webkitGetAsEntry?.() ||
              item.getAsEntry?.();

            if (entry && entry.isDirectory) {
              console.log(`Reading directory: ${entry.name}`);
              try {
                const dirFiles = await readDirectoryRecursively(entry as WebkitDirectoryEntry);
                allFiles.push(...dirFiles);
                console.log(
                  `Found ${dirFiles.length} files in directory ${entry.name}`
                );
              } catch (error) {
                console.warn('Failed to read directory contents:', error);
                alert(
                  `Failed to read directory contents. Please use the "Choose Folder" button instead.`
                );
                return;
              }
            } else if (entry && entry.isFile) {
              // Handle individual file
              (entry as WebkitFileEntry).file((file: File) => {
                allFiles.push(file);
              });
            } else {
              // Fallback for browsers that don't support directory entries
              const file = item.getAsFile();
              if (file) allFiles.push(file);
            }
          }
        }

        // Wait a bit for all file operations to complete
        setTimeout(() => {
          if (allFiles.length > 0) {
            console.log(`Processing ${allFiles.length} dropped files`);
            const fileList = new DataTransfer();
            allFiles.forEach((file) => fileList.items.add(file));
            processFileList(fileList.files);
          } else {
            console.log('No files found in drop');
            alert(
              'Please use the "Choose Folder" button for better folder selection support.'
            );
          }
        }, 500);
      } catch (error) {
        console.error('Error processing dropped items:', error);
        alert(
          'Error processing dropped folder. Please use the "Choose Folder" button instead.'
        );
      }
    },
    [processFileList, readDirectoryRecursively]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      console.log('File input change event:', {
        filesCount: files?.length || 0,
        webkitdirectory: (e.target as WebkitHTMLInputElement).webkitdirectory,
        multiple: e.target.multiple,
        inputValue: e.target.value,
      });

      if (files && files.length > 0) {
        // Log all files to understand the structure
        console.log('All files received:');
        for (let i = 0; i < files.length; i++) {
          const file = files[i] as WebkitFile;
          console.log(`  File ${i}:`, {
            name: file.name,
            webkitRelativePath: file.webkitRelativePath,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
          });
        }

        // Check if we got actual files or just directories
        const actualFiles = Array.from(files).filter((file) => {
          // Filter out directory entries
          return !(file.size === 0 && file.type === '');
        });

        console.log(
          `Filtered to ${actualFiles.length} actual files from ${files.length} entries`
        );

        if (actualFiles.length === 0) {
          console.warn(
            'No actual files found in selection - this might be a browser compatibility issue'
          );
          alert(
            'No files were found in the selected folder. This might be a browser compatibility issue. Please try selecting a different folder or use a different browser.'
          );
          return;
        }

        processFileList(files);
      } else {
        console.log('No files selected');
      }
    },
    [processFileList]
  );

  const handleChooseFolder = useCallback(() => {
    if (fileInputRef.current) {
      const input = fileInputRef.current as WebkitHTMLInputElement;
      // Reset and ensure directory attributes are set correctly
      input.value = '';
      input.webkitdirectory = true;
      input.directory = true;
      input.multiple = true;

      console.log('Input element attributes before click:', {
        webkitdirectory: input.webkitdirectory,
        directory: input.directory,
        multiple: input.multiple,
        type: input.type,
        value: input.value,
      });

      input.click();
    }
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-muted p-4">
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              Select a folder to squeeze
            </h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop a folder here, or choose one from your computer
            </p>
          </div>

          <Button onClick={handleChooseFolder} className="gap-2">
            <Upload className="h-4 w-4" />
            Choose Folder
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            {...({ webkitdirectory: 'true', directory: 'true' } as Record<string, string>)}
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>
      </div>

      <div className="mt-4 text-xs text-muted-foreground text-center space-y-2">
        <p>
          Only text files will be processed. Binary files, node_modules, and
          hidden files are excluded by default.
        </p>
        {ignorePatterns.length > 0 && (
          <p className="text-orange-600 dark:text-orange-400">
            {ignorePatterns.length} custom ignore pattern{ignorePatterns.length !== 1 ? 's' : ''} active. 
            Click settings to manage patterns.
          </p>
        )}
      </div>
    </div>
  );
}

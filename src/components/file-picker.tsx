'use client';

import React, { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileEntry, isTextFile, shouldIgnoreFile } from '@/lib/file-processor';
import { FolderOpen, Upload, Sparkles, Loader2 } from 'lucide-react';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to ensure UI updates
  const forceUIUpdate = useCallback(async () => {
    await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
    await new Promise(resolve => setTimeout(resolve, 0));
  }, []);

  const processFileList = useCallback(
    async (fileList: FileList) => {
      const files: FileEntry[] = [];
      const batchSize = 20; // Process files in smaller batches

      console.log(`Processing ${fileList.length} files from folder selection`);
      setProcessingStatus(`Processing ${fileList.length} files...`);

      // Force UI update using requestAnimationFrame
      await forceUIUpdate();
      await new Promise(resolve => setTimeout(resolve, 50));

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

        // Yield control more frequently
        if (i % batchSize === 0) {
          setProcessingStatus(`Processing files... (${i}/${fileList.length})`);
          await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
          await new Promise(resolve => setTimeout(resolve, 5));
        }
      }

      console.log(
        `Final file count: ${files.length}, Text files: ${files.filter((f) => f.isText).length}`
      );

      setProcessingStatus('Sorting files...');
      await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
      await new Promise(resolve => setTimeout(resolve, 50));

      // Sort files by path
      files.sort((a, b) => a.path.localeCompare(b.path));

      setProcessingStatus('Finalizing...');
      await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
      await new Promise(resolve => setTimeout(resolve, 50));

      onFilesSelected(files);
      setIsProcessing(false);
      setProcessingStatus('');
    },
    [onFilesSelected, ignorePatterns, forceUIUpdate]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isProcessing) {
      setIsDragOver(true);
    }
  }, [isProcessing]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isProcessing) {
      setIsDragOver(false);
    }
  }, [isProcessing]);

  const readDirectoryRecursively = useCallback(async (dirEntry: WebkitDirectoryEntry): Promise<File[]> => {
    const collectedFiles: File[] = [];

    return new Promise<File[]>((resolve, reject) => {
      const reader = dirEntry.createReader();

      const readEntries = async () => {
        reader.readEntries(async (entries: (WebkitFileEntry | WebkitDirectoryEntry)[]) => {
          if (entries.length === 0) {
            resolve(collectedFiles);
            return;
          }

          const batchPromises: Promise<void>[] = [];
          let fileCount = 0;

          for (const entry of entries) {
            if (entry.isFile) {
              const filePromise = new Promise<void>((fileResolve, fileReject) => {
                (entry as WebkitFileEntry).file((file: File) => {
                  Object.defineProperty(file, 'webkitRelativePath', {
                    value: entry.fullPath.substring(1), // Remove leading slash
                    writable: false,
                  });
                  collectedFiles.push(file);
                  fileCount++;
                  if (fileCount % 10 === 0) {
                    setProcessingStatus(`Reading files... (${collectedFiles.length} found)`);
                  }
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
                setProcessingStatus(`Reading files... (${collectedFiles.length} found)`);
              }).catch(dirError => {
                console.error(`[readDirectoryRecursively] Error recursing into directory ${entry.name}:`, dirError);
              });
              batchPromises.push(subdirPromise);
            }
          }

                      try {
              await Promise.all(batchPromises);
              // Allow UI to update between batches
              await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
              await new Promise(resolve => setTimeout(resolve, 20));
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
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (isProcessing) return;

      const items = e.dataTransfer.items;
      if (!items) return;

      console.log(`Dropped ${items.length} items`);
      setIsProcessing(true);
      setProcessingStatus('Reading dropped folder...');

      // Defer heavy processing to next event loop tick
      setTimeout(async () => {
        try {
          // Additional delay to ensure UI has updated
          await new Promise(resolve => setTimeout(resolve, 50));

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
                  setIsProcessing(false);
                  setProcessingStatus('');
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
          setTimeout(async () => {
            if (allFiles.length > 0) {
              console.log(`Processing ${allFiles.length} dropped files`);
              const fileList = new DataTransfer();
              allFiles.forEach((file) => fileList.items.add(file));
              try {
                await processFileList(fileList.files);
              } catch (error) {
                console.error('Error processing dropped files:', error);
                setIsProcessing(false);
                setProcessingStatus('');
                alert('An error occurred while processing the files. Please try again.');
              }
            } else {
              console.log('No files found in drop');
              setIsProcessing(false);
              setProcessingStatus('');
              alert(
                'Please use the "Choose Folder" button for better folder selection support.'
              );
            }
          }, 500);
        } catch (error) {
          console.error('Error processing dropped items:', error);
          setIsProcessing(false);
          setProcessingStatus('');
          alert(
            'Error processing dropped folder. Please use the "Choose Folder" button instead.'
          );
        }
      }, 0);
    },
    [processFileList, readDirectoryRecursively, isProcessing]
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
        // Set processing state immediately
        setIsProcessing(true);
        setProcessingStatus('Reading selected folder...');

        // Defer heavy processing to next event loop tick to allow UI to update
        setTimeout(async () => {
          try {
            // Additional delay to ensure UI has updated
            await new Promise(resolve => setTimeout(resolve, 50));

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
              setIsProcessing(false);
              setProcessingStatus('');
              alert(
                'No files were found in the selected folder. This might be a browser compatibility issue. Please try selecting a different folder or use a different browser.'
              );
              return;
            }

            await processFileList(files);
          } catch (error) {
            console.error('Error processing files:', error);
            setIsProcessing(false);
            setProcessingStatus('');
            alert('An error occurred while processing the files. Please try again.');
          }
        }, 0);
      } else {
        console.log('No files selected');
      }
    },
    [processFileList]
  );

  const handleChooseFolder = useCallback(() => {
    if (isProcessing) return;
    
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
  }, [isProcessing]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is not part of the standard HTML input attributes but is needed for directory selection in webkit browsers
        webkitdirectory="true"
        directory="true"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="Select folder"
      />
      
      <motion.div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer",
          isProcessing
            ? "border-muted bg-muted/20 cursor-not-allowed"
            : isDragOver
            ? "border-primary bg-primary/5 scale-105"
            : "border-border hover:border-primary/50 hover:bg-accent/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!isProcessing ? handleChooseFolder : undefined}
        whileHover={!isProcessing ? { scale: 1.02 } : {}}
        whileTap={!isProcessing ? { scale: 0.98 } : {}}
        layout
      >
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <motion.div
                animate={{ 
                  rotate: 360
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center"
              >
                <Loader2 className="h-6 w-6 text-primary" />
              </motion.div>
              <div className="space-y-1">
                <motion.h3 
                  className="text-base font-semibold text-primary"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Processing folder...
                </motion.h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  {processingStatus || 'Please wait while we read your files'}
                </p>
              </div>
            </motion.div>
          ) : isDragOver ? (
            <motion.div
              key="drag-over"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1.1, 1]
                }}
                transition={{ 
                  duration: 0.6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center"
              >
                <Upload className="h-6 w-6 text-primary" />
              </motion.div>
              <div className="space-y-1">
                <motion.h3 
                  className="text-base font-semibold text-primary"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Drop your folder here!
                </motion.h3>
                <p className="text-xs text-muted-foreground">
                  Release to select the folder
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <motion.div 
                className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center group"
                whileHover={{ 
                  scale: 1.1,
                  backgroundColor: "hsl(var(--primary) / 0.15)"
                }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <motion.div
                  animate={{ 
                    y: [0, -2, 0],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <FolderOpen className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                </motion.div>
              </motion.div>
              
              <div className="space-y-2">
                <motion.h3 
                  className="text-base font-semibold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  Select a folder to get started
                </motion.h3>
                <motion.p 
                  className="text-xs text-muted-foreground max-w-md mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Choose a folder containing your codebase, or drag and drop it here
                </motion.p>
              </div>
              
              <motion.div 
                className="flex items-center justify-center gap-1 text-xs text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Sparkles className="h-3 w-3" />
                <span>
                  Supports all programming languages and file types
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Animated background elements */}
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0 pointer-events-none"
          animate={isDragOver ? {
            opacity: 1,
            background: "radial-gradient(circle at center, hsl(var(--primary) / 0.1) 0%, transparent 70%)"
          } : { opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      <div className="mt-2 text-xs text-muted-foreground text-center space-y-1 max-w-lg mx-auto">
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

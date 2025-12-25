"use client";

import React, { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileEntry, isTextFile, shouldIgnoreFile } from "@/lib/file-processor";
import { FolderOpen, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type WebkitFile = File & {
  webkitRelativePath?: string;
};

interface WebkitFileEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
  file(
    successCallback: (file: File) => void,
    errorCallback?: (error: DOMException) => void
  ): void;
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
    successCallback: (
      entries: (WebkitFileEntry | WebkitDirectoryEntry)[]
    ) => void,
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
  const [processingStatus, setProcessingStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const forceUIUpdate = useCallback(async () => {
    await new Promise((resolve) =>
      requestAnimationFrame(() => resolve(undefined))
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
  }, []);

  const processFileList = useCallback(
    async (fileList: FileList) => {
      const files: FileEntry[] = [];
      const batchSize = 20;

      setProcessingStatus(`Scanning ${fileList.length} files...`);
      await forceUIUpdate();
      await new Promise((resolve) => setTimeout(resolve, 50));

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i] as WebkitFile;
        const path = file.webkitRelativePath || file.name;

        if (file.size === 0 && file.type === "" && !file.name.includes(".")) {
          continue;
        }

        if (shouldIgnoreFile(path, ignorePatterns)) {
          continue;
        }

        const isText = isTextFile(file);

        files.push({
          path,
          file,
          size: file.size,
          isIncluded: isText,
          isText,
        });

        if (i % batchSize === 0) {
          setProcessingStatus(`Processing ${i}/${fileList.length} files...`);
          await new Promise((resolve) =>
            requestAnimationFrame(() => resolve(undefined))
          );
          await new Promise((resolve) => setTimeout(resolve, 5));
        }
      }

      setProcessingStatus("Organizing files...");
      await new Promise((resolve) =>
        requestAnimationFrame(() => resolve(undefined))
      );
      await new Promise((resolve) => setTimeout(resolve, 50));

      files.sort((a, b) => a.path.localeCompare(b.path));

      onFilesSelected(files);
      setIsProcessing(false);
      setProcessingStatus("");
    },
    [onFilesSelected, ignorePatterns, forceUIUpdate]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!isProcessing) {
        setIsDragOver(true);
      }
    },
    [isProcessing]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!isProcessing) {
        setIsDragOver(false);
      }
    },
    [isProcessing]
  );

  const readDirectoryRecursively = useCallback(
    async (dirEntry: WebkitDirectoryEntry): Promise<File[]> => {
      const collectedFiles: File[] = [];

      return new Promise<File[]>((resolve, reject) => {
        const reader = dirEntry.createReader();

        const readEntries = async () => {
          reader.readEntries(
            async (entries: (WebkitFileEntry | WebkitDirectoryEntry)[]) => {
              if (entries.length === 0) {
                resolve(collectedFiles);
                return;
              }

              const batchPromises: Promise<void>[] = [];
              let fileCount = 0;

              for (const entry of entries) {
                if (entry.isFile) {
                  const filePromise = new Promise<void>(
                    (fileResolve, fileReject) => {
                      (entry as WebkitFileEntry).file(
                        (file: File) => {
                          Object.defineProperty(file, "webkitRelativePath", {
                            value: entry.fullPath.substring(1),
                            writable: false,
                          });
                          collectedFiles.push(file);
                          fileCount++;
                          if (fileCount % 10 === 0) {
                            setProcessingStatus(
                              `Reading files... (${collectedFiles.length} found)`
                            );
                          }
                          fileResolve();
                        },
                        (err: DOMException) => {
                          console.error(
                            `Error getting file object for ${entry.name}:`,
                            err
                          );
                          fileReject(err);
                        }
                      );
                    }
                  );
                  batchPromises.push(filePromise);
                } else if (entry.isDirectory) {
                  const subdirPromise = readDirectoryRecursively(
                    entry as WebkitDirectoryEntry
                  )
                    .then((subFiles) => {
                      collectedFiles.push(...subFiles);
                      setProcessingStatus(
                        `Reading files... (${collectedFiles.length} found)`
                      );
                    })
                    .catch((dirError) => {
                      console.error(
                        `Error recursing into directory ${entry.name}:`,
                        dirError
                      );
                    });
                  batchPromises.push(subdirPromise);
                }
              }

              try {
                await Promise.all(batchPromises);
                await new Promise((resolve) =>
                  requestAnimationFrame(() => resolve(undefined))
                );
                await new Promise((resolve) => setTimeout(resolve, 20));
                readEntries();
              } catch (error) {
                reject(error);
              }
            },
            (err: DOMException) => {
              console.error(
                `reader.readEntries error for ${dirEntry.name}:`,
                err
              );
              reject(err);
            }
          );
        };

        readEntries();
      });
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (isProcessing) return;

      const items = e.dataTransfer.items;
      if (!items) return;

      setIsProcessing(true);
      setProcessingStatus("Reading dropped folder...");

      setTimeout(async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 50));

          const allFiles: File[] = [];

          for (let i = 0; i < items.length; i++) {
            const item = items[i] as WebkitDataTransferItem;

            if (item.kind === "file") {
              const entry = item.webkitGetAsEntry?.() || item.getAsEntry?.();

              if (entry && entry.isDirectory) {
                try {
                  const dirFiles = await readDirectoryRecursively(
                    entry as WebkitDirectoryEntry
                  );
                  allFiles.push(...dirFiles);
                } catch (error) {
                  console.warn("Failed to read directory contents:", error);
                  setIsProcessing(false);
                  setProcessingStatus("");
                  alert(
                    `Failed to read directory contents. Please use the "Choose Folder" button instead.`
                  );
                  return;
                }
              } else if (entry && entry.isFile) {
                (entry as WebkitFileEntry).file((file: File) => {
                  allFiles.push(file);
                });
              } else {
                const file = item.getAsFile();
                if (file) allFiles.push(file);
              }
            }
          }

          setTimeout(async () => {
            if (allFiles.length > 0) {
              const fileList = new DataTransfer();
              allFiles.forEach((file) => fileList.items.add(file));
              try {
                await processFileList(fileList.files);
              } catch (error) {
                console.error("Error processing dropped files:", error);
                setIsProcessing(false);
                setProcessingStatus("");
                alert(
                  "An error occurred while processing the files. Please try again."
                );
              }
            } else {
              setIsProcessing(false);
              setProcessingStatus("");
              alert(
                'Please use the "Choose Folder" button for better folder selection support.'
              );
            }
          }, 500);
        } catch (error) {
          console.error("Error processing dropped items:", error);
          setIsProcessing(false);
          setProcessingStatus("");
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

      if (files && files.length > 0) {
        setIsProcessing(true);
        setProcessingStatus("Reading selected folder...");

        setTimeout(async () => {
          try {
            await new Promise((resolve) => setTimeout(resolve, 50));

            const actualFiles = Array.from(files).filter((file) => {
              return !(file.size === 0 && file.type === "");
            });

            if (actualFiles.length === 0) {
              setIsProcessing(false);
              setProcessingStatus("");
              alert(
                "No files were found in the selected folder. This might be a browser compatibility issue. Please try selecting a different folder or use a different browser."
              );
              return;
            }

            await processFileList(files);
          } catch (error) {
            console.error("Error processing files:", error);
            setIsProcessing(false);
            setProcessingStatus("");
            alert(
              "An error occurred while processing the files. Please try again."
            );
          }
        }, 0);
      }
    },
    [processFileList]
  );

  const handleChooseFolder = useCallback(() => {
    if (isProcessing) return;

    if (fileInputRef.current) {
      const input = fileInputRef.current as WebkitHTMLInputElement;
      input.value = "";
      input.webkitdirectory = true;
      input.directory = true;
      input.multiple = true;
      input.click();
    }
  }, [isProcessing]);

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is not part of standard HTML attributes
        webkitdirectory="true"
        directory="true"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="Select folder"
      />

      <motion.div
        className={cn(
          "drop-zone rounded-2xl cursor-pointer overflow-hidden",
          isDragOver && "active",
          isProcessing && "cursor-not-allowed opacity-80"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!isProcessing ? handleChooseFolder : undefined}
        whileHover={!isProcessing ? { scale: 1.005 } : {}}
        whileTap={!isProcessing ? { scale: 0.995 } : {}}
      >
        <div className="p-8 sm:p-10">
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative">
                  <motion.div
                    className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Loader2 className="h-6 w-6 text-accent" />
                  </motion.div>
                </div>
                <div className="text-center space-y-1">
                  <p className="font-medium text-fg">Processing folder...</p>
                  <p className="text-sm text-fg-muted">{processingStatus}</p>
                </div>
              </motion.div>
            ) : isDragOver ? (
              <motion.div
                key="drag-over"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center gap-4"
              >
                <motion.div
                  className="w-14 h-14 rounded-xl bg-accent/15 flex items-center justify-center"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                >
                  <Upload className="h-6 w-6 text-accent" />
                </motion.div>
                <div className="text-center space-y-1">
                  <p className="font-medium text-accent">Drop your folder here</p>
                  <p className="text-sm text-fg-muted">Release to start processing</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <motion.div
                  className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <FolderOpen className="h-6 w-6 text-accent" />
                </motion.div>
                <div className="text-center space-y-1">
                  <p className="font-medium text-fg">
                    Drop a folder here or{" "}
                    <span className="text-accent">click to browse</span>
                  </p>
                  <p className="text-sm text-fg-muted">
                    Binary files and node_modules are automatically excluded
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {ignorePatterns.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-accent mt-3 text-center"
        >
          {ignorePatterns.length} custom ignore pattern
          {ignorePatterns.length !== 1 ? "s" : ""} active
        </motion.p>
      )}
    </div>
  );
}

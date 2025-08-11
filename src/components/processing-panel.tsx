"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FileEntry,
  processFiles,
  ProcessingProgress,
  ProcessingResult,
} from "@/lib/file-processor";
import { copyToClipboard, getClipboardLimits } from "@/lib/clipboard";
import { formatBytes, generateSHA256 } from "@/lib/utils";
import {
  Play,
  Copy,
  Download,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface ProcessingPanelProps {
  files: FileEntry[];
}

export function ProcessingPanel({ files }: ProcessingPanelProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [copyStatus, setCopyStatus] = useState<
    "idle" | "copying" | "success" | "error"
  >("idle");

  const includedFiles = files.filter((f) => f.isIncluded && f.isText);
  const totalSize = includedFiles.reduce((sum, f) => sum + f.size, 0);
  const clipboardLimits = getClipboardLimits();

  const handleProcess = useCallback(async () => {
    if (includedFiles.length === 0) return;

    setIsProcessing(true);
    setResult(null);
    setOutputBlob(null);
    setCopyStatus("idle");

    try {
      const chunks: string[] = [];
      const processor = processFiles(includedFiles, setProgress);

      let processingResult: ProcessingResult | undefined;

      // Consume all yielded chunks
      for await (const chunk of processor) {
        chunks.push(chunk);
      }

      // Get the final return value
      try {
        const finalResult = await processor.next();
        if (finalResult.done && finalResult.value) {
          processingResult = finalResult.value;
        }
      } catch {
        // For generators, the return value might be accessible differently
        console.log("Generator completed, checking for return value");
      }

      // If we have chunks, create the blob and use the processing result
      if (chunks.length > 0) {
        const fullContent = chunks.join("");
        const blob = new Blob([fullContent], { type: "text/plain" });

        // If we don't have a result from the generator, calculate it manually
        if (!processingResult) {
          const estimatedTokens = Math.ceil(fullContent.length / 4);
          const checksum = await generateSHA256(fullContent);
          const lineCount = fullContent.split("\n").length;

          processingResult = {
            content: fullContent,
            stats: {
              totalFiles: includedFiles.length,
              totalSize,
              lineCount,
              estimatedTokens,
            },
            checksum,
          };
        }

        setResult(processingResult);
        setOutputBlob(blob);
      }
    } catch (error) {
      console.error("Processing failed:", error);

      // Show user-friendly error message
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      // Set a result with error information
      setResult({
        content: `/* Processing failed: ${errorMessage} */\n\n/* Please try selecting the folder again */`,
        stats: {
          totalFiles: 0,
          totalSize: 0,
          lineCount: 1,
          estimatedTokens: 0,
        },
        checksum: "error",
      });

      const errorBlob = new Blob(
        [
          `Processing failed: ${errorMessage}\n\nPlease try selecting the folder again.`,
        ],
        { type: "text/plain" },
      );
      setOutputBlob(errorBlob);
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  }, [includedFiles, totalSize]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!outputBlob) return;

    setCopyStatus("copying");

    try {
      const text = await outputBlob.text();
      const result = await copyToClipboard(text);

      if (result.success) {
        setCopyStatus("success");
        setTimeout(() => setCopyStatus("idle"), 3000);
      } else {
        setCopyStatus("error");
        setTimeout(() => setCopyStatus("idle"), 5000);
      }
    } catch {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 5000);
    }
  }, [outputBlob]);

  const handleDownload = useCallback(async () => {
    if (!outputBlob || !result) return;

    try {
      const checksum = await generateSHA256(await outputBlob.text());
      const filename = `codebase-${checksum.substring(0, 8)}.txt`;

      const url = URL.createObjectURL(outputBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  }, [outputBlob, result]);

  if (includedFiles.length === 0) {
    return (
      <motion.div
        className="w-full max-w-2xl mx-auto text-center py-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          animate={{
            y: [0, -5, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            type: "tween",
          }}
        >
          <p className="text-fg-muted">
            No files selected for processing. Please select at least one text
            file.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto space-y-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div className="space-y-4" layout>
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div>
            <motion.h3
              className="text-lg font-semibold"
              whileHover={{ scale: 1.02 }}
            >
              Process Files
            </motion.h3>
            <motion.p
              className="text-sm text-fg-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Ready to process{" "}
              <motion.span
                key={includedFiles.length}
                initial={{ scale: 1.2, color: "var(--color-accent)" }}
                animate={{ scale: 1, color: "var(--color-fg-muted)" }}
                transition={{ duration: 0.3 }}
              >
                {includedFiles.length}
              </motion.span>{" "}
              files ({formatBytes(totalSize)})
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleProcess}
              disabled={isProcessing || includedFiles.length === 0}
              className="gap-2 relative overflow-hidden"
              size="lg"
            >
              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.div
                    key="processing"
                    initial={{ rotate: 0, scale: 0 }}
                    animate={{ rotate: 360, scale: 1 }}
                    exit={{ rotate: 0, scale: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="play"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Play className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
              {isProcessing ? "Processing..." : "Process Files"}

              {/* Animated background effect */}
              {isProcessing && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              )}
            </Button>
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {progress && (
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="flex justify-between text-sm">
                <motion.span
                  key={progress.currentFile}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  Processing: {progress.currentFile}
                </motion.span>
                <motion.span
                  animate={{
                    scale: [1, 1.1, 1],
                    color: [
                      "var(--color-fg-muted)",
                      "var(--color-accent)",
                      "var(--color-fg-muted)",
                    ],
                  }}
                  transition={{ duration: 0.6 }}
                >
                  {progress.current} / {progress.total}
                </motion.span>
              </div>
              <motion.div layout>
                <Progress
                  value={(progress.current / progress.total) * 100}
                  className="h-2"
                  showAnimation={true}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {result && outputBlob && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="border border-border rounded-2xl p-6 bg-surface/50 backdrop-blur-sm shadow-[var(--shadow-card)]"
            whileHover={{
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              scale: 1.01,
            }}
          >
            <motion.div
              className="flex items-start gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.3,
                  type: "spring",
                  stiffness: 200,
                  damping: 10,
                }}
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-[color:color-mix(in_oklab,var(--color-accent)_20%,transparent)]"
              >
                <CheckCircle className="h-5 w-5 text-accent" />
              </motion.div>

              <div className="flex-1 space-y-4">
                <div>
                  <motion.h4
                    className="text-lg font-semibold"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Processing Complete!
                  </motion.h4>
                  <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {[
                      { label: "Files", value: result.stats.totalFiles },
                      {
                        label: "Lines",
                        value: result.stats.lineCount.toLocaleString(),
                      },
                      {
                        label: "Size",
                        value: formatBytes(result.stats.totalSize),
                      },
                      {
                        label: "Est. Tokens",
                        value: result.stats.estimatedTokens.toLocaleString(),
                      },
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        className="text-center p-2 bg-muted/50 rounded-2xl"
                      >
                        <div className="font-semibold text-accent">
                          {stat.value}
                        </div>
                        <div className="text-xs text-fg-muted">
                          {stat.label}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                <motion.div
                  className="flex flex-wrap gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={handleCopyToClipboard}
                      disabled={copyStatus === "copying"}
                      className="gap-2"
                      data-copy-button
                    >
                      <AnimatePresence mode="wait">
                        {copyStatus === "copying" ? (
                          <motion.div
                            key="copying"
                            initial={{ rotate: 0 }}
                            animate={{ rotate: 360 }}
                            exit={{ rotate: 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </motion.div>
                        ) : copyStatus === "success" ? (
                          <motion.div
                            key="success"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 15,
                            }}
                          >
                            <CheckCircle className="h-4 w-4 text-accent" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="copy"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Copy className="h-4 w-4" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {copyStatus === "copying"
                        ? "Copying..."
                        : copyStatus === "success"
                          ? "Copied!"
                          : "Copy to Clipboard"}
                    </Button>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download File
                    </Button>
                  </motion.div>
                </motion.div>

                {result.checksum && (
                  <motion.div
                    className="text-xs text-fg-muted font-mono bg-muted/30 p-2 rounded-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    SHA-256: {result.checksum}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clipboard size warning */}
      {totalSize > clipboardLimits.warningSize && !result && (
        <motion.div
          className="flex items-center gap-2 p-3 bg-[color:color-mix(in_oklab,#fde68a_25%,transparent)] dark:bg-[color:color-mix(in_oklab,#fde68a_15%,transparent)] border border-[color:#f59e0b]/30 rounded-2xl text-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          whileHover={{ scale: 1.02 }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </motion.div>
          <span className="text-[color:#92400e] dark:text-[color:#fcd34d]">
            Large codebase detected ({formatBytes(totalSize)}). Consider
            downloading the file instead of copying to clipboard.
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

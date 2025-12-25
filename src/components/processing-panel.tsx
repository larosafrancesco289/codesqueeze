"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
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
  Check,
  AlertTriangle,
  Loader2,
  FileText,
  Code,
  Hash,
  Sparkles,
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

      for await (const chunk of processor) {
        chunks.push(chunk);
      }

      try {
        const finalResult = await processor.next();
        if (finalResult.done && finalResult.value) {
          processingResult = finalResult.value;
        }
      } catch {
        console.log("Generator completed");
      }

      if (chunks.length > 0) {
        const fullContent = chunks.join("");
        const blob = new Blob([fullContent], { type: "text/plain" });

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

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      setResult({
        content: `/* Processing failed: ${errorMessage} */`,
        stats: {
          totalFiles: 0,
          totalSize: 0,
          lineCount: 1,
          estimatedTokens: 0,
        },
        checksum: "error",
      });

      const errorBlob = new Blob(
        [`Processing failed: ${errorMessage}\n\nPlease try again.`],
        { type: "text/plain" }
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
        setTimeout(() => setCopyStatus("idle"), 2000);
      } else {
        setCopyStatus("error");
        setTimeout(() => setCopyStatus("idle"), 3000);
      }
    } catch {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 3000);
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
      <div className="card-elevated rounded-xl p-6 text-center">
        <p className="text-fg-muted text-sm">
          No files selected. Select at least one text file to continue.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Process Action */}
      <div className="card-elevated rounded-xl p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="font-display text-base font-semibold">Export</h3>
            <p className="text-sm text-fg-muted">
              <span className="text-accent font-medium tabular-nums">
                {includedFiles.length}
              </span>{" "}
              files · {formatBytes(totalSize)}
            </p>
          </div>

          <Button
            onClick={handleProcess}
            disabled={isProcessing || includedFiles.length === 0}
            size="lg"
            className="min-w-32"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </div>

        {/* Progress */}
        <AnimatePresence>
          {progress && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-border-subtle"
            >
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-fg-muted truncate max-w-[60%]">
                  {progress.currentFile}
                </span>
                <span className="text-fg-muted tabular-nums">
                  {progress.current}/{progress.total}
                </span>
              </div>
              <div className="progress-bar h-1.5">
                <motion.div
                  className="progress-bar-fill h-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(progress.current / progress.total) * 100}%`,
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Size Warning */}
      {totalSize > clipboardLimits.warningSize && !result && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20"
        >
          <AlertTriangle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <p className="text-sm text-fg-muted">
            Large codebase detected ({formatBytes(totalSize)}). Consider
            downloading the file instead of copying to clipboard.
          </p>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && outputBlob && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card-elevated rounded-xl overflow-hidden"
          >
            {/* Success Header */}
            <div className="p-4 border-b border-border-subtle bg-accent/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <h4 className="font-display font-semibold">Ready to use</h4>
                  <p className="text-sm text-fg-muted">
                    Your codebase has been processed
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  icon: FileText,
                  label: "Files",
                  value: result.stats.totalFiles.toString(),
                },
                {
                  icon: Code,
                  label: "Lines",
                  value: result.stats.lineCount.toLocaleString(),
                },
                {
                  icon: Hash,
                  label: "Size",
                  value: formatBytes(result.stats.totalSize),
                },
                {
                  icon: Sparkles,
                  label: "Tokens",
                  value: `~${result.stats.estimatedTokens.toLocaleString()}`,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="stat-pill rounded-lg p-3 text-center"
                >
                  <stat.icon className="h-4 w-4 text-accent mx-auto mb-1" />
                  <div className="font-semibold tabular-nums text-fg">
                    {stat.value}
                  </div>
                  <div className="text-xs text-fg-muted">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="p-4 pt-0 flex flex-wrap gap-2">
              <Button
                onClick={handleCopyToClipboard}
                disabled={copyStatus === "copying"}
                className="flex-1 sm:flex-none min-w-32"
                data-copy-button
              >
                {copyStatus === "copying" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Copying...
                  </>
                ) : copyStatus === "success" ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy to Clipboard
                  </>
                )}
              </Button>

              <Button
                onClick={handleDownload}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>

            {/* Checksum */}
            {result.checksum && result.checksum !== "error" && (
              <div className="px-4 pb-4">
                <div className="text-xs text-fg-muted font-mono bg-muted/50 rounded-md px-3 py-2 truncate">
                  SHA-256: {result.checksum}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

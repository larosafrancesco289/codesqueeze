'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FileEntry, 
  processFiles, 
  ProcessingProgress, 
  ProcessingResult 
} from '@/lib/file-processor';
import { copyToClipboard, getClipboardLimits } from '@/lib/clipboard';
import { formatBytes, generateSHA256 } from '@/lib/utils';
import { 
  Play, 
  Copy, 
  Download, 
  CheckCircle, 
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface ProcessingPanelProps {
  files: FileEntry[];
}

export function ProcessingPanel({ files }: ProcessingPanelProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');

  const includedFiles = files.filter(f => f.isIncluded && f.isText);
  const totalSize = includedFiles.reduce((sum, f) => sum + f.size, 0);
  const clipboardLimits = getClipboardLimits();

  const handleProcess = useCallback(async () => {
    if (includedFiles.length === 0) return;

    setIsProcessing(true);
    setResult(null);
    setOutputBlob(null);
    setCopyStatus('idle');

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
        console.log('Generator completed, checking for return value');
      }

      // If we have chunks, create the blob and use the processing result
      if (chunks.length > 0) {
        const fullContent = chunks.join('');
        const blob = new Blob([fullContent], { type: 'text/plain' });
        
        // If we don't have a result from the generator, calculate it manually
        if (!processingResult) {
          const estimatedTokens = Math.ceil(fullContent.length / 4);
          const checksum = await generateSHA256(fullContent);
          const lineCount = fullContent.split('\n').length;
          
          processingResult = {
            content: fullContent,
            stats: {
              totalFiles: includedFiles.length,
              totalSize,
              lineCount,
              estimatedTokens
            },
            checksum
          };
        }
        
        setResult(processingResult);
        setOutputBlob(blob);
      }
    } catch (error) {
      console.error('Processing failed:', error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Set a result with error information
      setResult({
        content: `/* Processing failed: ${errorMessage} */\n\n/* Please try selecting the folder again */`,
        stats: {
          totalFiles: 0,
          totalSize: 0,
          lineCount: 1,
          estimatedTokens: 0
        },
        checksum: 'error'
      });
      
      const errorBlob = new Blob([`Processing failed: ${errorMessage}\n\nPlease try selecting the folder again.`], { type: 'text/plain' });
      setOutputBlob(errorBlob);
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  }, [includedFiles, totalSize]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!outputBlob) return;

    setCopyStatus('copying');
    
    try {
      const text = await outputBlob.text();
      const result = await copyToClipboard(text);
      
      if (result.success) {
        setCopyStatus('success');
        setTimeout(() => setCopyStatus('idle'), 3000);
      } else {
        setCopyStatus('error');
        setTimeout(() => setCopyStatus('idle'), 5000);
      }
    } catch {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 5000);
    }
  }, [outputBlob]);

  const handleDownload = useCallback(async () => {
    if (!outputBlob || !result) return;

    try {
      const checksum = await generateSHA256(await outputBlob.text());
      const filename = `codebase-${checksum.substring(0, 8)}.txt`;
      
      const url = URL.createObjectURL(outputBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [outputBlob, result]);

  if (includedFiles.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-8">
        <p className="text-muted-foreground">
          No files selected for processing. Please select at least one text file.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Process Files</h3>
            <p className="text-sm text-muted-foreground">
              Ready to process {includedFiles.length} files ({formatBytes(totalSize)})
            </p>
          </div>
          
          <Button
            onClick={handleProcess}
            disabled={isProcessing || includedFiles.length === 0}
            className="gap-2"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isProcessing ? 'Processing...' : 'Process Files'}
          </Button>
        </div>

        {progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing: {progress.currentFile}</span>
              <span>{Math.round((progress.current / progress.total) * 100)}%</span>
            </div>
            <Progress value={progress.current} max={progress.total} />
          </div>
        )}
      </div>

      {result && outputBlob && (
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h4 className="font-semibold">Processing Complete</h4>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">Files</div>
              <div className="text-muted-foreground">{result.stats.totalFiles}</div>
            </div>
            <div>
              <div className="font-medium">Size</div>
              <div className="text-muted-foreground">{formatBytes(result.stats.totalSize)}</div>
            </div>
            <div>
              <div className="font-medium">Lines</div>
              <div className="text-muted-foreground">{result.stats.lineCount.toLocaleString()}</div>
            </div>
            <div>
              <div className="font-medium">Est. Tokens</div>
              <div className="text-muted-foreground">{result.stats.estimatedTokens.toLocaleString()}</div>
            </div>
          </div>

          {outputBlob.size > clipboardLimits.warningSize && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-yellow-800 dark:text-yellow-200">Large content warning</div>
                <div className="text-yellow-700 dark:text-yellow-300">
                  Content is {formatBytes(outputBlob.size)}, which may be too large for clipboard on some browsers.
                  Consider downloading instead.
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleCopyToClipboard}
              disabled={copyStatus === 'copying'}
              variant={copyStatus === 'success' ? 'default' : 'outline'}
              className="gap-2"
            >
              {copyStatus === 'copying' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : copyStatus === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copyStatus === 'copying' ? 'Copying...' : 
               copyStatus === 'success' ? 'Copied!' : 'Copy to Clipboard'}
            </Button>

            <Button
              onClick={handleDownload}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download .txt
            </Button>
          </div>

          {copyStatus === 'error' && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to copy to clipboard. Please try downloading instead.
            </p>
          )}

          <div className="text-xs text-muted-foreground">
            SHA-256: {result.checksum}
          </div>
        </div>
      )}
    </div>
  );
} 
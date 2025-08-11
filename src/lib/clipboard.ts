export interface ClipboardResult {
  success: boolean;
  error?: string;
  fallbackUsed?: boolean;
}

const CLIPBOARD_SIZE_LIMIT = 150 * 1024; // 150KB - conservative limit for older browsers

export async function copyToClipboard(text: string): Promise<ClipboardResult> {
  if (!navigator.clipboard) {
    return fallbackCopyToClipboard(text);
  }

  try {
    // Check if content is too large
    if (text.length > CLIPBOARD_SIZE_LIMIT) {
      console.warn("Content may be too large for clipboard on some browsers");
    }

    await navigator.clipboard.writeText(text);
    return { success: true };
  } catch (error) {
    console.warn("Clipboard API failed, falling back to legacy method", error);
    return fallbackCopyToClipboard(text);
  }
}

function fallbackCopyToClipboard(text: string): ClipboardResult {
  try {
    // Create a temporary textarea element
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Make it invisible but not display:none (which breaks the selection)
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.style.opacity = "0";

    document.body.appendChild(textArea);

    // Select and copy
    textArea.focus();
    textArea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);

    if (successful) {
      return { success: true, fallbackUsed: true };
    } else {
      return {
        success: false,
        error: "Copy command failed",
        fallbackUsed: true,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      fallbackUsed: true,
    };
  }
}

export function getClipboardLimits() {
  return {
    warningSize: CLIPBOARD_SIZE_LIMIT,
    estimatedMaxSize: 180 * 1024, // Conservative estimate for older Chrome
  };
}

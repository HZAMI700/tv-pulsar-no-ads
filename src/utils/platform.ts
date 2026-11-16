/**
 * Platform Detection Utility
 * Determines if running inside native Android WebView shell (PulsarApp / PulsarDownloader)
 * or directly in a standard web browser (Chrome, Edge, Safari, Firefox, Web version).
 */

export const isNativeApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).PulsarApp ||
    (window as any).PulsarDownloader?.isNativeDownloaderSupported
  );
};

export const isWebVersion = (): boolean => !isNativeApp();

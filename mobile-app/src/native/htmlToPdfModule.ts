/**
 * Shim for react-native-html-to-pdf: resolves the native module lazily and avoids
 * "Cannot read property 'convert' of null" when NativeModules.HtmlToPdf is missing
 * until the bridge finishes registering (common on physical devices).
 */
import {NativeModules, TurboModuleRegistry} from 'react-native';

type NativePdfResult = {
  filePath?: string;
  base64?: string;
  numberOfPages?: string;
};

type NativePdfModule = {
  convert: (options: Record<string, unknown>) => Promise<NativePdfResult>;
};

const NATIVE_MODULE_NAMES = [
  'HtmlToPdf',
  'RNHTMLtoPDF',
  'RNHtmlToPdf',
] as const;

function getHtmlToPdfNative(): NativePdfModule | null {
  const nm = NativeModules as Record<string, NativePdfModule | undefined>;
  for (const name of NATIVE_MODULE_NAMES) {
    const m = nm[name];
    if (m != null && typeof m.convert === 'function') {
      return m;
    }
  }
  try {
    const t = TurboModuleRegistry.get?.('HtmlToPdf') as NativePdfModule | undefined;
    if (t != null && typeof t.convert === 'function') {
      return t;
    }
  } catch {
    // TurboModuleRegistry.get may throw if module not registered
  }
  if (__DEV__) {
    const keys = Object.keys(NativeModules).filter(
      k => /html|pdf|print/i.test(k),
    );
    console.warn(
      '[FireApp PDF] No HtmlToPdf native module. Matching NativeModules keys:',
      keys.length ? keys.join(', ') : '(none)',
    );
  }
  return null;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generatePDF(
  options: Record<string, unknown>,
): Promise<NativePdfResult> {
  let mod = getHtmlToPdfNative();
  if (mod == null) {
    await delay(0);
    mod = getHtmlToPdfNative();
  }
  if (mod == null) {
    await delay(100);
    mod = getHtmlToPdfNative();
  }
  if (mod == null) {
    throw new Error(
      'PDF engine is not available on this build. Fix: (1) cd ios && pod install, (2) Open FireApp.xcworkspace in Xcode, (3) Product → Clean Build Folder, (4) Build & run on your iPad. Ensure npm install ran so patch-package applies the HtmlToPdf iOS patch.',
    );
  }
  return mod.convert(options);
}

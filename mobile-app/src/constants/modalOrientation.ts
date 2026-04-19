/**
 * Must align with UISupportedInterfaceOrientations in ios/FireApp/Info.plist (landscape-only).
 * Omitting supportedOrientations makes RN default to portrait on phone → iOS asserts / crashes
 * when the modal or keyboard updates (e.g. dismissing numeric keypad).
 */
export const MODAL_LANDSCAPE_ORIENTATIONS = ['landscape-left', 'landscape-right'] as const;

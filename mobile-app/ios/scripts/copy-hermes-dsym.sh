#!/bin/bash
# Prebuilt Hermes (RN CocoaPods) does not ship hermes.framework.dSYM; App Store Connect
# then warns "Upload Symbols Failed". dsymutil on the device slice produces a dSYM with
# the same UUID as the embedded framework so symbol upload succeeds.
set -eo pipefail

if [[ "${PLATFORM_NAME:-}" != "iphoneos" ]]; then
  echo "[Hermes dSYM] Skip (not device build: PLATFORM_NAME=${PLATFORM_NAME:-unset})"
  exit 0
fi

H_BIN="${PODS_ROOT}/hermes-engine/destroot/Library/Frameworks/universal/hermes.xcframework/ios-arm64/hermes.framework/hermes"
DEST="${DWARF_DSYM_FOLDER_PATH:-}"

if [[ ! -f "$H_BIN" ]]; then
  echo "warning: [Hermes dSYM] Hermes binary not found: $H_BIN"
  exit 0
fi

if [[ -z "$DEST" ]]; then
  echo "warning: [Hermes dSYM] DWARF_DSYM_FOLDER_PATH unset, skipping"
  exit 0
fi

OUT="${DEST}/hermes.framework.dSYM"
echo "[Hermes dSYM] Generating ${OUT}"
rm -rf "${OUT}"
mkdir -p "${DEST}"
# Warnings about missing .o paths (Meta's build machine) are expected; UUID still matches.
dsymutil "${H_BIN}" -o "${OUT}"
echo "[Hermes dSYM] $(dwarfdump --uuid "${OUT}" 2>/dev/null | head -1 || true)"

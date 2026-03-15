const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Find expo-asset in the pnpm store (root node_modules or local)
function findExpoAsset() {
  const searchPaths = [
    path.resolve(__dirname, "../node_modules/expo-asset/build/AssetSources.js"),
    path.resolve(__dirname, "../../node_modules/expo-asset/build/AssetSources.js"),
    path.resolve(__dirname, "../../../node_modules/expo-asset/build/AssetSources.js"),
  ];

  for (const p of searchPaths) {
    if (fs.existsSync(p)) return p;
  }

  // Search pnpm store
  try {
    const pnpmStore = path.resolve(__dirname, "../../../node_modules/.pnpm");
    if (fs.existsSync(pnpmStore)) {
      const dirs = fs.readdirSync(pnpmStore).filter((d) => d.startsWith("expo-asset@"));
      for (const dir of dirs) {
        const candidate = path.join(pnpmStore, dir, "node_modules/expo-asset/build/AssetSources.js");
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  } catch {}

  return null;
}

function applyExpoAssetPatch() {
  const filePath = findExpoAsset();
  if (!filePath) {
    console.log("[patches] expo-asset not found, skipping patch");
    return;
  }

  const content = fs.readFileSync(filePath, "utf-8");

  // Check if already patched
  if (content.includes("manifestBaseUrl?.startsWith('https://')")) {
    console.log("[patches] expo-asset already patched, skipping");
    return;
  }

  const oldStr = `    const devServerUrl = manifest2?.extra?.expoGo?.developer\n        ? 'http://' + manifest2.extra.expoGo.debuggerHost`;
  const newStr = `    // Use HTTPS scheme for Replit/secure dev servers (patch)\n    const scheme = manifestBaseUrl?.startsWith('https://') ? 'https://' : 'http://';\n    const devServerUrl = manifest2?.extra?.expoGo?.developer\n        ? scheme + manifest2.extra.expoGo.debuggerHost`;

  if (content.includes(oldStr)) {
    fs.writeFileSync(filePath, content.replace(oldStr, newStr));
    console.log("[patches] expo-asset HTTPS patch applied to:", filePath);
  } else {
    console.log("[patches] expo-asset pattern not found, may already be patched differently");
  }
}

applyExpoAssetPatch();

import { execSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getConfig } from "@expo/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "..");
const UPDATE_SERVER_ROOT = path.resolve(APP_ROOT, "../update-server");
const EXPORT_DIR = path.join(APP_ROOT, "dist-ota");
const PRIVATE_KEY_PATH = path.join(APP_ROOT, "keys", "private-key.pem");

const CDN_BASE_URL =
  process.env.UPDATE_CDN_BASE_URL || "https://update-server.netlify.app";

const args = process.argv.slice(2);
let minFirmwareVersion = null;
const descParts = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--min-fw" && args[i + 1]) {
    minFirmwareVersion = args[++i];
  } else {
    descParts.push(args[i]);
  }
}
const releaseDescription = descParts.join(" ") || "Bug fixes and improvements.";

if (!fs.existsSync(PRIVATE_KEY_PATH)) {
  throw new Error(
    `Missing private key at ${PRIVATE_KEY_PATH}. Run 'npx expo-updates codesigning:generate' first.`
  );
}
const privateKeyPem = fs.readFileSync(PRIVATE_KEY_PATH, "utf-8");

const { exp: fullExp } = getConfig(APP_ROOT, {
  skipSDKVersionRequirement: true,
});
const { exp } = getConfig(APP_ROOT, {
  skipSDKVersionRequirement: true,
  isPublicConfig: true,
});

const runtimeVersion =
  typeof exp.runtimeVersion === "string" ? exp.runtimeVersion : exp.version;

if (!runtimeVersion) {
  throw new Error("runtimeVersion must be a string in app.config.ts");
}

console.log(
  `Exporting OpenWink OTA update (app v${exp.version}, runtime ${runtimeVersion})...`
);

fs.rmSync(EXPORT_DIR, { recursive: true, force: true });
execSync("npx expo export --output-dir dist-ota", {
  cwd: APP_ROOT,
  stdio: "inherit",
});

const metadataPath = path.join(EXPORT_DIR, "metadata.json");
const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));

function sha256Base64Url(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("base64url");
}

function md5Hex(buffer) {
  return crypto.createHash("md5").update(buffer).digest("hex");
}

function uuidFromHash(buffer) {
  const hex = crypto.createHash("sha256").update(buffer).digest("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    "5" + hex.slice(13, 16),
    ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0") +
    hex.slice(18, 20),
    hex.slice(20, 32),
  ].join("-");
}

const keyId = fullExp.updates?.codeSigningMetadata?.keyid ?? "openwink";

function signManifestSFV(manifestJsonString, privateKey) {
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(manifestJsonString, "utf-8");
  signer.end();
  const base64Sig = signer.sign(privateKey, "base64");
  return `sig="${base64Sig}", keyid="${keyId}"`;
}

const MIME_MAP = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  ttf: "font/ttf",
  otf: "font/otf",
  woff: "font/woff",
  woff2: "font/woff2",
  json: "application/json",
};

function getMimeType(ext) {
  const clean = ext.replace(/^\./, "").toLowerCase();
  return MIME_MAP[clean] || "application/octet-stream";
}

const createdAt = new Date().toISOString();
const serverManifestDir = path.join(
  UPDATE_SERVER_ROOT,
  "files",
  "app-updates",
  runtimeVersion
);
const serverStaticDir = path.join(
  UPDATE_SERVER_ROOT,
  "dist",
  "app-updates",
  runtimeVersion
);

fs.mkdirSync(serverManifestDir, { recursive: true });
fs.rmSync(serverStaticDir, { recursive: true, force: true });
fs.mkdirSync(serverStaticDir, { recursive: true });

for (const platform of ["ios", "android"]) {
  const platformMeta = metadata.fileMetadata[platform];
  if (!platformMeta) continue;

  const bundleRelPath = platformMeta.bundle.replace(/\\/g, "/");
  const bundleAbsPath = path.join(EXPORT_DIR, bundleRelPath);
  const bundleBuffer = fs.readFileSync(bundleAbsPath);
  const bundleExt = path.extname(bundleRelPath) || ".hbc";

  const launchAsset = {
    hash: sha256Base64Url(bundleBuffer),
    key: md5Hex(bundleBuffer),
    fileExtension: bundleExt,
    contentType: "application/javascript",
    url: `${CDN_BASE_URL}/app-updates/${runtimeVersion}/${bundleRelPath}`,
  };

  const assets = platformMeta.assets.map((asset) => {
    const assetRelPath = asset.path.replace(/\\/g, "/");
    const assetAbsPath = path.join(EXPORT_DIR, assetRelPath);
    const assetBuffer = fs.readFileSync(assetAbsPath);
    const ext = asset.ext.startsWith(".") ? asset.ext : `.${asset.ext}`;

    return {
      hash: sha256Base64Url(assetBuffer),
      key: md5Hex(assetBuffer),
      fileExtension: ext,
      contentType: getMimeType(ext),
      url: `${CDN_BASE_URL}/app-updates/${runtimeVersion}/${assetRelPath}`,
    };
  });

  const manifest = {
    id: uuidFromHash(bundleBuffer),
    createdAt,
    runtimeVersion,
    launchAsset,
    assets,
    metadata: {
      appVersion: exp.version ?? "2.0.0",
      ...(minFirmwareVersion ? { minFirmwareVersion } : {}),
    },
    extra: {
      expoClient: exp,
    },
  };

  const manifestString = JSON.stringify(manifest);
  const signatureHeader = signManifestSFV(manifestString, privateKeyPem);

  fs.writeFileSync(
    path.join(serverManifestDir, `manifest-${platform}.json`),
    manifestString,
    "utf-8"
  );
  fs.writeFileSync(
    path.join(serverManifestDir, `manifest-${platform}.sig`),
    signatureHeader,
    "utf-8"
  );
  console.log(`Generated & signed manifest-${platform}.json (id: ${manifest.id})`);
}

const infoPayload = {
  version: exp.version,
  runtimeVersion,
  minFirmwareVersion,
  description: releaseDescription,
  iosStoreUrl:
    process.env.IOS_STORE_URL ||
    "https://github.com/seasaltsaige/openwink/releases/",
  androidStoreUrl:
    process.env.ANDROID_STORE_URL ||
    "https://github.com/seasaltsaige/openwink/releases/",
  createdAt,
};

fs.writeFileSync(
  path.join(serverManifestDir, "info.json"),
  JSON.stringify(infoPayload, null, 2)
);

const latestInfoPath = path.join(
  UPDATE_SERVER_ROOT,
  "files",
  "app-updates",
  "latest.json"
);
fs.writeFileSync(latestInfoPath, JSON.stringify(infoPayload, null, 2));

for (const folder of ["_expo", "assets"]) {
  const src = path.join(EXPORT_DIR, folder);
  if (fs.existsSync(src)) {
    fs.cpSync(src, path.join(serverStaticDir, folder), { recursive: true });
  }
}

fs.rmSync(EXPORT_DIR, { recursive: true, force: true });
console.log(`Done! Signed manifests and static bundles written to update-server.`);
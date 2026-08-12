/**
 * Diagnóstico local do Google Maps no Android (sem imprimir secrets/SHA-1).
 *
 * Causa mais comum de mapa em branco no `npx expo run:android`:
 * 1) Maps SDK for Android não habilitado no Google Cloud
 * 2) Restrição da API key sem package `com.rastro.app` + SHA-1 do keystore de debug
 *    (este projeto assina com `android/app/debug.keystore`)
 * 3) Billing desabilitado no projeto GCP
 * 4) Rebuild sem `.env` → meta-data com apiKey vazia
 *
 * Para obter o SHA-1 (rode localmente, não versionar o output):
 *   keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function mask(key) {
  if (!key) return "(vazia)";
  if (key.length < 12) return "(inválida)";
  return `${key.slice(0, 6)}…${key.slice(-4)} (${key.length} chars)`;
}

function readEnvKey() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return "";
  const text = fs.readFileSync(envPath, "utf8");
  const line = text.split(/\r?\n/).find((l) => l.startsWith("EXPO_PUBLIC_GOOGLE_MAPS_API_KEY="));
  if (!line) return "";
  return line.slice("EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
}

function readManifestKey() {
  const manifest = path.join(root, "android/app/src/main/AndroidManifest.xml");
  if (!fs.existsSync(manifest)) return { present: false, value: "" };
  const text = fs.readFileSync(manifest, "utf8");
  const m = text.match(/com\.google\.android\.geo\.API_KEY"[^>]*android:value="([^"]*)"/);
  return { present: Boolean(m), value: m?.[1] ?? "" };
}

const envKey = readEnvKey();
const manifest = readManifestKey();
const debugKs = path.join(root, "android/app/debug.keystore");

console.log("Rastro — check Google Maps (Android)");
console.log(`- .env key: ${mask(envKey)}`);
console.log(`- AndroidManifest meta-data: ${manifest.present ? mask(manifest.value) : "(ausente)"}`);
console.log(`- debug.keystore: ${fs.existsSync(debugKs) ? "ok (android/app/debug.keystore)" : "ausente"}`);
console.log(`- package esperado: com.rastro.app`);
console.log("");
console.log("Checklist GCP:");
console.log("1. Habilitar Maps SDK for Android (Geocoding sozinho não renderiza tiles).");
console.log("2. Restringir a key a Android apps: package com.rastro.app + SHA-1 do debug.keystore.");
console.log("3. Billing ativo no projeto.");
console.log("4. Em builds EAS (APK), adicione também o SHA-1 do keystore preview/production:");
console.log("     npx eas-cli credentials -p android");
console.log("   → Keystore → SHA-1 Fingerprint + package com.rastro.app");
console.log("5. Após mudar a key no .env: npx expo prebuild --clean && npx expo run:android");
console.log("6. No EAS, EXPO_PUBLIC_GOOGLE_MAPS_API_KEY deve existir no environment preview.");
console.log("");
console.log("SHA-1 debug local:");
console.log(
  '  keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android',
);

if (!envKey) {
  console.error("\nFalha: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ausente no .env");
  process.exitCode = 1;
}
if (manifest.present && !manifest.value) {
  console.error("Falha: API_KEY vazia no AndroidManifest — rebuild com .env carregado.");
  process.exitCode = 1;
}

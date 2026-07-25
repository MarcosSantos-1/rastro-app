/**
 * Lê assets/features-BL.json e gera assets/sectors.compact.json
 * Regra: um registro por `setor` único; centroid = média dos centroids dos segmentos;
 * ordem = primeira aparição no array original, depois ordenação estável por código setor.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const inputPath = path.join(root, "assets", "features-BL.json");
const outPath = path.join(root, "assets", "sectors.compact.json");
const outMobile = path.join(root, "mobile", "assets", "data", "sectors.compact.json");
const outWeb = path.join(root, "web", "public", "sectors.compact.json");

const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const features = raw.features || [];

/** @type {Map<string, { latSum: number, lngSum: number, n: number, logradouros: Set<string>, subs: Set<string> }>} */
const bySetor = new Map();
/** Orem de primeira aparição */
const firstIndex = new Map();

for (let i = 0; i < features.length; i++) {
  const f = features[i];
  const setor = f.setor;
  if (!setor || typeof setor !== "string") continue;
  if (!firstIndex.has(setor)) firstIndex.set(setor, i);

  const c = f.centroid;
  if (!Array.isArray(c) || c.length < 2) continue;
  const lat = Number(c[0]);
  const lng = Number(c[1]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

  if (!bySetor.has(setor)) {
    bySetor.set(setor, {
      latSum: 0,
      lngSum: 0,
      n: 0,
      logradouros: new Set(),
      subs: new Set(),
    });
  }
  const agg = bySetor.get(setor);
  agg.latSum += lat;
  agg.lngSum += lng;
  agg.n += 1;
  if (f.logradouro) agg.logradouros.add(String(f.logradouro));
  if (f.subprefeitura) agg.subs.add(String(f.subprefeitura));
}

const subRegional = (code) => {
  if (!code || code.length < 2) return "??";
  return code.slice(0, 2).toUpperCase();
};

const sectors = [...bySetor.entries()].map(([setor, agg]) => {
  const lat = agg.latSum / Math.max(1, agg.n);
  const lng = agg.lngSum / Math.max(1, agg.n);
  const logradouro = [...agg.logradouros][0] || "";
  const subprefeitura = [...agg.subs][0] || "";
  return {
    setor,
    subRegional: subRegional(setor),
    centroidLat: Math.round(lat * 1e6) / 1e6,
    centroidLng: Math.round(lng * 1e6) / 1e6,
    logradouro,
    subprefeitura,
    _first: firstIndex.get(setor) ?? 999999,
  };
});

// Ordenação: primeiro pela ordem de aparição no JSON; empate por string setor
sectors.sort((a, b) => {
  if (a._first !== b._first) return a._first - b._first;
  return a.setor.localeCompare(b.setor, "en");
});

const clean = sectors.map((s, orderIndex) => {
  const { _first, ...rest } = s;
  return {
    ...rest,
    orderIndex,
  };
});

const payload = {
  generatedAt: new Date().toISOString(),
  source: "assets/features-BL.json",
  sectors: clean,
};

const json = JSON.stringify(payload);
fs.mkdirSync(path.dirname(outMobile), { recursive: true });
fs.mkdirSync(path.dirname(outWeb), { recursive: true });
fs.writeFileSync(outPath, json, "utf8");
fs.writeFileSync(outMobile, json, "utf8");
fs.writeFileSync(outWeb, json, "utf8");
console.log(`Wrote ${clean.length} setores -> ${outPath}`);
console.log(`Copied -> ${outMobile}`);
console.log(`Copied -> ${outWeb}`);

/** Polilinhas por setor (coords de cada segmento do features-BL) — usado no mapa Leaflet mobile */
const linesBySetor = {};
for (const f of features) {
  const setor = f.setor;
  if (!setor || typeof setor !== "string") continue;
  const coords = f.coords;
  if (!Array.isArray(coords) || coords.length < 2) continue;
  const line = [];
  for (const pt of coords) {
    if (!Array.isArray(pt) || pt.length < 2) continue;
    const lat = Number(pt[0]);
    const lng = Number(pt[1]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
    line.push([lat, lng]);
  }
  if (line.length < 2) continue;
  if (!linesBySetor[setor]) linesBySetor[setor] = [];
  linesBySetor[setor].push(line);
}

const linesPayload = {
  generatedAt: new Date().toISOString(),
  source: "assets/features-BL.json",
  linesBySetor,
};
const linesJson = JSON.stringify(linesPayload);
const outLinesMobile = path.join(root, "mobile", "assets", "data", "setor-lines.json");
fs.writeFileSync(outLinesMobile, linesJson, "utf8");
const outLinesWeb = path.join(root, "web", "public", "setor-lines.json");
fs.writeFileSync(outLinesWeb, linesJson, "utf8");
console.log(`Wrote setor-lines -> ${outLinesMobile}`);
console.log(`Copied -> ${outLinesWeb}`);

/**
 * Converte geoportal_ecoponto.geojson (SIRGAS 2000 / UTM 23S — EPSG:31983)
 * para WGS84 enxuto usado pelo app mobile.
 *
 * Uso: node scripts/convert-ecopontos.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import proj4 from "proj4";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const src = path.join(root, "assets/geoportal_ecoponto.geojson");
const out = path.join(__dirname, "../assets/data/ecopontos-sp.json");

proj4.defs(
  "EPSG:31983",
  "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
);

const raw = JSON.parse(fs.readFileSync(src, "utf8"));
const features = raw.features ?? [];

const points = [];
for (const f of features) {
  const coords = f?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) continue;
  const [x, y] = coords;
  const [lng, lat] = proj4("EPSG:31983", "WGS84", [x, y]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
  const p = f.properties ?? {};
  points.push({
    id: String(p.cd_identificador_ecoponto ?? points.length + 1),
    nome: String(p.nm_ecoponto ?? "Ecoponto"),
    endereco: String(p.nm_endereco ?? ""),
    distrito: String(p.nm_distrito ?? ""),
    lat: Math.round(lat * 1e6) / 1e6,
    lng: Math.round(lng * 1e6) / 1e6,
  });
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(points));
console.log(`Wrote ${points.length} ecopontos → ${out}`);
if (points[0]) console.log("sample", points[0]);

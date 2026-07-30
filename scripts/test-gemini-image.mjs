/**
 * Validação Gemini “por fora” (sem Cloud Function ainda).
 *
 * Uso:
 *   set GEMINI_API_KEY=sua_chave
 *   npm run test:gemini -- caminho/foto.jpg
 *   npm run test:gemini -- https://...firebasestorage.../foto.jpg
 *   npm run test:gemini -- ./assets/FotosTest
 *   npm run test:gemini:batch
 *
 * Prompt alinhado a docs/GeminiAPI.md
 */
import { GoogleGenAI } from "@google/genai";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESC_MAX = 120;
const BATCH_PAUSE_MS = 600;
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

const SYSTEM = `Você é um backend de validação de segurança e triagem para um aplicativo de zeladoria urbana e descarte de resíduos.
Sua única tarefa é analisar a imagem fornecida e gerar uma resposta estritamente no formato JSON, sem qualquer formatação de Markdown (não use \`\`\`json), textos introdutórios ou explicações.

O JSON deve seguir exatamente esta estrutura de chaves:
{
  "contem_lixo": true/false,
  "contem_pessoas": true/false,
  "confianca": 0-100,
  "reciclavel": true/false,
  "description": "frase curta"
}

Regras de análise:
1. "contem_lixo": Defina como true apenas se a imagem contiver evidências claras de descarte irregular de entulho, lixo na calçada/via pública, sacos de lixo acumulados ou contêineres/lixeiras públicas cheias/transbordando. Caso contrário (fotos de paisagens limpas, ambientes internos, memes, partes do corpo isoladas), defina como false.
2. "contem_pessoas": Defina como true se houver qualquer pessoa visível na foto, especialmente rostos (mesmo que ao fundo ou borrados), para que o sistema possa aplicar uma camada de privacidade posteriormente. Se não houver humanos na imagem, defina como false.
3. "confianca": Nível de confiança de 0 a 100 de que há lixo de zeladoria na foto. Próximo de 0 = certeza de que não contém lixo. Entre 50 e 80 = duvidoso (conteúdo ambíguo, obsceno ou fora de escopo) e deve passar por análise humana. ≥90 = alta certeza de lixo na imagem. Próximo de 100 = certeza absoluta.
4. "reciclavel": true somente se contem_lixo for true E o material parecer predominantemente reciclável (papel, plástico, metal, vidro, papelão relativamente limpos). Entulho, madeira misturada, orgânico, sacos pretos misturados ou resíduos indeterminados → false. Se contem_lixo for false → false.
5. "description": Uma frase curta (máximo ~120 caracteres) descrevendo o que há na foto no contexto de lixo/sustentabilidade. Foque em materiais e situação (ex.: "Madeiras, entulhos e resíduos em escadaria"). NÃO descreva carros, pessoas, imóveis, marcas ou detalhes irrelevantes. Se não houver lixo, use algo como "Sem evidência de descarte irregular".

Exemplo de saída esperada:
{"contem_lixo": true, "contem_pessoas": false, "confianca": 95, "reciclavel": false, "description": "Madeiras, entulhos e resíduos em escadaria"}`;

const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

function mimeFromPathOrUrl(p) {
  const lower = p.toLowerCase().split("?")[0];
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

function normalizeInputPath(input) {
  const trimmed = String(input).trim().replace(/^['"]|['"]$/g, "");
  // npm no Windows às vezes passa ".\C:\..." — trata como absoluto
  return trimmed.replace(/^\.[\\/]+(?=[A-Za-z]:[\\/])/, "");
}

async function loadImage(input) {
  const normalized = normalizeInputPath(input);

  if (/^https?:\/\//i.test(normalized)) {
    const res = await fetch(normalized);
    if (!res.ok) throw new Error(`Falha ao baixar imagem: HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get("content-type") || mimeFromPathOrUrl(normalized);
    return { data: buf.toString("base64"), mimeType: ct.split(";")[0].trim(), label: normalized };
  }

  const abs = path.isAbsolute(normalized) ? normalized : path.resolve(normalized);
  if (!fs.existsSync(abs)) throw new Error(`Arquivo não encontrado: ${abs}`);
  const buf = fs.readFileSync(abs);
  return { data: buf.toString("base64"), mimeType: mimeFromPathOrUrl(abs), label: abs };
}

function parseJsonLoose(text) {
  const raw = String(text || "").trim();
  try {
    return JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error(`Resposta não é JSON:\n${raw}`);
    return JSON.parse(m[0]);
  }
}

function normalizeResult(raw) {
  const contemLixo = Boolean(raw?.contem_lixo);
  const confiancaNum = Number(raw?.confianca);
  const confianca = Number.isFinite(confiancaNum)
    ? Math.max(0, Math.min(100, Math.round(confiancaNum)))
    : 0;
  let reciclavel = Boolean(raw?.reciclavel);
  if (!contemLixo) reciclavel = false;

  let description = String(raw?.description ?? "").trim().replace(/\s+/g, " ");
  if (!description) {
    description = contemLixo ? "Resíduo urbano sem detalhe" : "Sem evidência de descarte irregular";
  }
  if (description.length > DESC_MAX) {
    description = `${description.slice(0, DESC_MAX - 1).trimEnd()}…`;
  }

  return {
    contem_lixo: contemLixo,
    contem_pessoas: Boolean(raw?.contem_pessoas),
    confianca,
    reciclavel,
    description,
  };
}

function mapToFirestoreFields(result) {
  return {
    iaValida: result.contem_lixo,
    iaScore: result.confianca,
    iaContemPessoas: result.contem_pessoas,
    iaReciclavel: result.reciclavel,
    iaDescricao: result.description,
    iaRaw: result,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isImageFile(filePath) {
  return IMAGE_EXT.has(path.extname(filePath).toLowerCase());
}

function listImagesInDir(dirPath) {
  const abs = path.isAbsolute(dirPath) ? dirPath : path.resolve(dirPath);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    throw new Error(`Pasta não encontrada: ${abs}`);
  }
  return fs
    .readdirSync(abs)
    .filter((name) => isImageFile(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((name) => path.join(abs, name));
}

function resolveTargets(input) {
  const normalized = normalizeInputPath(input);
  if (/^https?:\/\//i.test(normalized)) {
    return { mode: "single", targets: [normalized] };
  }
  const abs = path.isAbsolute(normalized) ? normalized : path.resolve(normalized);
  if (!fs.existsSync(abs)) throw new Error(`Caminho não encontrado: ${abs}`);
  if (fs.statSync(abs).isDirectory()) {
    const targets = listImagesInDir(abs);
    if (targets.length === 0) throw new Error(`Nenhuma imagem em: ${abs}`);
    return { mode: "batch", targets };
  }
  return { mode: "single", targets: [abs] };
}

async function analyzeOne(ai, input) {
  const { data, mimeType, label } = await loadImage(input);
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      { inlineData: { mimeType, data } },
      {
        text: "Analise esta imagem e responda apenas com o JSON pedido nas instruções do sistema.",
      },
    ],
    config: {
      systemInstruction: SYSTEM,
      temperature: 0.1,
      maxOutputTokens: 384,
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "";
  const parsed = normalizeResult(parseJsonLoose(text));
  const mapped = mapToFirestoreFields(parsed);
  return { label, mimeType, parsed, mapped };
}

function printSingleResult({ label, mimeType, parsed, mapped }) {
  console.log(`Imagem: ${label}`);
  console.log(`MIME: ${mimeType} | modelo: ${MODEL}`);
  console.log("\n--- Gemini (normalizado) ---");
  console.log(JSON.stringify(parsed, null, 2));
  console.log("\n--- Campos sugeridos no Firestore (denuncias) ---");
  console.log(JSON.stringify(mapped, null, 2));
  console.log(
    `\nVerdict: ${mapped.iaValida ? "ACEITAR (parece lixo/zeladoria)" : "REJEITAR (fora do escopo)"} | confianca=${mapped.iaScore} | reciclavel=${mapped.iaReciclavel}`,
  );
}

function pad(str, len) {
  const s = String(str ?? "");
  return s.length >= len ? s.slice(0, len) : s + " ".repeat(len - s.length);
}

function printBatchSummary(rows) {
  console.log("\n=== Resumo batch ===");
  console.log(
    `${pad("arquivo", 14)} ${pad("lixo", 6)} ${pad("pessoas", 8)} ${pad("conf", 5)} ${pad("recic", 6)} description`,
  );
  console.log("-".repeat(90));
  for (const row of rows) {
    if (row.error) {
      console.log(`${pad(row.file, 14)} ERRO: ${row.error}`);
      continue;
    }
    const p = row.parsed;
    console.log(
      `${pad(row.file, 14)} ${pad(p.contem_lixo, 6)} ${pad(p.contem_pessoas, 8)} ${pad(p.confianca, 5)} ${pad(p.reciclavel, 6)} ${p.description}`,
    );
  }
  const ok = rows.filter((r) => !r.error).length;
  const fail = rows.length - ok;
  console.log(`\nTotal: ${rows.length} | ok: ${ok} | erro: ${fail}`);
}

function writeJsonl(rows) {
  const outDir = path.join(__dirname, "out");
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z$/, "")
    .replace("T", "-");
  const outPath = path.join(outDir, `gemini-batch-${stamp}.jsonl`);
  const lines = rows.map((row) => JSON.stringify(row));
  fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
  return outPath;
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error(`Uso:
  GEMINI_API_KEY=... npm run test:gemini -- ./foto.jpg
  GEMINI_API_KEY=... npm run test:gemini -- ./assets/FotosTest
  GEMINI_API_KEY=... npm run test:gemini -- "https://firebasestorage.googleapis.com/..."
  GEMINI_API_KEY=... npm run test:gemini:batch`);
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Defina GEMINI_API_KEY (Google AI Studio).");
    process.exit(1);
  }

  const { mode, targets } = resolveTargets(input);
  const ai = new GoogleGenAI({ apiKey });

  if (mode === "single") {
    const result = await analyzeOne(ai, targets[0]);
    printSingleResult(result);
    return;
  }

  console.log(`Batch: ${targets.length} imagem(ns) | modelo: ${MODEL} | pause: ${BATCH_PAUSE_MS}ms`);
  const rows = [];

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const file = path.basename(target);
    console.log(`\n[${i + 1}/${targets.length}] ${file}`);
    try {
      const result = await analyzeOne(ai, target);
      printSingleResult(result);
      rows.push({
        file,
        path: result.label,
        mimeType: result.mimeType,
        parsed: result.parsed,
        mapped: result.mapped,
        error: null,
      });
    } catch (err) {
      const message = err?.message || String(err);
      console.error(`Falha em ${file}: ${message}`);
      rows.push({
        file,
        path: target,
        mimeType: null,
        parsed: null,
        mapped: null,
        error: message,
      });
    }
    if (i < targets.length - 1) await sleep(BATCH_PAUSE_MS);
  }

  printBatchSummary(rows);
  const outPath = writeJsonl(rows);
  console.log(`\nJSONL salvo em: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

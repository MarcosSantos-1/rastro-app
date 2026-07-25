/**
 * Validação Gemini “por fora” (sem Cloud Function ainda).
 *
 * Uso:
 *   set GEMINI_API_KEY=sua_chave
 *   npm run test:gemini -- caminho/foto.jpg
 *   npm run test:gemini -- https://...firebasestorage.../foto.jpg
 *
 * Prompt alinhado a docs/GeminiAPI.md
 */
import { GoogleGenAI } from "@google/genai";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SYSTEM = `Você é um backend de validação de segurança e triagem para um aplicativo de zeladoria urbana e descarte de resíduos.
Sua única tarefa é analisar a imagem fornecida e gerar uma resposta estritamente no formato JSON, sem qualquer formatação de Markdown (não use \`\`\`json), textos introdutórios ou explicações.

O JSON deve seguir exatamente esta estrutura de chaves:
{
  "contem_lixo": true/false,
  "contem_pessoas": true/false,
  "confianca": 100
}

Regras de análise:
1. "contem_lixo": Defina como true apenas se a imagem contiver evidências claras de descarte irregular de entulho, lixo na calçada, bueiros entupidos por sujeira, sacos de lixo acumulados ou contêineres/lixeiras públicas completamente cheias/transbordando. Caso contrário (fotos de paisagens limpas, ambientes internos, memes, partes do corpo isoladas), defina como false.
2. "contem_pessoas": Defina como true se houver qualquer pessoa visível na foto, especialmente rostos (mesmo que ao fundo ou borrados), para que o sistema possa aplicar uma camada de privacidade posteriormente. Se não houver humanos na imagem, defina como false.
3. "confianca": Nível de confiança a respeito do que contém na imagem é lixo ou não. Próximo de 0, certeza que não contém lixo na foto. Entre 50 e 80, pode conter lixo mas contém coisas como dedo do meio, coisas obscenas etc, teria que passar por uma análise humana. Quanto mais próximo de 100, certeza absoluta de lixo na imagem.

Exemplo de saída esperada:
{"contem_lixo": true, "contem_pessoas": false, "confianca": 95}`;

const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

function mimeFromPathOrUrl(p) {
  const lower = p.toLowerCase().split("?")[0];
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

async function loadImage(input) {
  const trimmed = String(input).trim().replace(/^['"]|['"]$/g, "");
  // npm no Windows às vezes passa ".\C:\..." — trata como absoluto
  const normalized = trimmed.replace(/^\.[\\/]+(?=[A-Za-z]:[\\/])/, "");

  if (/^https?:\/\//i.test(normalized)) {
    const res = await fetch(normalized);
    if (!res.ok) throw new Error(`Falha ao baixar imagem: HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get("content-type") || mimeFromPathOrUrl(normalized);
    return { data: buf.toString("base64"), mimeType: ct.split(";")[0].trim() };
  }

  const abs = path.isAbsolute(normalized) ? normalized : path.resolve(normalized);
  if (!fs.existsSync(abs)) throw new Error(`Arquivo não encontrado: ${abs}`);
  const buf = fs.readFileSync(abs);
  return { data: buf.toString("base64"), mimeType: mimeFromPathOrUrl(abs) };
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

function mapToFirestoreFields(result) {
  const contemLixo = Boolean(result.contem_lixo);
  const confianca = Number(result.confianca);
  const score = Number.isFinite(confianca) ? Math.max(0, Math.min(100, confianca)) : null;
  return {
    iaValida: contemLixo,
    iaScore: score,
    iaContemPessoas: Boolean(result.contem_pessoas),
    // Campos crus do modelo (úteis no painel / debug)
    iaRaw: result,
  };
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error(`Uso:
  GEMINI_API_KEY=... npm run test:gemini -- ./foto.jpg
  GEMINI_API_KEY=... npm run test:gemini -- "https://firebasestorage.googleapis.com/..."`);
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Defina GEMINI_API_KEY (Google AI Studio).");
    process.exit(1);
  }

  const { data, mimeType } = await loadImage(input);
  console.log(`Imagem: ${input}`);
  console.log(`MIME: ${mimeType} | modelo: ${MODEL}`);

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        inlineData: { mimeType, data },
      },
      {
        text: "Analise esta imagem e responda apenas com o JSON pedido nas instruções do sistema.",
      },
    ],
    config: {
      systemInstruction: SYSTEM,
      temperature: 0.1,
      maxOutputTokens: 256,
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "";
  const parsed = parseJsonLoose(text);
  const mapped = mapToFirestoreFields(parsed);

  console.log("\n--- Gemini (cru) ---");
  console.log(JSON.stringify(parsed, null, 2));
  console.log("\n--- Campos sugeridos no Firestore (denuncias) ---");
  console.log(JSON.stringify(mapped, null, 2));
  console.log(
    `\nVerdict: ${mapped.iaValida ? "ACEITAR (parece lixo/zeladoria)" : "REJEITAR (fora do escopo)"} | confianca=${mapped.iaScore}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

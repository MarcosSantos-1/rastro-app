/** Prompt/schema alinhados a docs/GeminiAPI.md */

const DESC_MAX = 120;

export const SYSTEM_INSTRUCTION = `Você é um backend de validação de segurança e triagem para um aplicativo de zeladoria urbana e descarte de resíduos.
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

export type GeminiTriage = {
  contem_lixo: boolean;
  contem_pessoas: boolean;
  confianca: number;
  reciclavel: boolean;
  description: string;
};

export type FirestoreIaFields = {
  iaValida: boolean;
  iaScore: number;
  iaContemPessoas: boolean;
  iaReciclavel: boolean;
  iaDescricao: string;
  iaRaw: GeminiTriage;
};

function parseJsonLoose(text: string): unknown {
  const raw = String(text || "").trim();
  try {
    return JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error(`Resposta Gemini não é JSON: ${raw.slice(0, 200)}`);
    return JSON.parse(m[0]);
  }
}

export function normalizeResult(raw: unknown): GeminiTriage {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const contemLixo = Boolean(obj.contem_lixo);
  const confiancaNum = Number(obj.confianca);
  const confianca = Number.isFinite(confiancaNum)
    ? Math.max(0, Math.min(100, Math.round(confiancaNum)))
    : 0;
  let reciclavel = Boolean(obj.reciclavel);
  if (!contemLixo) reciclavel = false;

  let description = String(obj.description ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!description) {
    description = contemLixo
      ? "Resíduo urbano sem detalhe"
      : "Sem evidência de descarte irregular";
  }
  if (description.length > DESC_MAX) {
    description = `${description.slice(0, DESC_MAX - 1).trimEnd()}…`;
  }

  return {
    contem_lixo: contemLixo,
    contem_pessoas: Boolean(obj.contem_pessoas),
    confianca,
    reciclavel,
    description,
  };
}

export function mapToFirestoreFields(result: GeminiTriage): FirestoreIaFields {
  return {
    iaValida: result.contem_lixo,
    iaScore: result.confianca,
    iaContemPessoas: result.contem_pessoas,
    iaReciclavel: result.reciclavel,
    iaDescricao: result.description,
    iaRaw: result,
  };
}

function bytesToBase64(bytes: ArrayBuffer): string {
  const u8 = new Uint8Array(bytes);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    binary += String.fromCharCode(...u8.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Chama Gemini REST (sem SDK Node) — adequado a Workers. */
export async function analyzeImageWithGemini(opts: {
  apiKey: string;
  model: string;
  imageBytes: ArrayBuffer;
  mimeType: string;
}): Promise<FirestoreIaFields> {
  const model = encodeURIComponent(opts.model);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(opts.apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: opts.mimeType,
                data: bytesToBase64(opts.imageBytes),
              },
            },
            {
              text: "Analise esta imagem e responda apenas com o JSON pedido nas instruções do sistema.",
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 384,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini HTTP ${res.status}: ${errText.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ??
    "";
  const parsed = normalizeResult(parseJsonLoose(text));
  return mapToFirestoreFields(parsed);
}

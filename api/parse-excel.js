/**
 * Vercel serverless: Gemini AI Excel → products (free tier)
 * Set env var: GEMINI_API_KEY
 */
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not set on Vercel. Add it in Project Settings → Environment Variables.",
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const sheet = body.sheet;
    const text = body.text;
    if (!Array.isArray(sheet) || sheet.length < 1) {
      return res.status(400).json({ error: "Missing sheet data" });
    }

    const products = await extractProductsWithGemini(apiKey, sheet, text);
    return res.status(200).json({ products, source: "gemini" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "AI parse failed" });
  }
};

function cellText(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && v !== null && "toISOString" in Object(v)) {
    try {
      return new Date(v).toISOString().slice(0, 10);
    } catch {
      return String(v);
    }
  }
  return String(v).replace(/\s+/g, " ").trim();
}

function sheetToAiText(aoa) {
  return aoa
    .slice(0, 120)
    .map((row, i) => {
      const cells = (row || [])
        .map((v, c) => {
          const t = cellText(v);
          return t ? `C${c + 1}:${t}` : null;
        })
        .filter(Boolean);
      return cells.length ? `R${i + 1} ${cells.join(" | ")}` : null;
    })
    .filter(Boolean)
    .join("\n");
}

function buildPrompt(sheet, text) {
  return `You are an expert at reading ANY messy Arabic/English Excel inventory or price sheet for an Egyptian freeze-dried food business (Pro Business).

The sheet may contain:
- titles and dates
- multiple sections (imported fruits, local fruits, candy, vegetables, raw materials)
- TWO tables side-by-side
- columns like: اسم الصنف, الوحده, الكميه المباعه, الكميه المتبقيه الصالحه للبيع, الرصيد
- NO prices at all (quantity-only daily reports) — that is normal

Return ONLY a valid JSON array. Each item:
{
  "name": string,
  "category": "fruits" | "candy" | "vegetables",
  "price1kg": number | null,
  "price10kg": number | null,
  "price30kg": number | null,
  "quantity": number,
  "notes": string
}

Critical rules:
1) Extract EVERY product row from ALL sections and BOTH left/right tables.
2) For stock/quantity prefer: "الكميه المتبقيه الصالحه للبيع" or "الرصيد" (NOT "الكميه المباعه").
3) If there is no price column, set all prices to null (do not invent zeros as prices).
4) quantity must be the remaining/balance number in kg when present (0 is valid).
5) Skip totals, tasks/notes paragraphs, empty rows, and section titles.
6) Keep Arabic names exactly as written.
7) Guess category from the product name / section title.

Sheet cells:
${text || sheetToAiText(sheet)}`;
}

async function extractProductsWithGemini(apiKey, sheet, text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: buildPrompt(sheet, text) }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini error ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  const cleaned = String(content)
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  const jsonText = start >= 0 && end >= 0 ? cleaned.slice(start, end + 1) : cleaned;
  const parsed = JSON.parse(jsonText);
  if (!Array.isArray(parsed)) throw new Error("AI did not return an array");
  return parsed;
}

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
    if (!Array.isArray(sheet) || sheet.length < 1) {
      return res.status(400).json({ error: "Missing sheet data" });
    }

    const products = await extractProductsWithGemini(apiKey, sheet);
    return res.status(200).json({ products, source: "gemini" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "AI parse failed" });
  }
};

function buildPrompt(sheet) {
  const trimmed = sheet.slice(0, 100);
  return `You extract product rows from messy Arabic/English spreadsheets for a freeze-dried food wholesaler in Egypt (Pro Business).

Return ONLY a valid JSON array (no markdown). Each item:
{
  "name": string,
  "category": "fruits" | "candy" | "vegetables",
  "price1kg": number | null,
  "price10kg": number | null,
  "price30kg": number | null,
  "quantity": number,
  "notes": string
}

Rules:
- Skip titles, totals, empty rows, and non-product lines.
- Many sheets have PRODUCT + WEIGHT/QUANTITY only (no prices). That is OK.
- Put weight/stock values into "quantity" (number in kg). Look for columns like: كمية، وزن، مخزون، رصيد، كجم، weight, qty, stock.
- Prices are PER KILOGRAM in EGP when present. If there is NO price column, set price1kg/price10kg/price30kg to null (do NOT invent 0 unless the cell is really 0).
- If only one price exists, put it in price1kg.
- Guess category from the product name when missing.
- Keep Arabic product names as written.
- Never drop a row just because price is missing if name + quantity/weight exist.

Spreadsheet rows (JSON array of arrays):
${JSON.stringify(trimmed)}`;
}

async function extractProductsWithGemini(apiKey, sheet) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: buildPrompt(sheet) }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini error ${response.status}: ${text.slice(0, 300)}`);
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

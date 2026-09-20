/**
 * Vercel serverless: real AI Excel → products
 * Set env var: OPENAI_API_KEY
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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is not set on Vercel. Add it in Project Settings → Environment Variables.",
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const sheet = body.sheet;
    if (!Array.isArray(sheet) || sheet.length < 1) {
      return res.status(400).json({ error: "Missing sheet data" });
    }

    const products = await extractProductsWithOpenAI(apiKey, sheet);
    return res.status(200).json({ products, source: "openai" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "AI parse failed" });
  }
};

async function extractProductsWithOpenAI(apiKey, sheet) {
  const trimmed = sheet.slice(0, 100);
  const prompt = `You extract product rows from messy Arabic/English spreadsheets for a freeze-dried food wholesaler in Egypt (Pro Business).

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
- Prices are PER KILOGRAM in EGP (not pack totals).
- If only one price exists, put it in price1kg.
- quantity is current stock in kg; use 0 if unknown.
- Guess category from the product name when missing.
- Keep Arabic product names as written.

Spreadsheet rows (JSON array of arrays):
${JSON.stringify(trimmed)}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: "You are a precise data-extraction engine. Output JSON arrays only.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "[]";
  const jsonText = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed = JSON.parse(jsonText);
  if (!Array.isArray(parsed)) throw new Error("AI did not return an array");
  return parsed;
}

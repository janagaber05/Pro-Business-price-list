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
  return `You are an expert at reading ANY messy Arabic/English Excel for an Egyptian freeze-dried food business (Pro Business).

Sheet types you MUST distinguish:
A) Inventory reports (التقرير اليومي): اسم الصنف + الكميه المتبقيه / الرصيد — often NO prices.
B) Price lists: product + سعر / سعر الكيلو (1kg), sometimes 10kg / 30kg.
C) Customer ORDERS / invoices (طلبية / فاتورة):
   - الصنف = product name
   - الكمية = ORDER quantity in kg (usually small: 2, 5, 10…)
   - سعر الكيلو = PRICE PER KG in EGP (usually hundreds/thousands: 550, 1250, 1700…)
   - المبلغ / السعر بعد الخصم = LINE TOTAL (qty × price) — NOT unit price, NOT quantity
   - نسبة الخصم = ignore

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
1) NEVER put "سعر الكيلو" into "quantity".
2) NEVER put "المبلغ" or "السعر بعد الخصم" into price1kg or quantity.
3) Order mapping: سعر الكيلو → price1kg, الكمية → quantity. One price column = price1kg unless header says 10/30.
4) Inventory: prefer المتبقي/الرصيد for quantity; null prices if missing.
5) Extract every product row. Keep Arabic names. Skip totals/titles.
6) Category: مارشميلو/موتشي/كاندي → candy; تفاح/موز → fruits; خضار → vegetables.

Example: تفاح | qty 10 | سعر الكيلو 1700 | مبلغ 17000
→ {"name":"تفاح","category":"fruits","price1kg":1700,"price10kg":null,"price30kg":null,"quantity":10,"notes":""}

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

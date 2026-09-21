const { useState, useEffect, useMemo, useCallback } = React;

const STORAGE_KEY = "pro-business-data-v5";
const ADMIN_KEY = "pro-business-admin-v1";
const CURRENCY_KEY = "drypeak-currency-v2";

const CATEGORY_LABELS = {
  fruits: "فواكه",
  candy: "حلويات",
  vegetables: "خضروات",
};
const CATEGORY_ORDER = ["fruits", "candy", "vegetables"];

const DEFAULT_PRODUCTS = [
  { id: "f1", name: "مكس فروت", category: "fruits", price1kg: 2200, price10kg: null, price30kg: null, quantity: 0, notes: "" },
  { id: "f2", name: "موز شرائح", category: "fruits", price1kg: 1250, price10kg: null, price30kg: null, quantity: 0, notes: "" },
  { id: "f3", name: "موز حبة كاملة", category: "fruits", price1kg: 1250, price10kg: null, price30kg: null, quantity: 0, notes: "" },
  { id: "f4", name: "فراولة حبة كاملة", category: "fruits", price1kg: 1850, price10kg: null, price30kg: null, quantity: 0, notes: "" },
  { id: "f5", name: "مانجا شرائح", category: "fruits", price1kg: 1900, price10kg: null, price30kg: null, quantity: 0, notes: "" },
  { id: "f6", name: "تفاح شرائح", category: "fruits", price1kg: 1850, price10kg: null, price30kg: null, quantity: 0, notes: "" },
  { id: "f7", name: "دراجون فروت", category: "fruits", price1kg: 1900, price10kg: null, price30kg: null, quantity: 0, notes: "" },
  { id: "c1", name: "آيس كريم ساندوتش أوريو", category: "candy", price1kg: 1750, price10kg: null, price30kg: null, quantity: 0, notes: "" },
  { id: "c2", name: "آيس كريم ساندوتش ميكس", category: "candy", price1kg: 1700, price10kg: null, price30kg: null, quantity: 0, notes: "" },
  { id: "c3", name: "آيس كريم شرائح", category: "candy", price1kg: 1800, price10kg: null, price30kg: null, quantity: 0, notes: "" },
  { id: "c4", name: "كاندي ميكس", category: "candy", price1kg: 1500, price10kg: null, price30kg: null, quantity: 0, notes: "" },
  { id: "c5", name: "سكيتلز مكس", category: "candy", price1kg: 1800, price10kg: null, price30kg: null, quantity: 0, notes: "" },
  { id: "c6", name: "مارشميلو مصري", category: "candy", price1kg: 650, price10kg: null, price30kg: null, quantity: 0, notes: "" },
  { id: "c7", name: "مارشميلو إسباني", category: "candy", price1kg: 875, price10kg: null, price30kg: null, quantity: 0, notes: "" },
  { id: "c8", name: "مارشميلو مجسمات", category: "candy", price1kg: 1500, price10kg: null, price30kg: null, quantity: 0, notes: "" },
  { id: "c9", name: "موتشي مقرمش مكس فراولة وفانيليا", category: "candy", price1kg: 1050, price10kg: null, price30kg: null, quantity: 0, notes: "" },
  { id: "v1", name: "ميكس خضار", category: "vegetables", price1kg: 1100, price10kg: null, price30kg: null, quantity: 0, notes: "كيس ٣ كجم = ٩٥٠ ج.م للكيلو" },
  { id: "v2", name: "بامية", category: "vegetables", price1kg: 1500, price10kg: null, price30kg: null, quantity: 0, notes: "" },
  { id: "v3", name: "بطاطس", category: "vegetables", price1kg: 1500, price10kg: null, price30kg: null, quantity: 0, notes: "" },
  { id: "v4", name: "بطاطا", category: "vegetables", price1kg: 1500, price10kg: null, price30kg: null, quantity: 0, notes: "" },
  { id: "v5", name: "بنجر", category: "vegetables", price1kg: 1500, price10kg: null, price30kg: null, quantity: 0, notes: "" },
  { id: "v6", name: "كوسة", category: "vegetables", price1kg: 1500, price10kg: null, price30kg: null, quantity: 0, notes: "" },
  { id: "v7", name: "بصل", category: "vegetables", price1kg: 1600, price10kg: null, price30kg: null, quantity: 0, notes: "" },
];

function uid(prefix = "p") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function Modal({ onClose, children }) {
  const canCloseRef = React.useRef(false);

  useEffect(() => {
    canCloseRef.current = false;
    // Prevent the same click that opened the modal from immediately closing it
    const enableTimer = setTimeout(() => {
      canCloseRef.current = true;
    }, 150);

    const onKey = (e) => {
      if (e.key === "Escape" && canCloseRef.current) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(enableTimer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function requestClose(e) {
    if (e) e.preventDefault();
    if (!canCloseRef.current) return;
    onClose();
  }

  return (
    <div className="modal-root" role="presentation">
      <button type="button" className="modal-backdrop" aria-label="إغلاق" onClick={requestClose} />
      <div className="modal-card" role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

function getAdminPin() {
  return window.APP_CONFIG?.adminPin || "pro2026";
}

function isCloudConfigured() {
  const cfg = window.APP_CONFIG;
  if (!cfg?.enabled) return false;
  return Boolean(
    cfg.supabaseUrl &&
      cfg.supabaseAnonKey &&
      !String(cfg.supabaseUrl).includes("YOUR_PROJECT") &&
      !String(cfg.supabaseAnonKey).includes("YOUR_ANON")
  );
}

/** Direct Supabase REST (more reliable than CDN supabase-js in plain HTML apps) */
async function sbFetch(path, { method = "GET", body, prefer } = {}) {
  if (!isCloudConfigured()) throw new Error("Supabase غير مفعّل في config.js");
  if (location.protocol === "file:") {
    throw new Error(
      "افتح عبر http://localhost (npm start) — فتح الملف مباشرة (file://) يمنع الاتصال بـ Supabase."
    );
  }
  const base = String(window.APP_CONFIG.supabaseUrl).replace(/\/$/, "");
  const key = window.APP_CONFIG.supabaseAnonKey;
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (prefer) headers.Prefer = prefer;

  let res;
  try {
    res = await fetch(`${base}/rest/v1/${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    const tip =
      "تعذر الوصول لـ Supabase من المتصفح (Load failed). تأكد إن المشروع Active، والجداول اتعملت من supabase-schema.sql، وأن مفيش مانع إعلانات بيبلوك supabase.co";
    throw new Error(`${tip} — ${err?.message || err}`);
  }

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 404 || /relation|does not exist|schema cache/i.test(text)) {
      throw new Error(
        "جداول Supabase مش موجودة. افتح SQL Editor والصق ملف supabase-schema.sql واضغط Run."
      );
    }
    throw new Error(`Supabase ${res.status}: ${text.slice(0, 180)}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

async function cloudLoadProducts() {
  const data = await sbFetch("products?select=*&order=name.asc");
  return (data || []).map(normalizeProduct);
}

async function cloudLoadOrders() {
  try {
    const data = await sbFetch("orders?select=*&order=created_at.desc&limit=100");
    return data || [];
  } catch {
    return [];
  }
}

async function cloudUpsertProducts(list) {
  const rows = list.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price1kg: p.price1kg,
    price10kg: p.price10kg,
    price30kg: p.price30kg,
    quantity: p.quantity ?? 0,
    notes: p.notes || "",
    updated_at: new Date().toISOString(),
  }));
  await sbFetch("products?on_conflict=id", {
    method: "POST",
    body: rows,
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}

async function cloudDeleteProduct(id) {
  await sbFetch(`products?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
}

async function cloudInsertOrder(order) {
  await sbFetch("orders", {
    method: "POST",
    body: order,
    prefer: "return=minimal",
  });
}

function toNumOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isNaN(n) ? null : n;
}

function hasPrice(value) {
  return value !== null && value !== undefined && value !== "" && !Number.isNaN(Number(value));
}

function guessCategory(text) {
  const t = String(text || "").toLowerCase();
  if (/fruit|فواكه|فراول|موز|مانج|تفاح|دراجون|مكس فروت/.test(t)) return "fruits";
  if (/candy|حلويات|آيس|ايس|سكيتل|مارش|موتشي|كاندي/.test(t)) return "candy";
  if (/veg|خضار|خضروات|بصل|بطاطس|بطاطا|بامية|كوسة|بنجر/.test(t)) return "vegetables";
  return "fruits";
}

function normalizeProduct(p) {
  return {
    id: p.id || uid("p"),
    name: String(p.name || "").trim(),
    category: CATEGORY_LABELS[p.category] ? p.category : guessCategory(p.category || p.name),
    price1kg: toNumOrNull(p.price1kg ?? p.price_1kg),
    price10kg: toNumOrNull(p.price10kg ?? p.price_10kg),
    price30kg: toNumOrNull(p.price30kg ?? p.price_30kg),
    quantity: Number(p.quantity ?? 0) || 0,
    notes: p.notes || "",
  };
}

function formatMoney(amount, currency) {
  if (!hasPrice(amount)) return "—";
  const n = Number(amount);
  const formatted = n.toLocaleString("ar-EG", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return currency === "EGP" ? `${formatted} ج.م` : `${currency}${formatted}`;
}

function formatQty(q) {
  const n = Number(q) || 0;
  return `${n.toLocaleString("ar-EG", { maximumFractionDigits: 2 })} كجم`;
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.products?.length) return null;
    return {
      products: parsed.products.map(normalizeProduct),
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    };
  } catch {
    return null;
  }
}

function saveLocal(products, orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ products, orders }));
}

async function loadSharedProducts() {
  try {
    const res = await fetch(`products.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const parsed = await res.json();
    if (!Array.isArray(parsed) || !parsed.length) return null;
    return parsed.map((p) => normalizeProduct({ ...p, quantity: p.quantity ?? 0 }));
  } catch {
    return null;
  }
}

function cellText(v) {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).replace(/\s+/g, " ").trim();
}

function isNameHeader(text) {
  const h = cellText(text);
  return /اسم\s*الصنف|اسم المنتج|الصنف|المنتج|product\s*name|^item$|^name$/i.test(h);
}

function qtyScore(text) {
  const h = cellText(text);
  if (!h) return 0;
  // Prefer remaining/sellable/balance over sold
  if (/متبقي|متبقيه|صالح|رصيد|مخزون|متاح|stock|remaining|balance|on\s*hand/i.test(h)) return 5;
  if (/كمية|كميه|وزن|qty|quantity|weight|كجم|كيلو/i.test(h) && !/مباع|sold|بيع/i.test(h)) return 3;
  if (/مباع|sold/i.test(h)) return 1;
  return 0;
}

function isSectionTitle(text) {
  const h = cellText(text);
  if (!h || h.length < 4) return false;
  if (isNameHeader(h) || qtyScore(h)) return false;
  if (/تاريخ|وحده|وحدة|ملاحظات/i.test(h)) return false;
  // long titles / category banners
  return /فواكه|حلويات|خضار|خامات|تقرير|مصنع|مستورد|مجفد|مجفف|أرصده|ارصده|RSIF|FDLF|FDLS|RVIV/i.test(h) || h.length > 28;
}

function isJunkName(name) {
  const h = cellText(name);
  if (!h) return true;
  if (isNameHeader(h) || qtyScore(h) > 0) return true;
  if (isSectionTitle(h)) return true;
  if (/^total|اجمالي|الإجمالي|المجموع|عينه|عينات|مهام|تجهيز|تنظيف|تعبئه|تعبئة|غدا|تسجيل/i.test(h)) return true;
  if (/^\d+(\.\d+)?$/.test(h)) return true;
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(h)) return true;
  return false;
}

function parseNumberCell(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const n = Number(String(v).replace(/,/g, "").replace(/[^\d.-]/g, ""));
  return Number.isNaN(n) ? null : n;
}

function namesLooselyMatch(a, b) {
  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/[^0-9a-z\u0600-\u06FF]/g, "")
      .trim();
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.includes(y) || y.includes(x)) return true;
  return false;
}

function findExistingProduct(products, name) {
  return (
    products.find((p) => p.name === name) ||
    products.find((p) => namesLooselyMatch(p.name, name)) ||
    null
  );
}

/**
 * Understands messy Arabic inventory reports with multiple sections
 * and side-by-side tables (like التقرير اليومي).
 * Works for ANY similar sheet: finds "اسم الصنف" blocks + nearby qty columns.
 */
function extractInventoryTables(aoa, products) {
  if (!aoa?.length) return [];
  const width = Math.max(...aoa.map((r) => (r ? r.length : 0)), 0);
  const blocks = [];

  for (let r = 0; r < aoa.length; r++) {
    const row = aoa[r] || [];
    for (let c = 0; c < row.length; c++) {
      if (!isNameHeader(row[c])) continue;
      // find best quantity column on same header row (to the right, nearby)
      let bestCol = -1;
      let best = 0;
      for (let k = c + 1; k < Math.min(row.length, c + 8); k++) {
        const score = qtyScore(row[k]);
        if (score > best) {
          best = score;
          bestCol = k;
        }
      }
      // also check if quantity header is slightly offset on previous/next row
      if (best < 3) {
        for (const rr of [r - 1, r + 1]) {
          if (rr < 0 || rr >= aoa.length) continue;
          const prow = aoa[rr] || [];
          for (let k = c + 1; k < Math.min(prow.length, c + 8); k++) {
            const score = qtyScore(prow[k]);
            if (score > best) {
              best = score;
              bestCol = k;
            }
          }
        }
      }
      if (bestCol < 0) continue;
      blocks.push({ headerRow: r, nameCol: c, qtyCol: bestCol, score: best });
    }
  }

  // de-duplicate overlapping blocks (same nameCol near same row)
  blocks.sort((a, b) => a.headerRow - b.headerRow || a.nameCol - b.nameCol);
  const used = new Set();
  const merged = new Map(); // name -> qty (prefer higher remaining values from sellable table)

  for (const block of blocks) {
    const key = `${block.nameCol}`;
    // read downward
    let emptyStreak = 0;
    for (let r = block.headerRow + 1; r < aoa.length; r++) {
      // stop if another name-header appears in this column
      const row = aoa[r] || [];
      const rawName = cellText(row[block.nameCol]);
      if (isNameHeader(rawName)) break;
      if (!rawName) {
        emptyStreak += 1;
        if (emptyStreak >= 3) break;
        continue;
      }
      emptyStreak = 0;
      if (isJunkName(rawName)) {
        // section banner — continue scanning this block (next products may follow)
        if (isSectionTitle(rawName)) continue;
        continue;
      }

      const qty = parseNumberCell(row[block.qtyCol]);
      if (qty === null) continue;

      const nkey = rawName;
      const prev = merged.get(nkey);
      // if same product appears twice, keep the entry from higher-priority qty column (score) or first sellable
      if (!prev || block.score >= prev.score) {
        merged.set(nkey, { name: rawName, quantity: qty, score: block.score });
      }
      used.add(`${r}:${block.nameCol}`);
    }
  }

  const rows = [];
  for (const item of merged.values()) {
    const existing = findExistingProduct(products, item.name);
    const row = normalizeProduct({
      name: item.name,
      category: existing?.category || guessCategory(item.name),
      price1kg: null,
      price10kg: null,
      price30kg: null,
      quantity: item.quantity,
      notes: "",
    });
    row._status = existing ? "تحديث كمية" : "جديد";
    row._existingId = existing?.id;
    row._via = "inventory-parser";
    rows.push(row);
  }
  return rows;
}

function mapHeader(header) {
  const h = cellText(header).toLowerCase();
  if (isNameHeader(h)) return "name";
  if (/category|تصنيف|قسم|نوع/.test(h)) return "category";
  if (/30|٣٠/.test(h) && /سعر|price|جنيه|egp|للكيلو/.test(h)) return "price30kg";
  if (/10|١٠/.test(h) && /سعر|price|جنيه|egp|للكيلو/.test(h)) return "price10kg";
  if ((/1|١/.test(h) || /price|سعر/.test(h)) && /سعر|price|جنيه|egp|للكيلو|كجم/.test(h) && !/10|30|١٠|٣٠|متبقي|رصيد|مباع/.test(h)) return "price1kg";
  if (qtyScore(h) >= 3) return "quantity";
  if (/note|ملاحظ/.test(h)) return "notes";
  return null;
}

function parseSheetRows(aoa, products) {
  // Prefer multi-table inventory extraction for reports like التقرير اليومي
  const inventory = extractInventoryTables(aoa, products);
  if (inventory.length >= 3) return inventory;

  if (!aoa?.length) return [];
  let headerIndex = 0;
  let bestScore = -1;
  const scan = Math.min(aoa.length, 25);
  for (let i = 0; i < scan; i++) {
    const row = aoa[i] || [];
    let score = 0;
    row.forEach((cell) => {
      if (mapHeader(cell)) score += 2;
      const t = cellText(cell);
      if (/منتج|اسم|صنف|بيان|سعر|كمية|كميه|وزن|مخزون|رصيد|متبقي|كجم|price|qty|product|weight|stock/i.test(t)) score += 1;
    });
    if (score > bestScore) {
      bestScore = score;
      headerIndex = i;
    }
  }

  const headers = aoa[headerIndex] || [];
  const col = {};
  headers.forEach((h, i) => {
    const key = mapHeader(h);
    if (key && col[key] === undefined) col[key] = i;
  });
  if (col.name === undefined) {
    // try find name col in header row
    headers.forEach((h, i) => {
      if (col.name === undefined && isNameHeader(h)) col.name = i;
    });
  }
  if (col.name === undefined && headers.length) col.name = 0;
  if (col.quantity === undefined) {
    let best = 0;
    headers.forEach((h, i) => {
      const s = qtyScore(h);
      if (s > best) {
        best = s;
        col.quantity = i;
      }
    });
  }

  const rows = [];
  for (let r = headerIndex + 1; r < aoa.length; r++) {
    const line = aoa[r];
    if (!line || !line.length) continue;
    const name = cellText(line[col.name]);
    if (!name || isJunkName(name)) continue;
    const categoryRaw = col.category !== undefined ? line[col.category] : "";
    const qtyRaw = col.quantity !== undefined ? line[col.quantity] : null;
    const row = normalizeProduct({
      name,
      category: categoryRaw,
      price1kg: col.price1kg !== undefined ? line[col.price1kg] : null,
      price10kg: col.price10kg !== undefined ? line[col.price10kg] : null,
      price30kg: col.price30kg !== undefined ? line[col.price30kg] : null,
      quantity: qtyRaw === null || qtyRaw === "" ? null : qtyRaw,
      notes: col.notes !== undefined ? String(line[col.notes] ?? "") : "",
    });
    if (row.quantity === null || Number.isNaN(row.quantity)) row.quantity = 0;
    const existing = findExistingProduct(products, row.name);
    row._status = existing ? "تحديث كمية/بيانات" : "جديد";
    row._existingId = existing?.id;
    rows.push(row);
  }
  return rows.length ? rows : inventory;
}

function sheetToAiText(aoa) {
  // Compact labeled grid so Gemini understands ANY layout
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

function buildGeminiPrompt(aoa) {
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
1) Extract EVERY product row you can find from ALL sections and BOTH left/right tables.
2) For stock/quantity prefer: "الكميه المتبقيه الصالحه للبيع" or "الرصيد" (NOT "الكميه المباعه").
3) If there is no price column, set all prices to null (do not invent zeros as prices).
4) quantity must be the remaining/balance number in kg when present (0 is valid).
5) Skip totals, tasks/notes paragraphs, empty rows, and section titles.
6) Keep Arabic names exactly as written.
7) Guess category from the product name / section title.

Sheet cells:
${sheetToAiText(aoa)}`;
}

function extractJsonArray(text) {
  const cleaned = String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array in AI response");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function callGeminiDirect(apiKey, aoa) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: buildGeminiPrompt(aoa) }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini error ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  return extractJsonArray(content);
}

async function parseWithRealAI(aoa) {
  // 1) Vercel serverless (production)
  try {
    const res = await fetch("/api/parse-excel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheet: aoa.slice(0, 120), text: sheetToAiText(aoa) }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.products) && data.products.length) {
        return { products: data.products, source: "ai" };
      }
    }
  } catch {
    // local static server has no /api — fall through
  }

  // 2) Direct Gemini from browser (local npm start)
  const key = window.APP_CONFIG?.geminiApiKey;
  if (key && String(key).trim()) {
    const products = await callGeminiDirect(String(key).trim(), aoa);
    if (Array.isArray(products) && products.length) {
      return { products, source: "ai" };
    }
  }

  return null;
}

function rowsFromAIProducts(aiProducts, products) {
  return aiProducts
    .map((p) => {
      const row = normalizeProduct(p);
      if (!row.name || isJunkName(row.name)) return null;
      if (!hasPrice(row.price1kg)) row.price1kg = null;
      if (!hasPrice(row.price10kg)) row.price10kg = null;
      if (!hasPrice(row.price30kg)) row.price30kg = null;
      if (row.quantity === null || Number.isNaN(Number(row.quantity))) row.quantity = 0;
      const existing = findExistingProduct(products, row.name);
      row._status = existing ? "تحديث كمية/بيانات" : "جديد";
      row._existingId = existing?.id;
      row._via = "AI";
      return row;
    })
    .filter(Boolean);
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("products");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currency, setCurrency] = useState(() => localStorage.getItem(CURRENCY_KEY) || "EGP");
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem(ADMIN_KEY) === "1");
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudError, setCloudError] = useState("");
  const [toast, setToast] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [adminError, setAdminError] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [importRows, setImportRows] = useState([]);

  const [orderType, setOrderType] = useState("out");
  const [orderProductId, setOrderProductId] = useState("");
  const [orderQty, setOrderQty] = useState("");
  const [orderNote, setOrderNote] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "fruits",
    price1kg: "",
    price10kg: "",
    price30kg: "",
    quantity: "0",
    notes: "",
  });

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(""), 2500);
  }, []);

  const persist = useCallback(
    async (nextProducts, nextOrders, message = "تم الحفظ") => {
      saveLocal(nextProducts, nextOrders);
      setProducts(nextProducts);
      setOrders(nextOrders);
      if (!isCloudConfigured()) {
        showToast(message + " (محلي فقط)");
        return false;
      }
      try {
        await cloudUpsertProducts(nextProducts);
        setCloudReady(true);
        setCloudError("");
        showToast(message + " — متزامن لكل الأجهزة");
        return true;
      } catch (err) {
        console.error(err);
        const msg = err?.message || String(err);
        setCloudReady(false);
        setCloudError(msg);
        showToast("⚠️ اتحفظ على الجهاز فقط — السحابة فشلت");
        alert("التعديل اتحفظ على هذا الجهاز بس.\n\n" + msg);
        return false;
      }
    },
    [showToast]
  );

  const reloadFromCloud = useCallback(async () => {
    if (!isCloudConfigured()) {
      showToast("Supabase مش مفعّل في config.js");
      return;
    }
    try {
      showToast("جاري التحديث من السحابة…");
      const list = await cloudLoadProducts();
      const ords = await cloudLoadOrders();
      setProducts(list);
      setOrders(ords);
      saveLocal(list, ords);
      setCloudReady(true);
      setCloudError("");
      showToast(`تم التحديث من السحابة (${list.length} منتج)`);
    } catch (err) {
      console.error(err);
      setCloudReady(false);
      setCloudError(err?.message || String(err));
      showToast("فشل التحديث من السحابة");
    }
  }, [showToast]);

  useEffect(() => {
    async function init() {
      if (isCloudConfigured()) {
        try {
          let list = await cloudLoadProducts();
          if (!list.length) {
            const seed = (await loadSharedProducts()) || structuredClone(DEFAULT_PRODUCTS);
            await cloudUpsertProducts(seed);
            list = seed.map(normalizeProduct);
          }
          const ords = await cloudLoadOrders();
          setProducts(list);
          setOrders(ords);
          saveLocal(list, ords);
          setCloudReady(true);
          setCloudError("");
        } catch (err) {
          console.error(err);
          setCloudReady(false);
          setCloudError(err?.message || String(err));
          const local = loadLocal();
          setProducts(local?.products || (await loadSharedProducts()) || structuredClone(DEFAULT_PRODUCTS));
          setOrders(local?.orders || []);
        }
      } else {
        setCloudReady(false);
        const local = loadLocal();
        setProducts(local?.products || (await loadSharedProducts()) || structuredClone(DEFAULT_PRODUCTS));
        setOrders(local?.orders || []);
      }
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (products.length && !orderProductId) setOrderProductId(products[0].id);
  }, [products, orderProductId]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (activeCategory !== "all" && p.category !== activeCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.notes || "").toLowerCase().includes(q) ||
        (CATEGORY_LABELS[p.category] || "").includes(q)
      );
    });
  }, [products, activeCategory, searchQuery]);

  const groups = useMemo(() => {
    if (activeCategory !== "all") return [{ cat: activeCategory, items: filtered }];
    return CATEGORY_ORDER.map((cat) => ({
      cat,
      items: filtered.filter((p) => p.category === cat),
    })).filter((g) => g.items.length);
  }, [filtered, activeCategory]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", category: "fruits", price1kg: "", price10kg: "", price30kg: "", quantity: "0", notes: "" });
    // Defer open so the click that triggered this cannot close the modal instantly
    setTimeout(() => setProductOpen(true), 0);
  }

  function openEdit(product) {
    setEditing(product);
    setForm({
      name: product.name,
      category: product.category,
      price1kg: hasPrice(product.price1kg) ? String(product.price1kg) : "",
      price10kg: hasPrice(product.price10kg) ? String(product.price10kg) : "",
      price30kg: hasPrice(product.price30kg) ? String(product.price30kg) : "",
      quantity: String(product.quantity ?? 0),
      notes: product.notes || "",
    });
    setTimeout(() => setProductOpen(true), 0);
  }

  async function saveProduct(e) {
    e.preventDefault();
    if (!isAdmin) return;
    const entry = normalizeProduct({
      id: editing?.id || uid("p"),
      name: form.name.trim(),
      category: form.category,
      price1kg: Number(form.price1kg),
      price10kg: form.price10kg === "" ? null : Number(form.price10kg),
      price30kg: form.price30kg === "" ? null : Number(form.price30kg),
      quantity: Number(form.quantity) || 0,
      notes: form.notes.trim(),
    });
    if (!entry.name || !hasPrice(entry.price1kg)) return;
    const next = editing
      ? products.map((p) => (p.id === editing.id ? entry : p))
      : [...products, entry];
    setProductOpen(false);
    await persist(next, orders, "تم حفظ المنتج");
  }

  async function deleteProduct(id) {
    if (!isAdmin) return;
    const product = products.find((p) => p.id === id);
    if (!product || !confirm(`حذف «${product.name}»؟`)) return;
    const next = products.filter((p) => p.id !== id);
    try {
      if (isCloudConfigured()) await cloudDeleteProduct(id);
    } catch (err) {
      console.error(err);
    }
    await persist(next, orders, "تم حذف المنتج");
  }

  async function submitOrder(e) {
    e.preventDefault();
    if (!isAdmin) {
      alert("سجّل دخول الإدارة أولاً");
      return;
    }
    const product = products.find((p) => p.id === orderProductId);
    const qty = Number(orderQty);
    if (!product || !(qty > 0)) return;
    if (orderType === "out" && (product.quantity || 0) < qty) {
      if (!confirm(`المخزون الحالي (${formatQty(product.quantity)}) أقل من المطلوب. تأكيد الخصم؟`)) return;
    }
    const nextQty =
      orderType === "in" ? (product.quantity || 0) + qty : Math.max(0, (product.quantity || 0) - qty);
    const updatedProduct = { ...product, quantity: nextQty };
    const nextProducts = products.map((p) => (p.id === product.id ? updatedProduct : p));
    const order = {
      id: uid("o"),
      product_id: product.id,
      product_name: product.name,
      type: orderType,
      quantity: qty,
      note: orderNote.trim(),
      created_at: new Date().toISOString(),
    };
    const nextOrders = [order, ...orders];
    saveLocal(nextProducts, nextOrders);
    setProducts(nextProducts);
    setOrders(nextOrders);
    if (isCloudConfigured()) {
      try {
        await cloudUpsertProducts([updatedProduct]);
        await cloudInsertOrder(order);
        setCloudReady(true);
        setCloudError("");
        showToast("تم تسجيل الحركة ومزامنتها");
      } catch (err) {
        console.error(err);
        setCloudReady(false);
        setCloudError(err?.message || String(err));
        showToast("الحركة اتحفظت محلياً — السحابة فشلت");
      }
    } else {
      showToast("تم تسجيل الحركة (محلي)");
    }
    setOrderQty("");
    setOrderNote("");
  }

  async function onImportFile(e) {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (!file || !window.XLSX) return;
    try {
      showToast("جاري فهم الملف (أي شكل Excel)…");
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });

      let rows = [];
      let source = "rules";

      // Always run structural inventory parser (works for التقرير اليومي and similar)
      const inventoryRows = extractInventoryTables(aoa, products);

      try {
        const ai = await parseWithRealAI(aoa);
        if (ai?.products?.length) {
          rows = rowsFromAIProducts(ai.products, products);
          source = "ai";
        }
      } catch (aiErr) {
        console.error(aiErr);
      }

      // Prefer whichever extracted more real stock rows; inventory parser is strong for Arabic reports
      if (inventoryRows.length && inventoryRows.length >= (rows.length || 0)) {
        rows = inventoryRows;
        source = "inventory";
      } else if (!rows.length) {
        rows = parseSheetRows(aoa, products);
        source = "rules";
      }

      if (!rows.length) {
        alert(
          "لم يتم التعرف على صفوف صالحة.\n\nالملف لازم فيه أسماء أصناف + كمية/رصيد.\nلو عندك Gemini key في config.js هيساعد يفهم أي شكل تقريباً."
        );
        return;
      }

      setImportRows(rows);
      const label =
        source === "ai" ? "AI" : source === "inventory" ? "محلل المخزون" : "قواعد ذكية";
      showToast(`${label}: ${rows.length} صنف (الكمية من المتبقي/الرصيد — الأسعار مش في التقرير ده)`);
    } catch (err) {
      console.error(err);
      alert("تعذر قراءة الملف.");
    } finally {
      e.target.value = "";
    }
  }

  async function applyImport() {
    if (!isAdmin || !importRows.length) return;
    let next = [...products];
    for (const row of importRows) {
      const existing =
        (row._existingId && next.find((p) => p.id === row._existingId)) ||
        next.find((p) => p.name === row.name || namesLooselyMatch(p.name, row.name));

      if (existing) {
        const entry = {
          ...existing,
          // update quantity from sheet
          quantity: row.quantity !== null && row.quantity !== undefined ? Number(row.quantity) || 0 : existing.quantity,
          // only overwrite prices when the sheet actually has them
          price1kg: hasPrice(row.price1kg) ? Number(row.price1kg) : existing.price1kg,
          price10kg: hasPrice(row.price10kg) ? Number(row.price10kg) : existing.price10kg,
          price30kg: hasPrice(row.price30kg) ? Number(row.price30kg) : existing.price30kg,
          notes: row.notes || existing.notes,
          category: row.category || existing.category,
        };
        next = next.map((p) => (p.id === existing.id ? entry : p));
      } else {
        const entry = normalizeProduct({
          ...row,
          id: uid("p"),
          price1kg: hasPrice(row.price1kg) ? row.price1kg : 0,
        });
        next.push(entry);
      }
    }
    setImportRows([]);
    await persist(next, orders, "تم تطبيق الاستيراد");
  }

  function downloadSheet(pack, onlyFiltered, includeStock = false) {
    const list = onlyFiltered ? filtered : [...products];
    const sorted = [...list].sort((a, b) => {
      const cat = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
      if (cat !== 0) return cat;
      return a.name.localeCompare(b.name, "ar");
    });
    const date = new Date().toISOString().slice(0, 10);
    const currencyLabel = currency === "EGP" ? "ج.م" : currency;
    let headers;
    let rows;
    if (pack === "1kg") {
      headers = includeStock
        ? ["المنتج", "التصنيف", "الكمية", `سعر الكيلو (${currencyLabel})`, "المخزون", "ملاحظات"]
        : ["المنتج", "التصنيف", "الكمية", `سعر الكيلو (${currencyLabel})`, "ملاحظات"];
      rows = sorted.map((p) => {
        const base = [p.name, CATEGORY_LABELS[p.category], "١ كجم", hasPrice(p.price1kg) ? p.price1kg : ""];
        if (includeStock) base.push(p.quantity ?? 0);
        base.push(p.notes || "");
        return base;
      });
    } else if (pack === "10kg") {
      headers = includeStock
        ? ["المنتج", "التصنيف", "الكمية", `سعر الكيلو (${currencyLabel})`, "المخزون", "ملاحظات"]
        : ["المنتج", "التصنيف", "الكمية", `سعر الكيلو (${currencyLabel})`, "ملاحظات"];
      rows = sorted.map((p) => {
        const base = [p.name, CATEGORY_LABELS[p.category], "١٠ كجم", hasPrice(p.price10kg) ? p.price10kg : ""];
        if (includeStock) base.push(p.quantity ?? 0);
        base.push(p.notes || "");
        return base;
      });
    } else if (pack === "30kg") {
      headers = includeStock
        ? ["المنتج", "التصنيف", "الكمية", `سعر الكيلو (${currencyLabel})`, "المخزون", "ملاحظات"]
        : ["المنتج", "التصنيف", "الكمية", `سعر الكيلو (${currencyLabel})`, "ملاحظات"];
      rows = sorted.map((p) => {
        const base = [p.name, CATEGORY_LABELS[p.category], "٣٠ كجم", hasPrice(p.price30kg) ? p.price30kg : ""];
        if (includeStock) base.push(p.quantity ?? 0);
        base.push(p.notes || "");
        return base;
      });
    } else {
      headers = includeStock
        ? ["المنتج", "التصنيف", "١ كجم", "١٠ كجم", "٣٠ كجم", "المخزون", "ملاحظات"]
        : ["المنتج", "التصنيف", "١ كجم", "١٠ كجم", "٣٠ كجم", "ملاحظات"];
      rows = sorted.map((p) => {
        const base = [
          p.name,
          CATEGORY_LABELS[p.category],
          hasPrice(p.price1kg) ? p.price1kg : "",
          hasPrice(p.price10kg) ? p.price10kg : "",
          hasPrice(p.price30kg) ? p.price30kg : "",
        ];
        if (includeStock) base.push(p.quantity ?? 0);
        base.push(p.notes || "");
        return base;
      });
    }
    const csv = "\uFEFF" + [headers, ...rows].map((r) => r.map(csvEscape).join(",")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `Pro-Business-prices-${pack}${includeStock ? "-stock" : ""}-${date}.csv`;
    a.click();
  }

  function loginAdmin(e) {
    e.preventDefault();
    if (adminPin !== getAdminPin()) {
      setAdminError("رمز الإدارة غير صحيح.");
      return;
    }
    setIsAdmin(true);
    sessionStorage.setItem(ADMIN_KEY, "1");
    setAdminOpen(false);
    setAdminPin("");
    setAdminError("");
  }

  function logoutAdmin() {
    setIsAdmin(false);
    sessionStorage.removeItem(ADMIN_KEY);
  }

  if (loading) {
    return (
      <div className="site-footer" style={{ paddingTop: "4rem", textAlign: "center" }}>
        جاري التحميل…
      </div>
    );
  }

  return (
    <>
      <div className="bg-glow" aria-hidden="true"></div>
      <div className="bg-pattern" aria-hidden="true"></div>

      {!cloudReady && (
        <div className="publish-banner" role="status">
          <p>
            السحابة مش شغالة الآن — التعديلات بتتخزن على هذا الجهاز فقط.
            {cloudError ? ` (${cloudError})` : " شغّل supabase-schema.sql في Supabase لو لسه ماعملتهوش."}
          </p>
          <button type="button" className="btn btn-primary" onClick={reloadFromCloud}>
            إعادة الاتصال
          </button>
        </div>
      )}
      {toast && <div className="save-toast">{toast}</div>}

      <header className="site-header">
        <div className="brand-block">
          <p className="brand">Pro Business</p>
          <p className="brand-tag">أسعار · مخزون · طلبات · استيراد ذكي</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-ghost" onClick={reloadFromCloud} title="جلب آخر بيانات من Supabase">
            تحديث
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              if (isAdmin) logoutAdmin();
              else setTimeout(() => setAdminOpen(true), 0);
            }}
          >
            {isAdmin ? "خروج الإدارة" : "دخول الإدارة"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setExportOpen(true)}>
            مشاركة الجدول
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
            طباعة
          </button>
          {isAdmin && (
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              إضافة منتج
            </button>
          )}
        </div>
      </header>

      <nav className="main-nav" aria-label="الأقسام">
        <button type="button" className={`nav-tab ${view === "products" ? "active" : ""}`} onClick={() => setView("products")}>
          المنتجات والأسعار
        </button>
        <button type="button" className={`nav-tab ${view === "orders" ? "active" : ""}`} onClick={() => setView("orders")}>
          الطلبات والمخزون
        </button>
        <button type="button" className={`nav-tab ${view === "import" ? "active" : ""}`} onClick={() => setView("import")}>
          استيراد Excel بالذكاء
        </button>
      </nav>

      <main>
        {view === "products" && (
          <section className="view">
            <div className="toolbar">
              <div className="search-wrap">
                <input
                  type="search"
                  placeholder="ابحث عن منتج…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="category-tabs">
                {[
                  ["all", "الكل"],
                  ["fruits", "فواكه"],
                  ["candy", "حلويات"],
                  ["vegetables", "خضروات"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={`tab ${activeCategory === id ? "active" : ""}`}
                    onClick={() => setActiveCategory(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="currency-wrap">
                <label htmlFor="currencySelect">العملة</label>
                <select
                  id="currencySelect"
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value);
                    localStorage.setItem(CURRENCY_KEY, e.target.value);
                  }}
                >
                  <option value="EGP">جنيه مصري (EGP)</option>
                  <option value="$">دولار ($)</option>
                  <option value="€">يورو (€)</option>
                  <option value="£">جنيه استرليني (£)</option>
                  <option value="₪">شيكل (₪)</option>
                </select>
              </div>
            </div>

            <section className="price-legend">
              <p>
                <strong>١ / ١٠ / ٣٠ كجم</strong> — سعر الكيلو حسب كمية الطلب
              </p>
              <p>
                <strong>المخزون</strong> — الكمية المتوفرة حالياً (كجم)
              </p>
            </section>

            <section className="product-list">
              {groups.map((group) => (
                <React.Fragment key={group.cat}>
                  {activeCategory === "all" && <h2 className="category-heading">{CATEGORY_LABELS[group.cat]}</h2>}
                  {group.items.map((product) => (
                    <article key={product.id} className="product-row product-row-stock">
                      <div className="product-info">
                        <h3 className="product-name">{product.name}</h3>
                        <p className="product-meta">{product.notes || CATEGORY_LABELS[product.category]}</p>
                      </div>
                      <div className="price-cell">
                        <span>١ كجم</span>
                        <strong>{formatMoney(product.price1kg, currency)}</strong>
                      </div>
                      <div className="price-cell">
                        <span>١٠ كجم</span>
                        <strong>{formatMoney(product.price10kg, currency)}</strong>
                      </div>
                      <div className="price-cell">
                        <span>٣٠ كجم</span>
                        <strong>{formatMoney(product.price30kg, currency)}</strong>
                      </div>
                      <div className={`price-cell stock-cell ${(product.quantity || 0) <= 0 ? "stock-low" : ""}`}>
                        <span>المخزون</span>
                        <strong>{formatQty(product.quantity)}</strong>
                      </div>
                      {isAdmin ? (
                        <div className="row-actions">
                          <button
                            type="button"
                            className="icon-btn edit"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openEdit(product);
                            }}
                            title="تعديل"
                          >
                            ✎
                          </button>
                          <button type="button" className="icon-btn delete" onClick={() => deleteProduct(product.id)} title="حذف">
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="row-actions">
                          <button
                            type="button"
                            className="icon-btn edit"
                            title="سجّل دخول الإدارة للتعديل"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              showToast("سجّل دخول الإدارة أولاً عشان تعدّل");
                              setTimeout(() => setAdminOpen(true), 0);
                            }}
                          >
                            ✎
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </React.Fragment>
              ))}
              {!filtered.length && <p className="empty-state">لا توجد منتجات مطابقة لبحثك.</p>}
            </section>
          </section>
        )}

        {view === "orders" && (
          <section className="view">
            <div className="panel">
              <h2>تسجيل حركة مخزون</h2>
              <p className="panel-hint">خصم عند البيع/الاستخدام، أو إضافة عند الشراء/التوريد.</p>
              <form className="order-form" onSubmit={submitOrder}>
                <label>
                  المنتج
                  <select value={orderProductId} onChange={(e) => setOrderProductId(e.target.value)} required>
                    {[...products]
                      .sort((a, b) => a.name.localeCompare(b.name, "ar"))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — متاح {formatQty(p.quantity)}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  نوع الحركة
                  <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                    <option value="out">خصم من المخزون (بيع / استخدام)</option>
                    <option value="in">إضافة للمخزون (شراء / توريد)</option>
                  </select>
                </label>
                <label>
                  الكمية (كجم)
                  <input type="number" min="0.01" step="0.01" value={orderQty} onChange={(e) => setOrderQty(e.target.value)} required />
                </label>
                <label>
                  ملاحظة <span className="optional">(اختياري)</span>
                  <input type="text" maxLength={120} value={orderNote} onChange={(e) => setOrderNote(e.target.value)} />
                </label>
                {isAdmin ? (
                  <button type="submit" className="btn btn-primary">
                    تنفيذ الحركة
                  </button>
                ) : (
                  <p className="panel-hint">سجّل دخول الإدارة عشان تسجّل طلبات.</p>
                )}
              </form>
            </div>

            <div className="panel">
              <h2>آخر الحركات</h2>
              <div className="orders-list">
                {[...orders]
                  .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
                  .slice(0, 50)
                  .map((o) => (
                    <article key={o.id} className={`order-item ${o.type === "in" ? "order-in" : "order-out"}`}>
                      <div>
                        <strong>{o.product_name || o.product_id}</strong>
                        <p className="product-meta">
                          {o.note || (o.type === "in" ? "إضافة" : "خصم")} ·{" "}
                          {o.created_at ? new Date(o.created_at).toLocaleString("ar-EG") : ""}
                        </p>
                      </div>
                      <div className="order-qty">
                        {o.type === "in" ? "+" : "−"} {formatQty(o.quantity)}
                      </div>
                    </article>
                  ))}
                {!orders.length && <p className="empty-state">لا توجد حركات بعد.</p>}
              </div>
            </div>
          </section>
        )}

        {view === "import" && (
          <section className="view">
            <div className="panel">
              <h2>استيراد ذكي من Excel (Gemini AI)</h2>
              <p className="panel-hint">
                ارفع Excel أو CSV. النظام يستخدم <strong>Google Gemini</strong> (مجاني) لفهم الجدول حتى لو العناوين غير مرتبة،
                ويعرض معاينة قبل الحفظ. لو مفيش مفتاح AI، يستخدم القواعد الذكية كاحتياطي.
              </p>
              {isAdmin ? (
                <div className="import-box">
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={onImportFile} />
                </div>
              ) : (
                <p className="panel-hint">سجّل دخول الإدارة عشان تستورد ملف.</p>
              )}

              {!!importRows.length && (
                <div>
                  <h3>معاينة الاستيراد ({importRows.length} صف)</h3>
                  <div className="table-scroll">
                    <table className="import-table">
                      <thead>
                        <tr>
                          <th>المنتج</th>
                          <th>التصنيف</th>
                          <th>١ كجم</th>
                          <th>١٠ كجم</th>
                          <th>٣٠ كجم</th>
                          <th>الكمية</th>
                          <th>الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importRows.map((row, i) => (
                          <tr key={`${row.name}-${i}`}>
                            <td>{row.name}</td>
                            <td>{CATEGORY_LABELS[row.category]}</td>
                            <td>{hasPrice(row.price1kg) ? row.price1kg : "—"}</td>
                            <td>{hasPrice(row.price10kg) ? row.price10kg : "—"}</td>
                            <td>{hasPrice(row.price30kg) ? row.price30kg : "—"}</td>
                            <td>{row.quantity ?? 0}</td>
                            <td>{row._status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="modal-actions" style={{ justifyContent: "flex-start", marginTop: "1rem" }}>
                    <button type="button" className="btn btn-primary" onClick={applyImport}>
                      تطبيق على النظام
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => setImportRows([])}>
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <p>
          {cloudReady
            ? "متصل بـ Supabase — أي حفظ يظهر على كل الأجهزة (اضغط تحديث لو الصفحة قديمة)."
            : "غير متصل بالسحابة — كل جهاز شايف بياناته المحلية فقط."}
          {cloudError ? ` خطأ: ${cloudError}` : ""}
        </p>
      </footer>

      {adminOpen && (
        <Modal onClose={() => setAdminOpen(false)}>
          <form className="export-panel" onSubmit={loginAdmin}>
            <h2>دخول الإدارة</h2>
            <p className="export-hint">رمز الإدارة مطلوب للتعديل والطلبات والاستيراد.</p>
            <label>
              رمز الإدارة
              <input type="password" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} required autoFocus />
            </label>
            {adminError && <p className="export-hint" style={{ color: "var(--danger)" }}>{adminError}</p>}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setAdminOpen(false)}>
                إلغاء
              </button>
              <button type="submit" className="btn btn-primary">
                دخول
              </button>
            </div>
          </form>
        </Modal>
      )}

      {exportOpen && (
        <ExportDialog
          onClose={() => setExportOpen(false)}
          onDownload={(pack, onlyFiltered, includeStock) => {
            downloadSheet(pack, onlyFiltered, includeStock);
            setExportOpen(false);
          }}
        />
      )}

      {productOpen && (
        <Modal onClose={() => setProductOpen(false)}>
          <form onSubmit={saveProduct}>
            <h2>{editing ? "تعديل منتج" : "إضافة منتج"}</h2>
            <label>
              اسم المنتج
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} />
            </label>
            <label>
              التصنيف
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="fruits">فواكه</option>
                <option value="candy">حلويات</option>
                <option value="vegetables">خضروات</option>
              </select>
            </label>
            <div className="price-fields">
              <label>
                سعر الكيلو (١ كجم)
                <input type="number" min="0" step="0.01" value={form.price1kg} onChange={(e) => setForm({ ...form, price1kg: e.target.value })} required />
              </label>
              <label>
                سعر الكيلو (١٠ كجم) <span className="optional">(اختياري)</span>
                <input type="number" min="0" step="0.01" value={form.price10kg} onChange={(e) => setForm({ ...form, price10kg: e.target.value })} />
              </label>
              <label>
                سعر الكيلو (٣٠ كجم) <span className="optional">(اختياري)</span>
                <input type="number" min="0" step="0.01" value={form.price30kg} onChange={(e) => setForm({ ...form, price30kg: e.target.value })} />
              </label>
            </div>
            <label>
              الكمية المتوفرة (كجم)
              <input type="number" min="0" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </label>
            <label>
              ملاحظات <span className="optional">(اختياري)</span>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={120} />
            </label>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setProductOpen(false)}>
                إلغاء
              </button>
              <button type="submit" className="btn btn-primary">
                حفظ
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

function ExportDialog({ onClose, onDownload }) {
  const [pack, setPack] = useState("1kg");
  const [onlyFiltered, setOnlyFiltered] = useState(false);
  const [includeStock, setIncludeStock] = useState(false);
  return (
    <Modal onClose={onClose}>
      <div className="export-panel">
        <h2>مشاركة قائمة الأسعار</h2>
        <p className="export-hint">حمّل جدولاً لإرساله للعملاء (بدون مخزون بشكل افتراضي).</p>
        <fieldset className="export-options">
          <legend>أي قائمة؟</legend>
          {[
            ["1kg", "١ كجم فقط"],
            ["10kg", "١٠ كجم فقط"],
            ["30kg", "٣٠ كجم فقط"],
            ["all", "كاملة (كل الأسعار)"],
          ].map(([value, label]) => (
            <label key={value} className="export-choice">
              <input type="radio" name="exportPack" checked={pack === value} onChange={() => setPack(value)} />
              <span>
                <strong>{label}</strong>
              </span>
            </label>
          ))}
        </fieldset>
        <label className="export-scope">
          <input type="checkbox" checked={onlyFiltered} onChange={(e) => setOnlyFiltered(e.target.checked)} />
          المنتجات الظاهرة فقط
        </label>
        <label className="export-scope">
          <input type="checkbox" checked={includeStock} onChange={(e) => setIncludeStock(e.target.checked)} />
          تضمين المخزون (الكمية المتوفرة)
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            إلغاء
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onDownload(pack, onlyFiltered, includeStock)}
          >
            تحميل الجدول
          </button>
        </div>
      </div>
    </Modal>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

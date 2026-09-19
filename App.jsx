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

function createSupabase() {
  if (!isCloudConfigured() || !window.supabase) return null;
  try {
    return window.supabase.createClient(window.APP_CONFIG.supabaseUrl, window.APP_CONFIG.supabaseAnonKey);
  } catch {
    return null;
  }
}

function mapHeader(header) {
  const h = String(header || "").toLowerCase().replace(/\s+/g, " ").trim();
  if (/^(name|product|المنتج|اسم|الصنف)$/.test(h) || h.includes("منتج") || h.includes("اسم")) return "name";
  if (/category|تصنيف|قسم|نوع/.test(h)) return "category";
  if (/30|٣٠/.test(h)) return "price30kg";
  if (/10|١٠/.test(h)) return "price10kg";
  if ((/1|١/.test(h) || /price|سعر/.test(h)) && /kg|كجم|كيلو|سعر/.test(h) && !/10|30|١٠|٣٠/.test(h)) return "price1kg";
  if (/^price$|^سعر$/.test(h) || h === "سعر الكيلو") return "price1kg";
  if (/qty|quantity|كمية|المخزون|متاح|stock/.test(h)) return "quantity";
  if (/note|ملاحظ/.test(h)) return "notes";
  return null;
}

function parseSheetRows(aoa, products) {
  if (!aoa?.length) return [];
  const headers = aoa[0];
  const col = {};
  headers.forEach((h, i) => {
    const key = mapHeader(h);
    if (key && col[key] === undefined) col[key] = i;
  });
  if (col.name === undefined && headers.length) col.name = 0;

  const rows = [];
  for (let r = 1; r < aoa.length; r++) {
    const line = aoa[r];
    if (!line || !line.length) continue;
    const name = String(line[col.name] ?? "").trim();
    if (!name) continue;
    const categoryRaw = col.category !== undefined ? line[col.category] : "";
    const row = normalizeProduct({
      name,
      category: categoryRaw,
      price1kg: col.price1kg !== undefined ? line[col.price1kg] : null,
      price10kg: col.price10kg !== undefined ? line[col.price10kg] : null,
      price30kg: col.price30kg !== undefined ? line[col.price30kg] : null,
      quantity: col.quantity !== undefined ? line[col.quantity] : 0,
      notes: col.notes !== undefined ? String(line[col.notes] ?? "") : "",
    });
    if (!hasPrice(row.price1kg)) row.price1kg = 0;
    const existing = products.find((p) => p.name === row.name);
    row._status = existing ? "تحديث" : "جديد";
    row._existingId = existing?.id;
    rows.push(row);
  }
  return rows;
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
  const [toast, setToast] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [adminError, setAdminError] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [importRows, setImportRows] = useState([]);
  const [supabaseClient, setSupabaseClient] = useState(null);

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
      if (supabaseClient) {
        try {
          const rows = nextProducts.map((p) => ({
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
          const { error } = await supabaseClient.from("products").upsert(rows);
          if (error) throw error;
          showToast(message + " — متزامن للجميع");
          return;
        } catch (err) {
          console.error(err);
          showToast("تم الحفظ محلياً فقط");
          return;
        }
      }
      showToast(message + (isCloudConfigured() ? "" : " (محلي)"));
    },
    [supabaseClient, showToast]
  );

  useEffect(() => {
    async function init() {
      const client = createSupabase();
      setSupabaseClient(client);
      setCloudReady(Boolean(client));

      if (client) {
        try {
          const [{ data: prods, error: e1 }, { data: ords, error: e2 }] = await Promise.all([
            client.from("products").select("*").order("name"),
            client.from("orders").select("*").order("created_at", { ascending: false }).limit(100),
          ]);
          if (e1) throw e1;
          if (e2) throw e2;
          let list = (prods || []).map(normalizeProduct);
          if (!list.length) {
            const seed = (await loadSharedProducts()) || structuredClone(DEFAULT_PRODUCTS);
            await client.from("products").upsert(
              seed.map((p) => ({
                ...p,
                updated_at: new Date().toISOString(),
              }))
            );
            list = seed;
          }
          setProducts(list);
          setOrders(ords || []);
          saveLocal(list, ords || []);
        } catch (err) {
          console.error(err);
          const local = loadLocal();
          setProducts(local?.products || (await loadSharedProducts()) || structuredClone(DEFAULT_PRODUCTS));
          setOrders(local?.orders || []);
        }
      } else {
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
    setProductOpen(true);
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
    setProductOpen(true);
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
    if (supabaseClient) await supabaseClient.from("products").delete().eq("id", id);
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
    if (supabaseClient) {
      try {
        await supabaseClient.from("products").upsert({
          ...updatedProduct,
          updated_at: new Date().toISOString(),
        });
        await supabaseClient.from("orders").insert(order);
        showToast("تم تسجيل الحركة ومزامنتها");
      } catch (err) {
        console.error(err);
        showToast("الحركة اتحفظت محلياً");
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
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      const rows = parseSheetRows(aoa, products);
      if (!rows.length) {
        alert("لم يتم التعرف على صفوف صالحة.");
        return;
      }
      setImportRows(rows);
      showToast(`تم تحليل ${rows.length} صف`);
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
      const entry = normalizeProduct({ ...row, id: row._existingId || uid("p") });
      if (row._existingId) {
        const prev = next.find((p) => p.id === row._existingId);
        if (prev && !hasPrice(entry.price10kg)) entry.price10kg = prev.price10kg;
        if (prev && !hasPrice(entry.price30kg)) entry.price30kg = prev.price30kg;
        next = next.map((p) => (p.id === entry.id ? entry : p));
      } else {
        next.push(entry);
      }
    }
    setImportRows([]);
    await persist(next, orders, "تم تطبيق الاستيراد");
  }

  function downloadSheet(pack, onlyFiltered) {
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
      headers = ["المنتج", "التصنيف", "الكمية", `سعر الكيلو (${currencyLabel})`, "المخزون", "ملاحظات"];
      rows = sorted.map((p) => [p.name, CATEGORY_LABELS[p.category], "١ كجم", hasPrice(p.price1kg) ? p.price1kg : "", p.quantity ?? 0, p.notes || ""]);
    } else if (pack === "10kg") {
      headers = ["المنتج", "التصنيف", "الكمية", `سعر الكيلو (${currencyLabel})`, "المخزون", "ملاحظات"];
      rows = sorted.map((p) => [p.name, CATEGORY_LABELS[p.category], "١٠ كجم", hasPrice(p.price10kg) ? p.price10kg : "", p.quantity ?? 0, p.notes || ""]);
    } else if (pack === "30kg") {
      headers = ["المنتج", "التصنيف", "الكمية", `سعر الكيلو (${currencyLabel})`, "المخزون", "ملاحظات"];
      rows = sorted.map((p) => [p.name, CATEGORY_LABELS[p.category], "٣٠ كجم", hasPrice(p.price30kg) ? p.price30kg : "", p.quantity ?? 0, p.notes || ""]);
    } else {
      headers = ["المنتج", "التصنيف", "١ كجم", "١٠ كجم", "٣٠ كجم", "المخزون", "ملاحظات"];
      rows = sorted.map((p) => [
        p.name,
        CATEGORY_LABELS[p.category],
        hasPrice(p.price1kg) ? p.price1kg : "",
        hasPrice(p.price10kg) ? p.price10kg : "",
        hasPrice(p.price30kg) ? p.price30kg : "",
        p.quantity ?? 0,
        p.notes || "",
      ]);
    }
    const csv = "\uFEFF" + [headers, ...rows].map((r) => r.map(csvEscape).join(",")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `Pro-Business-prices-${pack}-${date}.csv`;
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
          <p>Supabase مش مفعّل لسه — النظام شغال محلياً. فعّل Supabase من config.js عشان الكل يشوف نفس البيانات.</p>
        </div>
      )}
      {toast && <div className="save-toast">{toast}</div>}

      <header className="site-header">
        <div className="brand-block">
          <p className="brand">Pro Business</p>
          <p className="brand-tag">أسعار · مخزون · طلبات · استيراد ذكي</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-ghost" onClick={() => (isAdmin ? logoutAdmin() : setAdminOpen(true))}>
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
                      {isAdmin && (
                        <div className="row-actions">
                          <button type="button" className="icon-btn edit" onClick={() => openEdit(product)}>
                            ✎
                          </button>
                          <button type="button" className="icon-btn delete" onClick={() => deleteProduct(product.id)}>
                            ✕
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
              <h2>استيراد ذكي من Excel</h2>
              <p className="panel-hint">
                ارفع ملف Excel أو CSV فيه الأسعار والكميات. النظام هيكتشف الأعمدة تلقائياً ويعرض معاينة قبل الحفظ.
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
            ? "متصل بـ Supabase — المخزون والطلبات متزامنة."
            : "وضع محلي — فعّل Supabase عشان الأجهزة كلها تشوف نفس البيانات."}
        </p>
      </footer>

      {adminOpen && (
        <dialog open className="modal" onClose={() => setAdminOpen(false)}>
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
        </dialog>
      )}

      {exportOpen && (
        <ExportDialog
          onClose={() => setExportOpen(false)}
          onDownload={(pack, onlyFiltered) => {
            downloadSheet(pack, onlyFiltered);
            setExportOpen(false);
          }}
        />
      )}

      {productOpen && (
        <dialog open className="modal">
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
        </dialog>
      )}
    </>
  );
}

function ExportDialog({ onClose, onDownload }) {
  const [pack, setPack] = useState("1kg");
  const [onlyFiltered, setOnlyFiltered] = useState(false);
  return (
    <dialog open className="modal">
      <div className="export-panel">
        <h2>مشاركة قائمة الأسعار</h2>
        <p className="export-hint">حمّل جدولاً لإرساله للعملاء.</p>
        <fieldset className="export-options">
          <legend>أي قائمة؟</legend>
          {[
            ["1kg", "١ كجم فقط"],
            ["10kg", "١٠ كجم فقط"],
            ["30kg", "٣٠ كجم فقط"],
            ["all", "كاملة + الكمية"],
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
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            إلغاء
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onDownload(pack, onlyFiltered)}>
            تحميل الجدول
          </button>
        </div>
      </div>
    </dialog>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

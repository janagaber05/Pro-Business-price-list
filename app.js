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

let products = structuredClone(DEFAULT_PRODUCTS);
let orders = [];
let activeCategory = "all";
let searchQuery = "";
let currency = localStorage.getItem(CURRENCY_KEY) || "EGP";
let editingId = null;
let isAdmin = sessionStorage.getItem(ADMIN_KEY) === "1";
let supabase = null;
let cloudReady = false;
let importRows = [];

const els = {
  productList: document.getElementById("productList"),
  empty: document.getElementById("emptyState"),
  search: document.getElementById("searchInput"),
  currency: document.getElementById("currencySelect"),
  dialog: document.getElementById("productDialog"),
  form: document.getElementById("productForm"),
  dialogTitle: document.getElementById("dialogTitle"),
  productName: document.getElementById("productName"),
  productCategory: document.getElementById("productCategory"),
  price1kg: document.getElementById("price1kg"),
  price10kg: document.getElementById("price10kg"),
  price30kg: document.getElementById("price30kg"),
  productQty: document.getElementById("productQty"),
  productNotes: document.getElementById("productNotes"),
  setupBanner: document.getElementById("setupBanner"),
  saveToast: document.getElementById("saveToast"),
  adminBtn: document.getElementById("adminBtn"),
  syncStatus: document.getElementById("syncStatus"),
  orderProduct: document.getElementById("orderProduct"),
  orderType: document.getElementById("orderType"),
  orderQty: document.getElementById("orderQty"),
  orderNote: document.getElementById("orderNote"),
  ordersList: document.getElementById("ordersList"),
  ordersEmpty: document.getElementById("ordersEmpty"),
  importPreviewWrap: document.getElementById("importPreviewWrap"),
  importTableBody: document.getElementById("importTableBody"),
  importCount: document.getElementById("importCount"),
};

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

function toNumOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isNaN(n) ? null : n;
}

function guessCategory(text) {
  const t = String(text || "").toLowerCase();
  if (/fruit|فواكه|فراول|موز|مانج|تفاح|دراجون|مكس فروت/.test(t)) return "fruits";
  if (/candy|حلويات|آيس|ايس|سكيتل|مارش|موتشي|كاندي/.test(t)) return "candy";
  if (/veg|خضار|خضروات|بصل|بطاطس|بطاطا|بامية|كوسة|بنجر/.test(t)) return "vegetables";
  return "fruits";
}

function initCloud() {
  if (!isCloudConfigured() || !window.supabase) {
    cloudReady = false;
    return false;
  }
  try {
    supabase = window.supabase.createClient(
      window.APP_CONFIG.supabaseUrl,
      window.APP_CONFIG.supabaseAnonKey
    );
    cloudReady = true;
    return true;
  } catch (err) {
    console.error(err);
    cloudReady = false;
    return false;
  }
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

function saveLocal() {
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

async function loadFromCloud() {
  const [{ data: prods, error: e1 }, { data: ords, error: e2 }] = await Promise.all([
    supabase.from("products").select("*").order("name"),
    supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return {
    products: (prods || []).map(normalizeProduct),
    orders: ords || [],
  };
}

async function upsertProductsCloud(list) {
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
  const { error } = await supabase.from("products").upsert(rows);
  if (error) throw error;
}

async function insertOrderCloud(order) {
  const { error } = await supabase.from("orders").insert(order);
  if (error) throw error;
}

async function persistAll(message = "تم الحفظ") {
  saveLocal();
  if (cloudReady) {
    try {
      await upsertProductsCloud(products);
      showToast(message + " — متزامن للجميع");
      updateStatusUI();
      return true;
    } catch (err) {
      console.error(err);
      alert("تعذر الحفظ على Supabase. تأكد من المفاتيح والـ schema.");
      showToast("تم الحفظ محلياً فقط");
      return false;
    }
  }
  showToast(message + (cloudReady ? "" : " (محلي)"));
  updateStatusUI();
  return true;
}

function showToast(message) {
  els.saveToast.textContent = message;
  els.saveToast.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => els.saveToast.classList.add("hidden"), 2500);
}

async function initData() {
  const hasCloud = initCloud();
  els.setupBanner.classList.toggle("hidden", hasCloud);

  if (hasCloud) {
    try {
      let remote = await loadFromCloud();
      if (!remote.products.length) {
        const seed = (await loadSharedProducts()) || structuredClone(DEFAULT_PRODUCTS);
        await upsertProductsCloud(seed);
        remote = await loadFromCloud();
      }
      products = remote.products;
      orders = remote.orders;
      saveLocal();
    } catch (err) {
      console.error(err);
      const local = loadLocal();
      products = local?.products || (await loadSharedProducts()) || structuredClone(DEFAULT_PRODUCTS);
      orders = local?.orders || [];
      alert("فشل الاتصال بـ Supabase — تم التحميل من النسخة المحلية.");
    }
  } else {
    const local = loadLocal();
    products = local?.products || (await loadSharedProducts()) || structuredClone(DEFAULT_PRODUCTS);
    orders = local?.orders || [];
  }

  updateAdminUI();
  updateStatusUI();
  fillOrderProductSelect();
  render();
  renderOrders();
}

function updateAdminUI() {
  document.querySelectorAll(".admin-only").forEach((el) => el.classList.toggle("hidden", !isAdmin));
  document.querySelectorAll(".admin-needed").forEach((el) => el.classList.toggle("hidden", isAdmin));
  els.adminBtn.textContent = isAdmin ? "خروج الإدارة" : "دخول الإدارة";
}

function updateStatusUI() {
  if (cloudReady) {
    els.syncStatus.textContent = "متصل بـ Supabase — المخزون والطلبات متزامنة.";
  } else {
    els.syncStatus.textContent = "وضع محلي — فعّل Supabase عشان الأجهزة كلها تشوف نفس البيانات.";
  }
}

function hasPrice(value) {
  return value !== null && value !== undefined && value !== "" && !Number.isNaN(Number(value));
}

function formatMoney(amount) {
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

function parseOptionalPrice(raw) {
  const t = String(raw ?? "").trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isNaN(n) ? null : n;
}

function filteredProducts() {
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
}

function render() {
  const items = filteredProducts();
  els.empty.classList.toggle("hidden", items.length > 0);
  els.productList.innerHTML = "";
  if (!items.length) return;

  const groups =
    activeCategory === "all"
      ? CATEGORY_ORDER.map((cat) => ({ cat, items: items.filter((p) => p.category === cat) })).filter(
          (g) => g.items.length
        )
      : [{ cat: activeCategory, items }];

  let delay = 0;
  for (const group of groups) {
    if (activeCategory === "all") {
      const h = document.createElement("h2");
      h.className = "category-heading";
      h.textContent = CATEGORY_LABELS[group.cat];
      h.style.animationDelay = `${delay}s`;
      els.productList.appendChild(h);
      delay += 0.03;
    }
    for (const product of group.items) {
      els.productList.appendChild(createRow(product, delay));
      delay += 0.03;
    }
  }
}

function createRow(product, delay) {
  const row = document.createElement("article");
  row.className = "product-row product-row-stock";
  row.style.animationDelay = `${delay}s`;
  const low = (product.quantity || 0) <= 0;

  row.innerHTML = `
    <div class="product-info">
      <h3 class="product-name"></h3>
      <p class="product-meta"></p>
    </div>
    <div class="price-cell"><span>١ كجم</span><strong class="p1"></strong></div>
    <div class="price-cell"><span>١٠ كجم</span><strong class="p10"></strong></div>
    <div class="price-cell"><span>٣٠ كجم</span><strong class="p30"></strong></div>
    <div class="price-cell stock-cell ${low ? "stock-low" : ""}">
      <span>المخزون</span>
      <strong class="pq"></strong>
    </div>
    <div class="row-actions admin-only ${isAdmin ? "" : "hidden"}">
      <button type="button" class="icon-btn edit" title="تعديل">✎</button>
      <button type="button" class="icon-btn delete" title="حذف">✕</button>
    </div>
  `;

  row.querySelector(".product-name").textContent = product.name;
  row.querySelector(".product-meta").textContent = product.notes || CATEGORY_LABELS[product.category];
  row.querySelector(".p1").textContent = formatMoney(product.price1kg);
  row.querySelector(".p10").textContent = formatMoney(product.price10kg);
  row.querySelector(".p30").textContent = formatMoney(product.price30kg);
  row.querySelector(".pq").textContent = formatQty(product.quantity);

  const editBtn = row.querySelector(".edit");
  const deleteBtn = row.querySelector(".delete");
  if (editBtn) editBtn.addEventListener("click", () => openDialog(product));
  if (deleteBtn) deleteBtn.addEventListener("click", () => deleteProduct(product.id));
  return row;
}

function fillOrderProductSelect() {
  const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name, "ar"));
  els.orderProduct.innerHTML = sorted
    .map(
      (p) =>
        `<option value="${p.id}">${p.name} — متاح ${formatQty(p.quantity)}</option>`
    )
    .join("");
}

function renderOrders() {
  const list = [...orders].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  els.ordersEmpty.classList.toggle("hidden", list.length > 0);
  els.ordersList.innerHTML = "";
  for (const o of list.slice(0, 50)) {
    const item = document.createElement("article");
    item.className = `order-item ${o.type === "in" ? "order-in" : "order-out"}`;
    const when = o.created_at ? new Date(o.created_at).toLocaleString("ar-EG") : "";
    item.innerHTML = `
      <div>
        <strong></strong>
        <p class="product-meta"></p>
      </div>
      <div class="order-qty"></div>
    `;
    item.querySelector("strong").textContent = o.product_name || o.product_id;
    item.querySelector(".product-meta").textContent = `${o.note || (o.type === "in" ? "إضافة" : "خصم")} · ${when}`;
    item.querySelector(".order-qty").textContent =
      (o.type === "in" ? "+" : "−") + " " + formatQty(o.quantity);
    els.ordersList.appendChild(item);
  }
}

function openDialog(product = null) {
  if (!isAdmin) return;
  editingId = product ? product.id : null;
  els.dialogTitle.textContent = product ? "تعديل منتج" : "إضافة منتج";
  els.productName.value = product?.name || "";
  els.productCategory.value = product?.category || "fruits";
  els.price1kg.value = hasPrice(product?.price1kg) ? product.price1kg : "";
  els.price10kg.value = hasPrice(product?.price10kg) ? product.price10kg : "";
  els.price30kg.value = hasPrice(product?.price30kg) ? product.price30kg : "";
  els.productQty.value = product?.quantity ?? 0;
  els.productNotes.value = product?.notes || "";
  els.dialog.showModal();
  els.productName.focus();
}

async function deleteProduct(id) {
  if (!isAdmin) return;
  const product = products.find((p) => p.id === id);
  if (!product) return;
  if (!confirm(`حذف «${product.name}»؟`)) return;
  products = products.filter((p) => p.id !== id);
  if (cloudReady) {
    await supabase.from("products").delete().eq("id", id);
  }
  await persistAll("تم حذف المنتج");
  fillOrderProductSelect();
  render();
}

els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!isAdmin) return;
  const entry = normalizeProduct({
    id: editingId || uid("p"),
    name: els.productName.value.trim(),
    category: els.productCategory.value,
    price1kg: Number(els.price1kg.value),
    price10kg: parseOptionalPrice(els.price10kg.value),
    price30kg: parseOptionalPrice(els.price30kg.value),
    quantity: Number(els.productQty.value) || 0,
    notes: els.productNotes.value.trim(),
  });
  if (!entry.name || !hasPrice(entry.price1kg)) return;

  if (editingId) products = products.map((p) => (p.id === editingId ? entry : p));
  else products.push(entry);

  els.dialog.close();
  await persistAll("تم حفظ المنتج");
  fillOrderProductSelect();
  render();
});

document.getElementById("orderForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!isAdmin) {
    alert("سجّل دخول الإدارة أولاً");
    return;
  }
  const productId = els.orderProduct.value;
  const type = els.orderType.value;
  const qty = Number(els.orderQty.value);
  const note = els.orderNote.value.trim();
  const product = products.find((p) => p.id === productId);
  if (!product || !(qty > 0)) return;

  if (type === "out" && (product.quantity || 0) < qty) {
    if (!confirm(`المخزون الحالي (${formatQty(product.quantity)}) أقل من المطلوب. تأكيد الخصم؟`)) return;
  }

  const nextQty =
    type === "in" ? (product.quantity || 0) + qty : Math.max(0, (product.quantity || 0) - qty);

  product.quantity = nextQty;
  products = products.map((p) => (p.id === productId ? product : p));

  const order = {
    id: uid("o"),
    product_id: productId,
    product_name: product.name,
    type,
    quantity: qty,
    note,
    created_at: new Date().toISOString(),
  };
  orders = [order, ...orders];

  saveLocal();
  if (cloudReady) {
    try {
      await upsertProductsCloud([product]);
      await insertOrderCloud(order);
      showToast("تم تسجيل الحركة ومزامنتها");
    } catch (err) {
      console.error(err);
      alert("الحركة اتحفظت محلياً لكن المزامنة فشلت");
    }
  } else {
    showToast("تم تسجيل الحركة (محلي)");
  }

  els.orderQty.value = "";
  els.orderNote.value = "";
  fillOrderProductSelect();
  render();
  renderOrders();
  updateStatusUI();
});

/* -------- Smart Excel import -------- */
function normHeader(h) {
  return String(h || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function mapHeader(header) {
  const h = normHeader(header);
  if (/^(name|product|المنتج|اسم|الصنف)$/.test(h) || h.includes("منتج") || h.includes("اسم")) return "name";
  if (/category|تصنيف|قسم|نوع/.test(h)) return "category";
  if (/30|٣٠/.test(h) && (/price|سعر|kg|كجم|كيلو/.test(h) || h.includes("30") || h.includes("٣٠"))) return "price30kg";
  if (/10|١٠/.test(h) && (/price|سعر|kg|كجم|كيلو/.test(h) || true)) {
    if (/10|١٠/.test(h)) return "price10kg";
  }
  if ((/1|١/.test(h) || /price|سعر/.test(h)) && /kg|كجم|كيلو|سعر/.test(h) && !/10|30|١٠|٣٠/.test(h)) return "price1kg";
  if (/^price$|^سعر$/.test(h) || h === "سعر الكيلو") return "price1kg";
  if (/qty|quantity|كمية|المخزون|متاح|stock/.test(h)) return "quantity";
  if (/note|ملاحظ/.test(h)) return "notes";
  return null;
}

function smartMapColumns(headers) {
  const map = {};
  headers.forEach((h, i) => {
    const key = mapHeader(h);
    if (key && map[key] === undefined) map[key] = i;
  });
  // fallback: first column = name if missing
  if (map.name === undefined && headers.length) map.name = 0;
  return map;
}

function parseSheetRows(aoa) {
  if (!aoa?.length) return [];
  const headers = aoa[0];
  const col = smartMapColumns(headers);
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

function showImportPreview(rows) {
  importRows = rows;
  els.importCount.textContent = String(rows.length);
  els.importTableBody.innerHTML = "";
  for (const row of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td></td><td></td><td></td><td></td><td></td><td></td><td></td>`;
    const cells = tr.querySelectorAll("td");
    cells[0].textContent = row.name;
    cells[1].textContent = CATEGORY_LABELS[row.category];
    cells[2].textContent = hasPrice(row.price1kg) ? row.price1kg : "—";
    cells[3].textContent = hasPrice(row.price10kg) ? row.price10kg : "—";
    cells[4].textContent = hasPrice(row.price30kg) ? row.price30kg : "—";
    cells[5].textContent = row.quantity ?? 0;
    cells[6].textContent = row._status;
    els.importTableBody.appendChild(tr);
  }
  els.importPreviewWrap.classList.toggle("hidden", rows.length === 0);
}

document.getElementById("importFile")?.addEventListener("change", async (e) => {
  if (!isAdmin) return;
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    const rows = parseSheetRows(aoa);
    if (!rows.length) {
      alert("لم يتم التعرف على صفوف صالحة. تأكد أن أول صف عناوين وفيه عمود للمنتج.");
      return;
    }
    showImportPreview(rows);
    showToast(`تم تحليل ${rows.length} صف بالذكاء`);
  } catch (err) {
    console.error(err);
    alert("تعذر قراءة الملف. جرّب Excel أو CSV.");
  } finally {
    e.target.value = "";
  }
});

document.getElementById("cancelImportBtn")?.addEventListener("click", () => {
  importRows = [];
  els.importPreviewWrap.classList.add("hidden");
});

document.getElementById("confirmImportBtn")?.addEventListener("click", async () => {
  if (!isAdmin || !importRows.length) return;
  for (const row of importRows) {
    const entry = normalizeProduct({
      ...row,
      id: row._existingId || uid("p"),
    });
    if (row._existingId) {
      const prev = products.find((p) => p.id === row._existingId);
      // keep old prices if import cell empty? we already set values
      if (prev && !hasPrice(entry.price10kg)) entry.price10kg = prev.price10kg;
      if (prev && !hasPrice(entry.price30kg)) entry.price30kg = prev.price30kg;
      products = products.map((p) => (p.id === entry.id ? entry : p));
    } else {
      products.push(entry);
    }
  }
  importRows = [];
  els.importPreviewWrap.classList.add("hidden");
  await persistAll("تم تطبيق الاستيراد");
  fillOrderProductSelect();
  render();
});

/* -------- Views / nav -------- */
document.querySelectorAll(".nav-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-tab").forEach((b) => b.classList.toggle("active", b === btn));
    document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
    document.getElementById(`view-${btn.dataset.view}`).classList.remove("hidden");
    if (btn.dataset.view === "orders") {
      fillOrderProductSelect();
      renderOrders();
    }
  });
});

document.getElementById("cancelBtn").addEventListener("click", () => els.dialog.close());
document.getElementById("addProductBtn").addEventListener("click", () => openDialog());
document.getElementById("printBtn").addEventListener("click", () => window.print());

const adminDialog = document.getElementById("adminDialog");
const adminError = document.getElementById("adminError");
const exportDialog = document.getElementById("exportDialog");

els.adminBtn.addEventListener("click", () => {
  if (isAdmin) {
    isAdmin = false;
    sessionStorage.removeItem(ADMIN_KEY);
    updateAdminUI();
    render();
    return;
  }
  adminError.hidden = true;
  document.getElementById("adminPinInput").value = "";
  adminDialog.showModal();
});
document.getElementById("adminCancelBtn").addEventListener("click", () => adminDialog.close());
document.getElementById("adminForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (document.getElementById("adminPinInput").value !== getAdminPin()) {
    adminError.hidden = false;
    adminError.textContent = "رمز الإدارة غير صحيح.";
    return;
  }
  isAdmin = true;
  sessionStorage.setItem(ADMIN_KEY, "1");
  adminDialog.close();
  updateAdminUI();
  render();
});

document.getElementById("exportSheetBtn").addEventListener("click", () => exportDialog.showModal());
document.getElementById("exportCancelBtn").addEventListener("click", () => exportDialog.close());
document.getElementById("exportDownloadBtn").addEventListener("click", () => {
  downloadPriceSheet(
    document.querySelector('input[name="exportPack"]:checked')?.value || "1kg",
    document.getElementById("exportFiltered").checked
  );
  exportDialog.close();
});

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function packLabel(pack) {
  return pack === "all" ? "full" : pack;
}
function priceOrBlank(value) {
  return hasPrice(value) ? Number(value) : "";
}

function downloadPriceSheet(pack, onlyFiltered) {
  const list = onlyFiltered ? filteredProducts() : [...products];
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
    rows = sorted.map((p) => [p.name, CATEGORY_LABELS[p.category], "١ كجم", priceOrBlank(p.price1kg), p.quantity ?? 0, p.notes || ""]);
  } else if (pack === "10kg") {
    headers = ["المنتج", "التصنيف", "الكمية", `سعر الكيلو (${currencyLabel})`, "المخزون", "ملاحظات"];
    rows = sorted.map((p) => [p.name, CATEGORY_LABELS[p.category], "١٠ كجم", priceOrBlank(p.price10kg), p.quantity ?? 0, p.notes || ""]);
  } else if (pack === "30kg") {
    headers = ["المنتج", "التصنيف", "الكمية", `سعر الكيلو (${currencyLabel})`, "المخزون", "ملاحظات"];
    rows = sorted.map((p) => [p.name, CATEGORY_LABELS[p.category], "٣٠ كجم", priceOrBlank(p.price30kg), p.quantity ?? 0, p.notes || ""]);
  } else {
    headers = ["المنتج", "التصنيف", "١ كجم", "١٠ كجم", "٣٠ كجم", "المخزون", "ملاحظات"];
    rows = sorted.map((p) => [
      p.name,
      CATEGORY_LABELS[p.category],
      priceOrBlank(p.price1kg),
      priceOrBlank(p.price10kg),
      priceOrBlank(p.price30kg),
      p.quantity ?? 0,
      p.notes || "",
    ]);
  }
  const csv = "\uFEFF" + [headers, ...rows].map((r) => r.map(csvEscape).join(",")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `Pro-Business-prices-${packLabel(pack)}-${date}.csv`;
  a.click();
}

els.search.addEventListener("input", () => {
  searchQuery = els.search.value;
  render();
});

document.querySelectorAll(".category-tabs .tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".category-tabs .tab").forEach((t) => {
      t.classList.toggle("active", t === tab);
      t.setAttribute("aria-selected", t === tab ? "true" : "false");
    });
    activeCategory = tab.dataset.category;
    render();
  });
});

els.currency.value = currency;
els.currency.addEventListener("change", () => {
  currency = els.currency.value;
  localStorage.setItem(CURRENCY_KEY, currency);
  render();
});

updateAdminUI();
initData();

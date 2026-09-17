const STORAGE_KEY = "drypeak-price-list-v3";
const CURRENCY_KEY = "drypeak-currency-v2";

const CATEGORY_LABELS = {
  fruits: "فواكه",
  candy: "حلويات",
  vegetables: "خضروات",
};

const CATEGORY_ORDER = ["fruits", "candy", "vegetables"];

/**
 * الأسعار = سعر الكيلو الواحد (جنيه)
 * price1kg  = سعر الكيلو عند شراء ١ كجم
 * price10kg / price30kg = تُضاف لاحقاً (فارغة الآن)
 */
const DEFAULT_PRODUCTS = [
  // فواكه
  { id: "f1", name: "مكس فروت", category: "fruits", price1kg: 2200, price10kg: null, price30kg: null, notes: "" },
  { id: "f2", name: "موز شرائح", category: "fruits", price1kg: 1250, price10kg: null, price30kg: null, notes: "" },
  { id: "f3", name: "موز حبة كاملة", category: "fruits", price1kg: 1250, price10kg: null, price30kg: null, notes: "" },
  { id: "f4", name: "فراولة حبة كاملة", category: "fruits", price1kg: 1850, price10kg: null, price30kg: null, notes: "" },
  { id: "f5", name: "مانجا شرائح", category: "fruits", price1kg: 1900, price10kg: null, price30kg: null, notes: "" },
  { id: "f6", name: "تفاح شرائح", category: "fruits", price1kg: 1850, price10kg: null, price30kg: null, notes: "" },
  { id: "f7", name: "دراجون فروت", category: "fruits", price1kg: 1900, price10kg: null, price30kg: null, notes: "" },

  // حلويات
  { id: "c1", name: "آيس كريم ساندوتش أوريو", category: "candy", price1kg: 1750, price10kg: null, price30kg: null, notes: "" },
  { id: "c2", name: "آيس كريم ساندوتش ميكس", category: "candy", price1kg: 1700, price10kg: null, price30kg: null, notes: "" },
  { id: "c3", name: "آيس كريم شرائح", category: "candy", price1kg: 1800, price10kg: null, price30kg: null, notes: "" },
  { id: "c4", name: "كاندي ميكس", category: "candy", price1kg: 1500, price10kg: null, price30kg: null, notes: "" },
  { id: "c5", name: "سكيتلز مكس", category: "candy", price1kg: 1800, price10kg: null, price30kg: null, notes: "" },
  { id: "c6", name: "مارشميلو مصري", category: "candy", price1kg: 650, price10kg: null, price30kg: null, notes: "" },
  { id: "c7", name: "مارشميلو إسباني", category: "candy", price1kg: 875, price10kg: null, price30kg: null, notes: "" },
  { id: "c8", name: "مارشميلو مجسمات", category: "candy", price1kg: 1500, price10kg: null, price30kg: null, notes: "" },
  { id: "c9", name: "موتشي مقرمش مكس فراولة وفانيليا", category: "candy", price1kg: 1050, price10kg: null, price30kg: null, notes: "" },

  // خضروات
  { id: "v1", name: "ميكس خضار", category: "vegetables", price1kg: 1100, price10kg: null, price30kg: null, notes: "كيس ٣ كجم = ٩٥٠ ج.م للكيلو" },
  { id: "v2", name: "بامية", category: "vegetables", price1kg: 1500, price10kg: null, price30kg: null, notes: "" },
  { id: "v3", name: "بطاطس", category: "vegetables", price1kg: 1500, price10kg: null, price30kg: null, notes: "" },
  { id: "v4", name: "بطاطا", category: "vegetables", price1kg: 1500, price10kg: null, price30kg: null, notes: "" },
  { id: "v5", name: "بنجر", category: "vegetables", price1kg: 1500, price10kg: null, price30kg: null, notes: "" },
  { id: "v6", name: "كوسة", category: "vegetables", price1kg: 1500, price10kg: null, price30kg: null, notes: "" },
  { id: "v7", name: "بصل", category: "vegetables", price1kg: 1600, price10kg: null, price30kg: null, notes: "" },
];

let products = loadProductsFromLocal() || structuredClone(DEFAULT_PRODUCTS);
let activeCategory = "all";
let searchQuery = "";
let currency = localStorage.getItem(CURRENCY_KEY) || "EGP";
let editingId = null;

const els = {
  list: document.getElementById("productList"),
  empty: document.getElementById("emptyState"),
  search: document.getElementById("searchInput"),
  currency: document.getElementById("currencySelect"),
  dialog: document.getElementById("productDialog"),
  form: document.getElementById("productForm"),
  dialogTitle: document.getElementById("dialogTitle"),
  productId: document.getElementById("productId"),
  productName: document.getElementById("productName"),
  productCategory: document.getElementById("productCategory"),
  price1kg: document.getElementById("price1kg"),
  price10kg: document.getElementById("price10kg"),
  price30kg: document.getElementById("price30kg"),
  productNotes: document.getElementById("productNotes"),
};

function loadProductsFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

async function loadSharedProducts() {
  try {
    const res = await fetch(`products.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const parsed = await res.json();
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function initProducts() {
  const local = loadProductsFromLocal();
  if (local) {
    products = local;
    render();
    return;
  }
  const shared = await loadSharedProducts();
  products = shared || structuredClone(DEFAULT_PRODUCTS);
  render();
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
  if (currency === "EGP") return `${formatted} ج.م`;
  return `${currency}${formatted}`;
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
    const catOk = activeCategory === "all" || p.category === activeCategory;
    if (!catOk) return false;
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.notes || "").toLowerCase().includes(q) ||
      (CATEGORY_LABELS[p.category] || "").toLowerCase().includes(q)
    );
  });
}

function render() {
  const items = filteredProducts();
  els.empty.classList.toggle("hidden", items.length > 0);
  els.list.innerHTML = "";

  if (items.length === 0) return;

  const groups =
    activeCategory === "all"
      ? CATEGORY_ORDER.map((cat) => ({
          cat,
          items: items.filter((p) => p.category === cat),
        })).filter((g) => g.items.length > 0)
      : [{ cat: activeCategory, items }];

  let delay = 0;
  for (const group of groups) {
    if (activeCategory === "all") {
      const h = document.createElement("h2");
      h.className = "category-heading";
      h.textContent = CATEGORY_LABELS[group.cat];
      h.style.animationDelay = `${delay}s`;
      els.list.appendChild(h);
      delay += 0.03;
    }

    for (const product of group.items) {
      els.list.appendChild(createRow(product, delay));
      delay += 0.03;
    }
  }
}

function createRow(product, delay) {
  const row = document.createElement("article");
  row.className = "product-row";
  row.style.animationDelay = `${delay}s`;
  row.dataset.id = product.id;

  row.innerHTML = `
    <div class="product-info">
      <h3 class="product-name"></h3>
      <p class="product-meta"></p>
    </div>
    <div class="price-cell">
      <span>سعر الكيلو · ١ كجم</span>
      <strong class="p1"></strong>
    </div>
    <div class="price-cell">
      <span>سعر الكيلو · ١٠ كجم</span>
      <strong class="p10"></strong>
    </div>
    <div class="price-cell">
      <span>سعر الكيلو · ٣٠ كجم</span>
      <strong class="p30"></strong>
    </div>
    <div class="row-actions">
      <button type="button" class="icon-btn edit" title="تعديل" aria-label="تعديل المنتج">✎</button>
      <button type="button" class="icon-btn delete" title="حذف" aria-label="حذف المنتج">✕</button>
    </div>
  `;

  row.querySelector(".product-name").textContent = product.name;
  row.querySelector(".product-meta").textContent = product.notes || CATEGORY_LABELS[product.category];
  row.querySelector(".p1").textContent = formatMoney(product.price1kg);
  row.querySelector(".p10").textContent = formatMoney(product.price10kg);
  row.querySelector(".p30").textContent = formatMoney(product.price30kg);

  row.querySelector(".edit").addEventListener("click", () => openDialog(product));
  row.querySelector(".delete").addEventListener("click", () => deleteProduct(product.id));

  return row;
}

function openDialog(product = null) {
  editingId = product ? product.id : null;
  els.dialogTitle.textContent = product ? "تعديل منتج" : "إضافة منتج";
  els.productId.value = product?.id || "";
  els.productName.value = product?.name || "";
  els.productCategory.value = product?.category || "fruits";
  els.price1kg.value = hasPrice(product?.price1kg) ? product.price1kg : "";
  els.price10kg.value = hasPrice(product?.price10kg) ? product.price10kg : "";
  els.price30kg.value = hasPrice(product?.price30kg) ? product.price30kg : "";
  els.productNotes.value = product?.notes || "";
  els.dialog.showModal();
  els.productName.focus();
}

function deleteProduct(id) {
  const product = products.find((p) => p.id === id);
  if (!product) return;
  if (!confirm(`حذف «${product.name}»؟`)) return;
  products = products.filter((p) => p.id !== id);
  saveProducts();
  render();
}

function uid() {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const entry = {
    id: editingId || uid(),
    name: els.productName.value.trim(),
    category: els.productCategory.value,
    price1kg: Number(els.price1kg.value),
    price10kg: parseOptionalPrice(els.price10kg.value),
    price30kg: parseOptionalPrice(els.price30kg.value),
    notes: els.productNotes.value.trim(),
  };

  if (!entry.name || Number.isNaN(entry.price1kg)) return;

  if (editingId) {
    products = products.map((p) => (p.id === editingId ? entry : p));
  } else {
    products.push(entry);
  }

  saveProducts();
  els.dialog.close();
  render();
});

document.getElementById("cancelBtn").addEventListener("click", () => els.dialog.close());
document.getElementById("addProductBtn").addEventListener("click", () => openDialog());
document.getElementById("printBtn").addEventListener("click", () => window.print());

const exportDialog = document.getElementById("exportDialog");
const syncDialog = document.getElementById("syncDialog");
const syncMessage = document.getElementById("syncMessage");
const importFileInput = document.getElementById("importFileInput");

document.getElementById("syncBtn").addEventListener("click", () => {
  syncMessage.hidden = true;
  syncDialog.showModal();
});

document.getElementById("syncCloseBtn").addEventListener("click", () => syncDialog.close());

document.getElementById("exportBackupBtn").addEventListener("click", () => {
  const payload = {
    app: "Pro Business",
    exportedAt: new Date().toISOString(),
    products,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Pro-Business-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  syncMessage.hidden = false;
  syncMessage.textContent = "تم التحميل. ابعت الملف للجهاز التاني واستورده من هناك.";
});

document.getElementById("importBackupBtn").addEventListener("click", () => {
  importFileInput.click();
});

importFileInput.addEventListener("change", async () => {
  const file = importFileInput.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const list = Array.isArray(parsed) ? parsed : parsed.products;
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error("empty");
    }
    products = list;
    saveProducts();
    render();
    syncMessage.hidden = false;
    syncMessage.textContent = `تم الاستيراد بنجاح (${list.length} منتج).`;
  } catch {
    syncMessage.hidden = false;
    syncMessage.textContent = "الملف غير صالح. اختار نسخة JSON اتصدّرت من التطبيق.";
  } finally {
    importFileInput.value = "";
  }
});

document.getElementById("exportSheetBtn").addEventListener("click", () => {
  exportDialog.showModal();
});

document.getElementById("exportCancelBtn").addEventListener("click", () => {
  exportDialog.close();
});

document.getElementById("exportDownloadBtn").addEventListener("click", () => {
  const pack = document.querySelector('input[name="exportPack"]:checked')?.value || "1kg";
  const onlyFiltered = document.getElementById("exportFiltered").checked;
  downloadPriceSheet(pack, onlyFiltered);
  exportDialog.close();
});

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function packLabel(pack) {
  if (pack === "1kg") return "1kg";
  if (pack === "10kg") return "10kg";
  if (pack === "30kg") return "30kg";
  return "full";
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
    headers = ["المنتج", "التصنيف", "الكمية", `سعر الكيلو (${currencyLabel})`, "ملاحظات"];
    rows = sorted.map((p) => [p.name, CATEGORY_LABELS[p.category], "١ كجم", priceOrBlank(p.price1kg), p.notes || ""]);
  } else if (pack === "10kg") {
    headers = ["المنتج", "التصنيف", "الكمية", `سعر الكيلو (${currencyLabel})`, "ملاحظات"];
    rows = sorted.map((p) => [p.name, CATEGORY_LABELS[p.category], "١٠ كجم", priceOrBlank(p.price10kg), p.notes || ""]);
  } else if (pack === "30kg") {
    headers = ["المنتج", "التصنيف", "الكمية", `سعر الكيلو (${currencyLabel})`, "ملاحظات"];
    rows = sorted.map((p) => [p.name, CATEGORY_LABELS[p.category], "٣٠ كجم", priceOrBlank(p.price30kg), p.notes || ""]);
  } else {
    headers = [
      "المنتج",
      "التصنيف",
      `سعر الكيلو · ١ كجم (${currencyLabel})`,
      `سعر الكيلو · ١٠ كجم (${currencyLabel})`,
      `سعر الكيلو · ٣٠ كجم (${currencyLabel})`,
      "ملاحظات",
    ];
    rows = sorted.map((p) => [
      p.name,
      CATEGORY_LABELS[p.category],
      priceOrBlank(p.price1kg),
      priceOrBlank(p.price10kg),
      priceOrBlank(p.price30kg),
      p.notes || "",
    ]);
  }

  const lines = [headers, ...rows].map((row) => row.map(csvEscape).join(","));
  const csv = "\uFEFF" + lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Pro-Business-prices-${packLabel(pack)}-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

els.search.addEventListener("input", () => {
  searchQuery = els.search.value;
  render();
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => {
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

initProducts();

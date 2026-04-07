/**
 * data.js — Storage layer for Despensa app
 * Uses localStorage to persist all data.
 */

const DB_KEYS = {
  products: 'despensa_products',
  list:     'despensa_list',
};

// ── Default seed data ─────────────────────────────────────────
const SEED_PRODUCTS = [
  { id: 'p1',  zone: 'despensa',   category: 'granos',     name: 'Arroz',          qty: 2,  unit: 'kg',     status: 'ok',      emoji: '🌾', expiry: '', notes: '' },
  { id: 'p2',  zone: 'despensa',   category: 'granos',     name: 'Pasta',          qty: 3,  unit: 'paquete',status: 'ok',      emoji: '🍝', expiry: '', notes: '' },
  { id: 'p3',  zone: 'despensa',   category: 'conservas',  name: 'Tomate frito',   qty: 4,  unit: 'bote',   status: 'ok',      emoji: '🥫', expiry: '', notes: '' },
  { id: 'p4',  zone: 'despensa',   category: 'conservas',  name: 'Atún en lata',   qty: 6,  unit: 'bote',   status: 'ok',      emoji: '🐟', expiry: '', notes: '' },
  { id: 'p5',  zone: 'despensa',   category: 'condimentos',name: 'Aceite de oliva',qty: 1,  unit: 'L',      status: 'low',     emoji: '🫒', expiry: '', notes: '' },
  { id: 'p6',  zone: 'despensa',   category: 'condimentos',name: 'Sal',            qty: 1,  unit: 'bote',   status: 'ok',      emoji: '🧂', expiry: '', notes: '' },
  { id: 'p7',  zone: 'despensa',   category: 'granos',     name: 'Lentejas',       qty: 0,  unit: 'kg',     status: 'missing', emoji: '🫘', expiry: '', notes: '' },
  { id: 'p8',  zone: 'nevera',    category: 'lacteos',    name: 'Leche',          qty: 2,  unit: 'L',      status: 'ok',      emoji: '🥛', expiry: '', notes: '' },
  { id: 'p9',  zone: 'nevera',    category: 'lacteos',    name: 'Mantequilla',    qty: 1,  unit: 'ud',     status: 'ok',      emoji: '🧈', expiry: '', notes: '' },
  { id: 'p10', zone: 'nevera',    category: 'lacteos',    name: 'Huevos',         qty: 6,  unit: 'ud',     status: 'low',     emoji: '🥚', expiry: '', notes: '' },
  { id: 'p11', zone: 'nevera',    category: 'frutas',     name: 'Zanahoria',      qty: 4,  unit: 'ud',     status: 'ok',      emoji: '🥕', expiry: '', notes: '' },
  { id: 'p12', zone: 'nevera',    category: 'frutas',     name: 'Tomate',         qty: 3,  unit: 'ud',     status: 'ok',      emoji: '🍅', expiry: '', notes: '' },
  { id: 'p13', zone: 'nevera',    category: 'carnes',     name: 'Pollo',          qty: 0,  unit: 'kg',     status: 'missing', emoji: '🍗', expiry: '', notes: '' },
  { id: 'p14', zone: 'congelador',category: 'carnes',     name: 'Carne picada',   qty: 2,  unit: 'kg',     status: 'ok',      emoji: '🥩', expiry: '', notes: '' },
  { id: 'p15', zone: 'congelador',category: 'carnes',     name: 'Merluza',        qty: 1,  unit: 'kg',     status: 'ok',      emoji: '🐟', expiry: '', notes: '' },
  { id: 'p16', zone: 'congelador',category: 'precocinados',name:'Pizza',           qty: 2,  unit: 'ud',     status: 'ok',      emoji: '🍕', expiry: '', notes: '' },
];

// ── Category metadata ──────────────────────────────────────────
const CATEGORIES = {
  frutas:      { label: 'Frutas y verduras',  emoji: '🍎', color: 'var(--cat-frutas)'      },
  lacteos:     { label: 'Lácteos y huevos',   emoji: '🥛', color: 'var(--cat-lacteos)'     },
  carnes:      { label: 'Carnes y pescados',  emoji: '🥩', color: 'var(--cat-carnes)'      },
  conservas:   { label: 'Conservas',          emoji: '🥫', color: 'var(--cat-conservas)'   },
  granos:      { label: 'Granos y cereales',  emoji: '🌾', color: 'var(--cat-granos)'      },
  condimentos: { label: 'Condimentos',        emoji: '🧂', color: 'var(--cat-condimentos)' },
  bebidas:     { label: 'Bebidas',            emoji: '🧃', color: 'var(--cat-bebidas)'     },
  pan:         { label: 'Pan y repostería',   emoji: '🍞', color: 'var(--cat-pan)'         },
  precocinados:{ label: 'Precocinados',       emoji: '🍱', color: 'var(--cat-precocinados)'},
  otros:       { label: 'Otros',              emoji: '📦', color: 'var(--cat-otros)'       },
};

// ── Status metadata ────────────────────────────────────────────
const STATUS_META = {
  ok:      { label: 'Tengo',       icon: '✅' },
  low:     { label: 'Queda poco',  icon: '🔶' },
  missing: { label: 'Falta',       icon: '⚠️' },
};

// ── CRUD helpers ───────────────────────────────────────────────
function loadProducts() {
  try {
    const raw = localStorage.getItem(DB_KEYS.products);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  // Seed on first load
  saveProducts(SEED_PRODUCTS);
  return SEED_PRODUCTS;
}

function saveProducts(products) {
  localStorage.setItem(DB_KEYS.products, JSON.stringify(products));
}

function loadList() {
  try {
    const raw = localStorage.getItem(DB_KEYS.list);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return [];
}

function saveList(list) {
  localStorage.setItem(DB_KEYS.list, JSON.stringify(list));
}

function generateId() {
  return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function generateListId() {
  return 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── Category emoji map (auto-assign by category) ───────────────
const CAT_EMOJIS = {
  frutas: ['🍎','🍊','🍋','🍇','🍓','🫐','🍑','🥝','🥦','🥕','🍅','🧅','🧄','🫛','🌽','🥬','🥒'],
  lacteos: ['🥛','🧀','🥚','🧈','🍦'],
  carnes: ['🥩','🍗','🥓','🌭','🐟','🦐','🦑'],
  conservas: ['🥫','🫙'],
  granos: ['🌾','🍚','🍝','🫘','🥜'],
  condimentos: ['🧂','🫒','🌶️','🧄','🍯','🫚'],
  bebidas: ['🧃','🥤','☕','🍵','💧','🍺'],
  pan: ['🍞','🥐','🧇','🥞','🍰','🍪'],
  precocinados: ['🍕','🌮','🍔','🍜','🥡'],
  otros: ['📦','🛒'],
};

function getDefaultEmoji(category) {
  const list = CAT_EMOJIS[category] || CAT_EMOJIS.otros;
  return list[0];
}

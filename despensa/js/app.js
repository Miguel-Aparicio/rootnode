/**
 * app.js — Main application logic for Despensa
 */

'use strict';

// ── State ──────────────────────────────────────────────────────
let products = loadProducts();
let shoppingList = loadList();
let currentZone = 'despensa';
let currentFilter = 'all';
let searchQuery = '';
let shoppingMode = false;
let editingProductId = null;

// ── DOM refs ───────────────────────────────────────────────────
const zoneTabs      = document.querySelectorAll('.zone-tab');
const panels        = document.querySelectorAll('.panel');
const filterChips   = document.querySelectorAll('.filter-chip');
const searchInput   = document.getElementById('search-input');
const toolbarInv    = document.getElementById('toolbar-inventory');
const badgeLista    = document.getElementById('badge-lista');
const btnAddProduct = document.getElementById('btn-add-product');
const btnShopMode   = document.getElementById('btn-shopping-mode');

// Product modal
const modalProduct     = document.getElementById('modal-product');
const modalProductTitle= document.getElementById('modal-product-title');
const modalProductId   = document.getElementById('modal-product-id');
const modalProductSave = document.getElementById('modal-product-save');
const modalProductDel  = document.getElementById('modal-product-delete');
const modalProductClose= document.getElementById('modal-product-close');
const modalProductCancel= document.getElementById('modal-product-cancel');
const fieldName   = document.getElementById('field-name');
const fieldZone   = document.getElementById('field-zone');
const fieldCat    = document.getElementById('field-category');
const fieldQty    = document.getElementById('field-qty');
const fieldUnit   = document.getElementById('field-unit');
const fieldStatus = document.getElementById('field-status');
const fieldExpiry = document.getElementById('field-expiry');
const fieldNotes  = document.getElementById('field-notes');

// List modal
const modalListItem    = document.getElementById('modal-listitem');
const modalListClose   = document.getElementById('modal-listitem-close');
const modalListCancel  = document.getElementById('modal-listitem-cancel');
const modalListSave    = document.getElementById('modal-listitem-save');
const listitemName     = document.getElementById('listitem-name');
const listitemQty      = document.getElementById('listitem-qty');

const shoppingListEl   = document.getElementById('shopping-list');
const shoppingEmpty    = document.getElementById('shopping-empty');
const btnAddFromMissing= document.getElementById('btn-add-from-missing');
const btnClearChecked  = document.getElementById('btn-clear-checked');
const btnShareList     = document.getElementById('btn-share-list');

// ── Zone Tab switching ─────────────────────────────────────────
zoneTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const zone = tab.dataset.zone;
    currentZone = zone;
    zoneTabs.forEach(t => { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', t === tab); });
    panels.forEach(p => p.classList.toggle('active', p.id === `panel-${zone}`));

    // toolbar only shown for inventory panels
    toolbarInv.hidden = (zone === 'lista');
    renderCurrentZone();
  });
});

// ── Filter chips ───────────────────────────────────────────────
filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    currentFilter = chip.dataset.filter;
    filterChips.forEach(c => c.classList.toggle('active', c === chip));
    renderCurrentZone();
  });
});

// ── Search ─────────────────────────────────────────────────────
searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.trim().toLowerCase();
  renderCurrentZone();
});

// ── Shopping mode ──────────────────────────────────────────────
btnShopMode.addEventListener('click', () => {
  shoppingMode = !shoppingMode;
  btnShopMode.classList.toggle('active', shoppingMode);
  document.getElementById('btn-add-product').classList.toggle('shopping', shoppingMode);

  // Toast
  if (shoppingMode) {
    showBanner('🛒 Modo compra activo — el botón + añade a la lista');
  } else {
    removeBanner();
  }
});

// ── FAB ────────────────────────────────────────────────────────
btnAddProduct.addEventListener('click', () => {
  if (shoppingMode) {
    openListItemModal();
  } else {
    openProductModal(null);
  }
});

// ── Product Modal ──────────────────────────────────────────────
function openProductModal(product) {
  editingProductId = product ? product.id : null;
  modalProductTitle.textContent = product ? 'Editar producto' : 'Añadir producto';
  modalProductId.value = product ? product.id : '';
  fieldName.value   = product ? product.name : '';
  fieldZone.value   = product ? product.zone : currentZone !== 'lista' ? currentZone : 'despensa';
  fieldCat.value    = product ? product.category : 'otros';
  fieldQty.value    = product ? product.qty : 1;
  fieldUnit.value   = product ? product.unit : 'ud';
  fieldStatus.value = product ? product.status : 'ok';
  fieldExpiry.value = product ? (product.expiry || '') : '';
  fieldNotes.value  = product ? (product.notes || '') : '';
  modalProductDel.hidden = !product;
  modalProductDel.className = 'btn btn--danger btn--sm';

  modalProduct.hidden = false;
  requestAnimationFrame(() => fieldName.focus());
  document.addEventListener('keydown', handleModalKeydown);
}

function closeProductModal() {
  modalProduct.hidden = true;
  document.removeEventListener('keydown', handleModalKeydown);
}

function handleModalKeydown(e) {
  if (e.key === 'Escape') { closeProductModal(); closeListItemModal(); }
}

modalProductClose.addEventListener('click', closeProductModal);
modalProductCancel.addEventListener('click', closeProductModal);
modalProduct.addEventListener('click', e => { if (e.target === modalProduct) closeProductModal(); });

// Qty stepper
document.getElementById('qty-plus').addEventListener('click', () => {
  fieldQty.value = Math.max(0, parseInt(fieldQty.value || 0) + 1);
});
document.getElementById('qty-minus').addEventListener('click', () => {
  fieldQty.value = Math.max(0, parseInt(fieldQty.value || 0) - 1);
});

// Save product
modalProductSave.addEventListener('click', () => {
  const name = fieldName.value.trim();
  if (!name) { fieldName.focus(); showToast('Escribe el nombre del producto', 'warn'); return; }

  const isEdit = !!editingProductId;
  if (isEdit) {
    const idx = products.findIndex(p => p.id === editingProductId);
    if (idx !== -1) {
      products[idx] = {
        ...products[idx],
        name,
        zone:     fieldZone.value,
        category: fieldCat.value,
        qty:      parseInt(fieldQty.value) || 0,
        unit:     fieldUnit.value,
        status:   fieldStatus.value,
        expiry:   fieldExpiry.value || '',
        notes:    fieldNotes.value.trim(),
      };
    }
    showToast('✅ Producto actualizado');
  } else {
    const newProduct = {
      id:       generateId(),
      name,
      zone:     fieldZone.value,
      category: fieldCat.value,
      qty:      parseInt(fieldQty.value) || 0,
      unit:     fieldUnit.value,
      status:   fieldStatus.value,
      expiry:   fieldExpiry.value || '',
      notes:    fieldNotes.value.trim(),
      emoji:    getDefaultEmoji(fieldCat.value),
    };
    products.push(newProduct);
    showToast('✅ Producto añadido');
  }

  saveProducts(products);
  closeProductModal();
  renderAll();
});

// Delete product
modalProductDel.addEventListener('click', () => {
  if (!editingProductId) return;
  products = products.filter(p => p.id !== editingProductId);
  saveProducts(products);
  closeProductModal();
  renderAll();
  showToast('🗑️ Producto eliminado', 'warn');
});

// ── List Item Modal ────────────────────────────────────────────
function openListItemModal(prefillName = '', prefillQty = '') {
  listitemName.value = prefillName;
  listitemQty.value  = prefillQty;
  modalListItem.hidden = false;
  requestAnimationFrame(() => listitemName.focus());
}

function closeListItemModal() {
  modalListItem.hidden = true;
}

modalListClose.addEventListener('click', closeListItemModal);
modalListCancel.addEventListener('click', closeListItemModal);
modalListItem.addEventListener('click', e => { if (e.target === modalListItem) closeListItemModal(); });

modalListSave.addEventListener('click', () => {
  const name = listitemName.value.trim();
  if (!name) { listitemName.focus(); showToast('Escribe el nombre', 'warn'); return; }
  addToList(name, listitemQty.value.trim());
  closeListItemModal();
  updateListBadge();
});

// Enter key to submit list modal
listitemName.addEventListener('keydown', e => { if (e.key === 'Enter') { listitemQty.focus(); } });
listitemQty.addEventListener('keydown', e => { if (e.key === 'Enter') { modalListSave.click(); } });

function addToList(name, qty) {
  const item = {
    id:      generateListId(),
    name,
    qty:     qty || '',
    checked: false,
  };
  shoppingList.push(item);
  saveList(shoppingList);
  renderShoppingList();
  showToast(`📋 "${name}" añadido a la lista`);
}

// ── Import missing products to list ───────────────────────────
btnAddFromMissing.addEventListener('click', () => {
  const missing = products.filter(p => p.status === 'missing');
  if (!missing.length) { showToast('No hay productos marcados como "Falta"', 'warn'); return; }
  let added = 0;
  missing.forEach(p => {
    const alreadyIn = shoppingList.some(i => i.name.toLowerCase() === p.name.toLowerCase());
    if (!alreadyIn) {
      shoppingList.push({ id: generateListId(), name: p.name, qty: `1 ${p.unit}`, checked: false });
      added++;
    }
  });
  saveList(shoppingList);
  renderShoppingList();
  updateListBadge();
  showToast(`📋 ${added} producto${added !== 1 ? 's' : ''} importado${added !== 1 ? 's' : ''}`);
});

// ── Clear checked ──────────────────────────────────────────────
btnClearChecked.addEventListener('click', () => {
  const before = shoppingList.length;
  shoppingList = shoppingList.filter(i => !i.checked);
  saveList(shoppingList);
  renderShoppingList();
  updateListBadge();
  const removed = before - shoppingList.length;
  showToast(`🗑️ ${removed} ítem${removed !== 1 ? 's' : ''} eliminado${removed !== 1 ? 's' : ''}`);
});

// ── Share list ─────────────────────────────────────────────────
btnShareList.addEventListener('click', () => {
  if (!shoppingList.length) { showToast('La lista está vacía', 'warn'); return; }
  const text = shoppingList
    .filter(i => !i.checked)
    .map(i => `• ${i.name}${i.qty ? ' — ' + i.qty : ''}`)
    .join('\n');
  if (navigator.share) {
    navigator.share({ title: 'Lista de la compra', text }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast('📋 Lista copiada al portapapeles'));
  }
});

// ── Rendering ──────────────────────────────────────────────────
function getFilteredProducts(zone) {
  return products.filter(p => {
    if (p.zone !== zone) return false;
    if (currentFilter !== 'all' && p.status !== currentFilter) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery)) return false;
    return true;
  });
}

function renderCurrentZone() {
  if (currentZone === 'lista') return;
  renderZone(currentZone);
}

function renderAll() {
  ['despensa', 'nevera', 'congelador'].forEach(renderZone);
  renderShoppingList();
  updateListBadge();
}

function renderZone(zone) {
  const listEl  = document.getElementById(`list-${zone}`);
  const emptyEl = document.getElementById(`empty-${zone}`);
  if (!listEl || !emptyEl) return;

  const filtered = getFilteredProducts(zone);

  if (!filtered.length) {
    listEl.innerHTML = '';
    emptyEl.hidden = false;
    // Also render stats for context
    renderStatsBar(zone, listEl);
    return;
  }
  emptyEl.hidden = true;

  // Group by category
  const groups = {};
  filtered.forEach(p => {
    if (!groups[p.category]) groups[p.category] = [];
    groups[p.category].push(p);
  });

  // Sort categories by label
  const sortedCats = Object.keys(groups).sort((a, b) => {
    return (CATEGORIES[a]?.label || a).localeCompare(CATEGORIES[b]?.label || b);
  });

  // Stats bar (total by zone, not filter-dependent)
  const statsHtml = buildStatsHtml(zone);

  let html = statsHtml;

  sortedCats.forEach(cat => {
    const catMeta = CATEGORIES[cat] || { label: cat, emoji: '📦', color: 'var(--cat-otros)' };
    const items = groups[cat];
    html += `
      <div class="category-section" data-cat="${cat}">
        <div class="category-header" role="button" tabindex="0" aria-expanded="true">
          <span class="category-header__dot" style="background:${catMeta.color}"></span>
          <span class="category-header__name">${catMeta.emoji} ${catMeta.label}</span>
          <span class="category-header__count">${items.length}</span>
          <svg class="category-header__chevron" viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1 1l5 5 5-5"/></svg>
        </div>
        <div class="product-grid">
          ${items.map(p => buildProductCard(p)).join('')}
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;

  // Attach collapse toggles
  listEl.querySelectorAll('.category-header').forEach(h => {
    h.addEventListener('click', () => h.closest('.category-section').classList.toggle('collapsed'));
    h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') h.click(); });
  });

  // Attach card click
  listEl.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.product-card__quick-add')) return;
      const product = products.find(p => p.id === card.dataset.id);
      if (product) openProductModal(product);
    });
  });

  // Quick-add to list button on missing cards
  listEl.querySelectorAll('.product-card__quick-add').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const product = products.find(p => p.id === btn.dataset.id);
      if (!product) return;
      addToList(product.name, `1 ${product.unit}`);
      // Switch to lista tab feedback
    });
  });
}

function buildProductCard(p) {
  const statusIcon = STATUS_META[p.status]?.icon || '';
  const isMissing = p.status === 'missing';
  const isLow     = p.status === 'low';
  const isExpiring = p.expiry ? getExpiryStatus(p.expiry) !== 'ok' : false;

  let classes = 'product-card';
  if (isMissing)  classes += ' product-card--missing';
  if (isLow)      classes += ' product-card--low';
  if (isExpiring) classes += ' product-card--expiring';

  const qtyText = p.qty > 0 ? `${p.qty} ${p.unit}` : isMissing ? 'Falta' : '0 ' + p.unit;
  const emoji = p.emoji || getDefaultEmoji(p.category);

  let expiryHtml = '';
  if (p.expiry) {
    const es = getExpiryStatus(p.expiry);
    const daysLeft = getDaysUntilExpiry(p.expiry);
    let expiryClass = 'product-card__expiry';
    let expiryText = '';
    if (es === 'expired') { expiryClass += ' product-card__expiry--danger'; expiryText = 'Caducado'; }
    else if (es === 'danger') { expiryClass += ' product-card__expiry--danger'; expiryText = `Caduca en ${daysLeft}d`; }
    else if (es === 'warn')   { expiryClass += ' product-card__expiry--warn';   expiryText = `Caduca en ${daysLeft}d`; }
    else { expiryText = formatExpiryDate(p.expiry); }
    expiryHtml = `<span class="${expiryClass}">${expiryText}</span>`;
  }

  const quickAdd = isMissing
    ? `<button class="product-card__quick-add" data-id="${p.id}" title="Añadir a la lista" aria-label="Añadir ${p.name} a la lista">+</button>`
    : '';

  return `
    <div class="${classes}" data-id="${p.id}" role="button" tabindex="0" aria-label="${p.name}">
      <span class="product-card__status" aria-hidden="true">${statusIcon}</span>
      <span class="product-card__emoji" aria-hidden="true">${emoji}</span>
      <span class="product-card__name">${escHtml(p.name)}</span>
      <span class="product-card__qty">${qtyText}</span>
      ${expiryHtml}
      ${quickAdd}
    </div>
  `;
}

function buildStatsHtml(zone) {
  const zoneProds = products.filter(p => p.zone === zone);
  const total   = zoneProds.length;
  const ok      = zoneProds.filter(p => p.status === 'ok').length;
  const low     = zoneProds.filter(p => p.status === 'low').length;
  const missing = zoneProds.filter(p => p.status === 'missing').length;
  const expiring = zoneProds.filter(p => p.expiry && getExpiryStatus(p.expiry) !== 'ok').length;

  if (!total) return '';

  return `
    <div class="stats-bar">
      <div class="stat-pill"><span class="stat-pill__dot" style="background:var(--accent-green)"></span> ${ok} tengo</div>
      <div class="stat-pill"><span class="stat-pill__dot" style="background:var(--accent-orange)"></span> ${low} poco</div>
      <div class="stat-pill"><span class="stat-pill__dot" style="background:var(--accent-red)"></span> ${missing} falta</div>
      ${expiring ? `<div class="stat-pill"><span class="stat-pill__dot" style="background:var(--accent-2)"></span> ${expiring} caduca pronto</div>` : ''}
    </div>
  `;
}

function renderStatsBar(zone, container) {
  container.innerHTML = buildStatsHtml(zone);
}

// ── Shopping list render ───────────────────────────────────────
function renderShoppingList() {
  if (!shoppingList.length) {
    shoppingListEl.innerHTML = '<li class="shopping-list__empty">No hay productos en la lista.</li>';
    return;
  }

  shoppingListEl.innerHTML = shoppingList.map(item => `
    <li class="shopping-item${item.checked ? ' shopping-item--checked' : ''}" data-id="${item.id}">
      <input type="checkbox" class="shopping-item__check" ${item.checked ? 'checked' : ''} aria-label="Marcar ${escHtml(item.name)}" />
      <span class="shopping-item__text">${escHtml(item.name)}</span>
      ${item.qty ? `<span class="shopping-item__qty">${escHtml(item.qty)}</span>` : ''}
      <button class="shopping-item__delete" aria-label="Eliminar ${escHtml(item.name)}">✕</button>
    </li>
  `).join('');

  // Checkbox toggle
  shoppingListEl.querySelectorAll('.shopping-item__check').forEach((chk, i) => {
    chk.addEventListener('change', () => {
      shoppingList[i].checked = chk.checked;
      saveList(shoppingList);
      chk.closest('.shopping-item').classList.toggle('shopping-item--checked', chk.checked);
      updateListBadge();
    });
  });

  // Delete
  shoppingListEl.querySelectorAll('.shopping-item__delete').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      shoppingList.splice(i, 1);
      saveList(shoppingList);
      renderShoppingList();
      updateListBadge();
    });
  });
}

function updateListBadge() {
  const count = shoppingList.filter(i => !i.checked).length;
  badgeLista.hidden = count === 0;
  badgeLista.textContent = count;
}

// ── Expiry helpers ─────────────────────────────────────────────
function getDaysUntilExpiry(dateStr) {
  if (!dateStr) return Infinity;
  const today = new Date(); today.setHours(0,0,0,0);
  const exp   = new Date(dateStr); exp.setHours(0,0,0,0);
  return Math.round((exp - today) / 86400000);
}

function getExpiryStatus(dateStr) {
  const days = getDaysUntilExpiry(dateStr);
  if (days < 0)  return 'expired';
  if (days <= 3) return 'danger';
  if (days <= 7) return 'warn';
  return 'ok';
}

function formatExpiryDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

// ── Toast ──────────────────────────────────────────────────────
function showToast(msg, type = 'ok') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toast-out 250ms ease forwards';
    el.addEventListener('animationend', () => el.remove());
  }, 2800);
}

// ── Shopping mode banner ───────────────────────────────────────
function showBanner(msg) {
  removeBanner();
  const el = document.createElement('div');
  el.className = 'shopping-mode-banner';
  el.id = 'shopping-mode-banner';
  el.textContent = msg;
  document.querySelector('.zone-tabs').after(el);
}
function removeBanner() {
  document.getElementById('shopping-mode-banner')?.remove();
}

// ── Security: HTML escape ──────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Boot ───────────────────────────────────────────────────────
renderAll();
// Start on inventory tab
toolbarInv.hidden = false;

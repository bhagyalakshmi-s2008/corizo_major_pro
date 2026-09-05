/**
 * AURA E-COMMERCE - ADVANCED FEATURES & INTERACTIVE ENGINE
 * Features:
 * 1. Instant Quick Preview Modal (Zero-Lag Product Popup)
 * 2. Real-Time Search Autocomplete Dropdown
 * 3. Side-by-Side Product Comparison Engine (Up to 3 Products)
 * 4. Dynamic Indian Pincode & Express Delivery Estimator
 * 5. Recently Viewed Products Tracker
 * 6. High-Performance Client-Side Caching & Preloading
 * 7. Interactive Lucky Spin-the-Wheel Discount Game
 * 8. Real-Time AI Customer Support Chat Assistant
 * 9. Web Speech Voice Search Engine
 * 10. 1-Click WhatsApp Product Sharing
 * 11. Top Flash Sale Live Ticking Countdown Bar
 */

// Global State
let compareList = JSON.parse(localStorage.getItem('aura_compare')) || [];
let recentlyViewed = JSON.parse(localStorage.getItem('aura_recently_viewed')) || [];
const productMemoryCache = new Map();
let hasSpunWheel = localStorage.getItem('aura_wheel_spun') === 'true';

// ==========================================================================
// MULTI-CURRENCY CONVERSION ENGINE (INR, USD, EUR, GBP, AED, CAD, AUD)
// ==========================================================================
const currencyRates = {
  INR: { rate: 1.0, symbol: '₹', flag: '🇮🇳', name: 'INR (₹)' },
  USD: { rate: 0.012, symbol: '$', flag: '🇺🇸', name: 'USD ($)' },
  EUR: { rate: 0.011, symbol: '€', flag: '🇪🇺', name: 'EUR (€)' },
  GBP: { rate: 0.0095, symbol: '£', flag: '🇬🇧', name: 'GBP (£)' },
  AED: { rate: 0.044, symbol: 'AED ', flag: '🇦🇪', name: 'AED (AED)' },
  CAD: { rate: 0.016, symbol: 'CA$', flag: '🇨🇦', name: 'CAD ($)' },
  AUD: { rate: 0.018, symbol: 'AU$', flag: '🇦🇺', name: 'AUD ($)' }
};

let currentCurrency = localStorage.getItem('aura_currency') || 'INR';

function formatCurrency(amountInINR) {
  if (isNaN(amountInINR)) return '₹0.00';
  const curr = currencyRates[currentCurrency] || currencyRates.INR;
  const converted = Number(amountInINR) * curr.rate;
  return curr.symbol + converted.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Global Alias for INR formatter to ensure full backward compatibility
function formatINR(amount) {
  return formatCurrency(amount);
}

function setAppCurrency(currCode) {
  if (!currencyRates[currCode]) return;
  currentCurrency = currCode;
  localStorage.setItem('aura_currency', currCode);

  const flagEl = document.getElementById('currentCurrencyFlag');
  const codeEl = document.getElementById('currentCurrencyCode');
  if (flagEl) flagEl.textContent = currencyRates[currCode].flag;
  if (codeEl) codeEl.textContent = currencyRates[currCode].name;

  document.querySelectorAll('.currency-opt').forEach(opt => {
    opt.classList.toggle('active', opt.textContent.includes(currCode));
  });

  const menu = document.getElementById('currencyMenuDropdown');
  if (menu) menu.classList.remove('active');

  // Trigger sound effect
  playSfx('click');

  showToast(`Currency switched to ${currencyRates[currCode].name}`, 'info');

  // Re-render UI components
  if (typeof renderProductsGrid === 'function' && typeof allProducts !== 'undefined') {
    renderProductsGrid(allProducts);
  }
  if (typeof renderCartDrawer === 'function') {
    renderCartDrawer();
  }
  if (typeof renderCheckoutSummary === 'function') {
    renderCheckoutSummary();
  }
}

function toggleCurrencyDropdown(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('currencyMenuDropdown');
  if (menu) menu.classList.toggle('active');
}

document.addEventListener('click', (e) => {
  const wrap = document.getElementById('currencyDropdownWrap');
  const menu = document.getElementById('currencyMenuDropdown');
  if (wrap && menu && !wrap.contains(e.target)) {
    menu.classList.remove('active');
  }
});

// ==========================================================================
// ZERO-DEPENDENCY SYNTHETIC WEB AUDIO SFX ENGINE
// ==========================================================================
let sfxMuted = localStorage.getItem('aura_sfx_muted') === 'true';
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSfx(type) {
  if (sfxMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'cart') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'coins' || type === 'win') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.09);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'celebrate') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + (i * 0.06));
        g.gain.setValueAtTime(0.15, now + (i * 0.06));
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        o.start(now + (i * 0.06));
        o.stop(now + 0.5);
      });
    } else if (type === 'wheel') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    }
  } catch (e) {}
}

function toggleSfxSound() {
  sfxMuted = !sfxMuted;
  localStorage.setItem('aura_sfx_muted', sfxMuted);
  const btn = document.getElementById('sfxToggleBtn');
  const icon = document.getElementById('sfxToggleIcon');

  if (icon) {
    icon.className = sfxMuted ? 'fa-solid fa-volume-xmark text-muted' : 'fa-solid fa-volume-high text-accent';
  }
  if (btn) {
    btn.classList.toggle('muted', sfxMuted);
  }

  if (!sfxMuted) playSfx('click');
  showToast(sfxMuted ? 'Audio SFX Muted' : 'Audio SFX Enabled 🔊', 'info');
}

// ==========================================================================
// 1. INSTANT QUICK VIEW MODAL (ZERO-LAG PREVIEW)
// ==========================================================================

async function openQuickViewModal(productId, event) {
  if (event) event.stopPropagation();

  const overlay = document.getElementById('quickViewModalOverlay');
  const body = document.getElementById('quickViewModalBody');
  if (!overlay || !body) return;

  // Show loading skeleton instantly
  overlay.classList.add('active');
  body.innerHTML = `
    <div class="quickview-loading-skeleton">
      <div class="skeleton-shimmer skeleton-img"></div>
      <div class="skeleton-info">
        <div class="skeleton-shimmer skeleton-line w-75"></div>
        <div class="skeleton-shimmer skeleton-line w-50"></div>
        <div class="skeleton-shimmer skeleton-line w-100"></div>
        <div class="skeleton-shimmer skeleton-line w-100"></div>
        <div class="skeleton-shimmer skeleton-btn"></div>
      </div>
    </div>
  `;

  try {
    let product = productMemoryCache.get(productId);
    if (!product) {
      const res = await api.getProductById(productId);
      if (res.success && res.product) {
        product = res.product;
        productMemoryCache.set(productId, product);
      }
    }

    if (product) {
      trackRecentlyViewed(product);
      renderQuickViewContent(product);
    }
  } catch (err) {
    body.innerHTML = `<div class="p-4 text-center text-danger"><p>Failed to load preview.</p></div>`;
  }
}

function renderQuickViewContent(product) {
  const body = document.getElementById('quickViewModalBody');
  if (!body) return;

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const gallery = product.gallery && product.gallery.length ? product.gallery : [product.image];

  body.innerHTML = `
    <div class="quickview-grid">
      <!-- Left: Image Preview & Gallery -->
      <div class="quickview-gallery">
        <div class="quickview-main-img-wrap">
          ${product.badge ? `<span class="product-card-badge">${product.badge}</span>` : ''}
          <img id="quickviewMainImg" src="${product.image}" alt="${product.title}">
        </div>
        <div class="quickview-thumbs">
          ${gallery.map((img, idx) => `
            <div class="qv-thumb-box ${idx === 0 ? 'active' : ''}" onclick="switchQuickViewImg('${img}', this)">
              <img src="${img}" alt="Thumbnail">
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Right: Product Info & Actions -->
      <div class="quickview-details">
        <span class="product-cat-pill">${product.category}</span>
        <h2 class="quickview-title">${product.title}</h2>

        <div class="product-rating-row mb-2">
          <div class="stars">${renderStarIcons(product.rating || 4.8)}</div>
          <span class="rating-count">(${product.reviewsCount || 48} ratings) &bull; <strong class="text-success">${product.stock} in stock</strong></span>
        </div>

        <div class="detail-price-box my-3">
          <span class="detail-current-price">${formatINR(product.price)}</span>
          ${product.originalPrice ? `<span class="detail-original-price">${formatINR(product.originalPrice)}</span>` : ''}
          ${discountPercent ? `<span class="detail-discount-badge">${discountPercent}% OFF</span>` : ''}
        </div>

        <p class="quickview-desc">${product.description}</p>

        <!-- Pincode Check Widget inside Quickview -->
        <div class="pincode-check-box mb-3">
          <label><i class="fa-solid fa-truck-fast text-accent"></i> Check Express Delivery to PIN Code:</label>
          <div class="pincode-input-row">
            <input type="text" id="qvPincodeInput" placeholder="e.g. 500081 or 110001" maxlength="6">
            <button class="btn btn-sm btn-outline" onclick="checkDeliveryPincode('qvPincodeInput', 'qvPincodeResult')">Check</button>
          </div>
          <div id="qvPincodeResult" class="pincode-result-badge" style="display: none;"></div>
        </div>

        <!-- Action Buttons -->
        <div class="quickview-actions">
          <div class="quantity-picker mr-2">
            <button type="button" onclick="adjustQuickViewQty(-1)">-</button>
            <input type="number" id="quickViewQtyInput" value="1" readonly>
            <button type="button" onclick="adjustQuickViewQty(1)">+</button>
          </div>
          <button class="btn btn-primary flex-1" onclick="handleQuickViewAddToCart('${product.id}')">
            <i class="fa-solid fa-cart-plus"></i> Add to Cart
          </button>
          <button class="btn btn-whatsapp" onclick="shareOnWhatsApp('${product.id}')" title="Share on WhatsApp">
            <i class="fa-brands fa-whatsapp"></i>
          </button>
          <button class="btn btn-secondary" onclick="closeQuickViewModal(); openProductDetail('${product.id}');" title="Full Page Details">
            Full Details <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

function switchQuickViewImg(imgUrl, thumbEl) {
  const mainImg = document.getElementById('quickviewMainImg');
  if (mainImg) mainImg.src = imgUrl;
  document.querySelectorAll('.qv-thumb-box').forEach(el => el.classList.remove('active'));
  if (thumbEl) thumbEl.classList.add('active');
}

function adjustQuickViewQty(delta) {
  const input = document.getElementById('quickViewQtyInput');
  if (!input) return;
  let val = parseInt(input.value, 10) || 1;
  val = Math.max(1, val + delta);
  input.value = val;
}

function handleQuickViewAddToCart(productId) {
  const product = productMemoryCache.get(productId) || (typeof allProducts !== 'undefined' ? allProducts.find(p => p.id === productId) : null);
  if (!product) return;

  const qtyInput = document.getElementById('quickViewQtyInput');
  const qty = parseInt(qtyInput ? qtyInput.value : 1, 10) || 1;
  addToCart(product, qty);
  closeQuickViewModal();
}

function closeQuickViewModal() {
  const overlay = document.getElementById('quickViewModalOverlay');
  if (overlay) overlay.classList.remove('active');
}

// ==========================================================================
// 2. REAL-TIME SEARCH AUTOCOMPLETE & VOICE SEARCH
// ==========================================================================

function setupLiveSearchAutocomplete() {
  const input = document.getElementById('globalSearchInput');
  const container = document.getElementById('navSearchBarContainer');
  if (!input || !container) return;

  let dropdown = document.getElementById('searchAutocompleteDropdown');
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.id = 'searchAutocompleteDropdown';
    dropdown.className = 'search-autocomplete-dropdown';
    container.appendChild(dropdown);
  }

  input.addEventListener('input', (e) => {
    const val = e.target.value.trim().toLowerCase();
    if (!val || val.length < 1) {
      dropdown.style.display = 'none';
      return;
    }

    const matches = (typeof allProducts !== 'undefined' ? allProducts : []).filter(p => 
      p.title.toLowerCase().includes(val) || 
      p.category.toLowerCase().includes(val) ||
      (p.description && p.description.toLowerCase().includes(val))
    ).slice(0, 5);

    if (matches.length === 0) {
      dropdown.innerHTML = `
        <div class="search-auto-item text-muted">
          <i class="fa-solid fa-magnifying-glass"></i> No instant matches for "<strong>${escapeHtml(val)}</strong>"
        </div>
      `;
      dropdown.style.display = 'block';
    } else {
      dropdown.innerHTML = matches.map(prod => `
        <div class="search-auto-item" onclick="selectAutocompleteProduct('${prod.id}')">
          <img src="${prod.image}" alt="${prod.title}" class="search-auto-img">
          <div class="search-auto-info">
            <span class="search-auto-title">${highlightText(prod.title, val)}</span>
            <span class="search-auto-meta">
              <span class="search-auto-cat">${prod.category}</span> &bull; 
              <strong class="text-accent">${formatINR(prod.price)}</strong>
            </span>
          </div>
          <i class="fa-solid fa-chevron-right search-auto-arrow"></i>
        </div>
      `).join('');
      dropdown.style.display = 'block';
    }
  });

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
}

function highlightText(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

function selectAutocompleteProduct(productId) {
  const dropdown = document.getElementById('searchAutocompleteDropdown');
  if (dropdown) dropdown.style.display = 'none';
  openProductDetail(productId);
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

// Web Speech Voice Search
function startVoiceSearch() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const voiceBtn = document.getElementById('voiceSearchBtn');
  const input = document.getElementById('globalSearchInput');

  if (!SpeechRecognition) {
    showToast('Voice Search is not supported on this browser. Please type in the search bar.', 'info');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;

  if (voiceBtn) voiceBtn.classList.add('listening');
  showToast('🎙️ Listening... Speak a product name or category now!', 'info');

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (input) {
      input.value = transcript;
      handleSearchInput(transcript);
    }
    showToast(`Searched for: "${transcript}"`, 'success');
  };

  recognition.onerror = () => {
    if (voiceBtn) voiceBtn.classList.remove('listening');
    showToast('Could not capture voice audio. Please try again.', 'warning');
  };

  recognition.onend = () => {
    if (voiceBtn) voiceBtn.classList.remove('listening');
  };

  recognition.start();
}

// ==========================================================================
// 3. PRODUCT COMPARISON ENGINE (SIDE-BY-SIDE COMPARE)
// ==========================================================================

function toggleCompareProduct(productId, event) {
  if (event) event.stopPropagation();

  const product = (typeof allProducts !== 'undefined' ? allProducts : []).find(p => p.id === productId);
  if (!product) return;

  const idx = compareList.findIndex(p => p.id === productId);
  if (idx > -1) {
    compareList.splice(idx, 1);
    showToast(`Removed "${product.title}" from comparison`, 'info');
  } else {
    if (compareList.length >= 3) {
      showToast('You can compare up to 3 products at a time.', 'warning');
      return;
    }
    compareList.push(product);
    showToast(`⚖️ Added "${product.title}" to compare list!`, 'success');
  }

  saveCompareList();
}

function saveCompareList() {
  localStorage.setItem('aura_compare', JSON.stringify(compareList));
  renderCompareFloatingBar();
}

function renderCompareFloatingBar() {
  let bar = document.getElementById('compareFloatingBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'compareFloatingBar';
    bar.className = 'compare-floating-bar';
    document.body.appendChild(bar);
  }

  if (compareList.length === 0) {
    bar.classList.remove('active');
    return;
  }

  bar.innerHTML = `
    <div class="compare-bar-content container">
      <div class="compare-bar-left">
        <strong><i class="fa-solid fa-scale-balanced"></i> Compare Products (${compareList.length}/3)</strong>
        <div class="compare-bar-thumbs">
          ${compareList.map(item => `
            <div class="compare-mini-thumb" title="${item.title}">
              <img src="${item.image}" alt="${item.title}">
              <button onclick="removeCompareItem('${item.id}', event)" class="compare-remove-mini"><i class="fa-solid fa-xmark"></i></button>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="compare-bar-actions">
        <button class="btn btn-sm btn-outline" onclick="clearCompareList()">Clear All</button>
        <button class="btn btn-sm btn-primary" onclick="openCompareModal()">
          <i class="fa-solid fa-table-columns"></i> View Comparison
        </button>
      </div>
    </div>
  `;

  bar.classList.add('active');
}

function removeCompareItem(productId, event) {
  if (event) event.stopPropagation();
  compareList = compareList.filter(p => p.id !== productId);
  saveCompareList();
}

function clearCompareList() {
  compareList = [];
  saveCompareList();
  showToast('Comparison list cleared', 'info');
}

function openCompareModal() {
  if (compareList.length === 0) {
    showToast('Add products to compare first!', 'warning');
    return;
  }

  const overlay = document.getElementById('compareModalOverlay');
  const table = document.getElementById('compareMatrixTable');
  if (!overlay || !table) return;

  const allSpecsKeys = new Set();
  compareList.forEach(p => {
    if (p.specs) {
      Object.keys(p.specs).forEach(k => allSpecsKeys.add(k));
    }
  });

  table.innerHTML = `
    <div class="compare-table-grid" style="grid-template-columns: 180px repeat(${compareList.length}, 1fr);">
      <div class="compare-cell compare-header-cell">Product</div>
      ${compareList.map(p => `
        <div class="compare-cell text-center">
          <img src="${p.image}" alt="${p.title}" class="compare-prod-img">
          <h4 class="mt-2 font-bold">${p.title}</h4>
          <span class="product-cat-pill">${p.category}</span>
          <button class="btn btn-primary btn-sm btn-block mt-2" onclick="addToCart(compareList.find(x => x.id === '${p.id}'), 1)">
            <i class="fa-solid fa-cart-plus"></i> Add to Cart
          </button>
        </div>
      `).join('')}

      <div class="compare-cell compare-feature-label">Price</div>
      ${compareList.map(p => `
        <div class="compare-cell text-center font-bold text-accent">${formatINR(p.price)}</div>
      `).join('')}

      <div class="compare-cell compare-feature-label">Customer Rating</div>
      ${compareList.map(p => `
        <div class="compare-cell text-center">
          ${renderStarIcons(p.rating || 4.8)} (${p.rating || 4.8})
        </div>
      `).join('')}

      <div class="compare-cell compare-feature-label">Stock Status</div>
      ${compareList.map(p => `
        <div class="compare-cell text-center">
          <span class="badge ${p.stock > 0 ? 'badge-popular' : 'badge-danger'}">
            ${p.stock > 0 ? `${p.stock} Units Available` : 'Out of Stock'}
          </span>
        </div>
      `).join('')}

      ${Array.from(allSpecsKeys).map(specKey => `
        <div class="compare-cell compare-feature-label">${specKey}</div>
        ${compareList.map(p => `
          <div class="compare-cell text-center">
            ${p.specs && p.specs[specKey] ? p.specs[specKey] : '<span class="text-muted">-</span>'}
          </div>
        `).join('')}
      `).join('')}
    </div>
  `;

  overlay.classList.add('active');
}

function closeCompareModal() {
  const overlay = document.getElementById('compareModalOverlay');
  if (overlay) overlay.classList.remove('active');
}

// ==========================================================================
// 4. DYNAMIC INDIAN PINCODE DELIVERY ESTIMATOR
// ==========================================================================

function checkDeliveryPincode(inputId, resultId) {
  const input = document.getElementById(inputId);
  const result = document.getElementById(resultId);
  if (!input || !result) return;

  const pin = input.value.trim();

  if (!/^\d{6}$/.test(pin)) {
    result.style.display = 'block';
    result.className = 'pincode-result-badge text-danger';
    result.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Please enter a valid 6-digit Indian PIN code.';
    return;
  }

  const now = new Date();
  const deliveryDays = (pin.startsWith('500') || pin.startsWith('110') || pin.startsWith('400') || pin.startsWith('560')) ? 2 : 3;
  now.setDate(now.getDate() + deliveryDays);

  const formattedDate = now.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  result.style.display = 'block';
  result.className = 'pincode-result-badge text-success';
  result.innerHTML = `
    <i class="fa-solid fa-circle-check"></i> Serviceable! Express Delivery by <strong>${formattedDate}</strong> &bull; <strong class="text-accent">FREE Delivery & Cash on Delivery Available</strong>
  `;
}

// ==========================================================================
// 5. RECENTLY VIEWED PRODUCTS TRACKER
// ==========================================================================

function trackRecentlyViewed(product) {
  if (!product || !product.id) return;
  recentlyViewed = recentlyViewed.filter(p => p.id !== product.id);
  recentlyViewed.unshift({
    id: product.id,
    title: product.title,
    price: product.price,
    image: product.image,
    category: product.category,
    rating: product.rating
  });

  if (recentlyViewed.length > 8) recentlyViewed.pop();
  localStorage.setItem('aura_recently_viewed', JSON.stringify(recentlyViewed));
  renderRecentlyViewedSection();
}

function renderRecentlyViewedSection() {
  const container = document.getElementById('recentlyViewedSectionContainer');
  const grid = document.getElementById('recentlyViewedGrid');
  if (!container || !grid) return;

  if (recentlyViewed.length < 2) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  grid.innerHTML = recentlyViewed.slice(0, 4).map(p => `
    <div class="product-card">
      <div class="product-image-wrap" onclick="openProductDetail('${p.id}')" style="cursor: pointer;">
        <img src="${p.image}" alt="${p.title}">
      </div>
      <div class="product-card-body">
        <span class="product-cat-pill">${p.category}</span>
        <h4 class="product-title" onclick="openProductDetail('${p.id}')">${p.title}</h4>
        <div class="product-price-row">
          <span class="current-price">${formatINR(p.price)}</span>
        </div>
        <button class="btn btn-card-add btn-sm" onclick="handleQuickAddToCart('${p.id}', event)">
          <i class="fa-solid fa-cart-plus"></i> Add to Cart
        </button>
      </div>
    </div>
  `).join('');
}

// ==========================================================================
// 6. INTERACTIVE LUCKY WHEEL SPIN DISCOUNT GAME
// ==========================================================================

const wheelPrizes = [
  { label: '20% OFF', code: 'SAVE20', color: '#6366f1' },
  { label: 'FREE DELIVERY', code: 'FREESHIP', color: '#ec4899' },
  { label: '10% OFF', code: 'WELCOME10', color: '#f59e0b' },
  { label: '15% OFF', code: 'EXTRA15', color: '#10b981' },
  { label: '25% OFF', code: 'SUPER25', color: '#8b5cf6' },
  { label: '₹500 OFF', code: 'FLAT500', color: '#3b82f6' }
];

let isSpinning = false;

function openLuckyWheelModal() {
  const overlay = document.getElementById('luckyWheelModalOverlay');
  if (overlay) {
    overlay.classList.add('active');
    drawLuckyWheel();
  }
}

function closeLuckyWheelModal() {
  const overlay = document.getElementById('luckyWheelModalOverlay');
  if (overlay) overlay.classList.remove('active');
}

function drawLuckyWheel() {
  const canvas = document.getElementById('wheelCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const numSegments = wheelPrizes.length;
  const arc = (2 * Math.PI) / numSegments;
  const radius = canvas.width / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  wheelPrizes.forEach((prize, i) => {
    const angle = i * arc;
    ctx.beginPath();
    ctx.fillStyle = prize.color;
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius - 4, angle, angle + arc);
    ctx.lineTo(radius, radius);
    ctx.fill();
    ctx.strokeStyle = '#1e1e38';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Text Label
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.translate(radius, radius);
    ctx.rotate(angle + arc / 2);
    ctx.textAlign = 'right';
    ctx.fillText(prize.label, radius - 20, 5);
    ctx.restore();
  });
}

function spinLuckyWheel() {
  if (isSpinning) return;
  isSpinning = true;

  const canvas = document.getElementById('wheelCanvas');
  const spinBtn = document.getElementById('spinWheelBtn');
  const resultBox = document.getElementById('wheelResultBox');
  if (!canvas || !spinBtn) return;

  spinBtn.disabled = true;
  if (resultBox) resultBox.style.display = 'none';

  // Choose random prize
  const prizeIndex = Math.floor(Math.random() * wheelPrizes.length);
  const selectedPrize = wheelPrizes[prizeIndex];

  const totalDegrees = 360 * 5 + (360 - (prizeIndex * (360 / wheelPrizes.length) + (360 / wheelPrizes.length) / 2));
  
  canvas.style.transition = 'transform 4s cubic-bezier(0.15, 0.9, 0.25, 1)';
  canvas.style.transform = `rotate(${totalDegrees}deg)`;

  setTimeout(() => {
    isSpinning = false;
    spinBtn.disabled = false;
    localStorage.setItem('aura_wheel_spun', 'true');

    if (resultBox) {
      resultBox.style.display = 'block';
      resultBox.innerHTML = `
        <div class="wheel-win-card">
          <div class="wheel-win-icon">🎉</div>
          <h3>Congratulations! You Won ${selectedPrize.label}!</h3>
          <p class="coupon-won-code">Use Promo Code: <strong>${selectedPrize.code}</strong></p>
          <button class="btn btn-primary btn-block mt-3" onclick="applyWonPromoCode('${selectedPrize.code}')">
            <i class="fa-solid fa-tag"></i> 1-Click Apply to Cart
          </button>
        </div>
      `;
    }

    if (typeof triggerConfetti === 'function') triggerConfetti();
    showToast(`🎉 You won ${selectedPrize.label}! Code: ${selectedPrize.code}`, 'success');
  }, 4200);
}

function applyWonPromoCode(code) {
  const couponInput = document.getElementById('drawerCouponInput');
  if (couponInput) couponInput.value = code;
  if (typeof applyCouponCode === 'function') applyCouponCode();
  closeLuckyWheelModal();
  toggleCartDrawer(true);
}

// ==========================================================================
// 7. REAL-TIME AI CUSTOMER SUPPORT CHAT ASSISTANT
// ==========================================================================

const botKnowledgeBase = [
  {
    triggers: ['cod', 'cash on delivery', 'pay on delivery', 'cash'],
    reply: "💵 **Cash on Delivery (COD)** is 100% supported across all serviceable PIN codes in India! There are zero advance payment charges—you simply pay in cash or via UPI when the courier delivers your package."
  },
  {
    triggers: ['delivery', 'shipping', 'how long', 'days', 'ship'],
    reply: "🚚 **Shipping & Delivery Policy**:\n- **Free Express Delivery** applies automatically on all orders above ₹999!\n- Standard delivery is usually **2 to 3 business days** across metro cities via BlueDart & Delhivery."
  },
  {
    triggers: ['return', 'refund', 'exchange', 'warranty'],
    reply: "🔄 **30-Day Hassle-Free Returns**:\nIf you are not 100% satisfied with your item or received a defective product, you can initiate a return or replacement within 30 days from your **My Orders** portal."
  },
  {
    triggers: ['order', 'track', 'where is my order', 'status'],
    reply: "📦 You can track your real-time shipment status with live milestones anytime under <a href='#my-orders' onclick='navigateTo(\"my-orders\"); toggleChatAssistant();'><strong>My Orders</strong></a>."
  },
  {
    triggers: ['coupon', 'discount', 'promo', 'offer', 'deal'],
    reply: "🏷️ **Active Coupons Today**:\n- **SAVE20** &rarr; 20% OFF on all orders above ₹999\n- **WELCOME10** &rarr; 10% OFF for first-time shoppers\n- Or spin the **Lucky Discount Wheel** for exclusive surprise rewards!"
  },
  {
    triggers: ['laptop', 'macbook', 'rog', 'dell'],
    reply: "💻 Check out our top-rated laptops:\n- **Apple MacBook Pro 16\" M3 Max** (₹1,89,900)\n- **ASUS ROG Zephyrus G16 OLED** (₹1,49,990)\n- **Dell XPS 15 InfinityEdge** (₹1,14,990)\nFilter by clicking the *Laptops* category in the navigation bar!"
  },
  {
    triggers: ['mobile', 'iphone', 'samsung', 'phone'],
    reply: "📱 Top Flagship Mobiles in stock:\n- **Apple iPhone 15 Pro Max** (₹1,34,900)\n- **Samsung Galaxy S24 Ultra** (₹1,19,999)\n- **OnePlus 12 5G** (₹64,999)\nAll available with express COD delivery!"
  }
];

function toggleChatAssistant() {
  const widget = document.getElementById('chatAssistantWidget');
  if (widget) {
    widget.classList.toggle('active');
    const badge = document.getElementById('chatNotificationDot');
    if (badge) badge.style.display = 'none';
  }
}

function sendChatMessage(presetText) {
  const input = document.getElementById('chatMessageInput');
  const chatLogs = document.getElementById('chatMessagesContainer');
  if (!chatLogs) return;

  const text = presetText || (input ? input.value.trim() : '');
  if (!text) return;

  // Append user message
  chatLogs.innerHTML += `
    <div class="chat-msg user-msg">
      <div class="msg-bubble">${escapeHtml(text)}</div>
    </div>
  `;

  if (input) input.value = '';
  chatLogs.scrollTop = chatLogs.scrollHeight;

  // Typing indicator
  const typingId = 'typing_' + Date.now();
  chatLogs.innerHTML += `
    <div class="chat-msg bot-msg" id="${typingId}">
      <span class="bot-avatar"><i class="fa-solid fa-robot"></i></span>
      <div class="msg-bubble"><i class="fa-solid fa-ellipsis fa-fade"></i> Typing...</div>
    </div>
  `;
  chatLogs.scrollTop = chatLogs.scrollHeight;

  setTimeout(() => {
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();

    const lower = text.toLowerCase();
    const matched = botKnowledgeBase.find(item => item.triggers.some(t => lower.includes(t)));

    const botResponse = matched 
      ? matched.reply 
      : `Thanks for reaching out! You can browse our 15 categories, use code **SAVE20** for discounts, or choose Cash on Delivery at checkout. What else can I help you find today?`;

    chatLogs.innerHTML += `
      <div class="chat-msg bot-msg">
        <span class="bot-avatar"><i class="fa-solid fa-robot"></i></span>
        <div class="msg-bubble">${botResponse.replace(/\n/g, '<br>')}</div>
      </div>
    `;
    chatLogs.scrollTop = chatLogs.scrollHeight;
  }, 700);
}

// 1-Click WhatsApp Sharing
function shareOnWhatsApp(productId) {
  const product = productMemoryCache.get(productId) || (typeof allProducts !== 'undefined' ? allProducts.find(p => p.id === productId) : null);
  if (!product) return;

  const text = encodeURIComponent(`Check out ${product.title} on AURA Store for ${formatINR(product.price)}! Fast Cash on Delivery available: ${window.location.origin}`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

// Top Flash Sale Live Ticking Countdown Bar
function startFlashSaleCountdown() {
  const timerEl = document.getElementById('flashSaleCountdownTimer');
  if (!timerEl) return;

  // 6 hours countdown repeating
  function updateTimer() {
    const now = new Date();
    const target = new Date();
    target.setHours(23, 59, 59, 999);

    let diff = Math.max(0, target - now);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    timerEl.textContent = `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

// ==========================================================================
// 8. 360° INTERACTIVE PRODUCT SPIN & 3D/AR ROOM SCALE SIMULATOR
// ==========================================================================
let current360Product = null;
let spinAngle = 0;
let isDraggingSpin = false;
let startDragX = 0;
let isAutoRotating = false;
let autoRotateInterval = null;
let arCurrentScale = 100;
let arCurrentLight = 100;

const arEnvironments = {
  living_room: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
  tech_desk: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=1200&q=80',
  creator_studio: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&q=80',
  cyberpunk: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80'
};

async function open360Modal(productId, event) {
  if (event) event.stopPropagation();

  let product = productMemoryCache.get(productId);
  if (!product && typeof allProducts !== 'undefined') {
    product = allProducts.find(p => p.id === productId);
  }
  if (!product) {
    try {
      const res = await api.getProductById(productId);
      if (res.success) product = res.product;
    } catch (e) {}
  }

  if (!product) return;
  current360Product = product;

  const overlay = document.getElementById('product360ModalOverlay');
  const titleEl = document.getElementById('modal360ProductTitle');
  const spinImg = document.getElementById('spinProductImage');
  const arImg = document.getElementById('arProductImage');

  if (titleEl) titleEl.textContent = `${product.title} - 360° & AR Visualizer`;
  if (spinImg) spinImg.src = product.image;
  if (arImg) arImg.src = product.image;

  switchViewerMode('spin');
  setSpinAngle(0);
  setupSpinDragPhysics();

  if (overlay) overlay.classList.add('active');
  playSfx('click');
}

function close360Modal() {
  const overlay = document.getElementById('product360ModalOverlay');
  if (overlay) overlay.classList.remove('active');
  if (isAutoRotating) toggleAutoRotate();
}

function switchViewerMode(mode) {
  const tabSpin = document.getElementById('tab360Spin');
  const tabAr = document.getElementById('tabArRoom');
  const viewSpin = document.getElementById('viewer360SpinContainer');
  const viewAr = document.getElementById('viewerArRoomContainer');

  if (mode === 'spin') {
    if (tabSpin) tabSpin.classList.add('active');
    if (tabAr) tabAr.classList.remove('active');
    if (viewSpin) viewSpin.classList.add('active');
    if (viewAr) viewAr.classList.remove('active');
  } else {
    if (tabSpin) tabSpin.classList.remove('active');
    if (tabAr) tabAr.classList.add('active');
    if (viewSpin) viewSpin.classList.remove('active');
    if (viewAr) viewAr.classList.add('active');
  }
  playSfx('click');
}

function setupSpinDragPhysics() {
  const stage = document.getElementById('spinCanvasStage');
  if (!stage || stage._dragAttached) return;
  stage._dragAttached = true;

  const handleStart = (clientX) => {
    isDraggingSpin = true;
    startDragX = clientX;
    const hint = document.getElementById('spinDragHint');
    if (hint) hint.style.opacity = '0';
  };

  const handleMove = (clientX) => {
    if (!isDraggingSpin) return;
    const deltaX = clientX - startDragX;
    startDragX = clientX;

    // Smooth rotational speed
    spinAngle = (spinAngle - deltaX * 0.7 + 360) % 360;
    updateSpinVisuals();
  };

  const handleEnd = () => {
    isDraggingSpin = false;
  };

  stage.addEventListener('mousedown', (e) => handleStart(e.clientX));
  window.addEventListener('mousemove', (e) => handleMove(e.clientX));
  window.addEventListener('mouseup', handleEnd);

  stage.addEventListener('touchstart', (e) => handleStart(e.touches[0].clientX), { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) handleMove(e.touches[0].clientX);
  }, { passive: true });
  window.addEventListener('touchend', handleEnd);
}

function setSpinAngle(degrees) {
  spinAngle = degrees % 360;
  updateSpinVisuals();
  playSfx('click');

  document.querySelectorAll('.angle-btn').forEach((btn, idx) => {
    const angles = [0, 45, 90, 180, 270];
    btn.classList.toggle('active', angles[idx] === degrees);
  });
}

function handleSpinSlider(val) {
  spinAngle = parseInt(val, 10);
  updateSpinVisuals();
}

function handleSpinZoom(val) {
  const zoom = parseInt(val, 10) / 100;
  const img = document.getElementById('spinProductImage');
  if (img) {
    img.style.transform = `rotateY(${spinAngle}deg) scale(${zoom})`;
  }
}

function updateSpinVisuals() {
  const img = document.getElementById('spinProductImage');
  const label = document.getElementById('spinDegreesLabel');
  const slider = document.getElementById('spinAngleSlider');

  if (img) {
    // 3D pseudo rotation perspective with realistic lighting shimmer
    const normalizedAngle = Math.round(spinAngle);
    const zoomSlider = document.getElementById('spinZoomSlider');
    const zoom = (zoomSlider ? parseInt(zoomSlider.value, 10) : 100) / 100;
    img.style.transform = `rotateY(${normalizedAngle}deg) scale(${zoom})`;
    img.style.filter = `drop-shadow(0 20px 30px rgba(0, 0, 0, 0.7)) brightness(${1 + 0.15 * Math.cos((normalizedAngle * Math.PI) / 180)})`;
  }
  if (label) label.textContent = `${Math.round(spinAngle)}°`;
  if (slider) slider.value = Math.round(spinAngle);
}

function toggleAutoRotate() {
  const btn = document.getElementById('autoRotateBtn');
  isAutoRotating = !isAutoRotating;

  if (isAutoRotating) {
    if (btn) btn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause Auto-Rotate';
    autoRotateInterval = setInterval(() => {
      spinAngle = (spinAngle + 2) % 360;
      updateSpinVisuals();
    }, 40);
  } else {
    if (btn) btn.innerHTML = '<i class="fa-solid fa-play"></i> Auto Rotate';
    if (autoRotateInterval) clearInterval(autoRotateInterval);
  }
}

function setArEnvironment(envKey) {
  const bg = document.getElementById('arRoomBg');
  if (bg && arEnvironments[envKey]) {
    bg.style.backgroundImage = `url('${arEnvironments[envKey]}')`;
  }
  document.querySelectorAll('.env-pill').forEach(pill => {
    pill.classList.toggle('active', pill.getAttribute('onclick').includes(envKey));
  });
  playSfx('click');
}

function handleArScale(val) {
  arCurrentScale = parseInt(val, 10);
  const img = document.getElementById('arProductImage');
  const label = document.getElementById('arScaleValue');
  const ruler = document.getElementById('arScaleLabel');

  if (img) img.style.transform = `scale(${arCurrentScale / 100})`;
  if (label) label.textContent = `${arCurrentScale}%`;
  if (ruler) ruler.textContent = `${arCurrentScale}% (${arCurrentScale === 100 ? 'True-to-Scale' : 'Custom Scale'})`;
}

function handleArLight(val) {
  arCurrentLight = parseInt(val, 10);
  const img = document.getElementById('arProductImage');
  if (img) img.style.filter = `drop-shadow(0 15px 25px rgba(0, 0, 0, 0.8)) brightness(${arCurrentLight / 100})`;
}

function addCurrent360ProductToCart() {
  if (!current360Product) return;
  if (typeof addToCart === 'function') {
    addToCart(current360Product, 1);
    playSfx('cart');
    close360Modal();
  }
}

// ==========================================================================
// 9. AI VISUAL CAMERA / PHOTO MATCH SEARCH ENGINE
// ==========================================================================
function openVisualSearchModal() {
  const overlay = document.getElementById('visualSearchModalOverlay');
  if (overlay) overlay.classList.add('active');
  playSfx('click');
}

function closeVisualSearchModal() {
  const overlay = document.getElementById('visualSearchModalOverlay');
  if (overlay) overlay.classList.remove('active');
}

function triggerVisualFileInput() {
  const input = document.getElementById('visualFileInput');
  if (input) input.click();
}

function handleVisualFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  showToast(`🔍 AI Analyzing visual contours of "${file.name}"...`, 'info');
  playSfx('click');

  // Simulated visual keyword extraction
  setTimeout(() => {
    performVisualSearchMatching(file.name);
  }, 600);
}

function searchBySamplePhoto(term, imgUrl) {
  showToast(`🔍 AI Matching visual features for "${term}"...`, 'info');
  playSfx('click');
  performVisualSearchMatching(term);
}

function performVisualSearchMatching(query) {
  const container = document.getElementById('visualSearchResultsContainer');
  const grid = document.getElementById('visualResultsGrid');
  const countEl = document.getElementById('visualMatchCount');

  if (!container || !grid) return;

  const qLower = query.toLowerCase();
  const prods = typeof allProducts !== 'undefined' ? allProducts : [];

  // Match products with similarity rank
  const scored = prods.map(p => {
    let score = 70;
    if (p.title.toLowerCase().includes(qLower) || qLower.includes(p.category.toLowerCase())) score += 25;
    if (p.description.toLowerCase().includes(qLower)) score += 15;
    score = Math.min(99, Math.max(82, score + Math.floor(Math.random() * 8)));
    return { product: p, score };
  }).sort((a, b) => b.score - a.score).slice(0, 6);

  if (countEl) countEl.textContent = `${scored.length} matches`;

  grid.innerHTML = scored.map(item => `
    <div class="visual-match-card">
      <span class="similarity-badge"><i class="fa-solid fa-sparkles"></i> ${item.score}% Match</span>
      <img src="${item.product.image}" alt="${item.product.title}" style="width: 100%; height: 120px; object-fit: contain; border-radius: 6px;">
      <h5 class="mt-2 text-truncate font-bold" style="font-size: 0.85rem;">${item.product.title}</h5>
      <div class="d-flex justify-content-between align-items-center mt-2">
        <span class="text-accent font-bold">${formatCurrency(item.product.price)}</span>
        <button class="btn btn-sm btn-primary" onclick="closeVisualSearchModal(); openProductDetail('${item.product.id}')">
          View
        </button>
      </div>
    </div>
  `).join('');

  container.style.display = 'block';
  playSfx('celebrate');
}

// ==========================================================================
// 10. AURA VIP CLUB & LOYALTY REWARDS SYSTEM
// ==========================================================================
async function openVipClubModal() {
  const overlay = document.getElementById('vipClubModalOverlay');
  if (!overlay) return;
  overlay.classList.add('active');
  playSfx('click');
  renderVipClubModal();
}

function closeVipClubModal() {
  const overlay = document.getElementById('vipClubModalOverlay');
  if (overlay) overlay.classList.remove('active');
}

async function renderVipClubModal() {
  const body = document.getElementById('vipClubModalBody');
  if (!body) return;

  body.innerHTML = `
    <div class="text-center p-4">
      <i class="fa-solid fa-spinner fa-spin fa-2x text-accent"></i>
      <p class="mt-2 text-muted">Loading VIP Passbook...</p>
    </div>
  `;

  let loyaltyData = { coins: 350, vipTier: 'Gold', streak: 3, canClaimDailyBonus: true, nextTier: 'Platinum (1000 Coins)' };

  if (api.getToken()) {
    try {
      const res = await api.getLoyaltyInfo();
      if (res.success && res.loyalty) loyaltyData = res.loyalty;
    } catch (e) {}
  }

  const streakDays = [1, 2, 3, 4, 5, 6, 7];

  body.innerHTML = `
    <div class="vip-portal-grid">
      <!-- Left: VIP Status & Coins Card -->
      <div class="vip-card-banner">
        <div class="vip-tier-chip">
          <i class="fa-solid fa-crown"></i> ${loyaltyData.vipTier.toUpperCase()} VIP TIER
        </div>
        <p class="text-muted" style="color: #cbd5e1 !important; font-size: 0.85rem;">Available Reward Coins</p>
        <div class="vip-coins-display">
          <i class="fa-solid fa-coins"></i> ${loyaltyData.coins.toLocaleString('en-IN')}
        </div>
        <p style="font-size: 0.8rem; color: #fef08a;">&asymp; Worth <strong>${formatCurrency(loyaltyData.coins * 0.1)}</strong> instant discount at checkout!</p>

        <div class="vip-progress-bar-wrap">
          <div class="d-flex justify-content-between text-xs text-muted mb-1" style="font-size: 0.75rem; color: #cbd5e1;">
            <span>Current: ${loyaltyData.vipTier}</span>
            <span>Next Tier: ${loyaltyData.nextTier}</span>
          </div>
          <div class="vip-progress-track">
            <div class="vip-progress-fill" style="width: ${Math.min(100, (loyaltyData.coins / 1000) * 100)}%;"></div>
          </div>
        </div>

        <div class="vip-perks-grid">
          <div class="vip-perk-item">
            <i class="fa-solid fa-truck-fast text-accent"></i> Free Priority Shipping
          </div>
          <div class="vip-perk-item">
            <i class="fa-solid fa-percent text-success"></i> 2X Coin Multiplier
          </div>
          <div class="vip-perk-item">
            <i class="fa-solid fa-shield-halved text-warning"></i> Extended Warranty
          </div>
          <div class="vip-perk-item">
            <i class="fa-solid fa-gift text-danger"></i> Exclusive Mystery Gifts
          </div>
        </div>
      </div>

      <!-- Right: Daily Check-in Streak Widget -->
      <div class="vip-streak-box">
        <h4><i class="fa-solid fa-fire text-warning"></i> Daily Check-in Streak</h4>
        <p class="text-muted text-sm" style="font-size: 0.82rem;">Check in daily to build your bonus streak and earn free Aura Coins!</p>

        <div class="streak-days-row">
          ${streakDays.map(day => `
            <div class="streak-day-badge ${day <= loyaltyData.streak ? 'claimed' : (day === loyaltyData.streak + 1 ? 'today' : '')}">
              <div>Day ${day}</div>
              <div class="font-bold">+${25 + (day * 5)}</div>
              ${day <= loyaltyData.streak ? '<i class="fa-solid fa-check text-xs"></i>' : '<i class="fa-solid fa-coins text-xs"></i>'}
            </div>
          `).join('')}
        </div>

        <button class="btn btn-primary btn-block" id="claimDailyCoinsBtn" onclick="handleClaimDailyCoins()" ${loyaltyData.canClaimDailyBonus ? '' : 'disabled'}>
          ${loyaltyData.canClaimDailyBonus ? '<i class="fa-solid fa-gift"></i> Claim Today\'s Bonus Coins' : '<i class="fa-solid fa-circle-check"></i> Claimed for Today (Return Tomorrow)'}
        </button>

        <div class="mt-3 p-3" style="background: var(--bg-secondary); border-radius: var(--radius-md); font-size: 0.8rem;">
          <strong><i class="fa-solid fa-circle-info text-accent"></i> How to earn more coins?</strong>
          <ul class="mt-1 pl-3 text-muted">
            <li>Earn 1 Coin for every ₹10 spent on all orders.</li>
            <li>Spin the Lucky Discount Wheel daily.</li>
            <li>Write verified product ratings and reviews.</li>
          </ul>
        </div>
      </div>
    </div>
  `;

  // Update navbar badge
  const badge = document.getElementById('navVipCoinsPill');
  if (badge) badge.textContent = `👑 ${loyaltyData.coins} Coins`;
}

async function handleClaimDailyCoins() {
  if (!api.getToken()) {
    showToast('Please login to claim your daily VIP coins streak!', 'warning');
    closeVipClubModal();
    navigateTo('login');
    return;
  }

  try {
    const res = await api.claimDailyLoyaltyBonus();
    if (res.success) {
      playSfx('coins');
      if (typeof triggerConfetti === 'function') triggerConfetti();
      showToast(res.message, 'success');
      renderVipClubModal();
    }
  } catch (err) {
    showToast(err.message || 'Failed to claim bonus', 'warning');
  }
}

// ==========================================================================
// 11. DIGITAL AURA WALLET & INSTANT GIFT CARD ENGINE
// ==========================================================================
async function openAuraWalletModal() {
  const overlay = document.getElementById('auraWalletModalOverlay');
  if (!overlay) return;
  overlay.classList.add('active');
  playSfx('click');
  renderAuraWalletModal();
}

function closeAuraWalletModal() {
  const overlay = document.getElementById('auraWalletModalOverlay');
  if (overlay) overlay.classList.remove('active');
}

async function renderAuraWalletModal() {
  const body = document.getElementById('auraWalletModalBody');
  if (!body) return;

  body.innerHTML = `
    <div class="text-center p-4">
      <i class="fa-solid fa-spinner fa-spin fa-2x text-accent"></i>
      <p class="mt-2 text-muted">Loading Wallet Balance...</p>
    </div>
  `;

  let wallet = { balance: 2500, transactions: [] };
  if (api.getToken()) {
    try {
      const res = await api.getWalletInfo();
      if (res.success && res.wallet) wallet = res.wallet;
    } catch (e) {}
  }

  body.innerHTML = `
    <div class="vip-portal-grid">
      <!-- Left: Wallet Card & Quick Top-up -->
      <div class="wallet-card-banner">
        <div class="d-flex justify-content-between align-items-center">
          <span class="font-bold text-accent"><i class="fa-solid fa-wallet"></i> DIGITAL AURA WALLET</span>
          <span class="badge badge-popular">1-Click Checkout Ready</span>
        </div>
        <div class="wallet-balance-num" id="modalWalletBalanceDisplay">
          ${formatCurrency(wallet.balance)}
        </div>
        <p style="font-size: 0.8rem; color: #94a3b8;">Use your wallet balance for instant, zero-failure checkout on any order.</p>

        <h5 class="mt-3" style="font-size: 0.85rem;"><i class="fa-solid fa-bolt text-warning"></i> Quick Instant Top-Up:</h5>
        <div class="wallet-topup-presets">
          <button class="topup-btn" onclick="handleWalletTopup(500)">+₹500</button>
          <button class="topup-btn" onclick="handleWalletTopup(1000)">+₹1,000</button>
          <button class="topup-btn" onclick="handleWalletTopup(2000)">+₹2,000</button>
          <button class="topup-btn" onclick="handleWalletTopup(5000)">+₹5,000</button>
        </div>

        <div class="mt-3">
          <label style="font-size: 0.8rem;"><i class="fa-solid fa-gift text-accent"></i> Redeem Gift Card / Voucher Code:</label>
          <div class="voucher-redeem-row">
            <input type="text" id="voucherCodeInput" class="form-control form-control-sm" placeholder="e.g. AURA1000 or GIFT500" style="text-transform: uppercase;">
            <button class="btn btn-sm btn-primary" onclick="handleRedeemGiftCard()">Redeem</button>
          </div>
          <small class="text-muted">Test voucher codes: <strong>AURA1000</strong> (₹1,000), <strong>GIFT500</strong> (₹500)</small>
        </div>
      </div>

      <!-- Right: Passbook Transaction History -->
      <div class="vip-streak-box">
        <h4><i class="fa-solid fa-clock-rotate-left text-accent"></i> Wallet Passbook</h4>
        <div class="wallet-tx-history" id="walletTxHistoryList">
          ${wallet.transactions && wallet.transactions.length ? wallet.transactions.map(tx => `
            <div class="wallet-tx-item">
              <div>
                <div>${escapeHtml(tx.description)}</div>
                <small class="text-muted">${new Date(tx.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>
              </div>
              <div class="${tx.type === 'credit' ? 'tx-credit' : 'tx-debit'}">
                ${tx.type === 'credit' ? '+' : '-'}${formatCurrency(tx.amount)}
              </div>
            </div>
          `).join('') : `
            <div class="text-center p-4 text-muted">
              <i class="fa-solid fa-receipt fa-2x mb-2"></i>
              <p>No transactions yet. Top up or redeem a gift card!</p>
            </div>
          `}
        </div>
      </div>
    </div>
  `;

  // Update navbar wallet pill
  const navPill = document.getElementById('navWalletBalancePill');
  if (navPill) navPill.textContent = formatCurrency(wallet.balance);
}

async function handleWalletTopup(amount) {
  if (!api.getToken()) {
    showToast('Please login to top up your Aura Wallet!', 'warning');
    closeAuraWalletModal();
    navigateTo('login');
    return;
  }

  try {
    const res = await api.topupWallet(amount);
    if (res.success) {
      playSfx('celebrate');
      if (typeof triggerConfetti === 'function') triggerConfetti();
      showToast(res.message, 'success');
      renderAuraWalletModal();
    }
  } catch (err) {
    showToast(err.message || 'Top-up failed', 'error');
  }
}

async function handleRedeemGiftCard() {
  const input = document.getElementById('voucherCodeInput');
  if (!input) return;
  const code = input.value.trim();

  if (!code) {
    showToast('Please enter a voucher code', 'warning');
    return;
  }

  if (!api.getToken()) {
    showToast('Please login to redeem gift cards!', 'warning');
    closeAuraWalletModal();
    navigateTo('login');
    return;
  }

  try {
    const res = await api.redeemGiftCard(code);
    if (res.success) {
      playSfx('celebrate');
      if (typeof triggerConfetti === 'function') triggerConfetti();
      showToast(res.message, 'success');
      renderAuraWalletModal();
    }
  } catch (err) {
    showToast(err.message || 'Invalid voucher code', 'error');
  }
}

// ==========================================================================
// 12. FREQUENTLY BOUGHT TOGETHER BUNDLE BUILDER
// ==========================================================================
async function renderFrequentlyBoughtBundle(productId) {
  const container = document.getElementById('productDetailBundleContainer');
  if (!container) return;

  try {
    const res = await api.getBundleRecommendations(productId);
    if (!res.success || !res.bundleItems || res.bundleItems.length === 0) {
      container.style.display = 'none';
      return;
    }

    const { mainProduct, bundleItems, pricing } = res;
    window.currentBundleData = res;

    container.style.display = 'block';
    container.innerHTML = `
      <div class="frequently-bought-bundle-box">
        <h4><i class="fa-solid fa-boxes-packing text-accent"></i> Frequently Bought Together &bull; Bundle & Save 15%</h4>
        
        <div class="bundle-items-visual-row">
          <div class="bundle-thumb-item">
            <img src="${mainProduct.image}" alt="${mainProduct.title}">
            <small class="font-bold text-truncate mt-1" style="max-width: 100px;">${mainProduct.title}</small>
            <span class="text-accent font-bold">${formatCurrency(mainProduct.price)}</span>
          </div>

          ${bundleItems.map((item, idx) => `
            <div class="bundle-plus-badge">+</div>
            <div class="bundle-thumb-item">
              <img src="${item.image}" alt="${item.title}">
              <small class="font-bold text-truncate mt-1" style="max-width: 100px;">${item.title}</small>
              <span class="text-accent font-bold">${formatCurrency(item.price)}</span>
            </div>
          `).join('')}
        </div>

        <div class="bundle-calc-banner">
          <div>
            <div style="font-size: 0.95rem;">
              Bundle Price: <strong class="text-accent" style="font-size: 1.25rem;">${formatCurrency(pricing.discountedTotal)}</strong>
              <span class="detail-original-price ml-2">${formatCurrency(pricing.originalTotal)}</span>
            </div>
            <div class="text-success font-bold" style="font-size: 0.85rem;">
              <i class="fa-solid fa-tag"></i> Instant Bundle Savings: ${formatCurrency(pricing.savings)} (15% OFF)
            </div>
          </div>
          <button class="btn btn-primary" onclick="handleAddBundleToCart()">
            <i class="fa-solid fa-cart-plus"></i> Add All to Cart (${pricing.bundleItems ? pricing.bundleItems.length + 1 : 3} Items)
          </button>
        </div>
      </div>
    `;
  } catch (err) {
    container.style.display = 'none';
  }
}

function handleAddBundleToCart() {
  if (!window.currentBundleData) return;
  const { mainProduct, bundleItems } = window.currentBundleData;

  addToCart(mainProduct, 1);
  bundleItems.forEach(item => addToCart(item, 1));

  playSfx('cart');
  showToast(`🎉 Added 15% OFF Combo Bundle (${bundleItems.length + 1} items) to your cart!`, 'success');
  toggleCartDrawer(true);
}

// ==========================================================================
// 13. LIVE FOMO SOCIAL PROOF NOTIFICATIONS ENGINE
// ==========================================================================
const fomoLocations = ['Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Kochi'];
const fomoNames = ['Rahul S.', 'Priya M.', 'Ananya K.', 'Vikram R.', 'Deepak P.', 'Sneha N.', 'Amit B.', 'Rohan J.'];

function startFomoNotificationsEngine() {
  const container = document.getElementById('fomoToastContainer');
  if (!container) return;

  function triggerRandomFomo() {
    if (typeof allProducts === 'undefined' || allProducts.length === 0) return;

    const randomProd = allProducts[Math.floor(Math.random() * allProducts.length)];
    const randomName = fomoNames[Math.floor(Math.random() * fomoNames.length)];
    const randomLoc = fomoLocations[Math.floor(Math.random() * fomoLocations.length)];
    const minsAgo = Math.floor(Math.random() * 8) + 1;

    const toast = document.createElement('div');
    toast.className = 'fomo-toast';
    toast.innerHTML = `
      <img src="${randomProd.image}" alt="${randomProd.title}">
      <div class="fomo-toast-text">
        <strong>${randomName}</strong> from ${randomLoc} bought
        <div class="text-truncate" style="max-width: 190px; color: var(--accent-primary); font-weight: 600;">${randomProd.title}</div>
        <span class="fomo-time"><i class="fa-regular fa-clock"></i> ${minsAgo} mins ago &bull; <strong class="text-success">Verified Buyer</strong></span>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'all 0.4s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 400);
    }, 5500);
  }

  // First trigger in 4 seconds, then periodically
  setTimeout(triggerRandomFomo, 4000);
  setInterval(triggerRandomFomo, 22000);
}

// ==========================================================================
// 14. PRICE DROP & BACK-IN-STOCK ALERTS ENGINE
// ==========================================================================
function openPriceDropModal(productId, event) {
  if (event) event.stopPropagation();

  let product = productMemoryCache.get(productId);
  if (!product && typeof allProducts !== 'undefined') {
    product = allProducts.find(p => p.id === productId);
  }
  if (!product) return;

  const overlay = document.getElementById('priceDropModalOverlay');
  const prodSummary = document.getElementById('alertProdSummary');
  const prodIdInput = document.getElementById('alertProductId');
  const targetPriceInput = document.getElementById('alertTargetPrice');
  const emailInput = document.getElementById('alertUserEmail');

  if (prodIdInput) prodIdInput.value = product.id;
  if (targetPriceInput) targetPriceInput.value = Math.round(product.price * 0.9); // Suggest 10% lower
  if (emailInput && typeof currentUser !== 'undefined' && currentUser) {
    emailInput.value = currentUser.email || '';
  }

  if (prodSummary) {
    prodSummary.innerHTML = `
      <div class="d-flex align-items-center gap-3 p-2" style="background: var(--bg-secondary); border-radius: var(--radius-md);">
        <img src="${product.image}" alt="${product.title}" style="width: 50px; height: 50px; object-fit: contain;">
        <div>
          <h5 class="m-0 font-bold" style="font-size: 0.9rem;">${product.title}</h5>
          <span class="text-muted">Current Price: <strong class="text-accent">${formatCurrency(product.price)}</strong></span>
        </div>
      </div>
    `;
  }

  if (overlay) overlay.classList.add('active');
  playSfx('click');
}

function closePriceDropModal() {
  const overlay = document.getElementById('priceDropModalOverlay');
  if (overlay) overlay.classList.remove('active');
}

async function handlePriceDropAlertSubmit(event) {
  event.preventDefault();

  const productId = document.getElementById('alertProductId').value;
  const targetPrice = document.getElementById('alertTargetPrice').value;
  const email = document.getElementById('alertUserEmail').value;
  const phone = document.getElementById('alertUserPhone').value;

  try {
    const res = await api.subscribePriceDropAlert({ productId, targetPrice, email, phone });
    if (res.success) {
      playSfx('celebrate');
      showToast(res.message, 'success');
      closePriceDropModal();
    }
  } catch (err) {
    showToast(err.message || 'Failed to set price alert', 'error');
  }
}

// ==========================================================================
// 15. OFFICIAL TAX INVOICE GENERATOR ENGINE
// ==========================================================================
function renderOfficialTaxInvoice(order) {
  const body = document.getElementById('invoicePrintableArea');
  const overlay = document.getElementById('invoiceModalOverlay');
  if (!body || !overlay) return;

  const invoiceDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  body.innerHTML = `
    <div class="tax-invoice-header">
      <div>
        <h2 style="color: var(--accent-primary); font-family: var(--font-heading); margin-bottom: 4px;">
          <i class="fa-solid fa-bolt"></i> AURA E-COMMERCE PVT. LTD.
        </h2>
        <p style="font-size: 0.8rem; margin: 0; opacity: 0.8;">
          Plot 100, Cyber Gateway, Hitech City, Hyderabad, TS - 500081<br>
          <strong>GSTIN:</strong> 36AAACH7409R1ZZ &bull; <strong>CIN:</strong> U72200TG2026PTC109923
        </p>
      </div>
      <div style="text-align: right;">
        <h3 style="margin: 0; font-size: 1.15rem;">TAX INVOICE</h3>
        <p style="font-size: 0.85rem; margin: 2px 0;"><strong>Invoice No:</strong> INV-${order.id.replace('ORD-', '')}</p>
        <p style="font-size: 0.85rem; margin: 0;"><strong>Date:</strong> ${invoiceDate}</p>
      </div>
    </div>

    <div class="tax-invoice-meta-row">
      <div>
        <strong>Billed To / Shipping Address:</strong><br>
        <span style="font-weight: 600;">${escapeHtml(order.customerName)}</span><br>
        ${escapeHtml(order.shippingAddress)}<br>
        Phone: ${escapeHtml(order.customerPhone || 'N/A')}<br>
        Email: ${escapeHtml(order.customerEmail || 'N/A')}
      </div>
      <div style="text-align: right;">
        <strong>Payment Information:</strong><br>
        Payment Method: <strong>${order.paymentMethod}</strong><br>
        Payment Status: <span class="badge badge-popular">${order.paymentStatus}</span><br>
        Place of Supply: <strong>Telangana (36)</strong>
      </div>
    </div>

    <table class="tax-invoice-table">
      <thead>
        <tr>
          <th>Item Description</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: right;">Tax (8% GST)</th>
          <th style="text-align: right;">Total Amount</th>
        </tr>
      </thead>
      <tbody>
        ${(order.items || []).map(item => `
          <tr>
            <td>
              <strong>${escapeHtml(item.title)}</strong>
              <div style="font-size: 0.75rem; opacity: 0.7;">HSN/SAC: 84713010</div>
            </td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right;">${formatCurrency(item.price)}</td>
            <td style="text-align: right;">${formatCurrency((item.price * item.quantity) * 0.08)}</td>
            <td style="text-align: right; font-weight: 600;">${formatCurrency(item.price * item.quantity)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="d-flex justify-content-between align-items-center" style="margin-top: 1rem;">
      <div class="d-flex align-items-center gap-3">
        <div class="invoice-qr-code" title="Digitally Signed Authenticity QR Code">
          <i class="fa-solid fa-qrcode text-accent"></i>
        </div>
        <div style="font-size: 0.75rem; opacity: 0.8;">
          Digitally signed by AURA Store Central Billing Engine.<br>
          Authorized Signatory: <em>Finance Director</em><br>
          Verified Authenticity Code: <strong>AUTH-${order.id}</strong>
        </div>
      </div>

      <div style="width: 250px; font-size: 0.88rem;">
        <div class="d-flex justify-content-between py-1">
          <span>Subtotal:</span>
          <strong>${formatCurrency(order.subtotal)}</strong>
        </div>
        ${order.discount ? `
          <div class="d-flex justify-content-between py-1 text-success">
            <span>Coupon Discount:</span>
            <strong>-${formatCurrency(order.discount)}</strong>
          </div>
        ` : ''}
        ${order.coinsDiscount ? `
          <div class="d-flex justify-content-between py-1 text-warning">
            <span>Aura Coins Discount:</span>
            <strong>-${formatCurrency(order.coinsDiscount)}</strong>
          </div>
        ` : ''}
        <div class="d-flex justify-content-between py-1">
          <span>Estimated GST (8%):</span>
          <strong>${formatCurrency(order.tax)}</strong>
        </div>
        <div class="d-flex justify-content-between py-1">
          <span>Shipping Charges:</span>
          <strong>${order.shipping === 0 ? 'FREE' : formatCurrency(order.shipping)}</strong>
        </div>
        <div class="d-flex justify-content-between py-1 font-bold text-accent" style="font-size: 1.15rem; border-top: 2px solid #cbd5e1; margin-top: 4px;">
          <span>Grand Total:</span>
          <span>${formatCurrency(order.total)}</span>
        </div>
      </div>
    </div>
  `;

  overlay.classList.add('active');
  playSfx('click');
}

function printInvoice() {
  window.print();
}

function closeInvoiceModal() {
  const overlay = document.getElementById('invoiceModalOverlay');
  if (overlay) overlay.classList.remove('active');
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  setupLiveSearchAutocomplete();
  renderCompareFloatingBar();
  renderRecentlyViewedSection();
  startFlashSaleCountdown();
  startFomoNotificationsEngine();

  // Sync saved currency display
  if (currencyRates[currentCurrency]) {
    const flagEl = document.getElementById('currentCurrencyFlag');
    const codeEl = document.getElementById('currentCurrencyCode');
    if (flagEl) flagEl.textContent = currencyRates[currentCurrency].flag;
    if (codeEl) codeEl.textContent = currencyRates[currentCurrency].name;
  }
});


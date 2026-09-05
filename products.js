/**
 * AURA E-COMMERCE - PRODUCT CATALOG & DETAILS MODULE (INR CURRENCY & ULTRA SPEED)
 * Handles product browsing, search, category filters, sorting, price range slider, wishlist, quickview, and reviews
 */

let allProducts = [];
let selectedCategory = 'All';
let searchQuery = '';
let currentSort = 'featured';
let maxPriceFilter = 200000;
let inStockOnlyFilter = false;
let currentDetailProduct = null;

// Currency Formatter Helper for Indian Rupee (₹)
function formatINR(amount) {
  if (isNaN(amount)) return '₹0.00';
  return '₹' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Fetch and load products with in-memory caching for 0ms navigation
async function loadProductsCatalog() {
  const grid = document.getElementById('productGrid');
  const emptyState = document.getElementById('noProductsFoundState');
  const countText = document.getElementById('catalogProductCount');

  // If we already loaded allProducts, filter instantly in memory for max preview speed
  if (allProducts.length > 0 && !searchQuery) {
    applyClientFiltersAndRender();
  } else if (grid && (!allProducts.length || searchQuery)) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
        <i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color: var(--accent-primary);"></i>
        <p class="mt-2 text-muted">Loading premium collection...</p>
      </div>
    `;
  }

  try {
    const params = {};
    if (selectedCategory && selectedCategory !== 'All') params.category = selectedCategory;
    if (searchQuery) params.search = searchQuery;
    if (currentSort && currentSort !== 'featured') params.sort = currentSort;
    if (maxPriceFilter) params.maxPrice = maxPriceFilter;

    const res = await api.getProducts(params);
    if (res.success) {
      if (!searchQuery && selectedCategory === 'All') {
        allProducts = res.products;
        res.products.forEach(p => productMemoryCache.set(p.id, p));
      }
      applyClientFiltersAndRender(res.products);
    }
  } catch (err) {
    if (grid && !allProducts.length) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #ef4444;">
          <i class="fa-solid fa-triangle-exclamation fa-2x"></i>
          <p class="mt-2">Failed to load catalog. Please check server connection.</p>
        </div>
      `;
    }
  }
}

// Client side filtering for instant 0ms preview speed
function applyClientFiltersAndRender(incomingProducts) {
  const grid = document.getElementById('productGrid');
  const emptyState = document.getElementById('noProductsFoundState');
  const countText = document.getElementById('catalogProductCount');

  let list = incomingProducts || allProducts;

  if (selectedCategory && selectedCategory !== 'All') {
    list = list.filter(p => p.category === selectedCategory);
  }

  if (maxPriceFilter) {
    list = list.filter(p => p.price <= maxPriceFilter);
  }

  if (inStockOnlyFilter) {
    list = list.filter(p => p.stock > 0);
  }

  // Client sort
  if (currentSort === 'price_asc') list.sort((a, b) => a.price - b.price);
  else if (currentSort === 'price_desc') list.sort((a, b) => b.price - a.price);
  else if (currentSort === 'rating') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));

  if (countText) {
    countText.textContent = `Showing ${list.length} ${list.length === 1 ? 'item' : 'items'}`;
  }

  if (list.length === 0) {
    if (grid) grid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
  } else {
    if (emptyState) emptyState.style.display = 'none';
    renderProductGrid(list);
  }
}

// Render Product Grid Cards
function renderProductGrid(products) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  grid.innerHTML = products.map(product => {
    const discountPercent = product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

    const isFav = typeof isItemInWishlist === 'function' ? isItemInWishlist(product.id) : false;
    const isCompared = typeof compareList !== 'undefined' ? compareList.some(c => c.id === product.id) : false;

    return `
      <div class="product-card">
        <div class="product-image-wrap" onclick="openProductDetail('${product.id}')" style="cursor: pointer;">
          ${product.badge ? `<span class="product-card-badge">${product.badge}</span>` : ''}
          
          <!-- Top Right Action Cluster -->
          <div class="card-top-actions">
            <button class="wishlist-heart-btn ${isFav ? 'active' : ''}" data-id="${product.id}" onclick="handleWishlistClick('${product.id}', event)" title="Save to wishlist">
              <i class="${isFav ? 'fa-solid fa-heart text-danger' : 'fa-regular fa-heart'}"></i>
            </button>
            <button class="quick-view-hover-btn" onclick="open360Modal('${product.id}', event)" title="360° 3D & AR Room Visualizer" style="background: rgba(99, 102, 241, 0.85); color: #fff;">
              <i class="fa-solid fa-arrows-spin"></i>
            </button>
            <button class="quick-view-hover-btn" onclick="openQuickViewModal('${product.id}', event)" title="Instant Quick Preview">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button class="quick-view-hover-btn" onclick="openPriceDropModal('${product.id}', event)" title="Price Drop Alert">
              <i class="fa-solid fa-bell"></i>
            </button>
          </div>

          <img src="${product.image}" alt="${product.title}" loading="lazy">
        </div>
        <div class="product-card-body">
          <div class="card-meta-header">
            <span class="product-cat-pill">${product.category}</span>
            <button class="btn-compare-pill ${isCompared ? 'active' : ''}" onclick="toggleCompareProduct('${product.id}', event)" title="Compare with other products">
              <i class="fa-solid fa-scale-balanced"></i> ${isCompared ? 'Comparing' : 'Compare'}
            </button>
          </div>

          <h3 class="product-title" onclick="openProductDetail('${product.id}')">${product.title}</h3>
          
          <div class="product-rating-row">
            <div class="stars">
              ${renderStarIcons(product.rating || 4.8)}
            </div>
            <span class="rating-count">(${product.reviewsCount || 42})</span>
          </div>

          <div class="product-price-row">
            <span class="current-price">${formatINR(product.price)}</span>
            ${product.originalPrice ? `<span class="original-price">${formatINR(product.originalPrice)}</span>` : ''}
            ${discountPercent ? `<span class="discount-tag">${discountPercent}% OFF</span>` : ''}
          </div>

          <div class="product-card-actions">
            <button class="btn btn-card-add" onclick="handleQuickAddToCart('${product.id}', event)">
              <i class="fa-solid fa-cart-plus"></i> Add to Cart
            </button>
            <button class="btn btn-card-view" onclick="open360Modal('${product.id}', event)" title="360° Spin & AR View">
              <i class="fa-solid fa-cube"></i>
            </button>
            <button class="btn btn-card-view" onclick="openQuickViewModal('${product.id}', event)" title="Instant Preview">
              <i class="fa-solid fa-magnifying-glass-plus"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Star rating icon generator
function renderStarIcons(rating) {
  let starsHtml = '';
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.4;

  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<i class="fa-solid fa-star"></i>';
  }
  if (hasHalf) {
    starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
  }
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '<i class="fa-regular fa-star"></i>';
  }
  return starsHtml;
}

// Quick Add To Cart from card
function handleQuickAddToCart(productId, event) {
  if (event) event.stopPropagation();
  const product = allProducts.find(p => p.id === productId) || productMemoryCache.get(productId);
  if (product) {
    addToCart(product, 1);
  }
}

// Wishlist click on card
function handleWishlistClick(productId, event) {
  if (event) event.stopPropagation();
  const product = allProducts.find(p => p.id === productId) || productMemoryCache.get(productId);
  if (product && typeof toggleWishlist === 'function') {
    toggleWishlist(product, event);
    const btn = event.currentTarget;
    if (btn) {
      const active = isItemInWishlist(productId);
      btn.classList.toggle('active', active);
      btn.innerHTML = `<i class="${active ? 'fa-solid fa-heart text-danger' : 'fa-regular fa-heart'}"></i>`;
    }
  }
}

// Filter by Category with Instant Response
function filterByCategory(category) {
  selectedCategory = category;

  document.querySelectorAll('.category-pill').forEach(btn => {
    if (btn.getAttribute('data-cat') === category) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const sectionTitle = document.getElementById('catalogSectionTitle');
  if (sectionTitle) {
    sectionTitle.textContent = category === 'All' ? 'Featured Collection' : `${category} Collection`;
  }

  // Instant render from cache
  applyClientFiltersAndRender();
}

// Handle Sort Dropdown
function handleSortChange(sortValue) {
  currentSort = sortValue;
  applyClientFiltersAndRender();
}

// Handle Price Range Slider
function handlePriceSliderChange(val) {
  maxPriceFilter = parseFloat(val);
  const label = document.getElementById('priceRangeLabel');
  if (label) label.textContent = formatINR(maxPriceFilter);
  applyClientFiltersAndRender();
}

// Handle In-Stock Only Toggle
function handleInStockToggle(checked) {
  inStockOnlyFilter = checked;
  applyClientFiltersAndRender();
}

// Handle Global Search Input with instant debounce
let searchDebounceTimeout = null;
function handleSearchInput(value) {
  searchQuery = value;
  const clearBtn = document.getElementById('clearSearchBtn');

  if (clearBtn) {
    clearBtn.style.display = value ? 'block' : 'none';
  }

  clearTimeout(searchDebounceTimeout);
  searchDebounceTimeout = setTimeout(() => {
    loadProductsCatalog();
  }, 200);
}

// Reset Filters
function resetFilters() {
  selectedCategory = 'All';
  searchQuery = '';
  currentSort = 'featured';
  maxPriceFilter = 200000;
  inStockOnlyFilter = false;

  const searchInput = document.getElementById('globalSearchInput');
  const sortSelect = document.getElementById('productSortSelect');
  const priceSlider = document.getElementById('priceRangeSlider');
  const priceLabel = document.getElementById('priceRangeLabel');
  const stockCheckbox = document.getElementById('inStockOnlyCheckbox');
  const clearBtn = document.getElementById('clearSearchBtn');

  if (searchInput) searchInput.value = '';
  if (sortSelect) sortSelect.value = 'featured';
  if (priceSlider) priceSlider.value = 200000;
  if (priceLabel) priceLabel.textContent = '₹2,00,000';
  if (stockCheckbox) stockCheckbox.checked = false;
  if (clearBtn) clearBtn.style.display = 'none';

  filterByCategory('All');
}

// ==========================================
// SPECIFIC PRODUCT DETAIL VIEW
// ==========================================

async function openProductDetail(productId) {
  try {
    let product = productMemoryCache.get(productId);
    let related = [];

    if (product) {
      related = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
    } else {
      const res = await api.getProductById(productId);
      if (res.success && res.product) {
        product = res.product;
        related = res.related || [];
        productMemoryCache.set(product.id, product);
      }
    }

    if (product) {
      currentDetailProduct = product;
      if (typeof trackRecentlyViewed === 'function') {
        trackRecentlyViewed(product);
      }
      renderProductDetailPage(product, related);
      navigateTo('product-detail');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } catch (err) {
    showToast('Failed to open product details', 'error');
  }
}

function renderProductDetailPage(product, related = []) {
  // Breadcrumbs
  const breadCat = document.getElementById('detailBreadcrumbCategory');
  const breadTitle = document.getElementById('detailBreadcrumbTitle');
  if (breadCat) breadCat.textContent = product.category;
  if (breadTitle) breadTitle.textContent = product.title;

  // Main Image & Badge
  const mainImg = document.getElementById('detailMainImage');
  const badge = document.getElementById('detailBadge');
  if (mainImg) mainImg.src = product.image;
  if (badge) {
    if (product.badge) {
      badge.style.display = 'block';
      badge.textContent = product.badge;
    } else {
      badge.style.display = 'none';
    }
  }

  // Thumbnails row
  const thumbsRow = document.getElementById('detailThumbnailsRow');
  if (thumbsRow) {
    const gallery = product.gallery && product.gallery.length ? product.gallery : [product.image];
    thumbsRow.innerHTML = gallery.map((imgUrl, index) => `
      <div class="thumbnail-box ${index === 0 ? 'active' : ''}" onclick="switchDetailMainImage('${imgUrl}', this)">
        <img src="${imgUrl}" alt="Gallery Thumbnail">
      </div>
    `).join('');
  }

  // Info Column
  const catTag = document.getElementById('detailCategoryTag');
  const title = document.getElementById('detailTitle');
  const starsWrap = document.getElementById('detailRatingStars');
  const ratingScore = document.getElementById('detailRatingScore');
  const reviewsCount = document.getElementById('detailReviewsCount');
  const curPrice = document.getElementById('detailCurrentPrice');
  const origPrice = document.getElementById('detailOriginalPrice');
  const discountBadge = document.getElementById('detailDiscountBadge');
  const description = document.getElementById('detailDescription');
  const stockText = document.getElementById('detailStockText');
  const qtyInput = document.getElementById('detailQuantityInput');

  if (catTag) catTag.textContent = product.category;
  if (title) title.textContent = product.title;
  if (starsWrap) starsWrap.innerHTML = renderStarIcons(product.rating || 4.9);
  if (ratingScore) ratingScore.textContent = (product.rating || 4.9).toFixed(1);
  if (reviewsCount) reviewsCount.textContent = `(${product.reviewsCount || 85} customer reviews)`;

  if (curPrice) curPrice.textContent = formatINR(product.price);
  if (origPrice) {
    if (product.originalPrice && product.originalPrice > product.price) {
      origPrice.style.display = 'inline-block';
      origPrice.textContent = formatINR(product.originalPrice);
    } else {
      origPrice.style.display = 'none';
    }
  }

  if (discountBadge) {
    if (product.originalPrice && product.originalPrice > product.price) {
      const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
      discountBadge.style.display = 'inline-block';
      discountBadge.textContent = `${discount}% OFF`;
    } else {
      discountBadge.style.display = 'none';
    }
  }

  if (description) description.textContent = product.description;
  if (stockText) {
    stockText.textContent = product.stock > 0
      ? `In Stock (${product.stock} units available)`
      : 'Currently Out of Stock';
  }
  if (qtyInput) qtyInput.value = 1;

  // Specs Table
  const specsTable = document.getElementById('detailSpecsTable');
  if (specsTable) {
    const specs = product.specs || { "Category": product.category, "Availability": "In Stock", "Delivery": "Express 2-3 Days" };
    specsTable.innerHTML = Object.entries(specs).map(([key, val]) => `
      <div class="specs-row">
        <span class="specs-key">${key}</span>
        <span class="specs-val">${val}</span>
      </div>
    `).join('');
  }

  // Render Frequently Bought Together Bundle Builder
  if (typeof renderFrequentlyBoughtBundle === 'function') {
    renderFrequentlyBoughtBundle(product.id);
  }

  // Render Reviews List
  renderProductReviewsSection(product);

  // Related products
  const relatedGrid = document.getElementById('relatedProductGrid');
  if (relatedGrid) {
    if (related.length === 0) {
      relatedGrid.innerHTML = '<p class="text-muted">No related items found.</p>';
    } else {
      relatedGrid.innerHTML = related.map(p => `
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
              Add to Cart
            </button>
          </div>
        </div>
      `).join('');
    }
  }
}

// Render Reviews Section
function renderProductReviewsSection(product) {
  const reviewsContainer = document.getElementById('detailReviewsList');
  if (!reviewsContainer) return;

  const reviews = product.reviews || [
    {
      id: 'rev_sample_1',
      userName: 'Rahul Sharma',
      rating: 5,
      title: 'Outstanding performance and fast delivery!',
      comment: 'Arrived within 2 days. The build quality and packaging are exceptional.',
      createdAt: '2026-02-15T10:00:00.000Z'
    },
    {
      id: 'rev_sample_2',
      userName: 'Ananya Roy',
      rating: 4.8,
      title: 'Value for money',
      comment: 'Works seamlessly out of the box. Highly recommend for the price point.',
      createdAt: '2026-02-20T14:30:00.000Z'
    }
  ];

  reviewsContainer.innerHTML = reviews.map(rev => `
    <div class="review-item-card">
      <div class="review-header">
        <div class="reviewer-info">
          <span class="user-avatar" style="width: 32px; height: 32px; font-size: 0.8rem;">${(rev.userName || 'U').charAt(0)}</span>
          <div>
            <strong>${rev.userName}</strong>
            <span class="badge badge-instant" style="font-size: 0.65rem; margin-left: 6px;">Verified Buyer</span>
          </div>
        </div>
        <div class="review-rating">${renderStarIcons(rev.rating)}</div>
      </div>
      <h4 class="review-title mt-2">${rev.title}</h4>
      <p class="review-comment">${rev.comment}</p>
      <span class="review-date text-muted small">${new Date(rev.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
    </div>
  `).join('');
}

// Submit Customer Review
async function submitProductReview(event) {
  event.preventDefault();
  if (!currentDetailProduct) return;

  const nameInput = document.getElementById('reviewAuthorName');
  const ratingInput = document.getElementById('reviewStarRating');
  const titleInput = document.getElementById('reviewTitleInput');
  const commentInput = document.getElementById('reviewCommentInput');
  const submitBtn = document.getElementById('submitReviewBtn');

  const rating = parseFloat(ratingInput ? ratingInput.value : 5);
  const title = titleInput ? titleInput.value.trim() : 'Great product';
  const comment = commentInput ? commentInput.value.trim() : '';
  const reviewerName = nameInput ? nameInput.value.trim() : (currentUser ? currentUser.name : 'Customer');

  if (!comment) {
    showToast('Please write a few words about the product.', 'warning');
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting...';
    }

    const res = await api.request(`/products/${currentDetailProduct.id}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ reviewerName, rating, title, comment })
    });

    if (res.success) {
      showToast('🎉 Your review was submitted successfully!', 'success');
      if (commentInput) commentInput.value = '';
      if (titleInput) titleInput.value = '';

      const prodRes = await api.getProductById(currentDetailProduct.id);
      if (prodRes.success && prodRes.product) {
        currentDetailProduct = prodRes.product;
        productMemoryCache.set(currentDetailProduct.id, currentDetailProduct);
        renderProductDetailPage(prodRes.product, prodRes.related || []);
      }
    }
  } catch (err) {
    showToast(err.message || 'Failed to submit review', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Review';
    }
  }
}

// Switch Detail Image
function switchDetailMainImage(imageUrl, thumbElement) {
  const mainImg = document.getElementById('detailMainImage');
  if (mainImg) mainImg.src = imageUrl;

  document.querySelectorAll('.thumbnail-box').forEach(t => t.classList.remove('active'));
  if (thumbElement) thumbElement.classList.add('active');
}

// Adjust Quantity in Detail Page
function adjustDetailQuantity(delta) {
  const input = document.getElementById('detailQuantityInput');
  if (!input || !currentDetailProduct) return;

  let currentVal = parseInt(input.value, 10) || 1;
  let nextVal = currentVal + delta;

  if (nextVal < 1) nextVal = 1;
  if (currentDetailProduct.stock && nextVal > currentDetailProduct.stock) {
    showToast(`Only ${currentDetailProduct.stock} units in stock`, 'warning');
    nextVal = currentDetailProduct.stock;
  }

  input.value = nextVal;
}

// Add Current Detail Product to Cart
function addCurrentProductToCart() {
  if (!currentDetailProduct) return;
  const qtyInput = document.getElementById('detailQuantityInput');
  const qty = parseInt(qtyInput ? qtyInput.value : 1, 10) || 1;
  addToCart(currentDetailProduct, qty);
}

// Buy Current Product Now (Instant Checkout)
function buyCurrentProductNow() {
  if (!currentDetailProduct) return;
  const qtyInput = document.getElementById('detailQuantityInput');
  const qty = parseInt(qtyInput ? qtyInput.value : 1, 10) || 1;
  addToCart(currentDetailProduct, qty);
  toggleCartDrawer(false);
  navigateTo('checkout');
}

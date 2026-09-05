/**
 * AURA E-COMMERCE - WISHLIST MODULE (INR CURRENCY)
 * Wishlist management, drawer UI, 1-click move to cart, and localStorage state
 */

let wishlist = JSON.parse(localStorage.getItem('aura_wishlist')) || [];

// Currency Formatter Helper for Indian Rupee (₹)
function formatINR(amount) {
  if (isNaN(amount)) return '₹0.00';
  return '₹' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function saveWishlist() {
  localStorage.setItem('aura_wishlist', JSON.stringify(wishlist));
  updateWishlistBadge();
  renderWishlistDrawer();
}

// Toggle product in/out of wishlist
function toggleWishlist(product, event) {
  if (event) event.stopPropagation();

  const index = wishlist.findIndex(item => item.id === product.id);
  if (index > -1) {
    wishlist.splice(index, 1);
    showToast(`Removed "${product.title}" from your wishlist`, 'info');
  } else {
    wishlist.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      category: product.category,
      rating: product.rating,
      stock: product.stock
    });
    showToast(`❤️ Added "${product.title}" to your wishlist!`, 'success');
  }

  saveWishlist();
}

// Check if item is in wishlist
function isItemInWishlist(productId) {
  return wishlist.some(item => item.id === productId);
}

// Remove from wishlist
function removeFromWishlist(productId, event) {
  if (event) event.stopPropagation();
  wishlist = wishlist.filter(item => item.id !== productId);
  saveWishlist();
  showToast('Item removed from wishlist', 'info');

  // Sync heart buttons on page
  document.querySelectorAll(`.wishlist-heart-btn[data-id="${productId}"]`).forEach(btn => {
    btn.classList.remove('active');
    btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
  });
}

// Move item from wishlist to cart
function moveWishlistItemToCart(productId) {
  const item = wishlist.find(i => i.id === productId);
  if (!item) return;

  // Add to cart
  addToCart(item, 1);

  // Remove from wishlist
  wishlist = wishlist.filter(i => i.id !== productId);
  saveWishlist();

  // Close wishlist drawer and open cart
  toggleWishlistDrawer(false);
  toggleCartDrawer(true);
}

// Update wishlist badge in header
function updateWishlistBadge() {
  const badge = document.getElementById('wishlistCountBadge');
  const count = wishlist.length;
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

// Render Wishlist Drawer Contents
function renderWishlistDrawer() {
  const list = document.getElementById('wishlistItemsList');
  const countHeader = document.getElementById('wishlistHeaderCount');
  if (!list) return;

  if (countHeader) {
    countHeader.textContent = `${wishlist.length} ${wishlist.length === 1 ? 'item' : 'items'}`;
  }

  if (wishlist.length === 0) {
    list.innerHTML = `
      <div class="empty-cart-state">
        <i class="fa-regular fa-heart" style="font-size: 3.5rem; color: rgba(255,255,255,0.15);"></i>
        <h4>Your Wishlist is Empty</h4>
        <p class="small text-muted">Tap the heart icon on any product to save it here for later.</p>
        <button class="btn btn-primary btn-sm mt-3" onclick="toggleWishlistDrawer(false); navigateTo('home');">
          Explore Catalog
        </button>
      </div>
    `;
    return;
  }

  list.innerHTML = wishlist.map(item => `
    <div class="cart-item-row">
      <img src="${item.image}" alt="${item.title}" class="cart-item-img">
      <div class="cart-item-info">
        <div class="cart-item-title">${item.title}</div>
        <div class="cart-item-price">${formatINR(item.price)}</div>
        <div class="mt-2" style="display: flex; gap: 0.5rem;">
          <button class="btn btn-primary btn-sm" onclick="moveWishlistItemToCart('${item.id}')">
            <i class="fa-solid fa-cart-plus"></i> Move to Cart
          </button>
          <button class="btn btn-outline btn-sm text-danger" onclick="removeFromWishlist('${item.id}', event)">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Toggle Wishlist Drawer
function toggleWishlistDrawer(forceOpen) {
  const drawer = document.getElementById('wishlistDrawer');
  const overlay = document.getElementById('wishlistDrawerOverlay');

  if (!drawer || !overlay) return;

  if (forceOpen === true) {
    drawer.classList.add('active');
    overlay.classList.add('active');
  } else if (forceOpen === false) {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
  } else {
    drawer.classList.toggle('active');
    overlay.classList.toggle('active');
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  saveWishlist();
});

/**
 * AURA E-COMMERCE - SHOPPING CART MODULE (INR CURRENCY)
 * Slide-over Cart Drawer, Local Storage State, Quantity Management & Discount Coupons
 */

let cart = JSON.parse(localStorage.getItem('aura_cart')) || [];
let activeCoupon = JSON.parse(localStorage.getItem('aura_coupon')) || null;

// Currency Formatter Helper for Indian Rupee (₹)
function formatINR(amount) {
  if (isNaN(amount)) return '₹0.00';
  return '₹' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Save cart state
function saveCart() {
  localStorage.setItem('aura_cart', JSON.stringify(cart));
  if (activeCoupon) {
    localStorage.setItem('aura_coupon', JSON.stringify(activeCoupon));
  } else {
    localStorage.removeItem('aura_coupon');
  }
  renderCartDrawer();
  updateCartBadge();
}

// Add item to cart
function addToCart(product, quantity = 1) {
  const existingIndex = cart.findIndex(item => item.id === product.id);

  if (existingIndex > -1) {
    const newQty = cart[existingIndex].quantity + quantity;
    if (product.stock && newQty > product.stock) {
      showToast(`Only ${product.stock} units available in stock!`, 'warning');
      cart[existingIndex].quantity = product.stock;
    } else {
      cart[existingIndex].quantity = newQty;
      showToast(`Updated "${product.title}" quantity in your cart!`, 'success');
    }
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      stock: product.stock,
      quantity: quantity
    });
    showToast(`Added "${product.title}" to cart!`, 'success');
  }

  saveCart();
  toggleCartDrawer(true);
}

// Remove item from cart
function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  showToast('Item removed from cart', 'info');
}

// Change item quantity
function updateCartItemQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  const newQty = item.quantity + delta;
  if (newQty <= 0) {
    removeFromCart(productId);
  } else if (item.stock && newQty > item.stock) {
    showToast(`Maximum available stock reached (${item.stock})`, 'warning');
  } else {
    item.quantity = newQty;
    saveCart();
  }
}

// Clear entire cart
function clearCart() {
  cart = [];
  activeCoupon = null;
  saveCart();
}

// Calculate All Totals
function calculateCartTotals() {
  const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  let discount = 0;
  if (activeCoupon && activeCoupon.discountPercent) {
    discount = +(subtotal * (activeCoupon.discountPercent / 100)).toFixed(2);
  }

  const tax = +(subtotal * 0.08).toFixed(2); // 8% GST
  const shippingThreshold = 999;
  const shipping = subtotal === 0 ? 0 : (subtotal >= shippingThreshold ? 0.00 : 99.00);
  const grandTotal = +(subtotal - discount + tax + shipping).toFixed(2);

  return {
    itemsCount,
    subtotal: +subtotal.toFixed(2),
    discount: +discount.toFixed(2),
    tax: +tax.toFixed(2),
    shipping: +shipping.toFixed(2),
    grandTotal: +grandTotal.toFixed(2),
    shippingThreshold
  };
}

// Update Global Header Badge
function updateCartBadge() {
  const totals = calculateCartTotals();
  const badge = document.getElementById('cartCountBadge');
  const pricePreview = document.getElementById('cartTotalPreview');

  if (badge) badge.textContent = totals.itemsCount;
  if (pricePreview) pricePreview.textContent = formatINR(totals.subtotal);
}

// Render Cart Drawer Contents
function renderCartDrawer() {
  const list = document.getElementById('cartItemsList');
  const headerCount = document.getElementById('cartHeaderCount');
  const subtotalText = document.getElementById('cartSubtotalText');
  const discountRow = document.getElementById('cartDiscountRow');
  const discountText = document.getElementById('cartDiscountText');
  const taxText = document.getElementById('cartTaxText');
  const shippingText = document.getElementById('cartShippingText');
  const grandTotalText = document.getElementById('cartGrandTotalText');
  const shippingBar = document.getElementById('shippingProgressBar');
  const shippingInfo = document.getElementById('shippingProgressText');
  const appliedBadge = document.getElementById('appliedCouponBadge');
  const appliedCode = document.getElementById('appliedCouponCode');

  if (!list) return;

  const totals = calculateCartTotals();

  if (headerCount) headerCount.textContent = `${totals.itemsCount} ${totals.itemsCount === 1 ? 'item' : 'items'}`;

  // Shipping meter
  if (shippingBar && shippingInfo) {
    if (totals.subtotal >= totals.shippingThreshold) {
      shippingBar.style.width = '100%';
      shippingInfo.innerHTML = '🎉 You qualify for <strong>FREE Delivery!</strong>';
    } else {
      const remaining = (totals.shippingThreshold - totals.subtotal).toFixed(2);
      const percentage = Math.min(100, Math.round((totals.subtotal / totals.shippingThreshold) * 100));
      shippingBar.style.width = `${percentage}%`;
      shippingInfo.innerHTML = `Add <strong>₹${remaining}</strong> more for <strong>FREE Delivery!</strong>`;
    }
  }

  // Render Items List
  if (cart.length === 0) {
    list.innerHTML = `
      <div class="empty-cart-state">
        <i class="fa-solid fa-cart-arrow-down"></i>
        <h4>Your Cart is Empty</h4>
        <p class="small">Explore our catalog and add items you like!</p>
        <button class="btn btn-primary btn-sm" onclick="toggleCartDrawer(false); navigateTo('home');">
          Browse Products
        </button>
      </div>
    `;
  } else {
    list.innerHTML = cart.map(item => `
      <div class="cart-item-row">
        <img src="${item.image}" alt="${item.title}" class="cart-item-img">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-price">${formatINR(item.price)}</div>
          <div class="cart-item-qty-row">
            <button class="mini-qty-btn" onclick="updateCartItemQty('${item.id}', -1)">-</button>
            <span class="mini-qty-val">${item.quantity}</span>
            <button class="mini-qty-btn" onclick="updateCartItemQty('${item.id}', 1)">+</button>
          </div>
        </div>
        <button class="remove-cart-item-btn" onclick="removeFromCart('${item.id}')" title="Remove item">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `).join('');
  }

  // Coupon badge
  if (appliedBadge && appliedCode) {
    if (activeCoupon) {
      appliedBadge.style.display = 'flex';
      appliedCode.textContent = `${activeCoupon.code} (-${activeCoupon.discountPercent}%)`;
    } else {
      appliedBadge.style.display = 'none';
    }
  }

  // Totals text
  if (subtotalText) subtotalText.textContent = formatINR(totals.subtotal);
  if (taxText) taxText.textContent = formatINR(totals.tax);
  if (shippingText) shippingText.textContent = totals.shipping === 0 ? 'FREE' : formatINR(totals.shipping);
  if (grandTotalText) grandTotalText.textContent = formatINR(totals.grandTotal);

  if (discountRow && discountText) {
    if (totals.discount > 0) {
      discountRow.style.display = 'flex';
      discountText.textContent = `-${formatINR(totals.discount)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }
}

// Toggle Cart Drawer
function toggleCartDrawer(forceOpen) {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartDrawerOverlay');

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

// Apply Coupon Code
async function applyCouponCode() {
  const input = document.getElementById('drawerCouponInput');
  if (!input) return;
  const code = input.value.trim().toUpperCase();

  if (!code) {
    showToast('Please enter a coupon code.', 'warning');
    return;
  }

  try {
    const res = await api.validateCoupon(code);
    if (res.success && res.coupon) {
      activeCoupon = res.coupon;
      input.value = '';
      saveCart();
      showToast(`Coupon "${code}" applied! You get ${res.coupon.discountPercent}% OFF.`, 'success');
    }
  } catch (err) {
    showToast(err.message || 'Invalid coupon code', 'error');
  }
}

// Remove Coupon Code
function removeCouponCode() {
  activeCoupon = null;
  saveCart();
  showToast('Coupon removed', 'info');
}

// Proceed to Checkout
function proceedToCheckout() {
  if (cart.length === 0) {
    showToast('Your cart is empty! Add products before checkout.', 'warning');
    return;
  }
  toggleCartDrawer(false);
  navigateTo('checkout');
}

// Initialize cart on boot
document.addEventListener('DOMContentLoaded', () => {
  saveCart();
});

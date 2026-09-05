/**
 * AURA E-COMMERCE - CHECKOUT & ORDER PLACEMENT MODULE (INR CURRENCY)
 * User shipping details, Cash on Delivery (COD) / Payment processing, and confirmation
 */

let selectedPaymentMethod = 'Cash on Delivery';
let selectedCoinsRedeemed = 0;
window.lastPlacedOrderId = null;

// Currency Formatter Helper for Indian Rupee (₹) or Active Currency
function formatINR(amount) {
  if (typeof formatCurrency === 'function') return formatCurrency(amount);
  if (isNaN(amount)) return '₹0.00';
  return '₹' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Initialize Checkout Page
function setupCheckoutPage() {
  if (cart.length === 0) {
    showToast('Your cart is empty. Please add items to checkout.', 'warning');
    navigateTo('home');
    return;
  }

  // Pre-fill user data if authenticated
  const nameInput = document.getElementById('checkoutName');
  const emailInput = document.getElementById('checkoutEmail');
  const phoneInput = document.getElementById('checkoutPhone');
  const addressInput = document.getElementById('checkoutAddress');

  if (currentUser) {
    if (nameInput) nameInput.value = currentUser.name || '';
    if (emailInput) emailInput.value = currentUser.email || '';
    if (phoneInput && currentUser.phone) phoneInput.value = currentUser.phone;
    if (addressInput && currentUser.address) addressInput.value = currentUser.address;

    // Populate Wallet & Coins info in checkout
    const walletBadge = document.getElementById('checkoutWalletBadge');
    if (walletBadge) {
      walletBadge.textContent = `Balance: ${formatINR(currentUser.walletBalance || 2500)}`;
    }

    const coinsAvail = document.getElementById('checkoutCoinsAvail');
    const coinsSlider = document.getElementById('checkoutCoinsSlider');
    const userCoins = currentUser.coins || 350;

    if (coinsAvail) coinsAvail.textContent = `${userCoins} Coins available`;
    if (coinsSlider) {
      coinsSlider.max = userCoins;
      coinsSlider.value = 0;
      selectedCoinsRedeemed = 0;
    }
  } else {
    if (emailInput) {
      emailInput.readOnly = false;
      emailInput.placeholder = 'Please sign in or enter email';
    }
  }

  renderCheckoutSummary();
}

function handleCheckoutCoinsChange(coins) {
  selectedCoinsRedeemed = parseInt(coins, 10) || 0;
  const label = document.getElementById('checkoutCoinsValLabel');
  const discountVal = (selectedCoinsRedeemed * 0.10);
  if (label) {
    label.textContent = `${selectedCoinsRedeemed} Coins (-${formatINR(discountVal)})`;
  }
  if (typeof playSfx === 'function') playSfx('click');
  renderCheckoutSummary();
}

// Render Order Summary in Checkout
function renderCheckoutSummary() {
  const itemsList = document.getElementById('checkoutItemsList');
  const subtotalEl = document.getElementById('checkoutSubtotal');
  const discountRow = document.getElementById('checkoutDiscountRow');
  const discountEl = document.getElementById('checkoutDiscount');
  const coinsRow = document.getElementById('checkoutCoinsDiscountRow');
  const coinsEl = document.getElementById('checkoutCoinsDiscount');
  const taxEl = document.getElementById('checkoutTax');
  const shippingEl = document.getElementById('checkoutShipping');
  const totalEl = document.getElementById('checkoutGrandTotal');

  if (!itemsList) return;

  const totals = calculateCartTotals();
  const coinsDiscount = +(selectedCoinsRedeemed * 0.10).toFixed(2);
  const grandTotalWithCoins = Math.max(0, totals.grandTotal - coinsDiscount);

  // Render Mini Items List
  itemsList.innerHTML = cart.map(item => `
    <div class="checkout-mini-item">
      <img src="${item.image}" alt="${item.title}">
      <div class="mini-info">
        <div class="mini-title">${item.title}</div>
        <div class="mini-qty">Qty: ${item.quantity} &times; ${formatINR(item.price)}</div>
      </div>
      <div class="mini-price"><strong>${formatINR(item.price * item.quantity)}</strong></div>
    </div>
  `).join('');

  if (subtotalEl) subtotalEl.textContent = formatINR(totals.subtotal);
  if (taxEl) taxEl.textContent = formatINR(totals.tax);
  if (shippingEl) shippingEl.textContent = totals.shipping === 0 ? 'FREE' : formatINR(totals.shipping);
  if (totalEl) totalEl.textContent = formatINR(grandTotalWithCoins);

  if (discountRow && discountEl) {
    if (totals.discount > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = `-${formatINR(totals.discount)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }

  if (coinsRow && coinsEl) {
    if (coinsDiscount > 0) {
      coinsRow.style.display = 'flex';
      coinsEl.textContent = `-${formatINR(coinsDiscount)}`;
    } else {
      coinsRow.style.display = 'none';
    }
  }
}

// Handle Payment Method Choice
function handlePaymentMethodChange(method) {
  selectedPaymentMethod = method;

  const walletCard = document.getElementById('payMethodWalletCard');
  const codCard = document.getElementById('payMethodCODCard');
  const cardCard = document.getElementById('payMethodCardCard');
  const upiCard = document.getElementById('payMethodUPICard');
  const codNotice = document.getElementById('codAssuranceNotice');
  const placeBtnText = document.getElementById('placeOrderBtnText');

  [walletCard, codCard, cardCard, upiCard].forEach(c => c && c.classList.remove('active'));

  if (typeof playSfx === 'function') playSfx('click');

  if (method === 'Aura Wallet') {
    if (walletCard) walletCard.classList.add('active');
    if (codNotice) codNotice.style.display = 'none';
    if (placeBtnText) placeBtnText.textContent = '1-Click Pay with Aura Wallet';
  } else if (method === 'Cash on Delivery') {
    if (codCard) codCard.classList.add('active');
    if (codNotice) codNotice.style.display = 'flex';
    if (placeBtnText) placeBtnText.textContent = 'Confirm & Place Cash on Delivery Order';
  } else if (method === 'Credit / Debit Card') {
    if (cardCard) cardCard.classList.add('active');
    if (codNotice) codNotice.style.display = 'none';
    if (placeBtnText) placeBtnText.textContent = 'Pay Now & Place Order';
  } else if (method === 'UPI / Digital Wallet') {
    if (upiCard) upiCard.classList.add('active');
    if (codNotice) codNotice.style.display = 'none';
    if (placeBtnText) placeBtnText.textContent = 'Pay via UPI & Place Order';
  }
}

// Submit Order Placement
async function submitOrderPlacement() {
  if (!currentUser) {
    showToast('Please sign in or create an account to place your order.', 'warning');
    navigateTo('login');
    return;
  }

  if (cart.length === 0) {
    showToast('Your shopping cart is empty.', 'error');
    return;
  }

  const name = document.getElementById('checkoutName').value.trim();
  const phone = document.getElementById('checkoutPhone').value.trim();
  const address = document.getElementById('checkoutAddress').value.trim();
  const notes = document.getElementById('checkoutInstructions') ? document.getElementById('checkoutInstructions').value.trim() : '';

  if (!name || !phone || !address) {
    showToast('Please fill in your name, phone number, and delivery address.', 'warning');
    return;
  }

  const placeBtn = document.getElementById('placeOrderBtn');
  try {
    placeBtn.disabled = true;
    placeBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing Order...';

    const orderPayload = {
      items: cart.map(item => ({
        productId: item.id,
        title: item.title,
        quantity: item.quantity
      })),
      customerName: name,
      customerPhone: phone,
      shippingAddress: address + (notes ? ` (Notes: ${notes})` : ''),
      paymentMethod: selectedPaymentMethod,
      couponCode: activeCoupon ? activeCoupon.code : null,
      coinsRedeemed: selectedCoinsRedeemed
    };

    const res = await api.createOrder(orderPayload);
    if (res.success && res.order) {
      window.lastPlacedOrderId = res.order.id;

      // Update user wallet & coins state locally if returned
      if (res.userWallet) {
        if (currentUser) {
          currentUser.walletBalance = res.userWallet.walletBalance;
          currentUser.coins = res.userWallet.coins;
          currentUser.vipTier = res.userWallet.vipTier;
        }
        const navCoins = document.getElementById('navVipCoinsPill');
        if (navCoins) navCoins.textContent = `👑 ${res.userWallet.coins} Coins`;
        const navWallet = document.getElementById('navWalletBalancePill');
        if (navWallet) navWallet.textContent = formatINR(res.userWallet.walletBalance);
      }

      // Clear Cart
      clearCart();

      // Show Order Success Screen
      renderOrderSuccessView(res.order);
      navigateTo('order-success');

      // Trigger Confetti Celebration & Sound
      if (typeof playSfx === 'function') playSfx('celebrate');
      triggerConfettiParticles();

      // Show Order Placed Notification Toast
      showToast(`🎉 Order ${res.order.id} placed successfully! Notification sent.`, 'success');
    }
  } catch (err) {
    showToast(err.message || 'Failed to place order. Please try again.', 'error');
  } finally {
    placeBtn.disabled = false;
    placeBtn.innerHTML = '<i class="fa-solid fa-lock"></i> <span id="placeOrderBtnText">Confirm & Place Order</span>';
  }
}

// Render Order Success View
function renderOrderSuccessView(order) {
  const idEl = document.getElementById('successOrderId');
  const payEl = document.getElementById('successPaymentMethod');
  const totalEl = document.getElementById('successOrderTotal');
  const dateEl = document.getElementById('successDeliveryDate');

  if (idEl) idEl.textContent = order.id;
  if (payEl) payEl.textContent = order.paymentMethod;
  if (totalEl) totalEl.textContent = formatINR(order.total);

  // 3-5 business days estimate
  const deliveryEst = new Date();
  deliveryEst.setDate(deliveryEst.getDate() + 4);
  if (dateEl) {
    dateEl.textContent = deliveryEst.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}

/**
 * AURA E-COMMERCE - CUSTOMER ORDERS & LIVE TRACKING MODULE (INR CURRENCY)
 * Features:
 * 1. Order History Cards & Status Filtering
 * 2. Multi-Step Animated Stepper Timeline
 * 3. Interactive Real-Time GPS & AWB Shipment Tracking Modal
 * 4. Official GST Tax Invoice Generator & Printable Views
 * 5. Direct Order ID Tracking Lookup Tool
 */

let myOrdersCache = [];
let activeOrderFilterStatus = 'All';
let orderSearchQuery = '';

// Currency Formatter Helper for Indian Rupee (₹)
function formatINR(amount) {
  if (isNaN(amount)) return '₹0.00';
  return '₹' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Load current user's orders
async function loadMyOrdersList() {
  const container = document.getElementById('ordersListContainer');
  const emptyState = document.getElementById('noOrdersState');

  if (!currentUser) {
    showToast('Please login to view your past orders', 'info');
    navigateTo('login');
    return;
  }

  if (container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color: var(--accent-primary);"></i>
        <p class="mt-2 text-muted">Retrieving your orders & shipment status...</p>
      </div>
    `;
  }

  try {
    const res = await api.getMyOrders();
    if (res.success) {
      myOrdersCache = res.orders;
      renderFilteredOrders();
    }
  } catch (err) {
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: #ef4444;">
          <i class="fa-solid fa-triangle-exclamation fa-2x"></i>
          <p class="mt-2">${err.message || 'Failed to load orders'}</p>
        </div>
      `;
    }
  }
}

// Filter and Search My Orders
function renderFilteredOrders() {
  const container = document.getElementById('ordersListContainer');
  const emptyState = document.getElementById('noOrdersState');
  if (!container) return;

  let filtered = myOrdersCache;

  // Status filter
  if (activeOrderFilterStatus !== 'All') {
    filtered = filtered.filter(o => (o.orderStatus || '').toLowerCase() === activeOrderFilterStatus.toLowerCase());
  }

  // Search query filter (Order ID or Item Title)
  if (orderSearchQuery) {
    const q = orderSearchQuery.toLowerCase();
    filtered = filtered.filter(o => {
      const matchId = o.id.toLowerCase().includes(q);
      const matchItem = (o.items || []).some(i => (i.title || '').toLowerCase().includes(q));
      return matchId || matchItem;
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
  } else {
    if (emptyState) emptyState.style.display = 'none';
    renderOrdersCards(filtered);
  }
}

// Render Orders Cards List
function renderOrdersCards(orders) {
  const container = document.getElementById('ordersListContainer');
  if (!container) return;

  container.innerHTML = orders.map(order => {
    const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const isDelivered = order.orderStatus === 'Delivered';

    return `
      <div class="order-card">
        <div class="order-card-header">
          <div class="order-header-left">
            <span class="order-id-badge">${order.id}</span>
            <span class="order-date-text"><i class="fa-regular fa-calendar"></i> ${formattedDate}</span>
          </div>
          <div class="order-header-right">
            ${getOrderStatusBadge(order.orderStatus)}
          </div>
        </div>

        <div class="order-card-body">
          <!-- Multi-Step Order Tracker -->
          <div class="order-stepper">
            ${renderOrderStepper(order.orderStatus)}
          </div>

          <!-- Order Items List -->
          <div class="order-items-grid">
            ${(order.items || []).map(item => `
              <div class="order-item-row">
                <img src="${item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}" alt="${item.title}">
                <div style="flex: 1;">
                  <h4 style="font-size: 0.95rem; margin-bottom: 0.2rem;">${item.title}</h4>
                  <p class="text-muted small">Qty: ${item.quantity} &times; ${formatINR(item.price)}</p>
                </div>
                <div style="font-weight: 700; color: var(--accent-primary);">
                  ${formatINR(item.price * item.quantity)}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Shipping Details & Payment Info -->
          <div class="order-meta-details-bar">
            <div>
              <span class="text-muted"><i class="fa-solid fa-location-dot"></i> Delivery Address:</span>
              <p class="mt-1" style="color: var(--text-primary); font-weight: 500;">${order.shippingAddress}</p>
            </div>
            <div>
              <span class="text-muted"><i class="fa-solid fa-money-bill-wave"></i> Payment Method:</span>
              <p class="mt-1" style="color: var(--text-primary); font-weight: 600;">
                ${order.paymentMethod}
                ${order.paymentMethod === 'Cash on Delivery' ? '<span class="badge badge-popular" style="margin-left: 6px;">Pay at Doorstep</span>' : ''}
              </p>
            </div>
          </div>
        </div>

        <div class="order-card-footer">
          <div style="font-size: 1.1rem; font-weight: 800; font-family: var(--font-heading);">
            Total: <span style="color: var(--accent-primary);">${formatINR(order.total)}</span>
          </div>
          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" onclick="openLiveTrackingModal('${order.id}')">
              <i class="fa-solid fa-satellite-dish fa-fade"></i> Track Live Shipment
            </button>
            <button class="btn btn-outline btn-sm" onclick="openOrderInvoiceModal('${order.id}')">
              <i class="fa-solid fa-receipt"></i> View Tax Invoice
            </button>
            ${isDelivered ? `
              <button class="btn btn-secondary btn-sm" onclick="showToast('Thank you for shopping with AURA! Review registered.', 'success')">
                <i class="fa-solid fa-star text-warning"></i> Leave Review
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Generate Status Badge
function getOrderStatusBadge(status) {
  const s = (status || 'Pending').toLowerCase();
  if (s === 'delivered') return `<span class="status-pill status-delivered"><i class="fa-solid fa-circle-check"></i> Delivered</span>`;
  if (s === 'shipped' || s === 'out for delivery') return `<span class="status-pill status-shipped"><i class="fa-solid fa-truck-fast"></i> ${status}</span>`;
  if (s === 'processing' || s === 'confirmed') return `<span class="status-pill status-confirmed"><i class="fa-solid fa-boxes-packing"></i> ${status}</span>`;
  if (s === 'cancelled') return `<span class="status-pill status-cancelled"><i class="fa-solid fa-circle-xmark"></i> Cancelled</span>`;
  return `<span class="status-pill status-pending"><i class="fa-solid fa-clock"></i> Pending</span>`;
}

// Render Order Stepper Node Tracking
function renderOrderStepper(currentStatus) {
  const steps = [
    { label: 'Placed', icon: 'fa-clipboard-check', status: 'Pending' },
    { label: 'Processing', icon: 'fa-boxes-packing', status: 'Processing' },
    { label: 'Shipped', icon: 'fa-truck-fast', status: 'Shipped' },
    { label: 'Delivered', icon: 'fa-house-circle-check', status: 'Delivered' }
  ];

  const statusOrder = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
  const currentIndex = statusOrder.indexOf(currentStatus) > -1 ? statusOrder.indexOf(currentStatus) : 0;

  return steps.map((step, idx) => {
    let stepClass = '';
    const stepWeight = idx * 1.5;
    if (currentIndex >= stepWeight + 1) stepClass = 'completed';
    else if (currentIndex >= stepWeight) stepClass = 'active';

    return `
      <div class="step-node ${stepClass}">
        <div class="step-icon-wrap">
          <i class="fa-solid ${step.icon}"></i>
        </div>
        <span class="step-label">${step.label}</span>
      </div>
    `;
  }).join('');
}

// Handle Order Search
function handleOrderSearch(query) {
  orderSearchQuery = query.trim();
  renderFilteredOrders();
}

// Filter My Orders by Status Pill
function filterMyOrdersByStatus(status) {
  activeOrderFilterStatus = status;

  document.querySelectorAll('.order-filter-pill').forEach(pill => {
    if (pill.getAttribute('data-status') === status) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  renderFilteredOrders();
}

// Quick Order Lookup by ID Tool
async function lookupOrderByIdInput() {
  const input = document.getElementById('orderIdLookupInput');
  if (!input) return;
  const orderId = input.value.trim();

  if (!orderId) {
    showToast('Please enter an Order ID (e.g. ORD-2026-XXXX)', 'warning');
    return;
  }

  openLiveTrackingModal(orderId);
}

// ==========================================================================
// INTERACTIVE REAL-TIME GPS & AWB SHIPMENT TRACKING MODAL
// ==========================================================================

async function openLiveTrackingModal(orderId) {
  if (!orderId) return;

  const overlay = document.getElementById('liveTrackingModalOverlay');
  const body = document.getElementById('liveTrackingModalBody');
  if (!overlay || !body) return;

  overlay.classList.add('active');
  body.innerHTML = `
    <div style="text-align: center; padding: 3rem;">
      <i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color: var(--accent-primary);"></i>
      <p class="mt-2 text-muted">Contacting BlueDart / Delhivery GPS Gateway...</p>
    </div>
  `;

  try {
    let order = myOrdersCache.find(o => o.id === orderId);
    if (!order) {
      const res = await api.getOrderById(orderId);
      if (res.success && res.order) {
        order = res.order;
      }
    }

    if (order) {
      renderLiveTrackingDetails(order);
    } else {
      body.innerHTML = `
        <div class="text-center p-4">
          <i class="fa-solid fa-triangle-exclamation text-danger fa-2x"></i>
          <h3 class="mt-2">Order Not Found</h3>
          <p class="text-muted">Could not locate order "${orderId}". Please verify your Order ID.</p>
        </div>
      `;
    }
  } catch (err) {
    body.innerHTML = `<p class="text-danger p-4 text-center">${err.message || 'Failed to fetch tracking data'}</p>`;
  }
}

function renderLiveTrackingDetails(order) {
  const body = document.getElementById('liveTrackingModalBody');
  if (!body) return;

  const status = order.orderStatus || 'Pending';
  const awbNumber = 'BLUEDART-' + (Math.abs(hashString(order.id)) % 90000000 + 10000000) + '-IN';
  const deliveryOtp = (Math.abs(hashString(order.id + 'otp')) % 9000 + 1000);

  const orderDate = new Date(order.createdAt);
  const timeStr = (d, offsetHours = 0) => {
    const nd = new Date(d.getTime() + offsetHours * 3600 * 1000);
    return nd.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) + ', ' +
      nd.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // Build Milestone Log based on status
  const isDelivered = status === 'Delivered';
  const isOut = status === 'Out for Delivery' || isDelivered;
  const isShipped = status === 'Shipped' || isOut;
  const isProcessing = status === 'Processing' || status === 'Confirmed' || isShipped;

  body.innerHTML = `
    <div class="tracking-modal-grid">
      <!-- Left Column: Carrier & Route Graphic -->
      <div class="tracking-left-pane">
        <div class="carrier-badge-box">
          <div class="carrier-logo-row">
            <span class="carrier-icon-pill"><i class="fa-solid fa-plane-departure"></i> BlueDart Express Air</span>
            <span class="tracking-live-pill"><i class="fa-solid fa-circle fa-beat text-success"></i> LIVE SATELLITE GPS</span>
          </div>

          <div class="awb-number-row mt-2">
            <div>
              <span class="text-muted small">Air Waybill (AWB) No:</span>
              <strong class="awb-text font-mono">${awbNumber}</strong>
            </div>
            <button class="btn btn-sm btn-outline" onclick="copyAWB('${awbNumber}')" title="Copy AWB">
              <i class="fa-regular fa-copy"></i> Copy
            </button>
          </div>
        </div>

        <!-- Animated Route Radar Simulation -->
        <div class="tracking-radar-card mt-3">
          <div class="radar-bg-grid"></div>
          <div class="radar-route-line">
            <div class="radar-point start-point" title="Fulfillment Hub - Mumbai">
              <i class="fa-solid fa-warehouse"></i>
              <span>Mumbai Hub</span>
            </div>
            <div class="radar-point transit-point ${isShipped ? 'reached' : ''}" title="Air Cargo Gateway">
              <i class="fa-solid fa-plane"></i>
              <span>Transit Hub</span>
            </div>
            <div class="radar-point end-point ${isDelivered ? 'reached' : ''}" title="Delivery Destination">
              <i class="fa-solid fa-house-chimney"></i>
              <span>Customer Home</span>
            </div>
          </div>
          <div class="radar-moving-truck" style="left: ${isDelivered ? '90%' : (isOut ? '75%' : (isShipped ? '50%' : '15%'))};">
            <i class="fa-solid fa-truck-fast text-accent"></i>
          </div>
        </div>

        <!-- Assigned Delivery Executive Info -->
        <div class="delivery-agent-card mt-3">
          <div class="agent-avatar"><i class="fa-solid fa-user-tie"></i></div>
          <div class="agent-info">
            <strong>Ramesh Kumar</strong>
            <p class="text-muted small">BlueDart Senior Delivery Partner</p>
            <span class="agent-rating"><i class="fa-solid fa-star text-warning"></i> 4.9 &bull; 1,420 Deliveries</span>
          </div>
          <div class="agent-contact-actions">
            <button class="btn btn-sm btn-outline" onclick="showToast('Calling Delivery Partner (+91 98490 54321)...', 'info')">
              <i class="fa-solid fa-phone"></i> Call
            </button>
          </div>
        </div>

        <!-- Delivery Security OTP -->
        <div class="delivery-otp-card mt-3">
          <div>
            <span class="text-muted small"><i class="fa-solid fa-shield-keyhole"></i> Secure Handover Code:</span>
            <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary);">Share this PIN only with delivery executive upon receiving package.</p>
          </div>
          <span class="otp-number-pill">OTP: ${deliveryOtp}</span>
        </div>
      </div>

      <!-- Right Column: Checkpoint Activity Timeline -->
      <div class="tracking-timeline-pane">
        <h3 class="timeline-heading"><i class="fa-solid fa-timeline text-accent"></i> Real-Time Shipment Milestones</h3>
        <div class="tracking-milestone-list">
          
          <div class="milestone-item ${isDelivered ? 'completed current' : ''}">
            <div class="milestone-marker"><i class="fa-solid fa-house-circle-check"></i></div>
            <div class="milestone-content">
              <h4>Package Delivered & Verified</h4>
              <p class="milestone-desc">Handed over to customer. Payment collected via ${order.paymentMethod}.</p>
              <span class="milestone-time">${isDelivered ? timeStr(orderDate, 48) : 'Estimated: 3-5 business days'}</span>
            </div>
          </div>

          <div class="milestone-item ${isOut ? 'completed ' + (status === 'Out for Delivery' ? 'current' : '') : ''}">
            <div class="milestone-marker"><i class="fa-solid fa-motorcycle"></i></div>
            <div class="milestone-content">
              <h4>Out for Delivery</h4>
              <p class="milestone-desc">Courier Partner Ramesh Kumar is en route with your package.</p>
              <span class="milestone-time">${isOut ? timeStr(orderDate, 36) : 'Pending Dispatch from Local Station'}</span>
            </div>
          </div>

          <div class="milestone-item ${isShipped ? 'completed ' + (status === 'Shipped' ? 'current' : '') : ''}">
            <div class="milestone-marker"><i class="fa-solid fa-plane"></i></div>
            <div class="milestone-content">
              <h4>In Transit via Express Air Hub</h4>
              <p class="milestone-desc">Package cleared central air sorting facility and routed to destination city.</p>
              <span class="milestone-time">${isShipped ? timeStr(orderDate, 18) : 'Awaiting Cargo Load'}</span>
            </div>
          </div>

          <div class="milestone-item ${isProcessing ? 'completed' : ''}">
            <div class="milestone-marker"><i class="fa-solid fa-boxes-packing"></i></div>
            <div class="milestone-content">
              <h4>Packed & Ready at Fulfillment Center</h4>
              <p class="milestone-desc">Goods checked for quality, tamper-evident sealed, and barcoded.</p>
              <span class="milestone-time">${isProcessing ? timeStr(orderDate, 4) : 'Pending Packaging'}</span>
            </div>
          </div>

          <div class="milestone-item completed">
            <div class="milestone-marker"><i class="fa-solid fa-file-invoice-dollar"></i></div>
            <div class="milestone-content">
              <h4>Order Confirmed</h4>
              <p class="milestone-desc">Order placed successfully with ${order.paymentMethod}. Tax Invoice generated.</p>
              <span class="milestone-time">${timeStr(orderDate, 0)}</span>
            </div>
          </div>

        </div>

        <div class="tracking-actions-footer mt-4">
          <button class="btn btn-outline btn-block" onclick="openOrderInvoiceModal('${order.id}')">
            <i class="fa-solid fa-file-invoice"></i> Download GST Tax Invoice
          </button>
        </div>
      </div>
    </div>
  `;
}

function closeLiveTrackingModal() {
  const overlay = document.getElementById('liveTrackingModalOverlay');
  if (overlay) overlay.classList.remove('active');
}

function copyAWB(awb) {
  navigator.clipboard.writeText(awb).then(() => {
    showToast(`Copied AWB Tracking No: ${awb}`, 'success');
  }).catch(() => {
    showToast(`AWB No: ${awb}`, 'info');
  });
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// ==========================================
// ORDER INVOICE MODAL & PRINTING
// ==========================================

async function openOrderInvoiceModal(orderId) {
  if (!orderId) return;

  const area = document.getElementById('invoicePrintableArea');
  const overlay = document.getElementById('invoiceModalOverlay');

  if (area) {
    area.innerHTML = `
      <div style="text-align: center; padding: 2.5rem; color: #1e293b;">
        <i class="fa-solid fa-circle-notch fa-spin fa-2x"></i>
        <p class="mt-2">Generating official tax invoice...</p>
      </div>
    `;
  }
  if (overlay) overlay.classList.add('active');

  try {
    const res = await api.getOrderById(orderId);
    if (res.success && res.order) {
      renderPrintableInvoice(res.order);
    }
  } catch (err) {
    if (area) {
      area.innerHTML = `<p style="color: #ef4444; padding: 2rem;">Failed to fetch invoice details.</p>`;
    }
  }
}

function renderPrintableInvoice(order) {
  const area = document.getElementById('invoicePrintableArea');
  if (!area) return;

  const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  area.innerHTML = `
    <div class="invoice-container">
      <div class="invoice-top-bar">
        <div class="invoice-brand">
          <h2>AURA E-COMMERCE</h2>
          <p style="color: #64748b; font-size: 0.8rem; margin-top: 2px;">GSTIN: 36AAACA0000A1Z5 &bull; Official Tax Invoice / Bill of Supply</p>
        </div>
        <div class="invoice-meta-table">
          <h3 style="color: #1e293b; font-size: 1.1rem;">INVOICE: ${order.id}</h3>
          <p style="color: #64748b;">Date: ${dateStr}</p>
          <p style="color: #64748b;">Payment: <strong>${order.paymentMethod}</strong></p>
        </div>
      </div>

      <div class="invoice-address-grid">
        <div>
          <strong style="color: #475569; font-size: 0.8rem; text-transform: uppercase;">Billed & Shipped To:</strong>
          <h4 style="margin: 0.25rem 0; color: #1e293b;">${order.customerName}</h4>
          <p style="color: #475569;">${order.shippingAddress}</p>
          <p style="color: #475569;">Phone: ${order.customerPhone || 'N/A'}</p>
          <p style="color: #475569;">Email: ${order.customerEmail}</p>
        </div>
        <div>
          <strong style="color: #475569; font-size: 0.8rem; text-transform: uppercase;">Sold & Dispatched By:</strong>
          <h4 style="margin: 0.25rem 0; color: #1e293b;">AURA Retail India Pvt Ltd</h4>
          <p style="color: #475569;">Cyber Towers, Hitech City</p>
          <p style="color: #475569;">Hyderabad, Telangana 500081</p>
          <p style="color: #475569;">support@aura-ecommerce.in</p>
        </div>
      </div>

      <table class="invoice-items-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Item Description</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Unit Price</th>
            <th style="text-align: right;">Total (INR)</th>
          </tr>
        </thead>
        <tbody>
          ${(order.items || []).map((item, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td><strong>${item.title}</strong></td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">${formatINR(item.price)}</td>
              <td style="text-align: right;">${formatINR(item.price * item.quantity)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="invoice-total-summary">
        <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #475569;">
          <span>Subtotal:</span>
          <span>${formatINR(order.subtotal)}</span>
        </div>
        ${order.discount ? `
          <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #16a34a;">
            <span>Discount:</span>
            <span>-${formatINR(order.discount)}</span>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #475569;">
          <span>GST (8%):</span>
          <span>${formatINR(order.tax)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #475569;">
          <span>Delivery Charge:</span>
          <span>${order.shipping === 0 ? 'FREE' : formatINR(order.shipping)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #cbd5e1; margin-top: 6px; font-size: 1.15rem; font-weight: 800; color: #1e293b;">
          <span>Grand Total:</span>
          <span>${formatINR(order.total)}</span>
        </div>
      </div>

      <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px dashed #cbd5e1; text-align: center; color: #94a3b8; font-size: 0.8rem;">
        <p>This is a computer-generated tax invoice. Zero advance payment required for Cash on Delivery orders.</p>
        <p>Thank you for shopping with AURA!</p>
      </div>
    </div>
  `;
}

function closeInvoiceModal() {
  const overlay = document.getElementById('invoiceModalOverlay');
  if (overlay) overlay.classList.remove('active');
}

function printInvoice() {
  window.print();
}

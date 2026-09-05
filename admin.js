/**
 * AURA E-COMMERCE - ADMIN PORTAL & MANAGEMENT MODULE (INR CURRENCY)
 * Dashboard analytics, inventory CRUD, 1-click restock, CSV export, order status changes, and customer roster
 */

let adminStatsCache = null;
let adminProductsCache = [];
let adminOrdersCache = [];
let adminCustomersCache = [];

// Currency Formatter Helper for Indian Rupee (₹)
function formatINR(amount) {
  if (isNaN(amount)) return '₹0.00';
  return '₹' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Switch Admin Tabs
function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-nav-item').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.querySelectorAll('.admin-tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });

  const targetPane = document.getElementById(`admin-tab-${tabName}`);
  if (targetPane) targetPane.classList.add('active');

  if (tabName === 'dashboard') loadAdminDashboard();
  if (tabName === 'products') loadAdminProducts();
  if (tabName === 'orders') loadAdminOrders();
  if (tabName === 'customers') loadAdminCustomers();
}

// ==========================================
// 1. DASHBOARD OVERVIEW & STATS
// ==========================================

async function loadAdminDashboard() {
  try {
    const res = await api.getAdminStats();
    if (res.success) {
      adminStatsCache = res.stats;
      renderAdminDashboardStats(res.stats);
      renderAdminSalesGraph();
    }
  } catch (err) {
    showToast(err.message || 'Failed to load admin statistics', 'error');
  }
}

function renderAdminDashboardStats(stats) {
  const revEl = document.getElementById('statTotalRevenue');
  const ordEl = document.getElementById('statTotalOrders');
  const prodEl = document.getElementById('statTotalProducts');
  const custEl = document.getElementById('statTotalCustomers');
  const lowStockEl = document.getElementById('statLowStockAlert');
  const recentOrdersTbody = document.getElementById('adminRecentOrdersTableBody');
  const catList = document.getElementById('adminCategoryBreakdownList');

  if (revEl) revEl.textContent = formatINR(stats.totalRevenue);
  if (ordEl) ordEl.textContent = stats.totalOrders;
  if (prodEl) prodEl.textContent = stats.totalProducts;
  if (custEl) custEl.textContent = stats.totalCustomers;
  if (lowStockEl) lowStockEl.textContent = `${stats.lowStockCount} items low stock`;

  // Recent Orders Table
  if (recentOrdersTbody) {
    if (!stats.recentOrders || stats.recentOrders.length === 0) {
      recentOrdersTbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">No recent orders placed yet.</td></tr>`;
    } else {
      recentOrdersTbody.innerHTML = stats.recentOrders.slice(0, 5).map(o => `
        <tr>
          <td><strong>${o.id}</strong></td>
          <td>${o.customerName}</td>
          <td><strong>${formatINR(o.total)}</strong></td>
          <td><span class="badge ${o.paymentMethod === 'Cash on Delivery' ? 'badge-popular' : 'badge-instant'}">${o.paymentMethod}</span></td>
          <td>${getOrderStatusBadge(o.orderStatus)}</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="openOrderInvoiceModal('${o.id}')">
              <i class="fa-solid fa-receipt"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }
  }

  // Category Inventory Breakdown
  if (catList && stats.categoryCounts) {
    catList.innerHTML = Object.entries(stats.categoryCounts).map(([cat, count]) => `
      <div class="category-breakdown-item">
        <span class="cat-name">${cat}</span>
        <span class="cat-count-badge">${count} items</span>
      </div>
    `).join('');
  }
}

// Render Monthly Sales Graph Bar Chart
function renderAdminSalesGraph() {
  const container = document.getElementById('adminSalesGraphContainer');
  if (!container) return;

  const months = [
    { label: 'Jan', val: 45000, height: '45%' },
    { label: 'Feb', val: 78000, height: '78%' },
    { label: 'Mar', val: 62000, height: '62%' },
    { label: 'Apr', val: 95000, height: '95%' },
    { label: 'May', val: 84000, height: '84%' },
    { label: 'Jun (Now)', val: 125000, height: '100%' }
  ];

  container.innerHTML = `
    <div class="sales-chart-wrapper">
      ${months.map(m => `
        <div class="chart-bar-col">
          <span class="chart-val-label">${formatINR(m.val)}</span>
          <div class="chart-bar-bg">
            <div class="chart-bar-fill" style="height: ${m.height};"></div>
          </div>
          <span class="chart-month-label">${m.label}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ==========================================
// 2. PRODUCT INVENTORY MANAGEMENT (CRUD)
// ==========================================

async function loadAdminProducts() {
  const tbody = document.getElementById('adminProductsTableBody');
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading inventory...</td></tr>`;
  }

  try {
    const res = await api.getProducts({ sort: 'newest' });
    if (res.success) {
      adminProductsCache = res.products;
      renderAdminProductsTable(res.products);
    }
  } catch (err) {
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">${err.message}</td></tr>`;
    }
  }
}

function renderAdminProductsTable(products) {
  const tbody = document.getElementById('adminProductsTableBody');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No products in catalog.</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(prod => `
    <tr>
      <td>
        <div class="admin-product-cell">
          <img src="${prod.image}" alt="${prod.title}" class="admin-prod-thumb">
          <div>
            <strong>${prod.title}</strong>
            <p class="text-muted small">ID: ${prod.id}</p>
          </div>
        </div>
      </td>
      <td><span class="product-cat-pill">${prod.category}</span></td>
      <td><strong>${formatINR(prod.price)}</strong></td>
      <td><span class="text-muted">${prod.originalPrice ? formatINR(prod.originalPrice) : '-'}</span></td>
      <td>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="stock-badge ${prod.stock <= 5 ? 'stock-badge-low' : 'stock-badge-in'}">
            ${prod.stock} in stock
          </span>
          <button class="btn btn-sm btn-outline" style="padding: 2px 6px; font-size: 0.72rem;" onclick="quickRestockProduct('${prod.id}', 20)" title="Quick Restock +20">
            <i class="fa-solid fa-plus"></i> 20
          </button>
        </div>
      </td>
      <td>${prod.badge ? `<span class="badge badge-instant">${prod.badge}</span>` : '-'}</td>
      <td>
        <div class="admin-actions-cell">
          <button class="btn btn-sm btn-outline" onclick="openEditProductModal('${prod.id}')" title="Edit Product">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn btn-sm btn-danger-outline" onclick="deleteProductConfirm('${prod.id}', '${prod.title.replace(/'/g, "\\'")}')" title="Delete Product">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// 1-Click Quick Restock
async function quickRestockProduct(productId, amount = 20) {
  try {
    const res = await api.request(`/products/${productId}/restock`, {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
    if (res.success) {
      showToast(`⚡ Restocked +${amount} units for ${res.product.title}! (Stock: ${res.product.stock})`, 'success');
      loadAdminProducts();
    }
  } catch (err) {
    showToast(err.message || 'Failed to restock product', 'error');
  }
}

// Open Add Product Modal
function openAddProductModal() {
  document.getElementById('productModalForm').reset();
  document.getElementById('editProductId').value = '';
  document.getElementById('productModalTitle').innerHTML = '<i class="fa-solid fa-plus"></i> Add New Product';
  document.getElementById('saveProductBtn').textContent = 'Create Product';
  document.getElementById('productModalOverlay').classList.add('active');
}

// Open Edit Product Modal
function openEditProductModal(productId) {
  const prod = adminProductsCache.find(p => p.id === productId);
  if (!prod) return;

  document.getElementById('editProductId').value = prod.id;
  document.getElementById('prodFormTitle').value = prod.title;
  document.getElementById('prodFormCategory').value = prod.category;
  document.getElementById('prodFormPrice').value = prod.price;
  document.getElementById('prodFormOrigPrice').value = prod.originalPrice || '';
  document.getElementById('prodFormStock').value = prod.stock;
  document.getElementById('prodFormBadge').value = prod.badge || '';
  document.getElementById('prodFormImage').value = prod.image;
  document.getElementById('prodFormDesc').value = prod.description;
  document.getElementById('prodFormFeatured').checked = !!prod.featured;

  document.getElementById('productModalTitle').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Product';
  document.getElementById('saveProductBtn').textContent = 'Update Product';
  document.getElementById('productModalOverlay').classList.add('active');
}

function closeProductModal() {
  document.getElementById('productModalOverlay').classList.remove('active');
}

// Handle Add/Edit Form Submit
async function handleProductFormSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('editProductId').value;
  const saveBtn = document.getElementById('saveProductBtn');

  const payload = {
    title: document.getElementById('prodFormTitle').value.trim(),
    category: document.getElementById('prodFormCategory').value,
    price: parseFloat(document.getElementById('prodFormPrice').value),
    originalPrice: document.getElementById('prodFormOrigPrice').value ? parseFloat(document.getElementById('prodFormOrigPrice').value) : null,
    stock: parseInt(document.getElementById('prodFormStock').value, 10),
    badge: document.getElementById('prodFormBadge').value.trim() || null,
    image: document.getElementById('prodFormImage').value.trim(),
    description: document.getElementById('prodFormDesc').value.trim(),
    featured: document.getElementById('prodFormFeatured').checked
  };

  try {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';

    if (id) {
      await api.updateProduct(id, payload);
      showToast('Product updated successfully!', 'success');
    } else {
      await api.createProduct(payload);
      showToast('New product added to catalog!', 'success');
    }

    closeProductModal();
    loadAdminProducts();
  } catch (err) {
    showToast(err.message || 'Failed to save product', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = id ? 'Update Product' : 'Create Product';
  }
}

// Delete Product
async function deleteProductConfirm(id, title) {
  if (confirm(`Are you sure you want to permanently delete "${title}"?`)) {
    try {
      await api.deleteProduct(id);
      showToast(`Deleted "${title}" successfully`, 'info');
      loadAdminProducts();
    } catch (err) {
      showToast(err.message || 'Failed to delete product', 'error');
    }
  }
}

// ==========================================
// 3. ALL ORDERS & STATUS MANAGEMENT
// ==========================================

async function loadAdminOrders() {
  const tbody = document.getElementById('adminOrdersTableBody');
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading orders...</td></tr>`;
  }

  try {
    const res = await api.getAdminOrders();
    if (res.success) {
      adminOrdersCache = res.orders;
      renderAdminOrdersTable(res.orders);
    }
  } catch (err) {
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4">${err.message}</td></tr>`;
    }
  }
}

function renderAdminOrdersTable(orders) {
  const tbody = document.getElementById('adminOrdersTableBody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No customer orders found.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(order => `
    <tr>
      <td><strong>${order.id}</strong></td>
      <td class="small text-muted">${new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
      <td>
        <div><strong>${order.customerName}</strong></div>
        <div class="small text-muted">${order.customerEmail}</div>
        <div class="small text-muted"><i class="fa-solid fa-phone"></i> ${order.customerPhone || 'N/A'}</div>
      </td>
      <td>
        <span class="badge badge-instant">${order.items ? order.items.length : 0} items</span>
      </td>
      <td><strong>${formatINR(order.total)}</strong></td>
      <td>
        <span class="badge ${order.paymentMethod === 'Cash on Delivery' ? 'badge-popular' : 'badge-instant'}">
          ${order.paymentMethod}
        </span>
      </td>
      <td>
        <select class="form-select form-select-sm" onchange="handleOrderStatusChange('${order.id}', this.value)" style="min-width: 130px; font-size: 0.82rem;">
          <option value="Pending" ${order.orderStatus === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Confirmed" ${order.orderStatus === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="Processing" ${order.orderStatus === 'Processing' ? 'selected' : ''}>Processing</option>
          <option value="Shipped" ${order.orderStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
          <option value="Out for Delivery" ${order.orderStatus === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
          <option value="Delivered" ${order.orderStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
          <option value="Cancelled" ${order.orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="openOrderInvoiceModal('${order.id}')" title="Print Invoice">
          <i class="fa-solid fa-receipt"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// Update Order Status
async function handleOrderStatusChange(orderId, newStatus) {
  try {
    const res = await api.updateOrderStatus(orderId, newStatus, `Status updated to ${newStatus} by store admin`);
    if (res.success) {
      showToast(`Order ${orderId} updated to "${newStatus}"!`, 'success');
    }
  } catch (err) {
    showToast(err.message || 'Failed to update order status', 'error');
  }
}

// Filter Admin Orders
function filterAdminOrders(status) {
  if (status === 'All') {
    renderAdminOrdersTable(adminOrdersCache);
  } else {
    renderAdminOrdersTable(adminOrdersCache.filter(o => o.orderStatus === status));
  }
}

// Export Orders to CSV
function exportOrdersCSV() {
  const token = localStorage.getItem('aura_token');
  if (!token) {
    showToast('Admin session expired', 'error');
    return;
  }

  fetch('/api/admin/orders/export', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AURA_Orders_Export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('📥 Orders CSV export downloaded successfully!', 'success');
  })
  .catch(err => {
    showToast('Failed to export CSV: ' + err.message, 'error');
  });
}

// ==========================================
// 4. VIEW REGISTERED CUSTOMERS
// ==========================================

async function loadAdminCustomers() {
  const tbody = document.getElementById('adminCustomersTableBody');
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading customers roster...</td></tr>`;
  }

  try {
    const res = await api.getAdminCustomers();
    if (res.success) {
      adminCustomersCache = res.customers;
      renderAdminCustomersTable(res.customers);
    }
  } catch (err) {
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">${err.message}</td></tr>`;
    }
  }
}

function renderAdminCustomersTable(customers) {
  const tbody = document.getElementById('adminCustomersTableBody');
  if (!tbody) return;

  if (customers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No registered customers.</td></tr>`;
    return;
  }

  tbody.innerHTML = customers.map(cust => `
    <tr>
      <td>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span class="user-avatar" style="width: 32px; height: 32px; font-size: 0.85rem;">${cust.name.charAt(0)}</span>
          <div>
            <strong>${cust.name}</strong>
            <p class="text-muted small">ID: ${cust.id}</p>
          </div>
        </div>
      </td>
      <td>${cust.email}</td>
      <td>${cust.phone || '-'}</td>
      <td class="small" style="max-width: 200px;">${cust.address || '-'}</td>
      <td><span class="badge badge-instant">${cust.ordersCount} orders</span></td>
      <td><strong>${formatINR(cust.lifetimeSpent)}</strong></td>
      <td class="small text-muted">${new Date(cust.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
    </tr>
  `).join('');
}

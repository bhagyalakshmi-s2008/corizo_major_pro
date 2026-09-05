/**
 * AURA E-COMMERCE - API CLIENT SERVICE
 * Centralized communication layer with the Express backend REST API
 */

const API_BASE = '/api';

const api = {
  // Token Storage Helpers
  getToken() {
    return localStorage.getItem('aura_token') || null;
  },

  setToken(token) {
    if (token) localStorage.setItem('aura_token', token);
    else localStorage.removeItem('aura_token');
  },

  // Base Request Method
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error);
      throw error;
    }
  },

  // Auth Endpoints
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async getCurrentUser() {
    return this.request('/auth/me');
  },

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Product Endpoints
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/products${queryString ? '?' + queryString : ''}`);
  },

  async getProductById(id) {
    return this.request(`/products/${id}`);
  },

  async createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  async updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  // Order Endpoints
  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  async getOrders() {
    return this.request('/orders');
  },

  async getOrderById(id) {
    return this.request(`/orders/${id}`);
  },

  async updateOrderStatus(id, status, note) {
    return this.request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
  },

  async cancelOrder(id) {
    return this.request(`/orders/${id}/cancel`, {
      method: 'POST',
    });
  },

  // Admin Endpoints
  async getAdminStats() {
    return this.request('/admin/stats');
  },

  async getAdminCustomers() {
    return this.request('/admin/customers');
  },

  // Coupon Endpoint
  async validateCoupon(code) {
    return this.request('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  // Wallet Endpoints
  async getWalletInfo() {
    return this.request('/wallet/info');
  },

  async topupWallet(amount) {
    return this.request('/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  async redeemGiftCard(code) {
    return this.request('/wallet/redeem-giftcard', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  // Loyalty / VIP Endpoints
  async getLoyaltyInfo() {
    return this.request('/loyalty/info');
  },

  async claimDailyLoyaltyBonus() {
    return this.request('/loyalty/claim-daily', {
      method: 'POST',
    });
  },

  // Price Drop Alert Endpoint
  async subscribePriceDropAlert(alertData) {
    return this.request('/alerts/price-drop', {
      method: 'POST',
      body: JSON.stringify(alertData),
    });
  },

  // Smart Bundle Recommendations
  async getBundleRecommendations(productId) {
    return this.request(`/products/${productId}/bundle-recommendations`);
  }
};

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'database.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple In-memory DB with File Persistence
let db = {
  users: [],
  products: [],
  orders: [],
  categories: [],
  coupons: [],
  giftCards: [],
  priceDropAlerts: []
};

function loadDatabase() {
  try {
    if (!fs.existsSync(path.dirname(DB_FILE))) {
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(data);
      if (!db.giftCards) db.giftCards = [];
      if (!db.priceDropAlerts) db.priceDropAlerts = [];
      // Ensure all users have wallet and loyalty properties
      db.users.forEach(u => {
        if (typeof u.walletBalance === 'undefined') u.walletBalance = 1500;
        if (typeof u.coins === 'undefined') u.coins = 250;
        if (!u.vipTier) u.vipTier = 'Bronze';
        if (typeof u.dailyClaimStreak === 'undefined') u.dailyClaimStreak = 1;
        if (!u.walletTransactions) u.walletTransactions = [];
      });
      console.log('✅ Database loaded successfully with advanced wallet & loyalty fields');
    }
  } catch (err) {
    console.error('❌ Failed to load database:', err);
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('❌ Failed to save database:', err);
  }
}

// Initial DB load
loadDatabase();

// Helper: Token Generator & Session Storage
const activeSessions = new Map();

function generateToken(user) {
  const token = 'tok_' + crypto.randomBytes(24).toString('hex');
  activeSessions.set(token, {
    userId: user.id,
    email: user.email,
    role: user.role,
    expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  });
  return token;
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  const session = activeSessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessions.delete(token);
    return res.status(401).json({ success: false, message: 'Session expired or invalid. Please login again.' });
  }

  const user = db.users.find(u => u.id === session.userId);
  if (!user) {
    return res.status(401).json({ success: false, message: 'User not found' });
  }

  req.user = user;
  next();
}

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Administrator privileges required.' });
    }
    next();
  });
}

// Optional Auth (doesn't fail if no token)
function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const session = activeSessions.get(token);
    if (session && session.expiresAt >= Date.now()) {
      req.user = db.users.find(u => u.id === session.userId);
    }
  }
  next();
}

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// Register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone, address } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ success: false, message: 'An account with this email already exists' });
  }

  const newUser = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: password, // Note: In production use bcrypt, plain text for local demo transparency
    role: 'customer',
    phone: phone ? phone.trim() : '',
    address: address ? address.trim() : '',
    walletBalance: 500, // Welcome ₹500 wallet credit
    coins: 100, // Welcome 100 Aura Coins
    vipTier: 'Bronze',
    dailyClaimStreak: 0,
    dailyLastClaimed: null,
    walletTransactions: [
      {
        id: 'wtx_' + Date.now(),
        type: 'credit',
        amount: 500,
        description: '🎉 New Member Registration Bonus',
        date: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDatabase();

  const token = generateToken(newUser);
  const { password: _, ...safeUser } = newUser;

  res.status(201).json({
    success: true,
    message: 'Registration successful! Welcome to the store.',
    token,
    user: safeUser
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = generateToken(user);
  const { password: _, ...safeUser } = user;

  res.json({
    success: true,
    message: `Welcome back, ${user.name}!`,
    token,
    user: safeUser
  });
});

// Get Current User Profile
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const { password: _, ...safeUser } = req.user;
  res.json({ success: true, user: safeUser });
});

// Update Profile
app.put('/api/auth/profile', authMiddleware, (req, res) => {
  const { name, phone, address } = req.body;
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (name) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (address !== undefined) user.address = address.trim();

  saveDatabase();
  const { password: _, ...safeUser } = user;
  res.json({ success: true, message: 'Profile updated successfully', user: safeUser });
});

// ==========================================
// 2. PRODUCT ROUTES
// ==========================================

// Get all products with search, category filter, sorting
app.get('/api/products', (req, res) => {
  let { category, search, sort, minPrice, maxPrice, featured } = req.query;
  let results = [...db.products];

  // Category filter
  if (category && category !== 'All' && category !== 'all') {
    results = results.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  // Search filter
  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    results = results.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  // Price range
  if (minPrice) {
    results = results.filter(p => p.price >= parseFloat(minPrice));
  }
  if (maxPrice) {
    results = results.filter(p => p.price <= parseFloat(maxPrice));
  }

  // Featured flag
  if (featured === 'true') {
    results = results.filter(p => p.featured);
  }

  // Sort
  if (sort === 'price_asc') {
    results.sort((a, b) => a.price - b.price);
  } else if (sort === 'price_desc') {
    results.sort((a, b) => b.price - a.price);
  } else if (sort === 'rating') {
    results.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'newest') {
    results.reverse();
  }

  res.json({
    success: true,
    total: results.length,
    categories: db.categories,
    products: results
  });
});

// Get single product details
app.get('/api/products/:id', (req, res) => {
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Find related products in same category
  const related = db.products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  res.json({
    success: true,
    product,
    related
  });
});

// Add Product (Admin Only)
app.post('/api/products', adminMiddleware, (req, res) => {
  const { title, category, price, originalPrice, stock, image, gallery, badge, description, specs, featured } = req.body;

  if (!title || !category || price === undefined) {
    return res.status(400).json({ success: false, message: 'Title, category, and price are required' });
  }

  const newProduct = {
    id: 'prod_' + Date.now(),
    title: title.trim(),
    category: category.trim(),
    price: parseFloat(price),
    originalPrice: originalPrice ? parseFloat(originalPrice) : parseFloat(price) * 1.2,
    rating: 5.0,
    reviewsCount: 1,
    stock: stock ? parseInt(stock, 10) : 15,
    image: image ? image.trim() : 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80',
    gallery: gallery && gallery.length ? gallery : [image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80'],
    badge: badge ? badge.trim() : 'New',
    description: description ? description.trim() : 'Premium quality product with cutting-edge design.',
    specs: specs || { "Material": "Premium Grade", "Warranty": "1 Year" },
    featured: !!featured
  };

  // Add category to list if not exists
  if (!db.categories.includes(newProduct.category)) {
    db.categories.push(newProduct.category);
  }

  db.products.unshift(newProduct);
  saveDatabase();

  res.status(201).json({
    success: true,
    message: 'Product added successfully!',
    product: newProduct
  });
});

// Add Product Review (Authenticated / Guest)
app.post('/api/products/:id/reviews', optionalAuthMiddleware, (req, res) => {
  const { reviewerName, rating, title, comment } = req.body;
  const product = db.products.find(p => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  if (!rating || !comment) {
    return res.status(400).json({ success: false, message: 'Rating score and review comment are required' });
  }

  if (!product.reviews) {
    product.reviews = [];
  }

  const newReview = {
    id: 'rev_' + Date.now(),
    userName: req.user ? req.user.name : (reviewerName ? reviewerName.trim() : 'Verified Buyer'),
    userId: req.user ? req.user.id : null,
    rating: parseFloat(rating),
    title: title ? title.trim() : 'Great purchase!',
    comment: comment.trim(),
    createdAt: new Date().toISOString()
  };

  product.reviews.unshift(newReview);

  // Recalculate average rating and count
  const allRatings = [
    ...(product.reviews.map(r => r.rating)),
    5.0, 4.8 // base priors
  ];
  const avg = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
  product.rating = +avg.toFixed(1);
  product.reviewsCount = (product.reviewsCount || 0) + 1;

  saveDatabase();

  res.status(201).json({
    success: true,
    message: 'Thank you! Your product review has been published.',
    review: newReview,
    newRating: product.rating,
    newReviewsCount: product.reviewsCount
  });
});

// 1-Click Restock Product (Admin Only)
app.post('/api/products/:id/restock', adminMiddleware, (req, res) => {
  const { amount } = req.body;
  const product = db.products.find(p => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const addUnits = amount ? parseInt(amount, 10) : 20;
  product.stock = (product.stock || 0) + addUnits;

  saveDatabase();

  res.json({
    success: true,
    message: `Restocked ${addUnits} units for "${product.title}". New stock: ${product.stock}`,
    product
  });
});

// Export Orders as CSV (Admin Only)
app.get('/api/admin/orders/export', adminMiddleware, (req, res) => {
  const headers = ['Order ID', 'Date', 'Customer Name', 'Customer Email', 'Phone', 'Total Amount ($)', 'Payment Method', 'Order Status'];
  const rows = db.orders.map(o => [
    `"${o.id}"`,
    `"${new Date(o.createdAt).toLocaleDateString('en-US')}"`,
    `"${o.customerName.replace(/"/g, '""')}"`,
    `"${o.customerEmail}"`,
    `"${o.customerPhone}"`,
    `"${o.total.toFixed(2)}"`,
    `"${o.paymentMethod}"`,
    `"${o.orderStatus}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="orders_export.csv"');
  res.send(csvContent);
});

// Update Product (Admin Only)
app.put('/api/products/:id', adminMiddleware, (req, res) => {
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const existing = db.products[index];
  const { title, category, price, originalPrice, stock, image, badge, description, specs, featured } = req.body;

  db.products[index] = {
    ...existing,
    title: title !== undefined ? title.trim() : existing.title,
    category: category !== undefined ? category.trim() : existing.category,
    price: price !== undefined ? parseFloat(price) : existing.price,
    originalPrice: originalPrice !== undefined ? parseFloat(originalPrice) : existing.originalPrice,
    stock: stock !== undefined ? parseInt(stock, 10) : existing.stock,
    image: image !== undefined ? image.trim() : existing.image,
    badge: badge !== undefined ? badge.trim() : existing.badge,
    description: description !== undefined ? description.trim() : existing.description,
    specs: specs !== undefined ? specs : existing.specs,
    featured: featured !== undefined ? !!featured : existing.featured
  };

  saveDatabase();

  res.json({
    success: true,
    message: 'Product updated successfully!',
    product: db.products[index]
  });
});

// Delete Product (Admin Only)
app.delete('/api/products/:id', adminMiddleware, (req, res) => {
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const deleted = db.products.splice(index, 1)[0];
  saveDatabase();

  res.json({
    success: true,
    message: `Product "${deleted.title}" deleted successfully.`
  });
});

// ==========================================
// 3. ORDER & CHECKOUT ROUTES
// ==========================================

// Create Order (Cash on Delivery / Online)
app.post('/api/orders', authMiddleware, (req, res) => {
  const { items, customerName, customerPhone, shippingAddress, paymentMethod, couponCode } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ success: false, message: 'Cart items are required to place an order' });
  }

  if (!customerName || !shippingAddress || !customerPhone) {
    return res.status(400).json({ success: false, message: 'Full shipping and contact details are required' });
  }

  // Calculate pricing & verify stock
  let subtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    const product = db.products.find(p => p.id === item.productId);
    if (!product) {
      return res.status(400).json({ success: false, message: `Product not found: ${item.title || item.productId}` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({ success: false, message: `Insufficient stock for ${product.title} (Available: ${product.stock})` });
    }

    // Deduct stock
    product.stock -= item.quantity;

    const itemTotal = product.price * item.quantity;
    subtotal += itemTotal;

    verifiedItems.push({
      productId: product.id,
      title: product.title,
      price: product.price,
      quantity: item.quantity,
      image: product.image
    });
  }

  // Apply Coupon if valid
  let discount = 0;
  if (couponCode) {
    const coupon = db.coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
    if (coupon) {
      discount = +(subtotal * (coupon.discountPercent / 100)).toFixed(2);
    }
  }

  // Aura Coins Redemption
  const coinsToRedeem = Math.max(0, Math.min(Number(req.body.coinsRedeemed) || 0, req.user.coins || 0));
  const coinsDiscount = +(coinsToRedeem * 0.10).toFixed(2); // 100 coins = ₹10 off

  const tax = +(subtotal * 0.08).toFixed(2); // 8% GST
  const shipping = subtotal >= 999 ? 0.00 : 99.00; // Free delivery above ₹999
  const total = Math.max(0, +(subtotal - discount - coinsDiscount + tax + shipping).toFixed(2));

  const orderId = 'ORD-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  const now = new Date().toISOString();

  // Validate Wallet Payment
  const isWalletPayment = (paymentMethod === 'Aura Wallet' || paymentMethod === 'Wallet');
  if (isWalletPayment) {
    if ((req.user.walletBalance || 0) < total) {
      return res.status(400).json({
        success: false,
        message: `Insufficient Aura Wallet balance (₹${req.user.walletBalance || 0}). Please top up your wallet or choose Cash on Delivery.`
      });
    }
    // Deduct from wallet
    req.user.walletBalance = +(req.user.walletBalance - total).toFixed(2);
    if (!req.user.walletTransactions) req.user.walletTransactions = [];
    req.user.walletTransactions.unshift({
      id: 'wtx_' + Date.now(),
      type: 'debit',
      amount: total,
      description: `🛒 Order Payment #${orderId}`,
      date: now
    });
  }

  // Deduct Redeemed Coins & Award Earned Coins (1 coin per ₹10 spent)
  req.user.coins = Math.max(0, (req.user.coins || 0) - coinsToRedeem);
  const coinsEarned = Math.max(10, Math.floor(total / 10));
  req.user.coins += coinsEarned;

  // Recalculate VIP Tier
  if (req.user.coins >= 1000) req.user.vipTier = 'Platinum';
  else if (req.user.coins >= 500) req.user.vipTier = 'Gold';
  else if (req.user.coins >= 200) req.user.vipTier = 'Silver';
  else req.user.vipTier = 'Bronze';

  const newOrder = {
    id: orderId,
    userId: req.user.id,
    customerName: customerName.trim(),
    customerEmail: req.user.email,
    customerPhone: customerPhone.trim(),
    shippingAddress: shippingAddress.trim(),
    items: verifiedItems,
    subtotal,
    discount,
    coinsRedeemed: coinsToRedeem,
    coinsDiscount,
    coinsEarned,
    tax,
    shipping,
    total,
    paymentMethod: isWalletPayment ? 'Aura Wallet' : (paymentMethod || 'Cash on Delivery'),
    paymentStatus: isWalletPayment ? 'Paid (Aura Wallet Instant)' : (paymentMethod === 'Cash on Delivery' ? 'Pending on Delivery' : 'Paid Online'),
    orderStatus: 'Pending',
    trackingHistory: [
      {
        status: 'Order Placed',
        timestamp: now,
        note: `Order received with ${isWalletPayment ? 'Aura Wallet' : (paymentMethod || 'Cash on Delivery')}. Earned ${coinsEarned} Aura Coins!`
      }
    ],
    createdAt: now
  };

  db.orders.unshift(newOrder);
  saveDatabase();

  res.status(201).json({
    success: true,
    message: '🎉 Congratulations! Your order has been placed successfully.',
    order: newOrder,
    userWallet: {
      walletBalance: req.user.walletBalance,
      coins: req.user.coins,
      vipTier: req.user.vipTier,
      coinsEarned
    }
  });
});

// Get Orders (User's own orders or Admin all orders)
app.get('/api/orders', authMiddleware, (req, res) => {
  if (req.user.role === 'admin') {
    return res.json({
      success: true,
      total: db.orders.length,
      orders: db.orders
    });
  }

  // Customer orders
  const userOrders = db.orders.filter(o => o.userId === req.user.id);
  res.json({
    success: true,
    total: userOrders.length,
    orders: userOrders
  });
});

// Get single order details
app.get('/api/orders/:id', authMiddleware, (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // Check authorization (customer can only view own order, admin can view any)
  if (req.user.role !== 'admin' && order.userId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized to view this order' });
  }

  res.json({ success: true, order });
});

// Update Order Status (Admin Only)
app.patch('/api/orders/:id/status', adminMiddleware, (req, res) => {
  const { status, note } = req.body;
  const order = db.orders.find(o => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  order.orderStatus = status;
  if (status === 'Delivered' && order.paymentMethod === 'Cash on Delivery') {
    order.paymentStatus = 'Paid (Cash Collected)';
  } else if (status === 'Cancelled') {
    order.paymentStatus = 'Cancelled';
  }

  order.trackingHistory.push({
    status: status,
    timestamp: new Date().toISOString(),
    note: note || `Order status updated to ${status} by Administrator.`
  });

  saveDatabase();

  res.json({
    success: true,
    message: `Order ${order.id} status updated to ${status}`,
    order
  });
});

// Cancel Order (User / Admin)
app.post('/api/orders/:id/cancel', authMiddleware, (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (req.user.role !== 'admin' && order.userId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  if (order.orderStatus === 'Delivered' || order.orderStatus === 'Shipped') {
    return res.status(400).json({ success: false, message: 'Cannot cancel an order that has already shipped or been delivered' });
  }

  order.orderStatus = 'Cancelled';
  order.paymentStatus = 'Cancelled';
  order.trackingHistory.push({
    status: 'Cancelled',
    timestamp: new Date().toISOString(),
    note: 'Order cancelled by customer.'
  });

  // Restore inventory
  for (const item of order.items) {
    const p = db.products.find(prod => prod.id === item.productId);
    if (p) p.stock += item.quantity;
  }

  saveDatabase();

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    order
  });
});

// ==========================================
// 4. ADMIN ANALYTICS & CUSTOMER ROUTES
// ==========================================

// Admin Dashboard Summary Stats
app.get('/api/admin/stats', adminMiddleware, (req, res) => {
  const totalOrders = db.orders.length;
  const totalRevenue = db.orders
    .filter(o => o.orderStatus !== 'Cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const totalProducts = db.products.length;
  const totalCustomers = db.users.filter(u => u.role === 'customer').length;
  const lowStockProducts = db.products.filter(p => p.stock <= 20);

  // Category counts
  const categoryCounts = {};
  db.products.forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  // Status breakdown
  const statusCounts = {};
  db.orders.forEach(o => {
    statusCounts[o.orderStatus] = (statusCounts[o.orderStatus] || 0) + 1;
  });

  // Recent 6 orders
  const recentOrders = db.orders.slice(0, 6);

  res.json({
    success: true,
    stats: {
      totalRevenue: +totalRevenue.toFixed(2),
      totalOrders,
      totalProducts,
      totalCustomers,
      lowStockCount: lowStockProducts.length,
      categoryCounts,
      statusCounts,
      recentOrders
    }
  });
});

// Admin View Customers List
app.get('/api/admin/customers', adminMiddleware, (req, res) => {
  const customers = db.users
    .filter(u => u.role === 'customer')
    .map(u => {
      const userOrders = db.orders.filter(o => o.userId === u.id);
      const totalSpent = userOrders
        .filter(o => o.orderStatus !== 'Cancelled')
        .reduce((sum, o) => sum + (o.total || 0), 0);

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || 'N/A',
        address: u.address || 'N/A',
        ordersCount: userOrders.length,
        totalSpent: +totalSpent.toFixed(2),
        registeredDate: u.createdAt
      };
    });

  res.json({
    success: true,
    total: customers.length,
    customers
  });
});

// ==========================================
// 5. COUPON VALIDATION ROUTE
// ==========================================
app.post('/api/coupons/validate', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'Please enter a coupon code' });

  const coupon = db.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
  }

  res.json({
    success: true,
    coupon: {
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      description: coupon.description
    }
  });
});

// ==========================================
// 6. AURA DIGITAL WALLET & GIFT CARDS ROUTES
// ==========================================

// Get user wallet info
app.get('/api/wallet/info', authMiddleware, (req, res) => {
  res.json({
    success: true,
    wallet: {
      balance: req.user.walletBalance || 0,
      transactions: req.user.walletTransactions || []
    }
  });
});

// Top-up wallet
app.post('/api/wallet/topup', authMiddleware, (req, res) => {
  const amount = Number(req.body.amount);
  if (!amount || isNaN(amount) || amount < 100) {
    return res.status(400).json({ success: false, message: 'Minimum wallet top-up amount is ₹100' });
  }

  req.user.walletBalance = +((req.user.walletBalance || 0) + amount).toFixed(2);
  if (!req.user.walletTransactions) req.user.walletTransactions = [];

  const tx = {
    id: 'wtx_' + Date.now(),
    type: 'credit',
    amount,
    description: `💳 Instant Wallet Top-Up via UPI/Card`,
    date: new Date().toISOString()
  };
  req.user.walletTransactions.unshift(tx);
  saveDatabase();

  res.json({
    success: true,
    message: `🎉 Successfully added ₹${amount.toLocaleString('en-IN')} to your Aura Wallet!`,
    balance: req.user.walletBalance,
    transaction: tx
  });
});

// Redeem Gift Card
app.post('/api/wallet/redeem-giftcard', authMiddleware, (req, res) => {
  const code = (req.body.code || '').trim().toUpperCase();
  if (!code) {
    return res.status(400).json({ success: false, message: 'Please enter a Gift Card or Voucher code' });
  }

  const giftCard = db.giftCards.find(g => g.code.toUpperCase() === code);
  if (!giftCard) {
    return res.status(404).json({ success: false, message: 'Invalid Gift Card voucher code. Please check and retry.' });
  }

  if (giftCard.isRedeemed) {
    return res.status(400).json({ success: false, message: 'This Gift Card has already been redeemed.' });
  }

  // Credit user wallet
  req.user.walletBalance = +((req.user.walletBalance || 0) + giftCard.amount).toFixed(2);
  giftCard.isRedeemed = true;
  giftCard.redeemedBy = req.user.id;
  giftCard.redeemedAt = new Date().toISOString();

  if (!req.user.walletTransactions) req.user.walletTransactions = [];
  const tx = {
    id: 'wtx_' + Date.now(),
    type: 'credit',
    amount: giftCard.amount,
    description: `🎁 Redeemed Gift Card Voucher [${giftCard.code}]`,
    date: new Date().toISOString()
  };
  req.user.walletTransactions.unshift(tx);
  saveDatabase();

  res.json({
    success: true,
    message: `🎉 Gift Card redeemed! ₹${giftCard.amount.toLocaleString('en-IN')} credited to your Aura Wallet.`,
    balance: req.user.walletBalance,
    amount: giftCard.amount,
    giftCardDescription: giftCard.description
  });
});

// ==========================================
// 7. LOYALTY REWARDS & VIP CLUB ROUTES
// ==========================================

// Get Loyalty status
app.get('/api/loyalty/info', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const canClaimToday = req.user.dailyLastClaimed !== today;

  res.json({
    success: true,
    loyalty: {
      coins: req.user.coins || 0,
      vipTier: req.user.vipTier || 'Bronze',
      streak: req.user.dailyClaimStreak || 0,
      canClaimDailyBonus: canClaimToday,
      nextTier: req.user.coins < 200 ? 'Silver (200 Coins)' : (req.user.coins < 500 ? 'Gold (500 Coins)' : (req.user.coins < 1000 ? 'Platinum (1000 Coins)' : 'Maximum VIP Status 👑'))
    }
  });
});

// Claim Daily Login Bonus Streak
app.post('/api/loyalty/claim-daily', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  if (req.user.dailyLastClaimed === today) {
    return res.status(400).json({ success: false, message: 'You have already claimed today\'s daily bonus! Return tomorrow to keep your streak.' });
  }

  const currentStreak = (req.user.dailyClaimStreak || 0) + 1;
  const bonusCoins = 25 + (Math.min(currentStreak, 7) * 5); // 30, 35, 40...

  req.user.coins = (req.user.coins || 0) + bonusCoins;
  req.user.dailyClaimStreak = currentStreak;
  req.user.dailyLastClaimed = today;

  // Recalculate VIP Tier
  if (req.user.coins >= 1000) req.user.vipTier = 'Platinum';
  else if (req.user.coins >= 500) req.user.vipTier = 'Gold';
  else if (req.user.coins >= 200) req.user.vipTier = 'Silver';
  else req.user.vipTier = 'Bronze';

  saveDatabase();

  res.json({
    success: true,
    message: `🎉 Claimed Day ${currentStreak} Streak Bonus! +${bonusCoins} Aura Coins added!`,
    coins: req.user.coins,
    streak: currentStreak,
    bonusCoins,
    vipTier: req.user.vipTier
  });
});

// ==========================================
// 8. PRICE DROP & BACK-IN-STOCK ALERTS ROUTE
// ==========================================
app.post('/api/alerts/price-drop', (req, res) => {
  const { productId, targetPrice, email, phone } = req.body;
  if (!productId || (!email && !phone)) {
    return res.status(400).json({ success: false, message: 'Product ID and email or phone are required.' });
  }

  const product = db.products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const newAlert = {
    id: 'alert_' + Date.now(),
    productId,
    productTitle: product.title,
    currentPrice: product.price,
    targetPrice: Number(targetPrice) || product.price,
    email: email || '',
    phone: phone || '',
    createdAt: new Date().toISOString()
  };

  db.priceDropAlerts.push(newAlert);
  saveDatabase();

  res.status(201).json({
    success: true,
    message: `🔔 Price alert confirmed! We will notify you instantly when "${product.title}" reaches your target price.`
  });
});

// ==========================================
// 9. SMART BUNDLE RECOMMENDATIONS ROUTE
// ==========================================
app.get('/api/products/:id/bundle-recommendations', (req, res) => {
  const mainProduct = db.products.find(p => p.id === req.params.id);
  if (!mainProduct) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Find 2 complementary products from accessories, gaming, audio, or same category
  const bundleItems = db.products
    .filter(p => p.id !== mainProduct.id && (p.category === 'Electronic Accessories' || p.category === 'Headphones & Earphones' || p.category === 'Smart Watches' || p.category === mainProduct.category))
    .slice(0, 2);

  const bundleTotal = mainProduct.price + bundleItems.reduce((acc, item) => acc + item.price, 0);
  const bundleDiscountPercent = 15; // 15% off bundle
  const discountedBundleTotal = +(bundleTotal * 0.85).toFixed(2);
  const savings = +(bundleTotal - discountedBundleTotal).toFixed(2);

  res.json({
    success: true,
    mainProduct,
    bundleItems,
    pricing: {
      originalTotal: bundleTotal,
      bundleDiscountPercent,
      discountedTotal: discountedBundleTotal,
      savings
    }
  });
});

// Fallback SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 E-Commerce Server running live at http://localhost:${PORT}`);
});

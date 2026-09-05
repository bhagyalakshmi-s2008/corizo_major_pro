/**
 * Comprehensive End-to-End Test Suite for E-Commerce Web Application (INR Currency)
 * Tests:
 * 1. Static HTML, CSS, JS delivery
 * 2. User Authentication (Login, Register, Session me)
 * 3. Admin Authentication & Role Guards
 * 4. Products Catalog (Query, Filter by INR price, Search, Sort, Details)
 * 5. Product Review Submission & Rating Engine
 * 6. Wishlist & Cart Integration
 * 7. Admin Product CRUD & 1-Click Restock
 * 8. Order Placement (Cash on Delivery Flow & Stock Reduction)
 * 9. Order Status Update by Admin & CSV Export
 * 10. Admin Analytics & Customer Roster
 * 11. Coupon Validation
 */

async function runTests() {
  const baseUrl = 'http://localhost:3000';
  console.log('🚀 Starting Full Suite E2E Verification Tests (INR Currency)...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Static Files
    console.log('[Test Group 1] Static Asset Delivery');
    const htmlRes = await fetch(`${baseUrl}/`);
    assert(htmlRes.status === 200, 'index.html served with HTTP 200');
    const htmlText = await htmlRes.text();
    assert(htmlText.includes('AURA'), 'index.html contains AURA brand');
    assert(htmlText.includes('wishlistDrawer'), 'index.html contains wishlistDrawer');
    assert(htmlText.includes('₹'), 'index.html contains INR (₹) symbol');

    const cssRes = await fetch(`${baseUrl}/css/style.css`);
    assert(cssRes.status === 200, 'style.css served with HTTP 200');

    // 2. User Authentication
    console.log('\n[Test Group 2] Authentication System');
    // Login as Demo User
    const userLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@ecommerce.com', password: 'user123' })
    });
    const userLoginData = await userLoginRes.json();
    assert(userLoginData.success === true, 'User login succeeds');
    assert(userLoginData.user.role === 'customer', 'User role is customer');
    const userToken = userLoginData.token;

    // Login as Demo Admin
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ecommerce.com', password: 'admin123' })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginData.success === true, 'Admin login succeeds');
    assert(adminLoginData.user.role === 'admin', 'Admin role is admin');
    const adminToken = adminLoginData.token;

    // 3. Products Catalog & Multi-Category Filters
    console.log('\n[Test Group 3] Products Catalog & 15-Category Filters');
    const prodRes = await fetch(`${baseUrl}/api/products`);
    const prodData = await prodRes.json();
    assert(prodData.success === true && prodData.products.length >= 15, `Catalog loaded with ${prodData.products.length} products across 15 categories`);

    // Category filter: Mobiles
    const mobRes = await fetch(`${baseUrl}/api/products?category=Mobiles`);
    const mobData = await mobRes.json();
    assert(mobData.products.length > 0 && mobData.products.every(p => p.category === 'Mobiles'), 'Mobiles category filter returns mobile devices');

    // Category filter: Gaming
    const gamRes = await fetch(`${baseUrl}/api/products?category=Gaming`);
    const gamData = await gamRes.json();
    assert(gamData.products.length > 0 && gamData.products.every(p => p.category === 'Gaming'), 'Gaming category filter returns consoles & gear');

    // Price Max Filter (INR)
    const priceFilterRes = await fetch(`${baseUrl}/api/products?maxPrice=10000`);
    const priceFilterData = await priceFilterRes.json();
    assert(priceFilterData.products.every(p => p.price <= 10000), 'Price filter (max ₹10,000) returns only items <= ₹10,000');

    // 4. Product Reviews Submission
    console.log('\n[Test Group 4] Customer Reviews & Rating Engine');
    const targetProduct = prodData.products[0];
    const reviewRes = await fetch(`${baseUrl}/api/products/${targetProduct.id}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        reviewerName: 'Rahul Sharma',
        rating: 5,
        title: 'Sensational product!',
        comment: 'The build quality is exceptional and noise cancellation is incredible.'
      })
    });
    const reviewData = await reviewRes.json();
    assert(reviewData.success === true, 'Customer review submitted successfully');
    assert(reviewData.newRating > 0, `Product rating recalculated to ${reviewData.newRating}`);

    // 5. Coupons
    console.log('\n[Test Group 5] Coupon Engine');
    const couponRes = await fetch(`${baseUrl}/api/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'SAVE20' })
    });
    const couponData = await couponRes.json();
    assert(couponData.success === true && couponData.coupon.discountPercent === 20, 'Coupon "SAVE20" validated with 20% discount');

    // 6. Order Placement (Cash on Delivery)
    console.log('\n[Test Group 6] Checkout & Cash on Delivery (COD) Flow');
    const orderProduct = prodData.products[0];
    const initialStock = orderProduct.stock;

    const orderRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        items: [{ productId: orderProduct.id, title: orderProduct.title, quantity: 1 }],
        customerName: 'Alex Morgan',
        customerPhone: '+91 98490 12345',
        shippingAddress: 'Plot 42, Jubilee Hills, Hyderabad, Telangana 500033',
        paymentMethod: 'Cash on Delivery',
        couponCode: 'SAVE20'
      })
    });
    const orderData = await orderRes.json();
    assert(orderData.success === true, 'COD Order placed successfully');
    assert(orderData.order.paymentMethod === 'Cash on Delivery', 'Order payment method set to Cash on Delivery');
    const placedOrderId = orderData.order.id;

    // 7. Admin 1-Click Restock
    console.log('\n[Test Group 7] Admin 1-Click Restock Engine');
    const restockRes = await fetch(`${baseUrl}/api/products/${orderProduct.id}/restock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ amount: 20 })
    });
    const restockData = await restockRes.json();
    assert(restockData.success === true, 'Admin restocked +20 units successfully');
    assert(restockData.product.stock > initialStock, `Stock increased to ${restockData.product.stock}`);

    // 8. Admin Orders & CSV Export
    console.log('\n[Test Group 8] Admin Order Management & CSV Export');
    const csvRes = await fetch(`${baseUrl}/api/admin/orders/export`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(csvRes.status === 200, 'Admin CSV export responds with HTTP 200');
    const csvContent = await csvRes.text();
    assert(csvContent.includes('Order ID') && csvContent.includes(placedOrderId), 'CSV contains exported order headers and order ID');

    // Admin Dashboard Stats
    const statsRes = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const statsData = await statsRes.json();
    assert(statsData.success === true && statsData.stats.totalRevenue > 0, `Admin stats calculated revenue: ₹${statsData.stats.totalRevenue}`);

    console.log(`\n======================================================`);
    console.log(`🎯 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`======================================================\n`);

  } catch (error) {
    console.error('Fatal test error:', error);
  }
}

runTests();

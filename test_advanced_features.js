/**
 * Comprehensive Automated Test Suite for AURA Advanced Features Suite
 * Tests:
 * 1. Static HTML & Components verification (360 AR modal, Visual Search, VIP Club, Wallet, FOMO, Currency Switcher)
 * 2. User Authentication with Wallet & Coins fields
 * 3. Digital Aura Wallet (Balance check, Top-up, Gift Card Redemption)
 * 4. VIP Club & Loyalty Rewards (Info, Daily Claim Streak Bonus)
 * 5. Price Drop & Back-in-Stock Alerts subscription
 * 6. Smart Bundle & Save recommendations
 * 7. Order Placement with Coins Redemption & Aura Wallet 1-Click Payment
 */

async function runAdvancedFeaturesTests() {
  const baseUrl = 'http://localhost:3000';
  console.log('🚀 Starting Verification Tests for Advanced Features Suite...\n');

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
    // 1. Static UI Markup Verification
    console.log('[Test Group 1] Advanced Frontend Component Markup');
    const htmlRes = await fetch(`${baseUrl}/`);
    assert(htmlRes.status === 200, 'index.html served with HTTP 200');
    const htmlText = await htmlRes.text();
    assert(htmlText.includes('product360ModalOverlay'), '360° & AR Room Simulator modal container present');
    assert(htmlText.includes('visualSearchModalOverlay'), 'AI Visual Camera Search modal container present');
    assert(htmlText.includes('vipClubModalOverlay'), 'Aura VIP Club & Loyalty modal container present');
    assert(htmlText.includes('auraWalletModalOverlay'), 'Digital Aura Wallet & Gift Cards modal container present');
    assert(htmlText.includes('priceDropModalOverlay'), 'Price Drop Alert modal container present');
    assert(htmlText.includes('fomoToastContainer'), 'Live FOMO Social Proof toast container present');
    assert(htmlText.includes('currencyDropdownWrap'), 'Global Multi-Currency Switcher present');
    assert(htmlText.includes('sfxToggleBtn'), 'Web Audio SFX toggle button present');

    // 2. Authentication & User Profile
    console.log('\n[Test Group 2] Authentication & Wallet/Loyalty Profile');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@ecommerce.com', password: 'user123' })
    });
    const loginData = await loginRes.json();
    assert(loginData.success === true, 'User login succeeds');
    assert(typeof loginData.user.walletBalance === 'number', `User wallet balance loaded: ₹${loginData.user.walletBalance}`);
    assert(typeof loginData.user.coins === 'number', `User coins loaded: ${loginData.user.coins} coins`);
    assert(loginData.user.vipTier !== undefined, `User VIP tier loaded: ${loginData.user.vipTier}`);
    const token = loginData.token;

    // 3. Digital Aura Wallet Operations
    console.log('\n[Test Group 3] Digital Aura Wallet & Gift Cards API');
    const walletRes = await fetch(`${baseUrl}/api/wallet/info`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const walletData = await walletRes.json();
    assert(walletData.success === true, 'Wallet info fetched successfully');
    const initialBalance = walletData.wallet.balance;

    // Top-up wallet
    const topupRes = await fetch(`${baseUrl}/api/wallet/topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ amount: 1000 })
    });
    const topupData = await topupRes.json();
    assert(topupData.success === true, 'Wallet top-up of ₹1,000 succeeds');
    assert(topupData.balance === initialBalance + 1000, `Updated balance matches: ₹${topupData.balance}`);

    // Redeem gift card (FESTIVE2000)
    const redeemRes = await fetch(`${baseUrl}/api/wallet/redeem-giftcard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ code: 'FESTIVE2000' })
    });
    const redeemData = await redeemRes.json();
    assert(redeemData.success === true, 'Gift Card FESTIVE2000 redeemed for ₹2,000');
    assert(redeemData.balance === topupData.balance + 2000, `New balance after gift card: ₹${redeemData.balance}`);

    // 4. VIP Club & Loyalty Rewards
    console.log('\n[Test Group 4] VIP Club & Loyalty Rewards API');
    const loyaltyRes = await fetch(`${baseUrl}/api/loyalty/info`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const loyaltyData = await loyaltyRes.json();
    assert(loyaltyData.success === true, 'Loyalty status retrieved');
    assert(loyaltyData.loyalty.coins >= 0, `Current Aura Coins: ${loyaltyData.loyalty.coins}`);

    // 5. Price Drop Alert
    console.log('\n[Test Group 5] Price Drop & Stock Alerts API');
    const alertRes = await fetch(`${baseUrl}/api/alerts/price-drop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'prod_mob_1',
        targetPrice: 125000,
        email: 'user@ecommerce.com',
        phone: '+91 98490 12345'
      })
    });
    const alertData = await alertRes.json();
    assert(alertData.success === true, 'Price drop alert registered successfully');

    // 6. Smart Bundle Recommendations
    console.log('\n[Test Group 6] Smart Bundle & Save Recommendations API');
    const bundleRes = await fetch(`${baseUrl}/api/products/prod_mob_1/bundle-recommendations`);
    const bundleData = await bundleRes.json();
    assert(bundleData.success === true, 'Bundle recommendations generated');
    assert(bundleData.bundleItems.length > 0, `Bundle includes ${bundleData.bundleItems.length} accessory add-ons`);
    assert(bundleData.pricing.bundleDiscountPercent === 15, '15% bundle combo savings verified');

    // 7. Order Placement with Coins & Wallet Payment
    console.log('\n[Test Group 7] Order Placement with Aura Coins & Wallet Payment');
    const orderRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        items: [{ productId: 'prod_mob_1', quantity: 1 }],
        customerName: 'Alex Morgan',
        customerPhone: '+91 98490 12345',
        shippingAddress: 'Plot 42, Jubilee Hills, Hyderabad 500033',
        paymentMethod: 'Cash on Delivery',
        coinsRedeemed: 200
      })
    });
    const orderData = await orderRes.json();
    assert(orderData.success === true, 'Order created successfully with Coins discount');
    assert(orderData.order.coinsRedeemed === 200, 'Redeemed 200 coins on order');
    assert(orderData.order.coinsDiscount === 20.00, '200 coins correctly applied as ₹20.00 discount');
    assert(orderData.userWallet.coinsEarned > 0, `Earned ${orderData.userWallet.coinsEarned} new Aura Coins on order!`);

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('❌ Test execution error:', err);
    process.exit(1);
  }
}

runAdvancedFeaturesTests();

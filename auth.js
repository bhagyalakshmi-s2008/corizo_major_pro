/**
 * AURA E-COMMERCE - AUTHENTICATION MODULE
 * Handles registration, login, 1-click demo accounts, role management & sessions
 */

let currentUser = null;

// Initialize and verify authentication on app boot
async function initAuth() {
  const token = api.getToken();
  if (token) {
    try {
      const res = await api.getCurrentUser();
      if (res.success && res.user) {
        currentUser = res.user;
      } else {
        api.setToken(null);
        currentUser = null;
      }
    } catch (err) {
      console.warn('Session verification failed, logging out session.');
      api.setToken(null);
      currentUser = null;
    }
  }
  updateAuthUI();
}

// Update Header, Drawer, and Protected UI based on current user
function updateAuthUI() {
  const guestNavGroup = document.getElementById('guestNavGroup');
  const userNavGroup = document.getElementById('userNavGroup');
  const adminNavGroup = document.getElementById('adminNavGroup');
  const adminPortalLink = document.getElementById('adminPortalLink');

  const mobileGuestMenu = document.getElementById('mobileGuestMenu');
  const mobileUserMenu = document.getElementById('mobileUserMenu');
  const mobileAdminLink = document.getElementById('mobileAdminLink');

  if (currentUser) {
    if (guestNavGroup) guestNavGroup.style.display = 'none';
    if (userNavGroup) userNavGroup.style.display = 'flex';
    if (mobileGuestMenu) mobileGuestMenu.style.display = 'none';
    if (mobileUserMenu) mobileUserMenu.style.display = 'block';

    const avatarInitial = (currentUser.name || 'U').charAt(0).toUpperCase();
    const firstName = (currentUser.name || 'User').split(' ')[0];

    const navUserAvatar = document.getElementById('navUserAvatar');
    const navUserName = document.getElementById('navUserName');
    const dropdownUserName = document.getElementById('dropdownUserName');
    const dropdownUserEmail = document.getElementById('dropdownUserEmail');
    const dropdownUserRole = document.getElementById('dropdownUserRole');

    if (navUserAvatar) navUserAvatar.textContent = avatarInitial;
    if (navUserName) navUserName.textContent = firstName;
    if (dropdownUserName) dropdownUserName.textContent = currentUser.name;
    if (dropdownUserEmail) dropdownUserEmail.textContent = currentUser.email;
    if (dropdownUserRole) dropdownUserRole.textContent = currentUser.role === 'admin' ? 'Administrator' : 'Customer';

    const mobileUserAvatar = document.getElementById('mobileUserAvatar');
    const mobileUserName = document.getElementById('mobileUserName');
    const mobileUserEmail = document.getElementById('mobileUserEmail');

    if (mobileUserAvatar) mobileUserAvatar.textContent = avatarInitial;
    if (mobileUserName) mobileUserName.textContent = currentUser.name;
    if (mobileUserEmail) mobileUserEmail.textContent = currentUser.email;

    // Update Navbar VIP Coins & Wallet badges
    const navCoins = document.getElementById('navVipCoinsPill');
    if (navCoins) navCoins.textContent = `👑 ${currentUser.coins || 0} Coins`;

    const navWallet = document.getElementById('navWalletBalancePill');
    if (navWallet) navWallet.textContent = typeof formatCurrency === 'function' ? formatCurrency(currentUser.walletBalance || 0) : `₹${currentUser.walletBalance || 0}`;

    // Check if user has Admin role
    const isAdmin = currentUser.role === 'admin';
    if (adminNavGroup) adminNavGroup.style.display = isAdmin ? 'flex' : 'none';
    if (adminPortalLink) adminPortalLink.style.display = isAdmin ? 'block' : 'none';
    if (mobileAdminLink) mobileAdminLink.style.display = isAdmin ? 'block' : 'none';
  } else {
    const navCoins = document.getElementById('navVipCoinsPill');
    if (navCoins) navCoins.textContent = '👑 VIP Club';

    const navWallet = document.getElementById('navWalletBalancePill');
    if (navWallet) navWallet.textContent = 'Wallet';

    if (guestNavGroup) guestNavGroup.style.display = 'flex';
    if (userNavGroup) userNavGroup.style.display = 'none';
    if (adminNavGroup) adminNavGroup.style.display = 'none';
    if (adminPortalLink) adminPortalLink.style.display = 'none';

    if (mobileGuestMenu) mobileGuestMenu.style.display = 'block';
    if (mobileUserMenu) mobileUserMenu.style.display = 'none';
  }
}

// 1-Click Quick Demo User
function fillDemoUser() {
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  if (emailInput && passInput) {
    emailInput.value = 'user@ecommerce.com';
    passInput.value = 'user123';
    showToast('Demo Customer credentials loaded!', 'info');
  }
}

// 1-Click Quick Demo Admin
function fillDemoAdmin() {
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  if (emailInput && passInput) {
    emailInput.value = 'admin@ecommerce.com';
    passInput.value = 'admin123';
    showToast('Demo Admin credentials loaded!', 'info');
  }
}

// Handle User Login
async function handleLoginFormSubmit(event) {
  event.preventDefault();
  const submitBtn = document.getElementById('loginSubmitBtn');
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Signing in...';

    const res = await api.login(email, password);
    if (res.success && res.token) {
      api.setToken(res.token);
      currentUser = res.user;
      updateAuthUI();
      showToast(`Welcome back, ${res.user.name}!`, 'success');

      // If user is admin, navigate directly to admin dashboard
      if (res.user.role === 'admin') {
        navigateTo('admin');
      } else {
        // If there's an ongoing cart checkout, proceed to checkout; otherwise home
        if (cart.length > 0) {
          navigateTo('checkout');
        } else {
          navigateTo('home');
        }
      }
    }
  } catch (err) {
    showToast(err.message || 'Login failed. Check credentials.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In';
  }
}

// Handle User Registration
async function handleRegisterFormSubmit(event) {
  event.preventDefault();
  const submitBtn = document.getElementById('regSubmitBtn');
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const phone = document.getElementById('regPhone').value.trim();
  const address = document.getElementById('regAddress').value.trim();

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Creating account...';

    const res = await api.register({ name, email, password, phone, address });
    if (res.success && res.token) {
      api.setToken(res.token);
      currentUser = res.user;
      updateAuthUI();
      showToast('🎉 Account created successfully! Welcome to AURA.', 'success');
      
      if (cart.length > 0) {
        navigateTo('checkout');
      } else {
        navigateTo('home');
      }
    }
  } catch (err) {
    showToast(err.message || 'Registration failed. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create My Account';
  }
}

// Handle User Logout
function logoutUser() {
  api.setToken(null);
  currentUser = null;
  updateAuthUI();
  showToast('You have been logged out successfully.', 'info');
  navigateTo('home');
}

// Helper: Toggle Password View
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) {
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    }
  } else {
    input.type = 'password';
    if (icon) {
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  }
}

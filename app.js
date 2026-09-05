/**
 * AURA E-COMMERCE - MAIN APPLICATION CONTROLLER
 * Single Page App Router, Toast Notifications, Confetti Particle System, Dark/Light Theme & Global Events
 */

// Theme Management
let currentTheme = localStorage.getItem('aura_theme') || 'theme-dark';

function initTheme() {
  document.body.className = currentTheme;
  updateThemeToggleIcon();
}

function toggleTheme() {
  currentTheme = currentTheme === 'theme-dark' ? 'theme-light' : 'theme-dark';
  document.body.className = currentTheme;
  localStorage.setItem('aura_theme', currentTheme);
  updateThemeToggleIcon();
  showToast(`Switched to ${currentTheme === 'theme-dark' ? 'Dark' : 'Light'} Mode`, 'info');
}

function updateThemeToggleIcon() {
  const icon = document.getElementById('themeToggleIcon');
  if (icon) {
    if (currentTheme === 'theme-dark') {
      icon.className = 'fa-solid fa-sun text-warning';
    } else {
      icon.className = 'fa-solid fa-moon text-accent';
    }
  }
}

// Route Navigation Function
function navigateTo(viewName) {
  // Update browser hash
  if (window.location.hash !== `#${viewName}`) {
    window.location.hash = `#${viewName}`;
  }

  // Deactivate all views
  document.querySelectorAll('.app-view').forEach(view => {
    view.classList.remove('active');
  });

  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.classList.add('active');
  } else {
    const homeView = document.getElementById('view-home');
    if (homeView) homeView.classList.add('active');
  }

  // View Specific Triggers
  if (viewName === 'home') {
    loadProductsCatalog();
  } else if (viewName === 'checkout') {
    setupCheckoutPage();
  } else if (viewName === 'my-orders') {
    loadMyOrdersList();
  } else if (viewName === 'admin') {
    initAdminPortal();
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Listen to Hash Changes
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '') || 'home';
  navigateTo(hash);
});

// ==========================================
// TOAST NOTIFICATIONS SYSTEM
// ==========================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-message toast-${type}`;

  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-circle-check';
  else if (type === 'error') icon = 'fa-circle-exclamation';
  else if (type === 'warning') icon = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 4000);
}

// ==========================================
// MOBILE DRAWER MENU
// ==========================================

function toggleMobileMenu() {
  const drawer = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('mobileDrawerOverlay');
  if (!drawer || !overlay) return;

  drawer.classList.toggle('active');
  overlay.classList.toggle('active');
}

// ==========================================
// CONFETTI CELEBRATION PARTICLE ENGINE
// ==========================================

function triggerConfettiParticles() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#6366f1', '#a855f7', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ffffff'];

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      r: Math.random() * 6 + 4,
      d: Math.random() * 150 + 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.floor(Math.random() * 10) - 10,
      tiltAngleIncremental: (Math.random() * 0.07) + 0.05,
      tiltAngle: 0,
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 0.5) * 18 - 8,
      gravity: 0.35,
      opacity: 1
    });
  }

  let animationFrame;
  const startTime = Date.now();

  function drawConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.tiltAngle += p.tiltAngleIncremental;
      p.tilt = Math.sin(p.tiltAngle) * 15;

      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();
    });

    if (Date.now() - startTime < 4000) {
      animationFrame = requestAnimationFrame(drawConfetti);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrame);
    }
  }

  drawConfetti();
}

window.addEventListener('resize', () => {
  const canvas = document.getElementById('confettiCanvas');
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
});

// ==========================================
// APPLICATION BOOTSTRAP
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
  // Init Theme
  initTheme();

  // Global search input listener
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      handleSearchInput(e.target.value);
    });
  }

  const clearSearchBtn = document.getElementById('clearSearchBtn');
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      handleSearchInput('');
    });
  }

  // Init Auth & Session
  await initAuth();

  // Route initial hash
  const initialHash = window.location.hash.replace('#', '') || 'home';
  navigateTo(initialHash);
});

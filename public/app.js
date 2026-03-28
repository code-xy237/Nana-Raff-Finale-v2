/* ===== NANA RAFF – Shared Utilities ===== */
const API = '/api';

// ── Auth helpers ──────────────────────────────────────────────────────────────
const Auth = {
  getToken: () => localStorage.getItem('nr_token'),
  getUser: () => { try { return JSON.parse(localStorage.getItem('nr_user')); } catch { return null; } },
  isAdmin: () => { const u = Auth.getUser(); return u && u.role === 'admin'; },
  isLoggedIn: () => !!Auth.getToken(),
  save: (user, token) => { localStorage.setItem('nr_user', JSON.stringify(user)); localStorage.setItem('nr_token', token); },
  logout: () => { localStorage.removeItem('nr_user'); localStorage.removeItem('nr_token'); window.location.href = '/login.html'; }
};

// ── API fetch wrapper ─────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = Auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.msg || `Erreur ${res.status}`);
  return data;
}

// ── Cart ──────────────────────────────────────────────────────────────────────
const Cart = {
  get: () => { try { return JSON.parse(localStorage.getItem('nr_cart')) || []; } catch { return []; } },
  save: (cart) => { localStorage.setItem('nr_cart', JSON.stringify(cart)); Cart.updateUI(); },
  add: (product, qty = 1) => {
    const cart = Cart.get();
    const ex = cart.find(i => i.productId === product.id);
    if (ex) ex.qty += qty; else cart.push({ productId: product.id, name: product.name, price: product.price, image: (product.images || [])[0] || '', qty });
    Cart.save(cart);
    toast('Ajouté au panier 🛒', 'success');
  },
  remove: (productId) => { Cart.save(Cart.get().filter(i => i.productId !== productId)); },
  setQty: (productId, qty) => {
    if (qty < 1) { Cart.remove(productId); return; }
    const cart = Cart.get(); const item = cart.find(i => i.productId === productId);
    if (item) { item.qty = qty; Cart.save(cart); }
  },
  total: () => Cart.get().reduce((s, i) => s + i.price * i.qty, 0),
  count: () => Cart.get().reduce((s, i) => s + i.qty, 0),
  clear: () => Cart.save([]),
  updateUI: () => {
    const count = Cart.count();
    document.querySelectorAll('.cart-count').forEach(el => { el.textContent = count; el.style.display = count > 0 ? 'flex' : 'none'; });
  }
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function toast(msg, type = 'default', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', default: 'ℹ️' };
  t.innerHTML = `<span>${icons[type] || icons.default}</span>${msg}`;
  container.appendChild(t);
  setTimeout(() => t.remove(), duration);
}

// ── Format helpers ────────────────────────────────────────────────────────────
function formatPrice(p) { return new Intl.NumberFormat('fr-FR').format(p) + ' FCFA'; }
function formatDate(d) { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }
function stars(n) { return '★'.repeat(n) + '☆'.repeat(5 - n); }

// ── Navbar setup ──────────────────────────────────────────────────────────────
function setupNavbar() {
  const user = Auth.getUser();
  const loginBtn = document.getElementById('nav-login');
  const userMenu = document.getElementById('nav-user-menu');
  const userName = document.getElementById('nav-user-name');
  const adminLink = document.getElementById('nav-admin-link');

  if (loginBtn && userMenu) {
    if (user) {
      loginBtn.classList.add('hidden');
      userMenu.classList.remove('hidden');
      if (userName) userName.textContent = user.name;
    } else {
      loginBtn.classList.remove('hidden');
      userMenu.classList.add('hidden');
    }
  }

  if (adminLink) {
    adminLink.style.display = Auth.isAdmin() ? '' : 'none';
  }

  // Hamburger
  const ham = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  if (ham && navLinks) {
    ham.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  Cart.updateUI();
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

// Init
document.addEventListener('DOMContentLoaded', () => {
  setupNavbar();
  // Close modal on overlay click
  document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', e => { if (e.target === el) el.classList.remove('open'); });
  });
  // Logout button
  document.querySelectorAll('[data-logout]').forEach(el => {
    el.addEventListener('click', () => Auth.logout());
  });
});

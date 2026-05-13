/* ============================================================
   cart.js — shared cart utilities (loaded on every page)
   ============================================================ */

const CART_KEY = 'glambyivy_cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateAllCartBadges();
}

function addToCart(product, qty) {
  qty = qty || 1;
  const cart = getCart();
  const existing = cart.find(function(item) { return item.id === product.id; });
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      categoryLabel: product.categoryLabel || '',
      qty: qty
    });
  }
  saveCart(cart);
  showToast(product.name + ' added to cart');
}

function removeFromCart(productId) {
  saveCart(getCart().filter(function(item) { return item.id !== productId; }));
}

function updateQty(productId, qty) {
  qty = parseInt(qty, 10);
  if (qty <= 0) { removeFromCart(productId); return; }
  const cart = getCart();
  const item = cart.find(function(i) { return i.id === productId; });
  if (item) { item.qty = qty; saveCart(cart); }
}

function getCartTotal() {
  return getCart().reduce(function(sum, item) { return sum + item.price * item.qty; }, 0);
}

function getCartCount() {
  return getCart().reduce(function(sum, item) { return sum + item.qty; }, 0);
}

function updateAllCartBadges() {
  var count = getCartCount();
  document.querySelectorAll('.cart-count').forEach(function(el) {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function formatKES(amount) {
  return 'KSh ' + Number(amount).toLocaleString('en-KE');
}

function showToast(msg) {
  var existing = document.querySelector('.gbi-toast');
  if (existing) existing.remove();
  var toast = document.createElement('div');
  toast.className = 'gbi-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      toast.classList.add('gbi-toast--show');
    });
  });
  setTimeout(function() {
    toast.classList.remove('gbi-toast--show');
    setTimeout(function() { toast.remove(); }, 350);
  }, 2500);
}

/* Mobile nav toggle — works for any page with .hamburger + .mobile-nav */
function initMobileNav() {
  var hamburger = document.querySelector('.hamburger');
  var mobileNav = document.querySelector('.mobile-nav');
  if (!hamburger || !mobileNav) return;
  hamburger.addEventListener('click', function() {
    var isOpen = hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
  });
  /* Close on link click */
  mobileNav.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', function() {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  updateAllCartBadges();
  initMobileNav();
});

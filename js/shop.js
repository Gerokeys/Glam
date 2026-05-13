/* ============================================================
   shop.js — product grid, filtering, search
   ============================================================ */

var allProducts = [];
var activeCategory = 'all';
var searchQuery = '';

function loadProducts() {
  fetch('./data/products.json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      allProducts = data;
      /* Apply URL param category on load */
      var params = new URLSearchParams(window.location.search);
      if (params.get('cat')) {
        activeCategory = params.get('cat');
        var btn = document.querySelector('.filter-btn[data-cat="' + activeCategory + '"]');
        if (btn) {
          document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
        }
      }
      renderProducts();
    });
}

function filterProducts() {
  return allProducts.filter(function(p) {
    var matchCat = activeCategory === 'all' || p.category === activeCategory;
    var q = searchQuery.toLowerCase().trim();
    var matchSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      p.categoryLabel.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });
}

function productCardHTML(p) {
  var safeName = p.name.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  var safeImage = p.image.replace(/'/g, '&#39;');
  return '<div class="product-card">' +
    '<a href="product.html?id=' + p.id + '" class="product-card__img-wrap">' +
      '<img src="' + p.image + '" alt="' + safeName + '" loading="lazy" />' +
      (!p.inStock ? '<span class="out-of-stock-badge">Out of Stock</span>' : '') +
    '</a>' +
    '<div class="product-card__info">' +
      '<span class="product-card__cat">' + p.categoryLabel + '</span>' +
      '<h3 class="product-card__name"><a href="product.html?id=' + p.id + '">' + p.name + '</a></h3>' +
      '<div class="product-card__footer">' +
        '<span class="product-card__price">' + formatKES(p.price) + '</span>' +
        (p.inStock
          ? '<button class="btn-cart-icon" onclick="addToCart({id:' + p.id + ',name:\'' + safeName + '\',price:' + p.price + ',image:\'' + safeImage + '\',categoryLabel:\'' + p.categoryLabel + '\'})" aria-label="Add to cart">' +
              '<ion-icon name="bag-add-outline"></ion-icon>' +
            '</button>'
          : '<span class="sold-out-label">Sold Out</span>') +
      '</div>' +
    '</div>' +
  '</div>';
}

function renderProducts() {
  var grid = document.getElementById('product-grid');
  var filtered = filterProducts();
  var countEl = document.getElementById('product-count');
  if (countEl) countEl.textContent = filtered.length + ' item' + (filtered.length !== 1 ? 's' : '');

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="no-results"><p>No products found.</p><a href="shop.html" class="btn-outline" onclick="location.reload();return false;">Clear filters</a></div>';
    return;
  }
  grid.innerHTML = filtered.map(productCardHTML).join('');
}

function setCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });
  renderProducts();
}

document.addEventListener('DOMContentLoaded', function() {
  loadProducts();

  var searchInput = document.getElementById('shop-search');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      searchQuery = e.target.value;
      renderProducts();
    });
  }

  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { setCategory(btn.dataset.cat); });
  });
});

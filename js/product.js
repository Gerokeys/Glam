/* ============================================================
   product.js — product detail page
   ============================================================ */

var currentProduct = null;

function loadProduct() {
  var params = new URLSearchParams(window.location.search);
  var id = parseInt(params.get('id'), 10);
  if (!id) { window.location.href = 'shop.html'; return; }

  fetch('./data/products.json')
    .then(function(r) { return r.json(); })
    .then(function(products) {
      currentProduct = products.find(function(p) { return p.id === id; });
      if (!currentProduct) { window.location.href = 'shop.html'; return; }
      renderProduct(currentProduct, products);
    });
}

function renderProduct(p, allProducts) {
  document.title = p.name + ' — Glam by Ivy';

  /* Breadcrumb */
  var bcCat = document.getElementById('bc-category');
  var bcName = document.getElementById('bc-name');
  if (bcCat) { bcCat.textContent = p.categoryLabel; bcCat.href = 'shop.html?cat=' + p.category; }
  if (bcName) bcName.textContent = p.name;

  /* Main image */
  var mainImg = document.getElementById('product-main-img');
  if (mainImg) { mainImg.src = p.image; mainImg.alt = p.name; }

  /* Thumbnails */
  var thumbsWrap = document.getElementById('product-thumbs');
  if (thumbsWrap && p.images && p.images.length > 1) {
    thumbsWrap.innerHTML = p.images.map(function(src, i) {
      return '<button class="thumb-btn' + (i === 0 ? ' active' : '') + '" data-src="' + src + '">' +
        '<img src="' + src + '" alt="View ' + (i + 1) + '" />' +
      '</button>';
    }).join('');
    thumbsWrap.querySelectorAll('.thumb-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        mainImg.src = btn.dataset.src;
        thumbsWrap.querySelectorAll('.thumb-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
    });
  }

  /* Info */
  var elName = document.getElementById('product-name');
  var elCat = document.getElementById('product-category');
  var elPrice = document.getElementById('product-price');
  var elDesc = document.getElementById('product-description');
  if (elName) elName.textContent = p.name;
  if (elCat) { elCat.textContent = p.categoryLabel; elCat.href = 'shop.html?cat=' + p.category; }
  if (elPrice) elPrice.textContent = formatKES(p.price);
  if (elDesc) elDesc.textContent = p.description;

  /* Stock badge */
  var stockEl = document.getElementById('stock-status');
  if (stockEl) {
    stockEl.textContent = p.inStock ? 'In Stock' : 'Out of Stock';
    stockEl.className = 'stock-badge ' + (p.inStock ? 'in-stock' : 'out-of-stock');
  }

  /* Add to cart */
  var addBtn = document.getElementById('add-to-cart-btn');
  if (addBtn) {
    if (!p.inStock) { addBtn.disabled = true; addBtn.textContent = 'Out of Stock'; }
    addBtn.addEventListener('click', function() {
      var qty = parseInt(document.getElementById('qty-input').value, 10) || 1;
      addToCart(p, qty);
    });
  }

  /* Related products */
  var related = allProducts.filter(function(x) {
    return x.category === p.category && x.id !== p.id;
  }).slice(0, 4);
  var relatedGrid = document.getElementById('related-grid');
  if (relatedGrid && related.length > 0) {
    relatedGrid.innerHTML = related.map(function(rp) {
      return '<div class="product-card">' +
        '<a href="product.html?id=' + rp.id + '" class="product-card__img-wrap">' +
          '<img src="' + rp.image + '" alt="' + rp.name + '" loading="lazy" />' +
        '</a>' +
        '<div class="product-card__info">' +
          '<span class="product-card__cat">' + rp.categoryLabel + '</span>' +
          '<h3 class="product-card__name"><a href="product.html?id=' + rp.id + '">' + rp.name + '</a></h3>' +
          '<div class="product-card__footer">' +
            '<span class="product-card__price">' + formatKES(rp.price) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  } else if (relatedGrid) {
    relatedGrid.closest('.related-section').style.display = 'none';
  }
}

/* Qty stepper */
function changeQty(delta) {
  var input = document.getElementById('qty-input');
  if (!input) return;
  var val = Math.max(1, parseInt(input.value, 10) + delta);
  input.value = val;
}

document.addEventListener('DOMContentLoaded', loadProduct);

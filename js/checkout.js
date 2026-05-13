/* ============================================================
   checkout.js — form, payment stubs (M-Pesa STK + Pesapal)
   ============================================================ */

var selectedPayment = null;

function renderOrderSummary() {
  var cart = getCart();
  if (cart.length === 0) { window.location.href = 'cart.html'; return; }

  var itemsEl = document.getElementById('order-items');
  var subtotalEl = document.getElementById('order-subtotal');
  var totalEl = document.getElementById('order-total');

  itemsEl.innerHTML = cart.map(function(item) {
    return '<div class="order-item">' +
      '<img src="' + item.image + '" alt="' + item.name + '" />' +
      '<div class="order-item__detail">' +
        '<p class="order-item__name">' + item.name + '</p>' +
        '<p class="order-item__qty">Qty: ' + item.qty + '</p>' +
      '</div>' +
      '<span class="order-item__price">' + formatKES(item.price * item.qty) + '</span>' +
    '</div>';
  }).join('');

  var total = getCartTotal();
  if (subtotalEl) subtotalEl.textContent = formatKES(total);
  if (totalEl) totalEl.textContent = formatKES(total);
}

function selectPayment(method) {
  selectedPayment = method;
  document.querySelectorAll('.payment-card').forEach(function(c) {
    c.classList.toggle('active', c.dataset.method === method);
  });
  document.getElementById('mpesa-fields').style.display = method === 'mpesa' ? 'block' : 'none';
  document.getElementById('card-fields').style.display = method === 'card' ? 'block' : 'none';
}

/* ──────────────────────────────────────────────
   M-Pesa STK Push stub
   ──────────────────────────────────────────────
   BACKEND TODO — when you have Daraja credentials:
   Register at: https://developer.safaricom.co.ke
   You need: Consumer Key, Consumer Secret, Shortcode (Paybill/Till), Passkey

   Your serverless function should:
   1. POST https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials
      (Basic auth with consumerKey:consumerSecret base64)
      → access_token

   2. POST https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest
      Headers: { Authorization: "Bearer " + access_token }
      Body: {
        BusinessShortCode: YOUR_SHORTCODE,
        Password: base64(shortcode + passkey + timestamp),
        Timestamp: "YYYYMMDDHHmmss",
        TransactionType: "CustomerPayBillOnline",   // or "CustomerBuyGoodsOnline" for Till
        Amount: amount,
        PartyA: phone,          // format: 2547XXXXXXXX
        PartyB: YOUR_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: "https://yourdomain.com/api/mpesa-callback",
        AccountReference: orderRef,
        TransactionDesc: "Glam by Ivy Order"
      }
      → { CheckoutRequestID, ResponseCode: "0" }

   3. Handle callback at /api/mpesa-callback (IPN) to confirm payment.
   ────────────────────────────────────────────── */
function initiateMpesaPayment(phone, amount, orderRef) {
  console.log('[M-Pesa STK Stub] Would send to serverless function:', { phone: phone, amount: amount, orderRef: orderRef });
  return Promise.resolve({ success: true, checkoutRequestId: 'STUB_' + Date.now() });
}

/* ──────────────────────────────────────────────
   Pesapal payment stub
   ──────────────────────────────────────────────
   BACKEND TODO — when you have Pesapal credentials:
   Register sandbox at: https://developer.pesapal.com
   Live account: https://my.pesapal.com

   Your serverless function should:
   1. POST https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken
      Body: { consumer_key, consumer_secret }
      → token

   2. Register IPN URL (one-time setup):
      POST https://cybqa.pesapal.com/pesapalv3/api/URLSetup/RegisterIPN
      Body: { url: "https://yourdomain.com/api/pesapal-ipn", ipn_notification_type: "GET" }
      → notification_id

   3. Submit order:
      POST https://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest
      Body: {
        id: orderRef,
        currency: "KES",
        amount: amount,
        description: "Glam by Ivy Order",
        callback_url: "https://yourdomain.com/checkout-success",
        notification_id: NOTIFICATION_ID,
        billing_address: { email, phone, first_name, last_name }
      }
      → { redirect_url, order_tracking_id }

   4. Redirect user to redirect_url.
   5. Handle IPN callback and transaction status check for confirmation.

   Live URLs: replace cybqa.pesapal.com with pay.pesapal.com
   ────────────────────────────────────────────── */
function initiatePesapalPayment(order) {
  console.log('[Pesapal Stub] Would redirect to Pesapal sandbox:', order);
  return Promise.resolve({ success: true, redirectUrl: null });
}

function handleCheckout(e) {
  e.preventDefault();
  var form = document.getElementById('checkout-form');
  var name = form.querySelector('[name="fullname"]').value.trim();
  var email = form.querySelector('[name="email"]').value.trim();
  var phone = form.querySelector('[name="phone"]').value.trim();
  var address = form.querySelector('[name="address"]').value.trim();

  if (!selectedPayment) {
    alert('Please select a payment method (M-Pesa or Card).');
    return;
  }

  /* Format Kenyan phone for M-Pesa: 2547XXXXXXXX */
  var mpesaPhone = phone.replace(/^0/, '254').replace(/^\+/, '').replace(/\s/g, '');

  var order = {
    ref: 'GBI-' + Date.now(),
    customer: { name: name, email: email, phone: mpesaPhone, address: address },
    items: getCart(),
    total: getCartTotal(),
    method: selectedPayment
  };

  var btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.textContent = 'Processing…';

  var promise = selectedPayment === 'mpesa'
    ? initiateMpesaPayment(mpesaPhone, order.total, order.ref)
    : initiatePesapalPayment(order);

  promise.then(function(result) {
    if (result.success) {
      showPendingState(order);
    } else {
      btn.disabled = false;
      btn.textContent = 'Place Order';
      alert('Payment initiation failed. Please try again.');
    }
  });
}

function showPendingState(order) {
  var section = document.getElementById('checkout-section');
  if (order.method === 'mpesa') {
    section.innerHTML =
      '<div class="payment-status">' +
        '<div class="payment-status__icon mpesa-icon">' +
          '<ion-icon name="phone-portrait-outline"></ion-icon>' +
        '</div>' +
        '<h2>Check Your Phone</h2>' +
        '<p>An M-Pesa STK push has been sent to <strong>' + order.customer.phone + '</strong>.</p>' +
        '<p>Enter your M-Pesa PIN to complete payment of <strong>' + formatKES(order.total) + '</strong>.</p>' +
        '<p class="order-ref-label">Order ref: <strong>' + order.ref + '</strong></p>' +
        '<button class="btn-primary" onclick="showSuccessState(\'' + order.ref + '\')" style="margin-top:2rem">I\'ve Completed Payment</button>' +
        '<p class="help-text">Didn\'t get a prompt? <a href="https://wa.me/254726316981" target="_blank">Contact us on WhatsApp</a></p>' +
      '</div>';
  } else {
    section.innerHTML =
      '<div class="payment-status">' +
        '<div class="payment-status__icon card-icon">' +
          '<ion-icon name="card-outline"></ion-icon>' +
        '</div>' +
        '<h2>Redirecting to Pesapal…</h2>' +
        '<p>You\'ll be taken to our secure Pesapal payment page.</p>' +
        '<p class="order-ref-label">Order ref: <strong>' + order.ref + '</strong></p>' +
        '<p class="sandbox-note">⚠️ Sandbox mode — no real charge will occur.</p>' +
        '<button class="btn-primary" onclick="showSuccessState(\'' + order.ref + '\')" style="margin-top:2rem">Simulate Payment Success</button>' +
      '</div>';
  }
}

function showSuccessState(orderRef) {
  localStorage.removeItem(CART_KEY);
  updateAllCartBadges();
  document.getElementById('checkout-section').innerHTML =
    '<div class="payment-status success">' +
      '<div class="payment-status__icon success-icon">' +
        '<ion-icon name="checkmark-circle-outline"></ion-icon>' +
      '</div>' +
      '<h2>Order Confirmed!</h2>' +
      '<p>Thank you for shopping with <strong>Glam by Ivy</strong>.</p>' +
      '<p>Your order reference is <strong>' + orderRef + '</strong>.</p>' +
      '<p>We\'ll follow up via <strong>+254 726 316981</strong> or <strong>sales@glambyivy.com</strong> to arrange delivery.</p>' +
      '<a href="shop.html" class="btn-primary" style="margin-top:2rem">Continue Shopping</a>' +
    '</div>';
}

document.addEventListener('DOMContentLoaded', function() {
  renderOrderSummary();

  document.querySelectorAll('.payment-card').forEach(function(card) {
    card.addEventListener('click', function() { selectPayment(card.dataset.method); });
  });

  var form = document.getElementById('checkout-form');
  if (form) form.addEventListener('submit', handleCheckout);
});

// Cart position update with debounce
let debounceTimer;
let ticking = false;

function updateCartPosition() {
  const nav = document.querySelector('.w3-bar');
  const cart = document.getElementById('cart-container');
  if (!nav || !cart) return;

  const navHeight = nav.offsetHeight;
  const navRect = nav.getBoundingClientRect();
  const cartTop = navRect.top <= 0 ? navHeight : navRect.top + navHeight;

  if (!ticking) {
    window.requestAnimationFrame(() => {
      cart.style.setProperty('--cart-top', `${cartTop}px`);
      ticking = false;
    });
    ticking = true;
  }
}

function debounceUpdateCartPosition() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(updateCartPosition, 50);
}

window.addEventListener('load', () => {
  updateCartPosition();

  // Initialize cart data and total price
  const cartData = JSON.parse(document.getElementById('cart-data')?.textContent || '[]');
  updateTotalPrice(cartData);

  // Attach change listeners for quantity inputs
  document.querySelectorAll('.item-quantity').forEach(input => {
    input.addEventListener('change', () => updateItemTotal(input));
  });
});

window.addEventListener('scroll', debounceUpdateCartPosition);

// Add to cart buttons event listeners
document.querySelectorAll('.cart-add').forEach(button => {
  button.addEventListener('click', () => {
    addToCart(
      button.getAttribute('data-food_id'),
      button.getAttribute('data-food_name'),
      button.getAttribute('data-food_price')
    );
  });
});

function addToCart(foodId, foodName, foodPrice) {
  const formData = new FormData();
  formData.append('food_id', foodId);
  formData.append('food_name', foodName);
  formData.append('food_price', foodPrice);

  fetch('/add_to_cart', { method: 'POST', body: formData })
    .then(res => res.json())
    .then(data => updateCartDisplay(data.cart))
    .catch(err => console.error('Error adding to cart:', err));
}

function updateCartDisplay(cart) {
  const cartBody = document.querySelector('#cart-items tbody');
  cartBody.innerHTML = '';

  cart.forEach(item => {
    const row = document.createElement('tr');
    row.classList.add('cart-item');
    row.innerHTML = `
      <td><input type="number" class="item-quantity" value="${item.quantity}" min="1" data-food-id="${item.food_id}"></td>
      <td>${item.food_name}</td>
      <td>$${parseFloat(item.food_price).toFixed(2)}</td>
      <td class="item-total">$${parseFloat(item.total_price).toFixed(2)}</td>
      <td><button class="remove-item" data-food-id="${item.food_id}" title="Remove">×</button></td>
    `;
    cartBody.appendChild(row);
  });

  // Remove item buttons
  document.querySelectorAll('.remove-item').forEach(button => {
    button.addEventListener('click', () => {
      removeCartItem(button.getAttribute('data-food-id'));
    });
  });

  // Quantity input listeners
  document.querySelectorAll('.item-quantity').forEach(input => {
    input.addEventListener('change', () => updateItemTotal(input));
  });

  updateTotalPrice(cart);
}

function removeCartItem(foodId) {
  fetch('/remove_from_cart', {
    method: 'POST',
    body: new URLSearchParams({ food_id: foodId })
  })
    .then(res => res.json())
    .then(data => updateCartDisplay(data.cart))
    .catch(err => console.error('Error removing item:', err));
}

function updateTotalPrice(cart) {
  const total = cart.reduce((sum, item) => sum + item.total_price, 0);
  document.getElementById('total-price').textContent = `$${total.toFixed(2)}`;
}

function updateItemTotal(inputElement) {
  const quantity = inputElement.value;
  const row = inputElement.closest('tr');
  const price = parseFloat(row.cells[2].textContent.replace('$', ''));
  const totalCell = row.querySelector('.item-total');
  const totalPrice = quantity * price;

  totalCell.textContent = `$${totalPrice.toFixed(2)}`;

  updateCartOnServer(inputElement.getAttribute('data-food-id'), quantity);
}

function updateCartOnServer(foodId, quantity) {
  const formData = new FormData();
  formData.append('food_id', foodId);
  formData.append('quantity', quantity);

  fetch('/update_cart', { method: 'POST', body: formData })
    .then(res => res.json())
    .then(data => updateCartDisplay(data.cart))
    .catch(err => console.error('Error updating cart:', err));
}

// Pickup/delivery buttons and toggling
const pickupButton = document.getElementById('pickup-button');
const deliveryButton = document.getElementById('delivery-button');

function clearSelection() {
  pickupButton.classList.remove('selected');
  deliveryButton.classList.remove('selected');
  document.getElementById('pickup-location').style.display = 'none';
  document.getElementById('delivery-address').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  // Show dropdown buttons and w3-bar-item buttons
  document.querySelectorAll('.w3-dropdown-click > button').forEach(btn => btn.style.display = 'block');
  document.querySelectorAll('.w3-bar-item .w3-button').forEach(btn => btn.style.display = 'block');

  clearSelection();

  pickupButton.addEventListener('click', () => {
    if (pickupButton.classList.contains('selected')) {
      clearSelection();
    } else {
      pickupButton.classList.add('selected');
      deliveryButton.classList.remove('selected');
      document.getElementById('pickup-location').style.display = 'block';
      document.getElementById('delivery-address').style.display = 'none';
    }
  });

  deliveryButton.addEventListener('click', () => {
    if (deliveryButton.classList.contains('selected')) {
      clearSelection();
    } else {
      deliveryButton.classList.add('selected');
      pickupButton.classList.remove('selected');
      document.getElementById('delivery-address').style.display = 'block';
      document.getElementById('pickup-location').style.display = 'none';
    }
  });
});

document.getElementById('checkout-button').addEventListener('click', () => {
  const cartData = JSON.parse(document.getElementById('cart-data').textContent || '[]');

  const orderType = document.getElementById('pickup-button').classList.contains('selected') ? 'pickup' :
                    document.getElementById('delivery-button').classList.contains('selected') ? 'delivery' : null;

  const deliveryAddress = document.getElementById('address-input').value;
  const pickupLocation = document.getElementById('location-select').value;

  const cardNumber = document.getElementById('card-number').value;
  const expiry = document.getElementById('expiry').value;
  const cvv = document.getElementById('cvv').value;

  const orderData = {
    cart: cartData,
    order_type: orderType,
    address: deliveryAddress,
    pick_up: pickupLocation,
    card_number: cardNumber,
    expiry,
    cvv
  };

  fetch('/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  })
  .then(response => response.json())
  .then(data => {
    console.log('Server response:', data);
    if (data.success) {
      alert('Order placed successfully!');
      
    } else {
      alert('There was a problem placing your order.');
    }
  })
  .catch(error => {
    console.error('Checkout failed:', error);
    alert('Checkout failed. Please try again.');
  });
});



// Login modal functions
function openLoginModal() {
  console.log("Opening login modal");
  document.getElementById('login-modal').style.display = 'block';
}

function closeLoginModal() {
  document.getElementById('login-modal').style.display = 'none';
}

function toggleDropdown(button) {
  const dropdownContent = button.nextElementSibling;
  if (dropdownContent && dropdownContent.classList.contains('w3-dropdown-content')) {
    dropdownContent.classList.toggle('w3-show');
  }
}

function updateDropdownPosition() {
  const dropdownContent = document.getElementById('logoutDropdownContent');
  const trigger = document.getElementById('username');
  if (!dropdownContent || !trigger) return;

  if (!dropdownContent.classList.contains('show-dropdown')) return; // only update if visible

  const rect = trigger.getBoundingClientRect();

  dropdownContent.style.top = `${rect.bottom}px`;
  dropdownContent.style.left = `${rect.left}px`;
  dropdownContent.style.right = 'auto';
}

function toggleDropdown(dropdownId) {
  const dropdownContent = document.getElementById(dropdownId);
  const trigger = document.getElementById('username');
  if (!dropdownContent || !trigger) return;

  if (dropdownContent.classList.contains('show-dropdown')) {
    dropdownContent.classList.remove('show-dropdown');
  } else {
    dropdownContent.classList.add('show-dropdown');
    updateDropdownPosition();
  }
}

function toTitleCase(str) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function showNutritionModal(data) {
  const modal = document.getElementById('nutrition-modal');  // define modal properly
  const modalFoodName = document.getElementById('modal-food-name');
  const nutritionTable = document.getElementById('modal-nutrition-table');

  modalFoodName.textContent = data.food_name.toUpperCase();
  modalFoodName.style.textAlign = 'center';  // center food name
  nutritionTable.innerHTML = '';

  // Allergens list
  const allergens = ['milk', 'eggs', 'fish', 'crustacean shellfish', 'tree nuts', 'peanuts', 'wheat', 'soy'];

  // Separate allergens from nutrition data
  const nutritionData = { ...data };
  delete nutritionData.food_name;

  const allergenStatus = {};
  allergens.forEach(allergen => {
    for (const key of Object.keys(nutritionData)) {
      const normalizedKey = key.toLowerCase().replace(/_/g, ' ');
      const normalizedAllergen = allergen.toLowerCase().replace(/_/g, ' ');
      if (normalizedKey === normalizedAllergen) {
        allergenStatus[allergen] = nutritionData[key] == 1 ? `Contains ${capitalizeWords(allergen)}` : `No ${capitalizeWords(allergen)}`;
        delete nutritionData[key];
      }
    }
  });

  // Helper for capitalization
  function capitalizeWords(str) {
    return str.replace(/\b\w/g, c => c.toUpperCase());
  }

  // Create header row (centered)
  const headerRow = document.createElement('tr');
  const headerCell = document.createElement('th');
  headerCell.textContent = 'Nutrition / Allergen';
  headerCell.colSpan = 2;
  headerCell.style.textAlign = 'center';
  headerRow.appendChild(headerCell);
  nutritionTable.appendChild(headerRow);

  // Add calories row (bold)
  if ('energy (calories)' in nutritionData) {
    const row = document.createElement('tr');
    const keyCell = document.createElement('td');
    keyCell.textContent = 'Calories';
    keyCell.style.fontWeight = 'bold';
    const valueCell = document.createElement('td');
    valueCell.textContent = nutritionData['energy (calories)'];
    valueCell.style.fontWeight = 'bold';
    row.appendChild(keyCell);
    row.appendChild(valueCell);
    nutritionTable.appendChild(row);
    delete nutritionData['energy (calories)'];
  }

  // Ordered keys according to FDA style:
  const order = [
  'servings',
  'serving size',
  'energy (calories)',
  'energy (kilojoules)',
  'fat - total',  // 'fat - total' normalized to 'total fat'
  'fat - sat',
  'sodium',
  'protein',
  'carbohydrate'
  ];

  // Normalize keys helper:
  const normalize = (k) => k.toLowerCase().replace(/_/g, ' ');

  // Helper to find key in nutritionData by normalized key
  function findKey(normKey) {
    return Object.keys(nutritionData).find(k => normalize(k) === normKey);
  }

  order.forEach(item => {
    const key = findKey(item);
    if (key) {
      const row = document.createElement('tr');
      const keyCell = document.createElement('td');
      const valueCell = document.createElement('td');

      // REMOVE indentation for subcategories
      // (Do not indent any keys)

      // Capitalize keys nicely
      let displayKey = key.replace(/_/g, ' ');
      displayKey = displayKey.replace(/\b\w/g, c => c.toUpperCase());

      keyCell.textContent = displayKey;
      valueCell.textContent = nutritionData[key];
      row.appendChild(keyCell);
      row.appendChild(valueCell);
      nutritionTable.appendChild(row);

      delete nutritionData[key];
    }
  });

  // Add remaining nutrition keys not in order
  Object.entries(nutritionData).forEach(([key, value]) => {
    const row = document.createElement('tr');
    const keyCell = document.createElement('td');
    keyCell.textContent = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const valueCell = document.createElement('td');
    valueCell.textContent = value;
    row.appendChild(keyCell);
    row.appendChild(valueCell);
    nutritionTable.appendChild(row);
  });

  // Split allergenStatus into Contains and Free From lists
const containsList = [];
const freeFromList = [];

Object.values(allergenStatus).forEach(status => {
  if (status.startsWith('Contains')) {
    containsList.push(status.replace('Contains ', ''));
  } else if (status.startsWith('No')) {
    freeFromList.push(status.replace('No ', ''));
  }
});

// Add Contains list row if any
if (containsList.length) {
  const row = document.createElement('tr');
  const cell = document.createElement('td');
  cell.colSpan = 2;
  cell.style.fontWeight = 'bold';
  cell.style.marginTop = '10px';
  cell.style.paddingTop = '10px';
  cell.textContent = 'Contains: ' + containsList.join(', ');
  row.appendChild(cell);
  nutritionTable.appendChild(row);
}

// Add Free From list row if any
if (freeFromList.length) {
  const row = document.createElement('tr');
  const cell = document.createElement('td');
  cell.colSpan = 2;
  cell.style.fontWeight = 'bold';
  cell.style.marginTop = '5px';
  cell.style.paddingTop = '5px';
  cell.textContent = 'Free From: ' + freeFromList.join(', ');
  row.appendChild(cell);
  nutritionTable.appendChild(row);
}

  // Show the modal
  modal.style.display = 'block';
}

function checkout() {
  const cartDataElement = document.getElementById('cart-data');
  if (!cartDataElement) return;

  const cart = JSON.parse(cartDataElement.textContent);
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }

  const orderType = document.getElementById('pickup-button').classList.contains('selected') ? 'pickup' :
      document.getElementById('delivery-button').classList.contains('selected') ? 'delivery' : null;

  const deliveryAddress = document.getElementById('address-input').value;
  const pickupLocation = document.getElementById('location-select').value;
  const cardNumber = document.getElementById('card-number').value;
  const expiry = document.getElementById('expiry').value;
  const cvv = document.getElementById('cvv').value;

  const orderData = {
      cart: cart,
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
    body: JSON.stringify(orderData),
  })
  .then(res => {
    if (!res.ok) throw new Error('Checkout failed');
    return res.json();
  })
  .then(data => {
    if (data.success) {
      alert('Checkout successful! Order ID: ' + data.orderId);
      // clear cart after checkout if needed:
      updateCartDisplay([]);
      updateTotalPrice([]);
      updateCartDataElement([]);
    } else {
      alert('There was a problem placing your order: ' + (data.message || 'Unknown error.'));
    }
  })
  .catch(err => alert('Error during checkout: ' + err.message));


}



function updateCartPosition() {
  const nav = document.querySelector('.w3-bar');
  const cart = document.getElementById('cart-container');
  if (!nav || !cart) return;

  const navHeight = nav.offsetHeight;
  const navRect = nav.getBoundingClientRect();
  const cartTop = navRect.top <= 0 ? navHeight : navRect.top + navHeight;

  cart.style.setProperty('--cart-top', `${cartTop}px`);
}

let debounceTimer;
let ticking = false;

function debounceUpdateCartPosition() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(updateCartPosition, 50);
}

function addToCart(foodId, foodName, foodPrice) {
  if (!foodId || !foodName || foodPrice === null || foodPrice === undefined) {
    console.error('Error: Missing data for food item.');
    return;
  }

  const cartItem = {
    food_id: foodId,
    food_name: foodName,
    food_price: foodPrice
  };

  fetch('/add_to_cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cartItem)
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      updateCartDisplay(data.cart);
      updateTotalPrice(data.cart);
      updateCartDataElement(data.cart);
    })
    .catch(err => console.error('Error adding to cart:', err));
}

function updateCartDisplay(cart) {
  const cartTableBody = document.querySelector('#cart-items tbody');
  if (!cartTableBody) return;

  cartTableBody.innerHTML = ''; // Clear existing items

  if (cart.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="5">No items in cart.</td>';
    cartTableBody.appendChild(emptyRow);
  } else {
    cart.forEach(item => {
      const itemRow = document.createElement('tr');
      itemRow.innerHTML = `
        <td>
          <input type="number" class="item-quantity" value="${item.quantity}" min="1" data-food-id="${item.food_id}">
        </td>
        <td>${item.food_name}</td>
        <td>$${parseFloat(item.food_price).toFixed(2)}</td>
        <td class="item-total">$${parseFloat(item.total_price).toFixed(2)}</td>
        <td><button class="remove-item-btn" data-food_id="${item.food_id}">&#10005;</button></td>
      `;
      cartTableBody.appendChild(itemRow);
    });
  }
}

function removeCartItem(foodId) {
  fetch('/remove_from_cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ food_id: foodId })
  })
    .then(res => res.json())
    .then(data => {
      updateCartDisplay(data.cart);
      updateTotalPrice(data.cart);
      updateCartDataElement(data.cart);
    })
    .catch(err => console.error('Error removing item:', err));
}

function updateTotalPrice(cart) {
  const total = cart.reduce((sum, item) => sum + item.total_price, 0);
  const totalPriceElement = document.getElementById('total-price');
  if (totalPriceElement) {
    totalPriceElement.textContent = `$${total.toFixed(2)}`;
  }
}

function updateItemTotal(inputElement) {
  const foodId = inputElement.getAttribute('data-food-id');
  let newQuantity = parseInt(inputElement.value, 10);
  if (isNaN(newQuantity) || newQuantity < 1) {
    newQuantity = 1;
    inputElement.value = newQuantity;
  }

  const cartDataElement = document.getElementById('cart-data');
  if (!cartDataElement) return;
  const cartData = JSON.parse(cartDataElement.textContent);

  const itemToUpdate = cartData.find(item => item.food_id == foodId);

  if (itemToUpdate) {
    const newTotalPrice = newQuantity * parseFloat(itemToUpdate.food_price);
    itemToUpdate.quantity = newQuantity;
    itemToUpdate.total_price = newTotalPrice;

    // Update the cart session and display
    updateCartSession(cartData);
    updateCartDisplay(cartData);
    updateTotalPrice(cartData);
  }
}

function updateCartSession(cartData) {
  fetch('/update_cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cart: cartData }),
  })
    .then(response => response.json())
    .then(updatedCart => {
      updateCartDataElement(updatedCart.cart);
    })
    .catch(error => console.error('Error updating cart:', error));
}

function updateCartDataElement(cart) {
  const cartDataElement = document.getElementById('cart-data');
  if (cartDataElement) {
    cartDataElement.textContent = JSON.stringify(cart);
  }
}

function clearSelection() {
  const pickupButton = document.getElementById('pickup-button');
  const deliveryButton = document.getElementById('delivery-button');
  if (pickupButton) pickupButton.classList.remove('selected');
  if (deliveryButton) deliveryButton.classList.remove('selected');
  const pickupLocation = document.getElementById('pickup-location');
  if (pickupLocation) pickupLocation.style.display = 'none';
  const deliveryAddress = document.getElementById('delivery-address');
  if (deliveryAddress) deliveryAddress.style.display = 'none';
}

function openLoginModal() {
  console.log("Opening login modal");
  const loginModal = document.getElementById('login-modal');
  if (loginModal) {
    loginModal.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Show food nutrition modal on food grid click
  const foodGrid = document.querySelector('.food-grid');
  if (foodGrid) {
    foodGrid.addEventListener('click', async (event) => {
      const foodItem = event.target.closest('.food-item');
      if (!foodItem) return;
      const foodId = foodItem.querySelector('.cart-add')?.dataset.food_id;
      if (!foodId) return;

      try {
        const response = await fetch(`/food/${foodId}`);
        if (!response.ok) throw new Error('Food data not found');
        const data = await response.json();
        showNutritionModal(data);
      } catch (error) {
        alert('Could not load nutrition info: ' + error.message);
      }
    });
  }

  // Modal close and outside click
  const modal = document.getElementById('nutrition-modal');
  const modalClose = document.getElementById('modal-close');
  if (modalClose) {
    modalClose.addEventListener('click', () => {
      if (modal) modal.style.display = 'none';
    });
  }
  window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // Dropdown toggle buttons display fix
  document.querySelectorAll('.w3-dropdown-click > button').forEach(btn => btn.style.display = 'block');
  document.querySelectorAll('.w3-bar-item .w3-button').forEach(btn => btn.style.display = 'block');

  // Clear pickup/delivery selection on load
  clearSelection();

  // Update cart position on load
  updateCartPosition();

  // Load cart data from hidden element
  const cartDataElement = document.getElementById('cart-data');
  const cartData = cartDataElement ? JSON.parse(cartDataElement.textContent || '[]') : [];
  updateTotalPrice(cartData);
  updateCartDisplay(cartData);

  // Event listeners for quantity changes and remove buttons
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('item-quantity')) updateItemTotal(e.target);
  });

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-item-btn')) {
      removeCartItem(e.target.dataset.food_id);
    }
  });

  // DOM Listener for checkout
  const checkoutButton = document.getElementById('checkout-button');
  if (checkoutButton) {
    checkoutButton.addEventListener('click', checkout);
  }


  // Scroll and resize update dropdown and cart positions
  window.addEventListener('scroll', () => {
    updateDropdownPosition();
    debounceUpdateCartPosition();
  });
  window.addEventListener('resize', () => {
    updateDropdownPosition();
    debounceUpdateCartPosition();
  });

  // Add to cart buttons click handler
  document.addEventListener('click', (event) => {
    const button = event.target.closest('.cart-add');
    if (button) {
      const foodId = button.getAttribute('data-food_id');
      const foodName = button.getAttribute('data-food_name');
      const foodPrice = button.getAttribute('data-food_price');
      addToCart(foodId, foodName, foodPrice);
    }
  });

  // Pickup and delivery button toggle handlers
  const pickupButton = document.getElementById('pickup-button');
  const deliveryButton = document.getElementById('delivery-button');
  if (pickupButton && deliveryButton) {
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
  }
});
// Toggle the username dropdown menu
function toggleDropdown(button) {
    const dropdownContent = button.nextElementSibling;
    if (dropdownContent && dropdownContent.classList.contains('w3-dropdown-content')) {
        if (dropdownContent.style.display === 'block') {
            dropdownContent.style.display = 'none';
        } else {
            dropdownContent.style.display = 'block';
        }
    }
}

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

    const cartData = JSON.parse(document.getElementById('cart-data')?.textContent || '[]');
    updateTotalPrice(cartData);

    // Event listener for quantity input changes
    document.addEventListener('change', (event) => {
        if (event.target.classList.contains('item-quantity')) {
            updateItemTotal(event.target);
        }
    });

    // Event listener for remove buttons
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-item-btn')) {
            const foodId = event.target.getAttribute('data-food_id');
            removeCartItem(foodId);
        }
    });
});

window.addEventListener('scroll', debounceUpdateCartPosition);

// Event listener for add to cart buttons
document.addEventListener('click', (event) => {
    const button = event.target.closest('.cart-add');
    if (button) {
        const foodId = button.getAttribute('data-food_id');
        const foodName = button.getAttribute('data-food_name');
        const foodPrice = button.getAttribute('data-food_price');
        addToCart(foodId, foodName, foodPrice);
    }
});


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
    const newQuantity = parseInt(inputElement.value, 10);

    const cartData = JSON.parse(document.getElementById('cart-data').textContent);
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
        document.getElementById('cart-data').textContent = JSON.stringify(updatedCart.cart);
    })
    .catch(error => console.error('Error updating cart:', error));
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

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.w3-dropdown-click > button').forEach(btn => btn.style.display = 'block');
    document.querySelectorAll('.w3-bar-item .w3-button').forEach(btn => btn.style.display = 'block');

    clearSelection();

    const pickupButton = document.getElementById('pickup-button');
    const deliveryButton = document.getElementById('delivery-button');
    const checkoutButton = document.getElementById('checkout-button');
    const loginForm = document.getElementById('login-form');

    function openLoginModal() {
        console.log("Opening login modal");
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.style.display = 'block';
        }
    }

    const openLoginBtn = document.getElementById('open-login-btn');
    if (openLoginBtn) {
        openLoginBtn.addEventListener('click', openLoginModal);
    }
    
    const closeLoginBtn = document.getElementById('close-login-modal-btn');
    if (closeLoginBtn) {
        closeLoginBtn.addEventListener('click', () => {
            const loginModal = document.getElementById('login-modal');
            if (loginModal) {
                loginModal.style.display = 'none';
            }
        });
    }

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

    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
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
                        console.log('Order placed successfully!');
                    } else {
                        console.error('There was a problem placing your order.');
                    }
                })
                .catch(error => {
                    console.error('Checkout failed:', error);
                    console.error('Checkout failed. Please try again.');
                });
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Server responded with an error:', errorText);
                    return;
                }

                const result = await response.json();

                if (result.success) {
                    console.log(result.message);
                    window.location.reload();
                } else {
                    console.error(result.message);
                }
            } catch (error) {
                console.error('Fetch error:', error);
                console.error("An error occurred. Please try again later.");
            }
        });
    }
});


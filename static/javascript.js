window.addEventListener('load', updateCartPosition);
window.addEventListener('scroll', updateCartPosition);

window.addEventListener('load', function () {
    updateTotalPrice();
    document.querySelectorAll('.item-quantity').forEach(input => {
        input.addEventListener('change', function () {
            updateItemTotal(this);
        });
    });
});

let debounceTimer;

function debounceUpdateCartPosition() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateCartPosition, 50);
}

document.querySelectorAll('.cart-add').forEach(button => {
    button.addEventListener('click', function () {
        const foodId = this.getAttribute('data-food_id');
        const foodName = this.getAttribute('data-food_name');
        const foodPrice = this.getAttribute('data-food_price');
        addToCart(foodId, foodName, foodPrice);
    });
});

function addToCart(foodId, foodName, foodPrice) {
    const formData = new FormData();
    formData.append('food_id', foodId);
    formData.append('food_name', foodName);
    formData.append('food_price', foodPrice);

    fetch('/add_to_cart', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        updateCartDisplay(data.cart);
    })
    .catch(error => console.error('Error adding to cart:', error));
}

function updateCartDisplay(cart) {
    const cartContainer = document.getElementById('cart-items');
    cartContainer.innerHTML = ''; // Clear current cart display

    cart.forEach(item => {
        const itemDiv = document.createElement('tr');
        itemDiv.classList.add('cart-item');
        itemDiv.innerHTML = `
            <td><input type="number" class="item-quantity" value="${item.quantity}" min="1" data-food-id="${item.food_id}"></td>
            <td>${item.food_name}</td>
            <td>$${item.food_price}</td>
            <td class="item-total">$${item.total_price}</td>
        `;
        cartContainer.appendChild(itemDiv);
    });

    updateTotalPrice(cart);
}

function updateTotalPrice(cart) {
    let total = 0;
    cart.forEach(item => {
        total += item.total_price;
    });
    document.getElementById('total-price').textContent = `$${total.toFixed(2)}`;
}

function updateItemTotal(inputElement) {
    const quantity = inputElement.value;
    const row = inputElement.closest('tr');
    const price = parseFloat(row.cells[2].textContent.replace('$', ''));
    const totalCell = row.querySelector('.item-total');

    const totalPrice = quantity * price;
    totalCell.textContent = `$${totalPrice.toFixed(2)}`;

    updateTotalPrice();

    const foodId = inputElement.getAttribute('data-food-id');

    // Send the updated quantity to the server
    updateCartOnServer(foodId, quantity);
}

function updateCartOnServer(foodId, quantity) {
    const formData = new FormData();
    formData.append('food_id', foodId);
    formData.append('quantity', quantity);

    fetch('/update_cart', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        updateCartDisplay(data.cart);
    })
    .catch(error => console.error('Error updating cart:', error));
}

let ticking = false;
function updateCartPosition() {
    const nav = document.querySelector('.w3-bar');
    const cart = document.getElementById('cart-container');
    
    if (nav && cart) {
        const navHeight = nav.offsetHeight;
        const navRect = nav.getBoundingClientRect();
        const cartTop = navRect.top <= 0 ? navHeight : navRect.top + navHeight;

        if (!ticking) {
            window.requestAnimationFrame(function() {
                cart.style.setProperty('--cart-top', `${cartTop}px`);
                ticking = false;
            });

            ticking = true;
        }
    }
}

const pickupButton = document.getElementById('pickup-button');
const deliveryButton = document.getElementById('delivery-button');

pickupButton.addEventListener('click', function() {
    pickupButton.classList.add('selected');
    deliveryButton.classList.remove('selected');
});

deliveryButton.addEventListener('click', function() {
    deliveryButton.classList.add('selected');
    pickupButton.classList.remove('selected');
});

document.addEventListener('DOMContentLoaded', function() {
    const dropdownButtons = document.querySelectorAll('.w3-dropdown-click > button');
    dropdownButtons.forEach(button => {
        button.style.display = 'block';
    });

    document.querySelectorAll('.w3-bar-item .w3-button').forEach(button => {
        button.style.display = 'block';
    });
});

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
        console.log("Dropdown content found");
        dropdownContent.classList.toggle('w3-show');
    }
    else {
        console.log("No dropdown content found");
    }
    console.log("Dropdown toggled");
}

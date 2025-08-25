window.addEventListener('load', updateCartPosition);
window.addEventListener('scroll', updateCartPosition)

let debounceTimer;

function debounceUpdateCartPosition() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateCartPosition, 50);
}


document.querySelectorAll('.cart-add').forEach(button => {
    button.addEventListener('click', function() {
        const foodId = this.getAttribute('data-food_id');
        const foodName = this.getAttribute('data-food_name');
        const foodPrice = this.getAttribute('data-food_price');
        addToCart(foodId, foodName, foodPrice);
    });
});

function addToCart(foodId, foodName, foodPrice) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const container = document.getElementById('cart-items');
        const fragment = document.createDocumentFragment();
    
        const itemDiv = document.createElement('div');
    itemDiv.classList.add('cart-item');
    itemDiv.setAttribute('data-food_id', foodId);
    itemDiv.innerHTML = `
        <span class="cart-item-name">${foodName}</span>
        <span class="cart-item-price">$${foodPrice}</span>
    `;
    container.appendChild(itemDiv);

    fragment.appendChild(itemDiv);
    container.appendChild(fragment);
    }, 200);
}

let ticking = false;
function updateCartPosition() {
    const nav = document.querySelector('.w3-bar');
    const cart = document.getElementById('cart-container');
    
    if (nav && cart) {
        const navHeight = nav.offsetHeight;
        const navRect = nav.getBoundingClientRect();
        const cartTop = navRect.top <= 0 ? navHeight : navRect.top + navHeight;

        console.log("navHeight:", navHeight); // Debugging
        console.log("navRect.top:", navRect.top); // Debugging
        console.log("cartTop:", cartTop); // Debugging

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
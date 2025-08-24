document.querySelectorAll('.cart-add')  .forEach(button => {
    button.addEventListener('click', function() {
        const foodId = this.getAttribute('data-food_id');
        const foodName = this.getAttribute('data-food_name');
        const foodPrice = this.getAttribute('data-food_price');

        addToCart(foodId, foodName, foodPrice);
    });
})

function addToCart(foodId, foodName, foodPrice) {
    const container = document.getElementById('cart-items');
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('cart-item');
    itemDiv.innerHTML = `
        <span class="cart-item-name">${foodName}</span>
        <span class="cart-item-price">$${foodPrice}</span>
    `;
    container.appendChild(itemDiv);
}



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
    if (dropdownContent) {
        console.log("Dropdown content found");
        dropdownContent.classList.toggle('w3-show');
    }
    else {
        console.log("No dropdown content found");
        return;
    }
        console.log("Dropdown toggled");
    }
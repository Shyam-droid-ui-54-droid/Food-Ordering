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
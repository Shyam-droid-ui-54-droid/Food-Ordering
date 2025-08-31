from flask import Flask, g, request, redirect, render_template, session, url_for, flash, abort, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import re
import json
import uuid

DATABASE = 'database.db'

# Initialize the Flask application
app = Flask(__name__)

app.secret_key = '6EC9568939D467FC35FE9C7A3E76F'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row  # In order to access columns by name
    return db

@app.teardown_appcontext
def close_connection(_):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv

# Route for the home page, which is the menu
@app.route('/')
def menu():
    # Home page - menu to display food items
    cart = session.get('cart', [])

    # Calculate total price for each item in the cart
    for item in cart:
        # Ensure total_price is a number (float)
        item['total_price'] = float(item['food_price']) * int(item['quantity'])

    # Calculate the overall total price of the cart
    total_price = sum(float(item['total_price']) for item in cart)  # Ensure total_price is treated as float

    # Fetch food items from the database
    sql = """
        SELECT * FROM Food
    """
    results = query_db(sql)
    return render_template("menu.html", foods=results, cart=cart, total_price=total_price)

from flask import jsonify

@app.route("/food/<int:food_id>")
def food(food_id):
    sql = """
        SELECT f.food_name, n.* FROM food_nutrition n
        JOIN Food f ON f.food_id = n.food_id
        WHERE f.food_id = ?
    """
    result = query_db(sql, (food_id,), one=True)  # one=True since only one food item

    if not result:
        return jsonify({"error": "Food nutrition not found"}), 404
    
    def convert_allergens(nutrition_dict):
        allergens = ['milk', 'eggs', 'fish', 'crustacean_shellfish', 'tree_nuts', 'peanuts', 'wheat', 'soy']
        for allergen in allergens:
            if allergen in nutrition_dict:
                nutrition_dict[allergen] = ("Contains " + allergen.replace('_', ' ') 
                                           if nutrition_dict[allergen] == 1 else 
                                           "No " + allergen.replace('_', ' '))
        return nutrition_dict

    result_dict = dict(result)
    result_dict = convert_allergens(result_dict)

    # Optionally remove food_id before returning
    result_dict.pop('food_id', None)

    return jsonify(result_dict)


# Route to add an item to the cart
@app.route('/add_to_cart', methods=['POST'])
def add_to_cart():
    # The JavaScript is now sending JSON data, so we must use request.get_json()
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON data'}), 400
    
    # Extract data directly from the JSON payload
    food_id = str(data.get('food_id'))
    food_name = data.get('food_name')
    
    try:
        food_price = float(data.get('food_price'))
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid food price'}), 400

    cart = session.get('cart', [])

    item_found = False
    for item in cart:
        # Ensure quantity is an integer
        if str(item.get('food_id')) == food_id:
            item['quantity'] = int(item['quantity'])
            item['quantity'] += 1
            item['total_price'] = float(item['quantity']) * float(item['food_price'])
            item_found = True
            break

    if not item_found:
        # Add the item with proper type conversions
        cart.append({
            'food_id': food_id,
            'food_name': food_name,
            'food_price': food_price,
            'quantity': 1,
            'total_price': float(food_price)
        })

    

    # Save updated cart to session
    session['cart'] = cart
    print(f"Cart after adding item: {session['cart']}")
    return jsonify({'cart': cart})

# New route to update the entire cart from a JSON payload
@app.route('/update_cart', methods=['POST'])
def update_cart():
    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 400
    
    data = request.get_json()
    if not data or 'cart' not in data:
        return jsonify({'error': 'Invalid JSON data'}), 400
    
    session['cart'] = data['cart']
    return jsonify({'cart': session['cart']})


@app.route('/remove_from_cart', methods=['POST'])
def remove_from_cart():
    # The JavaScript is now sending JSON data, so we must use request.get_json()
    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 400

    data = request.get_json()
    if not data or 'food_id' not in data:
        return jsonify({'error': 'Missing food_id'}), 400

    food_id = str(data.get('food_id'))
    cart = session.get('cart', [])

    # Remove the item with matching food_id
    cart = [item for item in cart if str(item['food_id']) != food_id]

    session['cart'] = cart
    return jsonify({'cart': cart})

@app.route('/checkout', methods=['POST'])
def checkout():
    # Log the incoming JSON data for debugging
    print("--- New Checkout Request Received ---")
    
    if not request.is_json:
        print("Error: Request is not JSON. Aborting.")
        return jsonify({'success': False, 'message': 'Request must be JSON'}), 400
        
    data = request.get_json()
    if not data:
        print("Error: Invalid JSON payload. Aborting.")
        return jsonify({'success': False, 'message': 'Invalid JSON payload. Please try again.'}), 400
    
    print(f"Received JSON data: {json.dumps(data, indent=2)}")

    cart = session.get('cart', [])
    print(f"Session cart: {cart}")
    
    if not cart:
        print("Error: Cart is empty. Aborting.")
        return jsonify({'success': False, 'message': 'Please add items to your order'})

    total_price = sum(item['total_price'] for item in cart)
    
    address = data.get('address')
    pick_up = data.get('pick_up')
    card_number = data.get('card_number')
    expiry = data.get('expiry')
    cvv = data.get('cvv')
    
    print(f"Address: {address}, Pick-up: {pick_up}")
    print(f"Card details received: Card: {card_number}, Expiry: {expiry}, CVV: {cvv}")

    customer_id = session.get('customer_id')
    email = session.get('email')
    name = session.get('name')

    # Ensure a customer_id is always present for the database
    if not customer_id:
        # Use a temporary ID for guest users and store it in the session
        temp_id = session.get('temp_id')
        if not temp_id:
            temp_id = str(uuid.uuid4())
            session['temp_id'] = temp_id
        customer_id = temp_id
        
    if not (card_number and expiry and cvv):
        print("Validation Error: Missing card details. Aborting.")
        return jsonify({'success': False, 'message': 'Please fill in all card details'})
    
    if not (address or pick_up):
        print("Validation Error: Missing address or pick-up. Aborting.")
        return jsonify ({'success': False, 'message': 'Please fill in pick-up or delivery'})

    if address == '':
        address = None

    if pick_up == '':
        pick_up = None

    try:
        conn = get_db()
        c = conn.cursor()

        cart_json = json.dumps(cart)
        
        # Log the data about to be inserted
        print("Attempting to insert into 'Order' table...")
        insert_data = (customer_id, cart_json, address, pick_up, card_number, expiry, cvv, email, name, total_price)
        print(f"Data to be inserted: {insert_data}")

        c.execute('''
            INSERT INTO "Order" (customer_id, cart, address, pick_up, card_number, expiry, cvv, email, name, total_price)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', insert_data)
        
        order_id = c.lastrowid

        for item in cart:
            c.execute('''
                INSERT INTO Order_items (order_id, food_id, quantity, price)
                VALUES (?, ?, ?, ?)
                ''', (order_id, item['food_id'], item['quantity'], item['total_price']))
            
        if session.get('customer_id'):
         points_add = total_price * 0.10
         c.execute('''
             UPDATE Customer
             SET points = points + ?
                WHERE customer_id = ?
         ''', (points_add, customer_id))

        conn.commit()
        
        print("Order placed successfully. Committing transaction.")
        
        session.pop('cart', None)
        return jsonify ({'success': True, 'message': 'Order Successful'})

    except Exception as e:
        print(f"Server error during checkout: {e}")
        # Return a specific message that you can catch on the client
        return jsonify ({'success': False, 'message': 'Server error: A database problem occurred.'})

# Route to add a new customer (for login, registration)
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        if request.is_json:
            data = request.get_json()
            print("Received JSON data.")
        else:
            data = request.form
            print("Received form data instead of JSON.")

        # Move all the validation and login logic here, outside the if/else block
        email = data.get("email")
        password = data.get("password")
        name = data.get("name")
        
        if not re.match(r"^[a-zA-Z0-9_]{1,10}$", name):
            return jsonify({"success": False, "message": "Name must be between 1 and 10 characters"})
        
        if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", email):
            return jsonify({"success": False, "message": "Invalid email"})
        
        if len(password) < 8 or not re.match(r"^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$", password):
            return jsonify({"success": False, "message": "Password must have: 8 characters, with at least one number and at least one letter"})

        if not email or not password:
            return jsonify({"success": False, "message": "Email and password are required"})
        
        customer = query_db("SELECT * FROM Customer WHERE email = ?", [email], one=True)

        if not customer:
            # User doesn't exist, create a new account
            hashed_password = generate_password_hash(password)
            conn = get_db()
            conn.execute("INSERT INTO Customer (email, password, name) VALUES (?, ?, ?)", [email, hashed_password, name])
            conn.commit()
            
            new_customer = query_db("SELECT * FROM Customer WHERE email = ?", [email], one=True)
            if new_customer:
                session["customer_id"] = new_customer["customer_id"]
                session["email"] = new_customer["email"]
                session["name"] = new_customer["name"]
                return jsonify({"success": True, "message": "Account created successfully!"})
            else:
                return jsonify({"success": False, "message": "Failed to create account. Please try again."})
        
        else:
            # User exists, check the password
            if check_password_hash(customer["password"], password):
                session["customer_id"] = customer["customer_id"]
                session["email"] = customer["email"]
                session["name"] = customer["name"]
                return jsonify({"success": True, "message": "Login successful!"})
            else:
                return jsonify({"success": False, "message": "Invalid email or password"})

    return redirect(url_for("menu"))

# Route for logout
@app.route("/logout")
def logout():
    session.clear()
    flash("You have been logged out")
    return redirect(url_for("menu"))

@app.route("/rewards")
def rewards():
    customer_id = session.get("customer_id")
    customer_name = session.get("name")
    is_logged_in = True
    
    # Initialize points to 0
    points = 0

    if not customer_id:
        is_logged_in = False
    else:
        # Retrieve the customer's total points from the database
        customer = query_db("SELECT points FROM Customer WHERE customer_id = ?", [customer_id], one=True)
        if customer:
            points = customer["points"]

    return render_template("rewards.html", points=points, is_logged_in=is_logged_in, customer_name=customer_name)

@app.route("/locations")
def locations():
    # Locations page - displays location information of restaurants
    return render_template("locations.html")

@app.errorhandler(404)
def page_not_found(_error):
    return render_template('404.html'), 404

@app.route('/example404')
def example404():
    abort(404)

@app.errorhandler(505)
def server_error(_error):
    return render_template('505.html'), 505

@app.route('/cause505')
def cause_505():
    abort(505)

if __name__ == "__main__":
    app.run(debug=True)


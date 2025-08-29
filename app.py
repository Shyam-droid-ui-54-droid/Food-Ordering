from flask import Flask, g, request, redirect, render_template, session, url_for, flash, make_response, abort, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import re

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
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv

# Route for the home page, which is the menu
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



# Route to add an item to the cart
@app.route('/add_to_cart', methods=['POST'])
def add_to_cart():
    food_id = str(request.form.get('food_id'))
    food_name = request.form.get('food_name')
    
    # Ensure that food_price is a float
    try:
        food_price = float(request.form.get('food_price'))
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid food price'}), 400

    cart = session.get('cart', [])

    print(f"Current cart before adding: {cart}")

    item_found = False
    for item in cart:
        # Ensure quantity is an integer
        if str(item.get('food_id')) == food_id:
            item['quantity'] = int(item['quantity'])  # Convert quantity to integer
            item['quantity'] += 1
            item['total_price'] = float(item['quantity']) * float(item['food_price'])  # Convert food_price to float
            item_found = True
            break

    if not item_found:
        # Add the item with proper type conversions
        cart.append({
            'food_id': food_id,
            'food_name': food_name,
            'food_price': food_price,
            'quantity': 1,  # Set quantity to 1
            'total_price': float(food_price)  # Convert total_price to float
        })

    # Save updated cart to session
    session['cart'] = cart
    return jsonify({'cart': cart})

@app.route('/remove_from_cart', methods=['POST'])
def remove_from_cart():
    food_id = request.form.get('food_id')
    if not food_id:
        return jsonify({'error': 'Missing food_id'}), 400

    cart = session.get('cart', [])

    # Remove the item with matching food_id
    cart = [item for item in cart if str(item['food_id']) != str(food_id)]

    session['cart'] = cart
    return jsonify({'cart': cart})

@app.route('/checkout', methods=['POST'])
def checkout():
    data = request.get_json()
    
    cart = data.get('cart', [])
    address = data.get('address')
    pick_up = data.get('pick_up')
    card_number = request.form.get('card_number')
    expiry = request.form.get('expiry')
    cvv = request.form.get('cvv')
    

    #pick-up / delivery here later
    #cart data from session?

    conn = sqlite3.connect('order')
    c = conn.cursor()

    c.execute('''
              INSET INTO order (card_number, expiry, cvv)
              VALUES (?, ?, ?)
        ''',(card_number, expiry, cvv))

    conn.commit()
    conn.close

    return redirect('/menu')

# Route to add a new customer (for login, registration)
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]
        name = request.form.get("name")
        
        if not re.match(r"^[a-zA-Z0-9_]{1,10}$", name):
            flash("Name must be between 1 and 10 characters")
            return redirect(request.referrer or url_for("menu"))
        
        if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", email):
            flash("Invalid email")
            return redirect(url_for("menu"))
        
        if len(password) < 8 or not re.match(r"^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$", password):
            flash("Password must have: 8 characters, with at least one number and at least one letter")
            return redirect(request.referrer or url_for("menu"))

        if not email or not password:
            flash("Email and password are required")
            return redirect(request.referrer or url_for("menu"))
        
        customer = query_db("SELECT * FROM Customer WHERE email = ?", [email], one=True)
        
        if not customer:
            hashed_password = generate_password_hash(password)
            conn = get_db()
            conn.execute("INSERT INTO Customer (email, password, name) VALUES (?, ?, ?)", [email , hashed_password, request.form["name"]])
            conn.commit()
            flash("Account created successfully") 
            customer = query_db("SELECT * FROM Customer WHERE email = ?", [email], one=True)
        
        if customer and check_password_hash(customer["password"], password):
            session["customer_id"] = customer["customer_id"]
            session["email"] = customer["email"]
            session["name"] = customer["name"]
            return redirect(request.referrer or url_for("menu"))
        else: 
            flash("Invalid email or password")

# Route for logout
@app.route("/logout")
def logout():
    session.clear()
    flash("You have been logged out")
    return redirect(url_for("menu"))

@app.route("/rewards")
def rewards():
    # Rewards page - displays customer loyalty rewards
    return render_template("rewards.html")

@app.route("/locations")
def locations():
    # Locations page - displays location information of restaurants
    return render_template("locations.html")

@app.errorhandler(404)
def page_not_found(error):
    return render_template('404.html'), 404

@app.route('/example404')
def example404():
    abort(404)

@app.errorhandler(505)
def server_error(error):
    return render_template('505.html'), 505

@app.route('/cause505')
def cause_505():
    abort(505)

if __name__ == "__main__":
    app.run(debug=True)

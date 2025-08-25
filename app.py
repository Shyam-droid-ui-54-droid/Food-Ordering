from flask import Flask, g, request, redirect, render_template, session, url_for, flash, make_response
from werkzeug.security import generate_password_hash, check_password_hash

import sqlite3
import json
DATABASE = 'database.db'

#initialize the Flask application
app = Flask(__name__)

app.secret_key ='222' # Replace with a secure key for better management of sessions

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row # In order to access columns by name
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

#Route for the home page which is the menu
@app.route('/')
def menu():
    #home page- menu so name, price, food type
    cart = session.get('cart', [])

    sql = """
                SELECT * FROM Food
                """ 
    results = query_db(sql)
    return render_template("menu.html", foods=results, cart=cart)

@app.route('/add_to_cart', methods=['POST'])
def add_to_cart():
    food_id = request.form.get('food_id')
    food_name = request.form.get ('food_name')
    food_price = request.form.get ('food_price')

    cart = session.get('cart', [])

    print(f"Current cart before adding: {cart}")

    cart.append({
        'food_id': food_id,
        'food_name': food_name,
        'food_price': food_price
    })

    session['cart'] = cart

    print(f"Updated cart after adding: {cart}")

    return redirect(url_for('menu'))

#Route for the food information page / to be made into modal
@app.route("/food/<int:food_id>")
def food(food_id):
    food_id = int(food_id)
    #gives further information about a specific food item
    sql = """
                SELECT f.food_name, n.* FROM Food_Nutrition n JOIN Food f On f.food_id = n.food_id WHERE f.food_id = ?
                """
    results = query_db(sql, (food_id,), True)
    return str(results)    

#Route for the login page
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]
        
        if not email or not password:
            flash("Email and password are required")
            return redirect(url_for("login"))
        
        customer = query_db("SELECT * FROM Customer WHERE email = ?", [email], one=True)
        
        if not customer:
            hashed_password = generate_password_hash(password)
            conn = get_db()
            cur = conn.cursor()
            conn.execute("INSERT INTO Customer (email, password, name) VALUES (?, ?, ?)", [email , hashed_password, request.form["name"]])
            conn.commit()
            flash("Account created successfully") 
            customer = query_db("SELECT * FROM Customer WHERE email = ?", [email] , one=True)
        
        if customer and check_password_hash(customer["password"], password):
            session["customer_id"] = customer["customer_id"]
            session["email"] = customer["email"]
            session["name"] = customer["name"]
            return redirect(url_for("menu"))
        else: 
            flash("Invalid email or password")

    return render_template("login.html")

#Route for logout
@app.route("/logout")
def logout():
    session.clear()
    flash("You have been logged out")
    return redirect(url_for("menu"))
@app.route ("/rewards")
def rewards():
    #rewards page- displays customer loyalty rewards
    return render_template("rewards.html")

@app.route ("/locations")
def locations():
    #locations page - displays location information of restraunts
    return render_template("locations.html")

if __name__ == "__main__":
    app.run(debug=True)
from flask import Flask, g, request, redirect, render_template, session, url_for

import sqlite3
DATABASE = 'database.db'

#initialize the Flask application
app = Flask(__name__)

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
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

@app.route('/')
def home():
    #home page- menu so name, price, food type
    sql = """
                SELECT * FROM Food
                """ 
    results = query_db(sql)
    return str(results)
#Later to be organised depending on website layout / price / type etc

@app.route("/food/<int:food_id>")
def food(food_id):
    food_id = int(food_id)
    #gives further information about a specific food item
    sql = """
                SELECT f.food_name, n.* FROM Food_Nutrition n JOIN Food f On f.food_id = n.food_id WHERE f.food_id = ? 
                """
    results = query_db(sql, (food_id,), True)
    return str(results)    


if __name__ == "__main__":
    app.run(debug=True)
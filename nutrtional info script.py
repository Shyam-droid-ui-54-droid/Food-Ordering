import sqlite3
import csv

DB_FILE = 'database.db'
CSV_FILE = 'nutritional.csv' 

def update_food_nutrition():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    with open(CSV_FILE, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile, delimiter=',')

        print("Columns detected:", reader.fieldnames)

        for row in reader:
            cursor.execute("""
                INSERT OR REPLACE INTO Food_Nutrition (
                    food_id,
                    "Serving Size",
                    "Energy (Calories)",
                    "Energy (Kilojoules)",
                    Protein,
                    "Fat - Total",
                    "Fat - Sat",
                    Carbohydrate,
                    Sodium,
                    Servings,
                    Milk,
                    Eggs,
                    Fish,
                    "Crustacean shellfish",
                    "Tree nuts",
                    Peanuts,
                    Wheat,
                    Soy
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                row.get('food_id') or 0,
                row.get('Serving Size') or 0,
                row.get('Energy (Calories)') or 0,
                row.get('Energy (Kilojoules)') or 0,
                row.get('Protein') or 0,
                row.get('Fat - Total') or 0,
                row.get('Fat - Sat') or 0,
                row.get('Carbohydrate') or 0,
                row.get('Sodium') or 0,
                int(row.get('Servings') or 0),
                int(row.get('Milk') or 0),
                int(row.get('Eggs') or 0),
                int(row.get('Fish') or 0),
                int(row.get('Crustacean shellfish') or 0),
                int(row.get('Tree nuts') or 0),
                int(row.get('Peanuts') or 0),
                int(row.get('Wheat') or 0),
                int(row.get('Soy') or 0)
            ))

    conn.commit()
    conn.close()
    print("Food nutrition data updated successfully.")

if __name__ == '__main__':
    update_food_nutrition()
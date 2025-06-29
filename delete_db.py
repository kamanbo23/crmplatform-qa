import os

DB_FILE = "app.db"

if os.path.exists(DB_FILE):
    os.remove(DB_FILE)
    print(f"Deleted database file: {DB_FILE}")
else:
    print("Database file not found.") 
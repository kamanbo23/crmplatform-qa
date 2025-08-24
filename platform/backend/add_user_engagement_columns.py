import sqlite3
import os

# This migration script is for the local SQLite database (app.db)
DB_PATH = 'app.db'

# Connect to the SQLite database
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

def add_logins_column():
    """Adds the 'logins' column to the 'users' table."""
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN logins INTEGER NOT NULL DEFAULT 0")
        print("Successfully added 'logins' column to 'users' table.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column 'logins' already exists in 'users' table.")
        else:
            raise

def add_rsvps_column():
    """Adds the 'rsvps' column to the 'users' table."""
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN rsvps INTEGER NOT NULL DEFAULT 0")
        print("Successfully added 'rsvps' column to 'users' table.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column 'rsvps' already exists in 'users' table.")
        else:
            raise

if __name__ == "__main__":
    print(f"Running migration on SQLite database: {DB_PATH}")
    add_logins_column()
    add_rsvps_column()
    print("Migration complete.")

    # Commit changes and close the connection
    conn.commit()
    conn.close()
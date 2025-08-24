import sqlite3
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_sqlite_migration():
    """Run migration to add engagement tracking fields to SQLite database"""
    db_path = "app.db"
    
    if not os.path.exists(db_path):
        logger.error(f"Database file {db_path} not found")
        return
    
    logger.info(f"Running SQLite migration on database: {db_path}")
    
    conn = None
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check current tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [table[0] for table in cursor.fetchall()]
        logger.info(f"Existing tables: {tables}")
        
        # Add engagement tracking fields to users table
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN plain_password TEXT;")
            logger.info("Added plain_password column to users table")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                logger.info("plain_password column already exists in users table")
            else:
                logger.error(f"Error adding plain_password column: {e}")
        
        # Add missing columns to users table
        missing_columns = [
            ("interests", "TEXT DEFAULT '[]'"),
            ("logins", "INTEGER DEFAULT 0"),
            ("rsvps", "INTEGER DEFAULT 0"),
            ("mentor_requests", "INTEGER DEFAULT 0"),
            ("last_login", "TIMESTAMP"),
            ("updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
        ]
        
        for column_name, column_def in missing_columns:
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {column_name} {column_def};")
                logger.info(f"Added {column_name} column to users table")
            except sqlite3.OperationalError as e:
                if "duplicate column name" in str(e):
                    logger.info(f"{column_name} column already exists in users table")
                else:
                    logger.error(f"Error adding {column_name} column: {e}")
        
        # Create login_sessions table if it doesn't exist
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS login_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            user_agent TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
        """)
        logger.info("Created login_sessions table")
        
        # Create event_rsvps table if it doesn't exist
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS event_rsvps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            event_id INTEGER NOT NULL,
            email TEXT NOT NULL,
            rsvp_status TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (event_id) REFERENCES events (id)
        );
        """)
        logger.info("Created event_rsvps table")
        
        # Add email column to existing event_rsvps table if it doesn't exist
        try:
            cursor.execute("ALTER TABLE event_rsvps ADD COLUMN email TEXT;")
            logger.info("Added email column to event_rsvps table")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                logger.info("email column already exists in event_rsvps table")
            else:
                logger.error(f"Error adding email column to event_rsvps table: {e}")
        
        # Update existing RSVPs to have email (if user_id exists, get email from users table)
        try:
            cursor.execute("""
                UPDATE event_rsvps 
                SET email = (
                    SELECT email FROM users WHERE users.id = event_rsvps.user_id
                )
                WHERE email IS NULL AND user_id IS NOT NULL
            """)
            logger.info("Updated existing RSVPs with user emails")
        except sqlite3.OperationalError as e:
            logger.info(f"Could not update existing RSVPs: {e}")
        
        # Create mentor_contact_requests table if it doesn't exist
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS mentor_contact_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            mentor_id INTEGER NOT NULL,
            contact_reason TEXT NOT NULL,
            request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pending',
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (mentor_id) REFERENCES mentors (id)
        );
        """)
        logger.info("Created mentor_contact_requests table")
        
        # Add engagement tracking fields to research_opportunities table (mentors)
        try:
            cursor.execute("ALTER TABLE research_opportunities ADD COLUMN total_contact_requests INTEGER DEFAULT 0;")
            logger.info("Added total_contact_requests column to research_opportunities table")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                logger.info("total_contact_requests column already exists in research_opportunities table")
            else:
                logger.error(f"Error adding total_contact_requests column: {e}")
        
        try:
            cursor.execute("ALTER TABLE research_opportunities ADD COLUMN last_contact_request TIMESTAMP;")
            logger.info("Added last_contact_request column to research_opportunities table")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                logger.info("last_contact_request column already exists in research_opportunities table")
            else:
                logger.error(f"Error adding last_contact_request column: {e}")
        
        try:
            cursor.execute("ALTER TABLE research_opportunities ADD COLUMN contact_requests INTEGER DEFAULT 0;")
            logger.info("Added contact_requests column to research_opportunities table")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                logger.info("contact_requests column already exists in research_opportunities table")
            else:
                logger.error(f"Error adding contact_requests column: {e}")
        
        # Add engagement tracking fields to events table
        try:
            cursor.execute("ALTER TABLE events ADD COLUMN total_rsvps INTEGER DEFAULT 0;")
            logger.info("Added total_rsvps column to events table")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                logger.info("total_rsvps column already exists in events table")
            else:
                logger.error(f"Error adding total_rsvps column: {e}")
        
        try:
            cursor.execute("ALTER TABLE events ADD COLUMN last_rsvp TIMESTAMP;")
            logger.info("Added last_rsvp column to events table")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                logger.info("last_rsvp column already exists in events table")
            else:
                logger.error(f"Error adding last_rsvp column: {e}")
        
        # Commit all changes
        conn.commit()
        logger.info("Migration completed successfully")
        
        # Show updated table structure
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [table[0] for table in cursor.fetchall()]
        logger.info(f"Updated tables: {tables}")
        
    except Exception as e:
        logger.error(f"Migration error: {str(e)}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()
            logger.info("Database connection closed")

if __name__ == "__main__":
    run_sqlite_migration() 
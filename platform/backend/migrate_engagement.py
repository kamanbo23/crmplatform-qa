#!/usr/bin/env python3
"""
Migration script to add engagement tracking tables and columns
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal
from models import Base
import models
from sqlalchemy import text

def migrate_database():
    """Add new tables and columns for engagement tracking"""
    
    db = SessionLocal()
    
    try:
        print("Starting database migration for engagement tracking...")
        
        # Add plain_password column to users table if it doesn't exist
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN plain_password TEXT"))
            print("✓ Added plain_password column to users table")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("✓ plain_password column already exists")
            else:
                print(f"Warning: Could not add plain_password column: {e}")
        
        # Add mentor_requests column to users table if it doesn't exist
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN mentor_requests INTEGER DEFAULT 0"))
            print("✓ Added mentor_requests column to users table")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("✓ mentor_requests column already exists")
            else:
                print(f"Warning: Could not add mentor_requests column: {e}")
        
        # Add last_login column to users table if it doesn't exist
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN last_login DATETIME"))
            print("✓ Added last_login column to users table")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("✓ last_login column already exists")
            else:
                print(f"Warning: Could not add last_login column: {e}")
        
        # Add contact_requests column to research_opportunities table if it doesn't exist
        try:
            db.execute(text("ALTER TABLE research_opportunities ADD COLUMN contact_requests INTEGER DEFAULT 0"))
            print("✓ Added contact_requests column to research_opportunities table")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("✓ contact_requests column already exists")
            else:
                print(f"Warning: Could not add contact_requests column: {e}")
        
        # Create new tables
        print("Creating new engagement tracking tables...")
        
        # Create event_rsvps table
        try:
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS event_rsvps (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    rsvp_status TEXT DEFAULT 'confirmed',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (event_id) REFERENCES events (id),
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """))
            print("✓ Created event_rsvps table")
        except Exception as e:
            print(f"Warning: Could not create event_rsvps table: {e}")
        
        # Create mentor_contact_requests table
        try:
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS mentor_contact_requests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    mentor_id INTEGER NOT NULL,
                    user_id INTEGER,
                    contact_name TEXT NOT NULL,
                    contact_email TEXT NOT NULL,
                    contact_major TEXT,
                    contact_year TEXT,
                    reason TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (mentor_id) REFERENCES research_opportunities (id),
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """))
            print("✓ Created mentor_contact_requests table")
        except Exception as e:
            print(f"Warning: Could not create mentor_contact_requests table: {e}")
        
        # Create login_sessions table
        try:
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS login_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                    ip_address TEXT,
                    user_agent TEXT,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """))
            print("✓ Created login_sessions table")
        except Exception as e:
            print(f"Warning: Could not create login_sessions table: {e}")
        
        # Update existing admin user to have plain password
        try:
            admin_user = db.query(models.User).filter(models.User.username == "admin").first()
            if admin_user and not admin_user.plain_password:
                admin_user.plain_password = "admin"
                db.commit()
                print("✓ Updated admin user with plain password")
        except Exception as e:
            print(f"Warning: Could not update admin user: {e}")
        
        db.commit()
        print("\n✅ Database migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_database() 
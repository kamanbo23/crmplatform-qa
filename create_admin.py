import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from dotenv import load_dotenv

# load_dotenv() is not strictly needed if we define a fallback
from models import User, Base

# Fallback to local SQLite DB if no DATABASE_URL is set
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///app.db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin_user():
    db = SessionLocal()
    try:
        # Check if admin user already exists
        admin_user = db.query(User).filter(User.username == "admin").first()
        if admin_user:
            print("Admin user already exists.")
            return

        hashed_password = pwd_context.hash("admin")
        
        new_admin = User(
            email="admin@example.com",
            username="admin",
            full_name="Admin User",
            hashed_password=hashed_password,
            role="admin",
            is_active=True
        )
        
        db.add(new_admin)
        db.commit()
        
        print("Admin user 'admin' with password 'admin' created successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    create_admin_user() 
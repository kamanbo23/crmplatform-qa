from fastapi import FastAPI, Depends, HTTPException, Query, status, Form, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Union
from datetime import datetime, timedelta
import models, schemas
from database import engine, get_db, SessionLocal
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import or_, and_, text
from sqlalchemy.sql import func
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import sys
from fastapi.responses import JSONResponse
from starlette.requests import Request
from starlette.responses import Response
from pydantic import ValidationError, validator, EmailStr
import direct_migration
import json
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
import secrets  # Import the secrets module for generating secure passwords

# --- Database Initialization ---
# This ensures that the database schema is created based on the models.
# It's safe to run on every startup, as it won't re-create existing tables.
print("Initializing database...")
try:
    models.Base.metadata.create_all(bind=engine)
    print("Database tables created or verified successfully.")
except Exception as e:
    print(f"Error initializing database: {str(e)}", file=sys.stderr)

app = FastAPI(title="EcoSystem CRM API")

# Configure CORS with multiple allowed origins
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://sjsu-crm.up.railway.app",
    "https://sjsu-crm-production.up.railway.app",
    # Add any other origins as needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# --- Security and Authentication ---
SECRET_KEY = os.getenv("SECRET_KEY", "a-very-secret-key-that-should-be-in-an-env-file")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # Increased token expiration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

# --- Email Configuration ---
# IMPORTANT: Replace these with your actual email credentials in environment variables
conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "your-mailtrap-username"),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "your-mailtrap-password"),
    MAIL_FROM = os.getenv("MAIL_FROM", "info@ecosystem-crm.com"),
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.mailtrap.io"),
    MAIL_STARTTLS = os.getenv("MAIL_STARTTLS", "True").lower() in ("true", "1", "yes"),
    MAIL_SSL_TLS = os.getenv("MAIL_SSL_TLS", "False").lower() in ("true", "1", "yes"),
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

# --- Utility Functions ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- Authentication Dependencies ---
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_admin_user(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have permissions to perform this action",
        )
    return current_user

# --- API Endpoints ---

# Authentication
@app.post("/api/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        (models.User.username == form_data.username) | (models.User.email == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update login stats
    user.last_login = datetime.utcnow()
    user.login_count = (user.login_count or 0) + 1
    db.commit()

    # Check if user is admin
    is_admin = user.role == "admin"
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id, "role": user.role},
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": user.role,
        "user_id": user.id,
        "username": user.username,
        "isAdmin": is_admin
    }

# User Management
@app.post("/api/users", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(
        (models.User.email == user.email) | (models.User.username == user.username)
    ).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email or username already registered")
    
    hashed_password = get_password_hash(user.password)
    # By default, new users are members. Admins must be created via a script or manually.
    db_user = models.User(
        **user.dict(exclude={"password"}),
        hashed_password=hashed_password,
        role="member" 
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/api/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/api/users", response_model=List[schemas.UserSimple], dependencies=[Depends(get_current_admin_user)])
def get_all_users(db: Session = Depends(get_db)):
    """
    Admin-only endpoint to get a list of all users.
    Useful for assigning tasks.
    """
    return db.query(models.User).all()

@app.get("/api/users/engagement", response_model=List[schemas.UserEngagement])
def get_user_engagement(db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin_user)):
    """
    Admin-only endpoint to get user engagement data.
    """
    # This is a placeholder implementation.
    # You can expand this to calculate real engagement metrics.
    users = db.query(models.User).all()
    engagement_data = []
    for user in users:
        engagement_data.append({
            "id": user.id,
            "username": user.username,
            "last_login": user.last_login,
            "login_count": user.login_count if hasattr(user, 'login_count') else 0, # Example metric
            "posts_created": 0 # Example metric
        })
    return engagement_data

# Contact Management
@app.get("/api/contacts", response_model=List[schemas.Contact])
def get_contacts(db: Session = Depends(get_db)):
    """
    Public endpoint to get all contacts.
    """
    return db.query(models.Contact).options(joinedload(models.Contact.tags)).all()

@app.post("/api/contacts", response_model=schemas.ContactCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(
    contact_data: schemas.ContactCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    # Check if a user or contact with this email already exists
    existing_user = db.query(models.User).filter(models.User.email == contact_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")
    
    existing_contact = db.query(models.Contact).filter(models.Contact.email == contact_data.email).first()
    if existing_contact:
        raise HTTPException(status_code=400, detail="A contact with this email already exists.")

    # --- Create the User account ---
    temp_password = secrets.token_hex(8)
    hashed_password = get_password_hash(temp_password)
    
    # Generate a unique username from email
    username_base = contact_data.email.split('@')[0]
    username = username_base
    counter = 1
    while db.query(models.User).filter(models.User.username == username).first():
        username = f"{username_base}{counter}"
        counter += 1

    new_user = models.User(
        email=contact_data.email,
        username=username,
        full_name=contact_data.full_name,
        hashed_password=hashed_password,
        role="member"
    )
    db.add(new_user)
    db.flush() # Flush to get the new_user.id before committing

    # --- Create the Contact record ---
    tags = []
    if contact_data.tags:
        for tag_name in contact_data.tags:
            tag = db.query(models.Tag).filter(models.Tag.name == tag_name).first()
            if not tag:
                tag = models.Tag(name=tag_name)
                db.add(tag)
            tags.append(tag)
    
    new_contact = models.Contact(
        email=contact_data.email,
        full_name=contact_data.full_name,
        tags=tags,
        user_id=new_user.id  # Link the contact to the new user
    )
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    
    # Return the created contact and the temporary password
    return {"contact": new_contact, "temp_password": temp_password}

@app.put("/api/contacts/{contact_id}", response_model=schemas.Contact)
def update_contact(
    contact_id: int,
    contact_update: schemas.ContactCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    db_contact = db.query(models.Contact).options(joinedload(models.Contact.tags)).filter(models.Contact.id == contact_id).first()
    if not db_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Update basic fields
    db_contact.full_name = contact_update.full_name
    db_contact.email = contact_update.email
    
    # Update tags
    if contact_update.tags is not None:
        new_tags = []
        for tag_name in contact_update.tags:
            tag = db.query(models.Tag).filter(models.Tag.name == tag_name).first()
            if not tag:
                tag = models.Tag(name=tag_name)
                db.add(tag)
            new_tags.append(tag)
        db_contact.tags = new_tags
    
    db.commit()
    db.refresh(db_contact)
    return db_contact

@app.delete("/api/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    db_contact = db.query(models.Contact).options(joinedload(models.Contact.tags)).filter(models.Contact.id == contact_id).first()
    if not db_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Also delete the associated user account, if it exists
    if db_contact.user_id:
        user_to_delete = db.query(models.User).filter(models.User.id == db_contact.user_id).first()
        if user_to_delete:
            # You might want to handle associated tasks or other dependencies here in a real app
            # For now, we will delete the user directly.
            db.delete(user_to_delete)
            
    db.delete(db_contact)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# --- Admin: Mentor (formerly Opportunity) Management ---

@app.get("/api/mentors", response_model=List[schemas.Mentor], dependencies=[Depends(get_current_admin_user)])
def get_all_mentors(db: Session = Depends(get_db)):
    """
    (Admin only) Get all mentors.
    """
    mentors = db.query(models.Mentor).all()
    return mentors

@app.post("/api/mentors", response_model=schemas.Mentor, dependencies=[Depends(get_current_admin_user)])
def create_mentor(mentor: schemas.MentorCreate, db: Session = Depends(get_db)):
    """
    (Admin only) Create a new mentor.
    """
    # Check for duplicate email
    existing_mentor = db.query(models.Mentor).filter(models.Mentor.email == mentor.email).first()
    if existing_mentor:
        raise HTTPException(status_code=400, detail="An mentor with this email already exists.")

    db_mentor = models.Mentor(**mentor.dict())
    db.add(db_mentor)
    db.commit()
    db.refresh(db_mentor)
    return db_mentor

@app.put("/api/mentors/{mentor_id}", response_model=schemas.Mentor, dependencies=[Depends(get_current_admin_user)])
def update_mentor(mentor_id: int, mentor: schemas.MentorUpdate, db: Session = Depends(get_db)):
    """
    (Admin only) Update an existing mentor.
    """
    db_mentor = db.query(models.Mentor).filter(models.Mentor.id == mentor_id).first()
    if not db_mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    
    update_data = mentor.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_mentor, key, value)
    
    db.commit()
    db.refresh(db_mentor)
    return db_mentor

@app.delete("/api/mentors/{mentor_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_admin_user)])
def delete_mentor(mentor_id: int, db: Session = Depends(get_db)):
    """
    (Admin only) Delete a mentor.
    """
    db_mentor = db.query(models.Mentor).filter(models.Mentor.id == mentor_id).first()
    if not db_mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    
    db.delete(db_mentor)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# --- Public Routes ---

# Public route to get all mentors (opportunities)
@app.get("/api/opportunities", response_model=List[schemas.Mentor])
def get_all_opportunities(db: Session = Depends(get_db)):
    """
    Public route to get all mentors (aliased as opportunities for legacy client).
    """
    mentors = db.query(models.Mentor).order_by(models.Mentor.created_at.desc()).all()
    return mentors

# Event Management
@app.get("/api/events", response_model=List[schemas.Event])
def get_events(db: Session = Depends(get_db)):
    return db.query(models.Event).order_by(models.Event.start_date.desc()).all()

@app.post("/api/events", response_model=schemas.Event, status_code=status.HTTP_201_CREATED)
def create_event(
    event: schemas.EventCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    # Check for duplicate event title
    existing_event = db.query(models.Event).filter(models.Event.title == event.title).first()
    if existing_event:
        raise HTTPException(status_code=400, detail="An event with this title already exists.")

    new_event = models.Event(**event.dict())
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event

@app.put("/api/events/{event_id}", response_model=schemas.Event)
def update_event(
    event_id: int,
    event_update: schemas.EventCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    for key, value in event_update.dict().items():
        setattr(db_event, key, value)
    
    db.commit()
    db.refresh(db_event)
    return db_event

@app.delete("/api/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(db_event)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# Newsletter Management
@app.get("/api/newsletters", response_model=List[schemas.Newsletter])
def get_newsletters(db: Session = Depends(get_db)):
    newsletters = db.query(models.Newsletter).order_by(models.Newsletter.created_at.desc()).all()
    return newsletters

@app.post("/api/newsletters", response_model=schemas.Newsletter, status_code=status.HTTP_201_CREATED)
def create_newsletter(
    newsletter: schemas.NewsletterCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    new_newsletter = models.Newsletter(**newsletter.dict())
    db.add(new_newsletter)
    db.commit()
    db.refresh(new_newsletter)
    return new_newsletter

@app.put("/api/newsletters/{newsletter_id}", response_model=schemas.Newsletter)
def update_newsletter(
    newsletter_id: int,
    newsletter_update: schemas.NewsletterCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    db_newsletter = db.query(models.Newsletter).filter(models.Newsletter.id == newsletter_id).first()
    if not db_newsletter:
        raise HTTPException(status_code=404, detail="Newsletter not found")
    
    # Update newsletter fields
    for key, value in newsletter_update.dict().items():
        setattr(db_newsletter, key, value)
    
    db.commit()
    db.refresh(db_newsletter)
    return db_newsletter

@app.delete("/api/newsletters/{newsletter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_newsletter(
    newsletter_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    db_newsletter = db.query(models.Newsletter).filter(models.Newsletter.id == newsletter_id).first()
    if not db_newsletter:
        raise HTTPException(status_code=404, detail="Newsletter not found")
    
    db.delete(db_newsletter)
    db.commit()
    return None

# --- Task Management Endpoints ---

@app.post("/api/tasks", response_model=schemas.Task, status_code=status.HTTP_201_CREATED)
def create_task(
    task: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    # Verify the user being assigned the task exists
    assigned_user = db.query(models.User).filter(models.User.id == task.assigned_to_id).first()
    if not assigned_user:
        raise HTTPException(status_code=404, detail=f"User with id {task.assigned_to_id} not found.")

    new_task = models.Task(
        **task.dict(exclude={"assigned_to_id"}),
        assigned_to_id=task.assigned_to_id,
        created_by_id=current_admin.id
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@app.get("/api/tasks", response_model=List[schemas.Task])
def get_all_tasks(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """ Admin-only endpoint to get all tasks. """
    return db.query(models.Task).options(
        joinedload(models.Task.assigned_to_user),
        joinedload(models.Task.created_by_user)
    ).order_by(models.Task.created_at.desc()).all()

@app.get("/api/users/me/tasks", response_model=List[schemas.Task])
def get_my_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """ Get tasks assigned to the current logged-in user. """
    return db.query(models.Task).filter(models.Task.assigned_to_id == current_user.id).options(
        joinedload(models.Task.assigned_to_user),
        joinedload(models.Task.created_by_user)
    ).order_by(models.Task.created_at.desc()).all()

@app.put("/api/tasks/{task_id}", response_model=schemas.Task)
def update_task(
    task_id: int,
    task_update: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """ Admin-only endpoint to update any task. """
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task_update.assigned_to_id:
        assigned_user = db.query(models.User).filter(models.User.id == task_update.assigned_to_id).first()
        if not assigned_user:
            raise HTTPException(status_code=404, detail=f"User with id {task_update.assigned_to_id} not found.")

    update_data = task_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task

@app.patch("/api/tasks/{task_id}/status", response_model=schemas.Task)
def update_task_status(
    task_id: int,
    status_update: schemas.TaskUpdate, # Re-using TaskUpdate, but only status will be considered
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """ Endpoint for users to update the status of their own tasks. """
    db_task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.assigned_to_id == current_user.id
    ).first()

    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found or you do not have permission to edit it.")

    if status_update.status not in ['pending', 'completed']:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'pending' or 'completed'.")

    db_task.status = status_update.status
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """ Admin-only endpoint to delete a task. """
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(db_task)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.get("/health")
def health_check():
    return {"status": "ok"}

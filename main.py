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

# Enhanced FastAPI app with comprehensive metadata
app = FastAPI(
    title="SpartUp CRM - Ecosystem Platform",
    description="""
SpartUp CRM - Ecosystem Platform

A comprehensive Customer Relationship Management (CRM) system designed for the SpartUp ecosystem,
connecting students, entrepreneurs, and industry professionals.

This platform connects students, entrepreneurs, and industry professionals through:
* **Startup Opportunities**: Internships, accelerators, funding opportunities, and startup projects
* **Mentor Network**: Connecting students with experienced entrepreneurs and industry professionals
* **Event Management**: Conferences, workshops, hackathons, and networking events
* **Newsletter System**: Curated content and updates about startup opportunities
* **Task Management**: Collaborative project and business development task tracking
* **Analytics**: Engagement tracking and insights for the ecosystem

## Quick Start

1. **Authentication**: Use the `/api/token` endpoint to get an access token
2. Browse available startup opportunities and events
3. Connect with mentors and industry professionals
4. Manage your profile and track your engagement

## Key Features

* 🎯 **Startup Opportunities**: Browse and apply for startup positions
* 👨‍🏫 **Mentor Network**: Connect with experienced entrepreneurs and professionals
* 📅 **Event Management**: Discover and register for startup events
* 📧 **Newsletter System**: Stay updated with curated content
* ✅ **Task Management**: Track collaborative projects and tasks
* 📊 **Analytics**: Monitor engagement and ecosystem health

## API Endpoints

### Authentication
* `POST /api/token` - Get access token
* `GET /api/users/me` - Get current user info

### Users & Contacts
* `GET /api/users` - List all users (admin only)
* `POST /api/users` - Create new user
* `GET /api/contacts` - List all contacts
* `POST /api/contacts` - Create new contact

### Mentors & Opportunities
* `GET /api/mentors` - List all mentors
* `POST /api/mentors` - Create new mentor
* `GET /api/opportunities` - List startup opportunities

### Events & Newsletters
* `GET /api/events` - List all events
* `POST /api/events` - Create new event
* `GET /api/newsletters` - List all newsletters
* `POST /api/newsletters` - Create new newsletter

### Tasks & Analytics
* `GET /api/tasks` - List all tasks
* `POST /api/tasks` - Create new task
* `GET /api/engagement/stats` - Get engagement statistics
* `GET /api/engagement/users` - Get user engagement data

For detailed API documentation, visit `/docs` when the server is running.
""",
    version="1.0.0",
    contact={
        "name": "SpartUp Ecosystem Team",
        "email": "ecosystem@spartup.edu",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS with multiple allowed origins
origins = [
    "*"  # Allow all origins during development
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
            detail="Not enough permissions"
        )
    return current_user

# --- API Endpoints ---

@app.post("/api/token", response_model=schemas.Token, tags=["Authentication"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Authenticate user and return access token.
    
    This endpoint allows users to log in with their username and password.
    Upon successful authentication, it returns a JWT token that should be
    included in subsequent API requests in the Authorization header.
    
    - **username**: User's username or email
    - **password**: User's password
    
    Returns:
    - **access_token**: JWT token for authentication
    - **token_type**: Type of token (Bearer)
    - **user_type**: Type of user (admin/member)
    - **user_id**: User's ID
    - **username**: User's username
    - **isAdmin**: Boolean indicating if user is admin
    """
    user = db.query(models.User).filter(
        or_(models.User.username == form_data.username, models.User.email == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update login tracking
    user.last_login = datetime.utcnow()
    user.login_count += 1
    db.commit()
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": user.role,
        "user_id": user.id,
        "username": user.username,
        "isAdmin": user.role == "admin"
    }

@app.post("/api/users", response_model=schemas.User, status_code=status.HTTP_201_CREATED, tags=["Users"])
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user.
    
    This endpoint creates a new user account with the provided information.
    The password is hashed for security but the plain password is also stored for admin visibility.
    
    - **email**: User's email address
    - **username**: Unique username
    - **password**: User's password (will be hashed)
    - **full_name**: User's full name
    
    Returns:
    - **User object**: Created user information
    """
    # Check if user already exists
    existing_user = db.query(models.User).filter(
        (models.User.email == user.email) | (models.User.username == user.username)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )
    
    # Create new user with hashed password and plain password
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        plain_password=user.password,  # Store plain password for admin visibility
        full_name=user.full_name,
        role="member"  # Default role
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/api/users/me", response_model=schemas.User, tags=["Users"])
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    """Get current user's profile information."""
    return current_user

@app.get("/api/users", response_model=List[schemas.UserAdmin], dependencies=[Depends(get_current_admin_user)], tags=["Users"])
def get_all_users(db: Session = Depends(get_db)):
    """
    Get all users (Admin only).
    
    Returns a list of all users in the system with admin information including plain passwords.
    This endpoint is restricted to admin users only.
    """
    users = db.query(models.User).all()
    return users

@app.get("/api/users/engagement", response_model=List[schemas.UserEngagement], tags=["Analytics"])
def get_user_engagement(db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin_user)):
    """
    Get user engagement analytics (Admin only).
    
    Returns engagement metrics for all users including:
    - Login frequency
    - Last login time
    - Task completion rates
    - Content interaction
    
    This endpoint is restricted to admin users only.
    """
    # Get user engagement data
    users = db.query(models.User).all()
    engagement_data = []
    
    for user in users:
        # Count tasks created by user
        tasks_created = db.query(models.Task).filter(models.Task.created_by_id == user.id).count()
        
        engagement_data.append(schemas.UserEngagement(
            id=user.id,
            username=user.username,
            last_login=user.last_login,
            login_count=user.login_count,
            posts_created=tasks_created  # Using tasks as a proxy for posts/activity
        ))
    
    return engagement_data

# --- Contact Management ---

@app.get("/api/tags", response_model=List[schemas.Tag], tags=["Tags"])
def get_tags(db: Session = Depends(get_db)):
    """
    Get all tags.
    
    Returns a list of all available tags for filtering and categorization.
    """
    tags = db.query(models.Tag).all()
    return tags

@app.get("/api/contacts", response_model=List[schemas.Contact], tags=["Contacts"])
def get_contacts(db: Session = Depends(get_db)):
    """
    Get all contacts.
    
    Returns a list of all contacts with their associated tags and user information.
    """
    contacts = db.query(models.Contact).options(
        joinedload(models.Contact.tags),
        joinedload(models.Contact.user)
    ).all()
    return contacts

@app.post("/api/contacts", response_model=schemas.ContactCreateResponse, status_code=status.HTTP_201_CREATED, tags=["Contacts"])
async def create_contact(
    contact_data: schemas.ContactCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """
    Create a new contact (Admin only).
    
    This endpoint creates a new contact and optionally creates a user account
    for them with a generated username and password that is returned in the response.
    
    - **email**: Contact's email address
    - **full_name**: Contact's full name
    - **tags**: List of tags to associate with the contact
    - **role**: User role (member, mentor, admin) - defaults to "member"
    - **create_user_account**: Whether to create a user account - defaults to True
    
    Returns:
    - **contact**: Created contact information
    - **user_credentials**: Generated username and password for the user account
    """
    # Check if a user or contact with this email already exists
    existing_user = db.query(models.User).filter(models.User.email == contact_data.email).first()
    existing_contact = db.query(models.Contact).filter(models.Contact.email == contact_data.email).first()
    
    if existing_user or existing_contact:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user or contact with this email already exists"
        )
    
    # Create the contact
    db_contact = models.Contact(
        email=contact_data.email,
        full_name=contact_data.full_name
    )
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    
    # Create tags if they don't exist and associate them
    if contact_data.tags:
        for tag_name in contact_data.tags:
            tag = db.query(models.Tag).filter(models.Tag.name == tag_name).first()
            if not tag:
                tag = models.Tag(name=tag_name)
                db.add(tag)
                db.commit()
                db.refresh(tag)
            db_contact.tags.append(tag)
    
    user_credentials = None
    
    # Create a user account if requested
    if contact_data.create_user_account:
        # Generate secure password
        password = secrets.token_urlsafe(12)
        hashed_password = get_password_hash(password)
        
        # Generate username from email or name
        email_username = contact_data.email.split('@')[0]
        name_username = contact_data.full_name.lower().replace(' ', '.').replace('-', '.')
        base_username = email_username or name_username
        
        # Ensure username is unique
        username = base_username
        counter = 1
        while db.query(models.User).filter(models.User.username == username).first():
            username = f"{base_username}{counter}"
            counter += 1
        
        # Validate role
        valid_roles = ["member", "mentor", "admin"]
        role = contact_data.role if contact_data.role in valid_roles else "member"
        
        db_user = models.User(
            email=contact_data.email,
            username=username,
            hashed_password=hashed_password,
            full_name=contact_data.full_name,
            role=role,
            is_active=True
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Link the contact to the user
        db_contact.user_id = db_user.id
        db.commit()
        db.refresh(db_contact)
        
        # Create user credentials response
        user_credentials = schemas.UserCredentials(
            username=username,
            password=password,
            role=role
        )
    
    return schemas.ContactCreateResponse(
        contact=db_contact,
        user_credentials=user_credentials
    )

@app.put("/api/contacts/{contact_id}", response_model=schemas.Contact, tags=["Contacts"])
def update_contact(
    contact_id: int,
    contact_update: schemas.ContactCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """
    Update an existing contact (Admin only).
    
    - **contact_id**: ID of the contact to update
    - **contact_update**: Updated contact information
    
    Returns:
    - **Contact object**: Updated contact information
    """
    contact = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Update contact fields
    contact.email = contact_update.email
    contact.full_name = contact_update.full_name
    
    # Update tags
    contact.tags.clear()
    if contact_update.tags:
        for tag_name in contact_update.tags:
            tag = db.query(models.Tag).filter(models.Tag.name == tag_name).first()
            if not tag:
                tag = models.Tag(name=tag_name)
                db.add(tag)
                db.commit()
                db.refresh(tag)
            contact.tags.append(tag)
    
    db.commit()
    db.refresh(contact)
    return contact

@app.delete("/api/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Contacts"])
def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """
    Delete a contact (Admin only).
    
    - **contact_id**: ID of the contact to delete
    
    Returns:
    - **204 No Content**: Contact successfully deleted
    """
    contact = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    db.delete(contact)
    db.commit()
    return None

# --- Mentor Management ---

@app.get("/api/mentors", response_model=List[schemas.Mentor], dependencies=[Depends(get_current_admin_user)], tags=["Mentors"])
def get_all_mentors(db: Session = Depends(get_db)):
    """
    Get all mentors (Admin only).
    
    Returns a list of all startup mentors in the system.
    This endpoint is restricted to admin users only.
    """
    mentors = db.query(models.Mentor).all()
    return mentors

@app.post("/api/mentors", response_model=schemas.Mentor, dependencies=[Depends(get_current_admin_user)], tags=["Mentors"])
def create_mentor(mentor: schemas.MentorCreate, db: Session = Depends(get_db)):
    """
    Create a new mentor (Admin only).
    
    - **full_name**: Mentor's full name
    - **email**: Mentor's email address
    - **organization**: Mentor's organization/company
    - **bio**: Mentor's biography
    - **expertise**: Mentor's areas of expertise
    - **mentor_type**: Type of mentorship offered
    - **location**: Mentor's location
    - **is_virtual**: Whether mentor offers virtual sessions
    - **tags**: Tags associated with the mentor
    
    Returns:
    - **Mentor object**: Created mentor information
    """
    db_mentor = models.Mentor(**mentor.dict())
    db.add(db_mentor)
    db.commit()
    db.refresh(db_mentor)
    return db_mentor

@app.put("/api/mentors/{mentor_id}", response_model=schemas.Mentor, dependencies=[Depends(get_current_admin_user)], tags=["Mentors"])
def update_mentor(mentor_id: int, mentor: schemas.MentorUpdate, db: Session = Depends(get_db)):
    """
    Update an existing mentor (Admin only).
    
    - **mentor_id**: ID of the mentor to update
    - **mentor**: Updated mentor information
    
    Returns:
    - **Mentor object**: Updated mentor information
    """
    db_mentor = db.query(models.Mentor).filter(models.Mentor.id == mentor_id).first()
    if not db_mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    
    for field, value in mentor.dict(exclude_unset=True).items():
        setattr(db_mentor, field, value)
    
    db.commit()
    db.refresh(db_mentor)
    return db_mentor

@app.delete("/api/mentors/{mentor_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_admin_user)], tags=["Mentors"])
def delete_mentor(mentor_id: int, db: Session = Depends(get_db)):
    """
    Delete a mentor (Admin only).
    
    - **mentor_id**: ID of the mentor to delete
    
    Returns:
    - **204 No Content**: Mentor successfully deleted
    """
    db_mentor = db.query(models.Mentor).filter(models.Mentor.id == mentor_id).first()
    if not db_mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    
    db.delete(db_mentor)
    db.commit()
    return None

# --- Startup Opportunities ---

@app.get("/api/opportunities", response_model=List[schemas.Mentor], tags=["Startup Opportunities"])
def get_all_opportunities(db: Session = Depends(get_db)):
    """
    Get all startup opportunities.
    
    Returns a list of all available startup opportunities including:
    - Internships
    - Accelerators
    - Funding opportunities
    - Startup projects
    
    Opportunities can be filtered by type, field, location, and other criteria.
    """
    opportunities = db.query(models.Mentor).all()
    return opportunities

# --- Event Management ---

@app.get("/api/events", response_model=List[schemas.Event], tags=["Events"])
def get_events(db: Session = Depends(get_db)):
    """
    Get all events.
    
    Returns a list of all academic events including:
    - Conferences
    - Workshops
    - Hackathons
    - Tech talks
    - Webinars
    - Meetups
    
    Events can be filtered by type, date range, and location.
    """
    events = db.query(models.Event).all()
    return events

@app.post("/api/events", response_model=schemas.Event, status_code=status.HTTP_201_CREATED, tags=["Events"])
def create_event(
    event: schemas.EventCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """
    Create a new event (Admin only).
    
    - **title**: Event title
    - **description**: Event description
    - **start_date**: Event start date and time
    - **end_date**: Event end date and time (optional)
    - **location**: Event location
    
    Returns:
    - **Event object**: Created event information
    """
    # Check for duplicate event title
    existing_event = db.query(models.Event).filter(models.Event.title == event.title).first()
    if existing_event:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An event with this title already exists"
        )
    
    db_event = models.Event(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@app.put("/api/events/{event_id}", response_model=schemas.Event, tags=["Events"])
def update_event(
    event_id: int,
    event_update: schemas.EventCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """
    Update an existing event (Admin only).
    
    - **event_id**: ID of the event to update
    - **event_update**: Updated event information
    
    Returns:
    - **Event object**: Updated event information
    """
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    for field, value in event_update.dict().items():
        setattr(db_event, field, value)
    
    db.commit()
    db.refresh(db_event)
    return db_event

@app.delete("/api/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Events"])
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """
    Delete an event (Admin only).
    
    - **event_id**: ID of the event to delete
    
    Returns:
    - **204 No Content**: Event successfully deleted
    """
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(db_event)
    db.commit()
    return None

# --- Newsletter Management ---

@app.get("/api/newsletters", response_model=List[schemas.Newsletter], tags=["Newsletters"])
def get_newsletters(db: Session = Depends(get_db)):
    """
    Get all newsletters.
    
    Returns a list of all published newsletters.
    Newsletters can be filtered by publish date and content.
    """
    newsletters = db.query(models.Newsletter).all()
    return newsletters

@app.post("/api/newsletters", response_model=schemas.Newsletter, status_code=status.HTTP_201_CREATED, tags=["Newsletters"])
def create_newsletter(
    newsletter: schemas.NewsletterCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """
    Create a new newsletter (Admin only).
    
    - **title**: Newsletter title
    - **content**: Newsletter content
    - **image**: Newsletter image URL (optional)
    - **publish_date**: Newsletter publish date (optional)
    
    Returns:
    - **Newsletter object**: Created newsletter information
    """
    db_newsletter = models.Newsletter(**newsletter.dict())
    db.add(db_newsletter)
    db.commit()
    db.refresh(db_newsletter)
    return db_newsletter

@app.put("/api/newsletters/{newsletter_id}", response_model=schemas.Newsletter, tags=["Newsletters"])
def update_newsletter(
    newsletter_id: int,
    newsletter_update: schemas.NewsletterCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """
    Update an existing newsletter (Admin only).
    
    - **newsletter_id**: ID of the newsletter to update
    - **newsletter_update**: Updated newsletter information
    
    Returns:
    - **Newsletter object**: Updated newsletter information
    """
    db_newsletter = db.query(models.Newsletter).filter(models.Newsletter.id == newsletter_id).first()
    if not db_newsletter:
        raise HTTPException(status_code=404, detail="Newsletter not found")
    
    for field, value in newsletter_update.dict().items():
        setattr(db_newsletter, field, value)
    
    db.commit()
    db.refresh(db_newsletter)
    return db_newsletter

@app.delete("/api/newsletters/{newsletter_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Newsletters"])
def delete_newsletter(
    newsletter_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """
    Delete a newsletter (Admin only).
    
    - **newsletter_id**: ID of the newsletter to delete
    
    Returns:
    - **204 No Content**: Newsletter successfully deleted
    """
    db_newsletter = db.query(models.Newsletter).filter(models.Newsletter.id == newsletter_id).first()
    if not db_newsletter:
        raise HTTPException(status_code=404, detail="Newsletter not found")
    
    db.delete(db_newsletter)
    db.commit()
    return None

# --- Task Management ---

@app.post("/api/tasks", response_model=schemas.Task, status_code=status.HTTP_201_CREATED, tags=["Tasks"])
def create_task(
    task: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """
    Create a new task (Admin only).
    
    - **title**: Task title
    - **description**: Task description (optional)
    - **due_date**: Task due date (optional)
    - **status**: Task status (default: 'pending')
    - **assigned_to_id**: ID of the user assigned to the task
    
    Returns:
    - **Task object**: Created task information
    """
    # Verify the user being assigned the task exists
    assigned_user = db.query(models.User).filter(models.User.id == task.assigned_to_id).first()
    if not assigned_user:
        raise HTTPException(status_code=404, detail="Assigned user not found")
    
    db_task = models.Task(
        **task.dict(),
        created_by_id=current_admin.id
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.get("/api/tasks", response_model=List[schemas.Task], tags=["Tasks"])
def get_all_tasks(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """
    Get all tasks (Admin only).
    
    Returns a list of all tasks in the system.
    This endpoint is restricted to admin users only.
    """
    tasks = db.query(models.Task).options(
        joinedload(models.Task.assigned_to_user),
        joinedload(models.Task.created_by_user)
    ).all()
    return tasks

@app.get("/api/users/me/tasks", response_model=List[schemas.Task], tags=["Tasks"])
def get_my_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get current user's assigned tasks.
    
    Returns a list of tasks assigned to the current user.
    """
    tasks = db.query(models.Task).filter(
        models.Task.assigned_to_id == current_user.id
    ).options(
        joinedload(models.Task.assigned_to_user),
        joinedload(models.Task.created_by_user)
    ).all()
    return tasks

@app.put("/api/tasks/{task_id}", response_model=schemas.Task, tags=["Tasks"])
def update_task(
    task_id: int,
    task_update: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """
    Update an existing task (Admin only).
    
    - **task_id**: ID of the task to update
    - **task_update**: Updated task information
    
    Returns:
    - **Task object**: Updated task information
    """
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # If changing assigned user, verify the new user exists
    if task_update.assigned_to_id:
        assigned_user = db.query(models.User).filter(models.User.id == task_update.assigned_to_id).first()
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Assigned user not found")
    
    for field, value in task_update.dict(exclude_unset=True).items():
        setattr(db_task, field, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task

@app.patch("/api/tasks/{task_id}/status", response_model=schemas.Task, tags=["Tasks"])
def update_task_status(
    task_id: int,
    status_update: schemas.TaskUpdate, # Re-using TaskUpdate, but only status will be considered
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Update task status (Task assignee or Admin only).
    
    This endpoint allows task assignees to update the status of their assigned tasks.
    Admins can update any task status.
    
    - **task_id**: ID of the task to update
    - **status_update**: Status update information
    
    Returns:
    - **Task object**: Updated task information
    """
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if user can update this task
    if current_user.role != "admin" and db_task.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")
    
    # Only update status field
    if status_update.status:
        db_task.status = status_update.status
    
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Tasks"])
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    """
    Delete a task (Admin only).
    
    - **task_id**: ID of the task to delete
    
    Returns:
    - **204 No Content**: Task successfully deleted
    """
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(db_task)
    db.commit()
    return None

# --- Engagement Tracking Endpoints ---

@app.get("/api/engagement/stats", response_model=schemas.EngagementStats, dependencies=[Depends(get_current_admin_user)], tags=["Analytics"])
def get_engagement_stats(db: Session = Depends(get_db)):
    """Get comprehensive engagement statistics for admin dashboard"""
    try:
        # Total users
        total_users = db.query(models.User).count()
        
        # Active users this month
        from datetime import datetime, timedelta
        month_ago = datetime.utcnow() - timedelta(days=30)
        active_users_this_month = db.query(models.User).filter(
            models.User.last_login >= month_ago
        ).count()
        
        # Total logins
        total_logins = db.query(func.sum(models.User.login_count)).scalar() or 0
        
        # Total RSVPs
        total_rsvps = db.query(func.count(models.EventRSVP.id)).scalar() or 0
        
        # Total mentor requests
        total_mentor_requests = db.query(func.count(models.MentorContactRequest.id)).scalar() or 0
        
        # Top mentors by requests - simplified
        top_mentors_data = []
        
        # Recent activity - simplified
        recent_activity = []
        
        return schemas.EngagementStats(
            total_users=total_users,
            active_users_this_month=active_users_this_month,
            total_logins=total_logins,
            total_rsvps=total_rsvps,
            total_mentor_requests=total_mentor_requests,
            top_mentors_by_requests=top_mentors_data,
            recent_activity=recent_activity
        )
    except Exception as e:
        print(f"Error in engagement stats: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to get engagement stats")

@app.get("/api/engagement/users", response_model=List[schemas.UserEngagement], dependencies=[Depends(get_current_admin_user)], tags=["Analytics"])
def get_user_engagement(db: Session = Depends(get_db)):
    """Get user engagement data for admin dashboard"""
    try:
        users = db.query(models.User).all()
        return [
            schemas.UserEngagement(
                user_id=user.id,
                username=user.username,
                full_name=user.full_name,
                role=user.role,
                logins=user.login_count or 0,
                rsvps=db.query(func.count(models.EventRSVP.id)).filter(models.EventRSVP.user_id == user.id).scalar() or 0,
                mentor_requests=db.query(func.count(models.MentorContactRequest.id)).filter(models.MentorContactRequest.user_id == user.id).scalar() or 0,
                last_login=user.last_login,
                created_at=user.created_at
            )
            for user in users
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get user engagement data")

# --- Email Management ---

@app.post("/api/contacts/send-email", tags=["Contacts"])
def send_email_to_contacts(
    email_data: dict,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """
    Send email to selected contacts.
    
    This endpoint allows admins to send emails to filtered contacts.
    The email_data should contain:
    - subject: Email subject
    - message: Email message
    - recipient_ids: List of contact IDs to send to
    """
    try:
        # Get the contacts to send emails to
        contacts = db.query(models.Contact).filter(
            models.Contact.id.in_(email_data.get('recipient_ids', []))
        ).all()
        
        recipient_emails = [contact.email for contact in contacts]
        
        # Here you would integrate with your email service (SendGrid, AWS SES, etc.)
        # For now, we'll just log the email details
        print(f"Sending email to {len(recipient_emails)} recipients:")
        print(f"Subject: {email_data.get('subject')}")
        print(f"Message: {email_data.get('message')}")
        print(f"Recipients: {recipient_emails}")
        
        # You could integrate with services like:
        # - SendGrid
        # - AWS SES
        # - Mailgun
        # - SMTP server
        
        return {
            "message": f"Email sent to {len(recipient_emails)} recipients",
            "recipient_count": len(recipient_emails),
            "recipients": recipient_emails
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

# --- Health Check ---

@app.get("/health", tags=["System"])
def health_check():
    """
    Health check endpoint.
    
    Returns the health status of the API.
    Useful for monitoring and load balancers.
    
    Returns:
    - **status**: Health status
    - **timestamp**: Current timestamp
    - **version**: API version
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "service": "SpartUp CRM Ecosystem Platform"
    }

# --- Root Endpoint ---

@app.get("/", tags=["System"])
def read_root():
    """
    Root endpoint.
    
    Returns basic information about the API.
    
    Returns:
    - **message**: Welcome message
    - **version**: API version
    - **docs**: Link to API documentation
    """
    return {
        "message": "Welcome to SpartUp CRM - Ecosystem Platform",
        "version": "1.0.0",
        "docs": "/docs",
        "description": "A comprehensive CRM system for the SpartUp ecosystem"
    }


# --- Server Startup ---

if __name__ == "__main__":
    import uvicorn
    
    print("Starting SpartUp CRM Backend Server...")
    print("API Documentation available at: http://localhost:8080/docs")
    print("Health check available at: http://localhost:8080/health")
    print("Press Ctrl+C to stop the server")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8080,
        reload=True,
        log_level="info"
    )

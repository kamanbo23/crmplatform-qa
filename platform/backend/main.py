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
    "https://spartup-crm.up.railway.app",
    "https://spartup-crm-production.up.railway.app",
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

# Initialize FastMail instance
fastmail = FastMail(conf)

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
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db),
    request: Request = None
):
    user = db.query(models.User).filter(
        (models.User.username == form_data.username) | (models.User.email == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Record login session for engagement tracking
    try:
        client_ip = request.client.host if request else "unknown"
        user_agent = request.headers.get("user-agent", "") if request else ""
        
        login_session = models.LoginSession(
            user_id=user.id,
            ip_address=client_ip,
            user_agent=user_agent
        )
        db.add(login_session)
        
        # Update user login count and last login
        user.logins = (user.logins or 0) + 1
        user.last_login = datetime.utcnow()
        db.commit()
    except Exception as e:
        print(f"Error recording login session: {e}")
        db.rollback()

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
        plain_password=user.password,  # Store plain password for admin visibility
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

@app.get("/api/users/engagement", response_model=List[schemas.User], dependencies=[Depends(get_current_admin_user)])
def get_user_engagement(db: Session = Depends(get_db)):
    """
    Admin-only endpoint to get user engagement data, including logins and RSVPs.
    """
    return db.query(models.User).order_by(models.User.logins.desc()).all()

# Contact Management
@app.get("/api/contacts", response_model=List[schemas.Contact])
def get_contacts(db: Session = Depends(get_db), q: Optional[str] = None):
    """
    Get all contacts, with optional search.
    Search is case-insensitive and covers:
    - full_name
    - email
    - user role
    - tags
    """
    query = db.query(models.Contact).options(
        joinedload(models.Contact.user),
        joinedload(models.Contact.tags)
    )
    
    if q:
        search_term = f"%{q.lower()}%"
        query = query.filter(
            or_(
                func.lower(models.Contact.full_name).like(search_term),
                func.lower(models.Contact.email).like(search_term),
                func.lower(models.User.role).like(search_term),
                models.Contact.tags.any(func.lower(models.Tag.name).like(search_term))
            )
        )
    
    contacts = query.order_by(models.Contact.created_at.desc()).all()
    return contacts

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
        role=contact_data.role
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
    
    # Eagerly load the 'user' relationship to ensure it's in the response
    db.refresh(new_contact, attribute_names=["user"])

    # Return the created contact and user credentials
    user_credentials = schemas.UserCredentials(
        username=username,
        password=temp_password,
        role=contact_data.role
    )
    return schemas.ContactCreateResponse(
        contact=new_contact,
        user_credentials=user_credentials
    )

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
    db_contact = db.query(models.Contact).options(
        joinedload(models.Contact.user),
        joinedload(models.Contact.tags)
    ).filter(models.Contact.id == contact_id).first()

    if not db_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Before deleting the user, find and delete all related records
    if db_contact.user:
        user_to_delete = db_contact.user
        
        # Delete all tasks associated with the user
        tasks_to_delete = db.query(models.Task).filter(
            (models.Task.assigned_to_id == user_to_delete.id) |
            (models.Task.created_by_id == user_to_delete.id)
        ).all()
        for task in tasks_to_delete:
            db.delete(task)
        
        # Delete all login sessions for the user
        login_sessions = db.query(models.LoginSession).filter(
            models.LoginSession.user_id == user_to_delete.id
        ).all()
        for session in login_sessions:
            db.delete(session)
        
        # Delete all event RSVPs for the user
        event_rsvps = db.query(models.EventRSVP).filter(
            models.EventRSVP.user_id == user_to_delete.id
        ).all()
        for rsvp in event_rsvps:
            db.delete(rsvp)
        
        # Delete all mentor contact requests for the user
        mentor_requests = db.query(models.MentorContactRequest).filter(
            models.MentorContactRequest.user_id == user_to_delete.id
        ).all()
        for request in mentor_requests:
            db.delete(request)
            
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

@app.get("/api/public/mentors", response_model=List[schemas.Mentor])
def get_public_mentors(db: Session = Depends(get_db)):
    """Get all mentors (public access for chatbot)"""
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

@app.post("/api/events/{event_id}/rsvp", status_code=status.HTTP_204_NO_CONTENT)
def rsvp_for_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Allows the current user to RSVP for a specific event.
    Increments the user's RSVP count.
    """
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Here you would typically add logic to record the RSVP,
    # for example, in an association table between users and events.
    # For now, we will just increment the user's RSVP count.

    current_user.rsvps = (current_user.rsvps or 0) + 1
    db.commit()

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

@app.get("/api/users/me/events", response_model=List[schemas.Event])
def get_my_events(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """ Get events that the current user has RSVP'd to. """
    # Get events where user has RSVP'd
    rsvp_events = db.query(models.Event).join(
        models.EventRSVP
    ).filter(
        models.EventRSVP.user_id == current_user.id,
        models.EventRSVP.rsvp_status == 'confirmed'
    ).options(
        joinedload(models.Event.rsvps)
    ).order_by(models.Event.start_date.asc()).all()
    
    return rsvp_events

@app.get("/api/events/{event_id}/rsvps", response_model=List[schemas.EventRSVP], dependencies=[Depends(get_current_admin_user)])
def get_event_rsvps(
    event_id: int,
    db: Session = Depends(get_db)
):
    """Get all RSVPs for a specific event (admin only)"""
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    rsvps = db.query(models.EventRSVP).filter(
        models.EventRSVP.event_id == event_id
    ).options(
        joinedload(models.EventRSVP.user)
    ).order_by(models.EventRSVP.created_at.desc()).all()
    
    return rsvps

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

@app.post("/api/mentor-contact")
async def send_mentor_contact_email(
    request: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Send mentor contact request email to max.rothe@spartup.edu and track engagement
    """
    try:
        mentor_data = request.get('mentor', {})
        contact_info = request.get('contactInfo', {})
        recipient_email = request.get('recipientEmail', 'max.rothe@spartup.edu')
        
        # Validate email format
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        contact_email = contact_info.get('email', '')
        
        if not contact_email or not re.match(email_pattern, contact_email):
            raise HTTPException(
                status_code=400,
                detail="Please provide a valid email address"
            )
        
        # Get mentor from database
        mentor = db.query(models.Mentor).filter(models.Mentor.id == mentor_data.get('id')).first()
        if mentor:
            # Update mentor contact requests count
            mentor.contact_requests += 1
            db.commit()
        
        # Create mentor contact request record
        contact_request = models.MentorContactRequest(
            mentor_id=mentor_data.get('id'),
            contact_name=contact_info.get('name'),
            contact_email=contact_info.get('email'),
            contact_major=contact_info.get('major'),
            contact_year=contact_info.get('year'),
            reason=contact_info.get('reason')
        )
        db.add(contact_request)
        db.commit()
        
        # Create email content
        subject = f"Mentor Contact Request: {contact_info.get('name', 'Unknown')} wants to connect with {mentor_data.get('full_name', 'Mentor')}"
        
        # Build email body
        email_body = f"""
Dear Max Rothe,

A student has requested to connect with a mentor through the SpartUp CRM platform.

**Student Information:**
- Name: {contact_info.get('name', 'Not provided')}
- Email: {contact_info.get('email', 'Not provided')}
- Major/Field: {contact_info.get('major', 'Not provided')}
- Academic Year: {contact_info.get('year', 'Not provided')}

**Mentor Information:**
- Name: {mentor_data.get('full_name', 'Not provided')}
- Organization: {mentor_data.get('organization', 'Not provided')}
- Expertise: {mentor_data.get('expertise', 'Not provided')}
- Location: {mentor_data.get('location', 'Not provided')}
- Virtual Available: {'Yes' if mentor_data.get('is_virtual') else 'No'}

**Student's Reason for Contact:**
{contact_info.get('reason', 'No reason provided')}

**Next Steps:**
Please review this request and coordinate the connection between the student and mentor.

Best regards,
SpartUp CRM System
        """
        
        # Create message schema
        message = MessageSchema(
            subject=subject,
            recipients=[recipient_email],
            body=email_body,
            subtype="html"
        )
        
        # Send email synchronously to catch errors
        try:
            print(f"Attempting to send email to: {recipient_email}")
            print(f"Email subject: {subject}")
            await fastmail.send_message(message)
            print("Email sent successfully!")
            email_sent = True
        except Exception as email_error:
            print(f"Email sending failed: {str(email_error)}")
            print(f"Email config: MAIL_SERVER={conf.MAIL_SERVER}, MAIL_PORT={conf.MAIL_PORT}")
            email_sent = False
        
        return {
            "message": "Contact request recorded successfully",
            "email_sent": email_sent,
            "email_error": None if email_sent else "Email delivery failed, but your request has been recorded"
        }
        
    except Exception as e:
        print(f"Error sending mentor contact email: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to send contact request"
        )

# --- Engagement Tracking Endpoints ---

@app.post("/api/login-session")
async def record_login_session(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Record a login session for engagement tracking"""
    try:
        # Get client IP and user agent
        client_ip = request.client.host
        user_agent = request.headers.get("user-agent", "")
        
        # Create login session
        login_session = models.LoginSession(
            user_id=user_id,
            ip_address=client_ip,
            user_agent=user_agent
        )
        db.add(login_session)
        
        # Update user login count and last login
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user:
            user.logins += 1
            user.last_login = datetime.utcnow()
        
        db.commit()
        return {"message": "Login session recorded"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to record login session")

@app.post("/api/events/{event_id}/rsvp")
def rsvp_for_event(
    event_id: int,
    rsvp_data: schemas.EventRSVPCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """RSVP for an event and track engagement (authenticated users)"""
    try:
        # Check if event exists
        event = db.query(models.Event).filter(models.Event.id == event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check if user already RSVP'd
        existing_rsvp = db.query(models.EventRSVP).filter(
            models.EventRSVP.event_id == event_id,
            models.EventRSVP.user_id == current_user.id
        ).first()
        
        if existing_rsvp:
            # Update existing RSVP
            existing_rsvp.rsvp_status = rsvp_data.rsvp_status
        else:
            # Create new RSVP
            rsvp = models.EventRSVP(
                event_id=event_id,
                user_id=current_user.id,
                email=current_user.email,
                rsvp_status=rsvp_data.rsvp_status
            )
            db.add(rsvp)
            
            # Update user RSVP count
            current_user.rsvps += 1
        
        db.commit()
        return {"message": "RSVP recorded successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to record RSVP")

@app.post("/api/events/{event_id}/rsvp/public")
def public_rsvp_for_event(
    event_id: int,
    rsvp_data: schemas.EventRSVPCreate,
    db: Session = Depends(get_db)
):
    """Public RSVP for an event (no authentication required)"""
    try:
        # Check if event exists
        event = db.query(models.Event).filter(models.Event.id == event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check if email already RSVP'd for this event
        existing_rsvp = db.query(models.EventRSVP).filter(
            models.EventRSVP.event_id == event_id,
            models.EventRSVP.email == rsvp_data.email
        ).first()
        
        if existing_rsvp:
            # Update existing RSVP
            existing_rsvp.rsvp_status = rsvp_data.rsvp_status
            db.commit()
            return {"message": "RSVP updated successfully"}
        
        # Check if email belongs to a registered user
        user = db.query(models.User).filter(models.User.email == rsvp_data.email).first()
        
        # Create new RSVP
        rsvp = models.EventRSVP(
            event_id=event_id,
            user_id=user.id if user else None,
            email=rsvp_data.email,
            rsvp_status=rsvp_data.rsvp_status
        )
        db.add(rsvp)
        
        # If user exists, update their RSVP count
        if user:
            user.rsvps += 1
        
        db.commit()
        
        return {
            "message": "RSVP recorded successfully",
            "is_member": user is not None,
            "user_id": user.id if user else None
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to record RSVP")

@app.get("/api/tags", response_model=List[schemas.Tag])
def get_tags(db: Session = Depends(get_db)):
    """
    Get all tags.
    
    Returns a list of all available tags for filtering and categorization.
    """
    tags = db.query(models.Tag).all()
    return tags

@app.get("/api/engagement/stats", response_model=schemas.EngagementStats, dependencies=[Depends(get_current_admin_user)])
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
        total_logins = db.query(func.sum(models.User.logins)).scalar() or 0
        
        # Total RSVPs
        total_rsvps = db.query(func.sum(models.User.rsvps)).scalar() or 0
        
        # Total mentor requests
        total_mentor_requests = db.query(func.sum(models.User.mentor_requests)).scalar() or 0
        
        # Top mentors by requests
        try:
            top_mentors = db.query(
                models.Mentor.full_name,
                models.Mentor.contact_requests
            ).filter(
                models.Mentor.contact_requests > 0
            ).order_by(
                models.Mentor.contact_requests.desc()
            ).limit(5).all()
            
            top_mentors_data = [
                {"name": mentor.full_name, "requests": mentor.contact_requests}
                for mentor in top_mentors
            ]
        except Exception as e:
            print(f"Error getting top mentors: {e}")
            top_mentors_data = []
        
        # Recent activity (last 10 login sessions)
        try:
            recent_logins = db.query(
                models.LoginSession,
                models.User.username,
                models.User.full_name
            ).join(
                models.User
            ).order_by(
                models.LoginSession.login_time.desc()
            ).limit(10).all()
            
            recent_activity = [
                {
                    "type": "login",
                    "user": f"{login.User.full_name} ({login.User.username})",
                    "time": login.LoginSession.login_time,
                    "details": f"Logged in from {login.LoginSession.ip_address}"
                }
                for login in recent_logins
            ]
        except Exception as e:
            print(f"Error getting recent activity: {e}")
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
        print(f"Engagement stats error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to get engagement stats: {str(e)}")

@app.get("/api/engagement/users", response_model=List[schemas.UserEngagement], dependencies=[Depends(get_current_admin_user)])
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
                logins=user.logins,
                rsvps=user.rsvps,
                mentor_requests=user.mentor_requests,
                last_login=user.last_login,
                created_at=user.created_at
            )
            for user in users
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get user engagement data")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8080,
        reload=True,
        log_level="info"
    )

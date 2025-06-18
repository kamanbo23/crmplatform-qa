from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum
import json

class EventType(str, Enum):
    CONFERENCE = "Conference"
    HACKATHON = "Hackathon"
    WORKSHOP = "Workshop"
    MEETUP = "Meetup"
    WEBINAR = "Webinar"
    TECH_TALK = "Tech Talk"
    
    @classmethod
    def _missing_(cls, value):
        # Make the enum more flexible to accept different formats
        if isinstance(value, str):
            # Try uppercase
            for member in cls:
                if member.name == value or member.value.upper() == value.upper():
                    return member
        return None

class OpportunityType(str, Enum):
    RESEARCH = "Research"
    INTERNSHIP = "Internship"
    FELLOWSHIP = "Fellowship"
    GRANT = "Grant"
    PROJECT = "Project"
    
    @classmethod
    def _missing_(cls, value):
        # Make the enum more flexible to accept different formats
        if isinstance(value, str):
            # Try uppercase
            for member in cls:
                if member.name == value or member.value.upper() == value.upper():
                    return member
        return None

class AdminBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)

class AdminCreate(AdminBase):
    password: str = Field(..., min_length=8)

class Admin(AdminBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: int

    class Config:
        from_attributes = True

class ContactBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=100)

class ContactCreate(ContactBase):
    tags: Optional[List[str]] = []

class ContactTag(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class Contact(ContactBase):
    id: int
    created_at: datetime
    tags: List[ContactTag] = []
    user_id: Optional[int] = None

    class Config:
        from_attributes = True

class ContactCreateResponse(BaseModel):
    contact: Contact
    temp_password: str

# A simplified User schema for nesting in other models
class UserSimple(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: str = Field(default='pending', description="Task status: 'pending' or 'completed'")

class TaskCreate(TaskBase):
    assigned_to_id: int

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    assigned_to_id: Optional[int] = None

class Task(TaskBase):
    id: int
    created_at: datetime
    
    # Nested user details
    assigned_to_user: UserSimple
    created_by_user: UserSimple

    class Config:
        from_attributes = True

class NewsletterBase(BaseModel):
    title: str
    content: str
    image: Optional[str] = None
    publish_date: Optional[datetime] = None

class NewsletterCreate(NewsletterBase):
    pass

class Newsletter(NewsletterBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr = Field(..., description="Valid email address")
    username: str = Field(..., min_length=3, max_length=50, description="Username between 3-50 characters")

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    full_name: str = Field(..., min_length=2, max_length=100, description="Full name between 2-100 characters")
    
    @validator('username')
    def validate_username(cls, v):
        if not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        return v

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    bio: Optional[str] = Field(None, max_length=1000)
    interests: Optional[List[str]] = None
    profile_image: Optional[str] = None

class User(UserBase):
    id: int
    full_name: str
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    is_active: bool
    role: str
    interests: List[str] = []
    created_at: datetime
    assigned_tasks: List[Task] = []
    created_tasks: List[Task] = []

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username_or_email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)

class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: str = "user"  # "admin" or "user"
    user_id: Optional[int] = None
    username: Optional[str] = None
    isAdmin: Optional[bool] = False

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None
    user_type: Optional[str] = None

class TechEventBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)  # More lenient length requirements
    organization: str = Field(..., min_length=1, max_length=200)  # More lenient
    description: str = Field(..., min_length=1)  # More lenient minimum length
    venue: str = Field(..., min_length=1, max_length=200)
    registration_link: str
    start_date: datetime
    end_date: datetime
    location: str = Field(..., min_length=1, max_length=200)  # More lenient
    type: EventType
    price: Optional[str] = None
    tech_stack: List[str] = []  # e.g., ["Python", "React", "AWS"]
    speakers: List[str] = []
    virtual: bool = False
    tags: List[str] = []
    
    # Validator to handle empty strings in arrays
    @validator('tech_stack', 'speakers', 'tags', pre=True)
    def clean_empty_strings(cls, v):
        if isinstance(v, list):
            return [item for item in v if item and isinstance(item, str) and item.strip()]
        return v
    
    @validator('end_date')
    def validate_end_date(cls, end_date, values):
        try:
            if 'start_date' in values and end_date < values['start_date']:
                raise ValueError('End date must be after start date')
            return end_date
        except Exception:
            # If there's any error, just accept the end date
            return end_date

class TechEventCreate(TechEventBase):
    pass

class TechEvent(TechEventBase):
    id: int
    created_at: datetime
    updated_at: datetime
    attendees: int = 0
    likes: int = 0

    class Config:
        from_attributes = True

class ResearchOpportunityBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)  # More lenient length requirements
    organization: str = Field(..., min_length=1, max_length=200)  # More lenient
    description: str = Field(..., min_length=1)  # More lenient minimum length
    type: OpportunityType
    location: str = Field(..., min_length=1, max_length=200)  # More lenient
    deadline: datetime
    duration: Optional[str] = None
    compensation: Optional[str] = None
    requirements: List[str] = []
    fields: List[str] = []  # e.g., ["Machine Learning", "Computer Vision"]
    contact_email: Optional[EmailStr] = None  # Made optional
    website: Optional[str] = Field(None, description="Website for applications or more information")  # Added website field
    virtual: bool = False
    tags: List[str] = []
    
    # Validator to handle empty strings in arrays
    @validator('requirements', 'fields', 'tags', pre=True)
    def clean_empty_strings(cls, v):
        if isinstance(v, list):
            return [item for item in v if item and isinstance(item, str) and item.strip()]
        return v

class ResearchOpportunityCreate(ResearchOpportunityBase):
    @validator('deadline')
    def validate_deadline(cls, deadline):
        try:
            # More lenient deadline validation - allow past dates in production
            if deadline < datetime(2000, 1, 1):  # Sanity check for very old dates
                raise ValueError('Deadline seems too far in the past')
            return deadline
        except Exception:
            # If there's any error, just accept the deadline
            return deadline

class ResearchOpportunity(BaseModel):
    id: int
    title: str
    organization: str
    description: Optional[str] = None
    type: Optional[str] = None
    location: Optional[str] = None
    deadline: Optional[datetime] = None
    duration: Optional[str] = None
    compensation: Optional[str] = None
    requirements: Optional[str] = None
    fields: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    virtual: Optional[bool] = None
    tags: Optional[str] = None
    applications: Optional[int] = None
    likes: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    location: Optional[str] = None

class EventCreate(EventBase):
    pass

class Event(EventBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Mentor Schemas (formerly Opportunity) ---

class MentorBase(BaseModel):
    full_name: str
    email: str
    organization: Optional[str] = None
    bio: Optional[str] = None
    expertise: Optional[str] = None
    mentor_type: Optional[str] = None
    location: Optional[str] = None
    is_virtual: Optional[bool] = False
    tags: Optional[str] = None

class MentorCreate(MentorBase):
    pass

class MentorUpdate(MentorBase):
    pass

class Mentor(MentorBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
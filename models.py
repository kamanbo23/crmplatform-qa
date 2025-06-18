from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, func, ForeignKey
from sqlalchemy.sql import func
import json
from sqlalchemy.types import TypeDecorator, JSON
from database import Base
import datetime
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

# Custom type for storing lists as JSON in SQLite
class JsonList(TypeDecorator):
    impl = Text
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return '[]'
        return json.dumps(value)
        
    def process_result_value(self, value, dialect):
        if value is None:
            return []
        return json.loads(value)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    bio = Column(Text, nullable=True)
    profile_image = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="member")  # Added role for Admin/Member
    interests = Column(JsonList, default=[])
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships for tasks
    assigned_tasks = relationship("Task", foreign_keys="[Task.assigned_to_id]", back_populates="assigned_to_user")
    created_tasks = relationship("Task", foreign_keys="[Task.created_by_id]", back_populates="created_by_user")


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Link to the auto-created user account
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, unique=True)
    user = relationship("User")

    tags = relationship("Tag", secondary="contact_tags", back_populates="contacts")

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    contacts = relationship("Contact", secondary="contact_tags", back_populates="tags")


class ContactTag(Base):
    __tablename__ = "contact_tags"
    contact_id = Column(Integer, ForeignKey("contacts.id"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    status = Column(String, default='pending', nullable=False)  # 'pending' or 'completed'
    
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime, server_default=func.now())

    # Relationships to User model
    assigned_to_user = relationship("User", foreign_keys=[assigned_to_id], back_populates="assigned_tasks")
    created_by_user = relationship("User", foreign_keys=[created_by_id], back_populates="created_tasks")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    location = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Mentor(Base):
    __tablename__ = "research_opportunities"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    organization = Column(String, index=True, nullable=True)
    bio = Column(Text, nullable=True)
    expertise = Column(Text, nullable=True)
    mentor_type = Column(String, nullable=True)
    location = Column(String, nullable=True)
    is_virtual = Column(Boolean, default=False)
    tags = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Newsletter(Base):
    __tablename__ = "newsletters"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    content = Column(Text, nullable=False)
    image = Column(String, nullable=True)
    publish_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
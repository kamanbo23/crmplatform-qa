#!/usr/bin/env python3
"""
Sample Data Generator for SpartUp CRM
Adds sample mentors, events, and newsletters to the database for testing the public pages.
"""

import sys
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

def create_sample_data():
    """Create sample mentors, events, newsletters, and tags in the database."""
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_mentors = db.query(models.Mentor).count()
        existing_events = db.query(models.Event).count()
        existing_newsletters = db.query(models.Newsletter).count()
        existing_tags = db.query(models.Tag).count()
        
        print(f"Current data: {existing_mentors} mentors, {existing_events} events, {existing_newsletters} newsletters, {existing_tags} tags")
        
        # Only add newsletters and tags if they don't exist
        if existing_newsletters > 0 and existing_tags > 0:
            print("Sample data already exists. Skipping...")
            return
        
        print("Creating sample newsletters and tags...")
        
        # Sample Tags
        sample_tags = [
            "Faculty",
            "Industry Professional", 
            "Research Scientist",
            "Student",
            "Alumni",
            "AI/ML",
            "Computer Science",
            "Engineering",
            "Data Science",
            "Cybersecurity",
            "Software Development",
            "Hardware",
            "Robotics",
            "Biotechnology",
            "Environmental Science",
            "Mathematics",
            "Physics",
            "Chemistry",
            "Business",
            "Healthcare",
            "Education",
            "Government",
            "Startup",
            "Corporate",
            "Non-profit",
            "International",
            "Local",
            "Virtual",
            "In-person",
            "Senior",
            "Junior",
            "Expert",
            "Beginner",
            "Mentor",
            "Mentee",
            "Collaborator",
            "Partner"
        ]
        
        # Add tags to database
        for tag_name in sample_tags:
            existing_tag = db.query(models.Tag).filter(models.Tag.name == tag_name).first()
            if not existing_tag:
                tag = models.Tag(name=tag_name)
                db.add(tag)
        
        # Sample mentors
        mentors = [
            {
                "full_name": "Dr. Sarah Johnson",
                "email": "sarah.johnson@example.com",
                "organization": "TechStart Inc.",
                "bio": "Serial entrepreneur with 15+ years experience in AI and machine learning startups. Founded 3 successful companies.",
                "expertise": "AI/ML, Entrepreneurship, Product Development",
                "mentor_type": "Startup Mentor",
                "location": "San Francisco, CA",
                "is_virtual": True,
                "tags": "AI, Machine Learning, Entrepreneurship"
            },
            {
                "full_name": "Michael Chen",
                "email": "michael.chen@example.com",
                "organization": "Venture Capital Partners",
                "bio": "Venture capitalist with focus on early-stage startups. Has invested in 50+ successful companies.",
                "expertise": "Venture Capital, Fundraising, Business Strategy",
                "mentor_type": "Investment Mentor",
                "location": "Palo Alto, CA",
                "is_virtual": False,
                "tags": "Venture Capital, Fundraising, Strategy"
            },
            {
                "full_name": "Lisa Rodriguez",
                "email": "lisa.rodriguez@example.com",
                "organization": "GreenTech Solutions",
                "bio": "Founder of sustainable technology startup. Expert in renewable energy and environmental innovation.",
                "expertise": "Sustainability, Renewable Energy, Innovation",
                "mentor_type": "Sustainability Mentor",
                "location": "San Jose, CA",
                "is_virtual": True,
                "tags": "Sustainability, Renewable Energy, Innovation"
            }
        ]

        # Sample newsletters
        newsletters = [
            {
                "title": "Spring 2024 Startup Opportunities",
                "content": "Welcome to our Spring 2024 newsletter! This edition highlights exciting startup opportunities across various industries. We're featuring new partnerships with Silicon Valley accelerators, upcoming pitch competitions, and exclusive internship programs. Our startup mentors have secured significant funding for cutting-edge projects in AI, fintech, and sustainable technology. Students can now apply for these positions through our streamlined application portal. Don't miss the deadline for the prestigious Y Combinator Startup School applications. We also have exciting news about our new collaboration with 500 Startups for early-stage company mentorship.",
                "publish_date": datetime(2024, 3, 15)
            },
            {
                "title": "AI and Machine Learning Startup Update",
                "content": "The AI revolution is transforming the startup landscape, and SpartUp is at the forefront of this innovation wave. Our Computer Science Department has launched several new startup initiatives focusing on ethical AI, computer vision, and natural language processing. We're proud to announce that Dr. Sarah Johnson's team has received a $2.5 million investment from leading venture capital firms including Sequoia Capital and Andreessen Horowitz who are collaborating with our entrepreneurs. Learn about the latest developments in deep learning, neural networks, and their applications in healthcare, autonomous vehicles, and environmental monitoring.",
                "publish_date": datetime(2024, 3, 20)
            },
            {
                "title": "Sustainable Technology Startups",
                "content": "As climate change becomes an increasingly urgent global challenge, SpartUp is committed to leading innovation in sustainable technologies. Our Engineering Department has established a new Center for Sustainable Energy Innovation, focusing on renewable energy systems, smart grid technologies, and energy storage solutions. This newsletter showcases our partnerships with leading renewable energy companies and government agencies, highlighting opportunities for students to work on cutting-edge sustainability projects. From solar panel optimization to electric vehicle infrastructure, our startup ecosystem is driving the green technology revolution.",
                "publish_date": datetime(2024, 3, 25)
            },
            {
                "title": "Student Success Stories",
                "content": "This edition celebrates the remarkable achievements of our students and alumni in the startup community. We feature success stories from recent graduates who have secured positions at top tech companies and founded successful startups. Learn about the entrepreneurial journeys of students who participated in our startup programs and how their experiences shaped their professional development. This newsletter also includes valuable career advice from industry professionals, tips for building a strong startup portfolio, and information about upcoming career fairs and networking events. We're excited to announce new mentorship programs connecting students with successful alumni and industry leaders.",
                "publish_date": datetime(2024, 3, 30)
            },
            {
                "title": "Upcoming Startup Events",
                "content": "Spring 2024 is packed with exciting startup events and opportunities! We're excited to announce the return of our annual Startup Showcase, which will showcase groundbreaking student and alumni startup projects. Other highlights include the Tech Startup Fair 2024, featuring over 50 companies from Silicon Valley, and the Women in Tech Panel Discussion featuring successful female entrepreneurs and leaders in technology. Don't miss our monthly Startup Networking Mixer, where students can connect with industry professionals and potential mentors. We also have several hackathons and pitch competitions scheduled throughout the semester.",
                "publish_date": datetime(2024, 4, 5)
            }
        ]
        
        # Add newsletters to database
        for newsletter_data in newsletters:
            newsletter = models.Newsletter(**newsletter_data)
            db.add(newsletter)
        
        # Commit all changes
        db.commit()
        
        print(f"Successfully created {len(sample_tags)} sample tags and {len(newsletters)} sample newsletters!")
        
    except Exception as e:
        print(f"Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Ensure database tables exist
    models.Base.metadata.create_all(bind=engine)
    
    # Create sample data
    create_sample_data() 
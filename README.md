# SpartUp CRM Platform

A comprehensive Customer Relationship Management (CRM) platform designed for startup ecosystems, built with FastAPI backend and React frontend.

## 🚀 Features

### Core Functionality
- **User Management**: Role-based access control (Admin/Member)
- **Contact Management**: Create, edit, and manage community contacts
- **Mentor Directory**: Browse and connect with startup mentors
- **Event Management**: Create and RSVP to startup events
- **Newsletter System**: Publish and manage newsletters
- **Task Management**: Assign and track tasks
- **Engagement Tracking**: Monitor user activity and interactions

### Public Features
- **Public Landing Page**: Showcase the startup ecosystem
- **Public Events**: Browse and RSVP to events without login
- **Public Mentors**: View mentor directory and request connections
- **Public Newsletters**: Read published newsletters
- **AI Chatbot**: Interactive chatbot with real-time platform data

### Admin Features
- **Dashboard Analytics**: Comprehensive engagement statistics
- **User Management**: Create accounts, manage roles, view credentials
- **Contact Management**: Advanced filtering, export, and email campaigns
- **Event Management**: Create, edit, and track RSVPs
- **Mentor Management**: Add mentors and track contact requests

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM for database operations
- **SQLite**: Database (can be configured for PostgreSQL)
- **JWT**: Authentication and authorization
- **Pydantic**: Data validation and serialization
- **FastAPI-Mail**: Email functionality

### Frontend
- **React**: JavaScript library for building user interfaces
- **Material-UI**: React component library
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **Framer Motion**: Animation library

### AI Integration
- **OpenRouter API**: AI chatbot with real-time data integration

## 📋 Prerequisites

- Python 3.9+
- Node.js 16+
- npm or yarn

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/kamanbo23/crmplatform-qa.git
cd crmplatform-qa
```

### 2. Backend Setup
```bash
cd platform/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migration
python sqlite_migration.py

# Create admin user
python create_admin.py

# Start the backend server
python main.py
```

The backend will be available at `http://localhost:8080`

### 3. Frontend Setup
```bash
cd platform/frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env and add your OpenRouter API key

# Start the frontend development server
npm start
```

The frontend will be available at `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL=sqlite:///./app.db

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email Configuration
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-email-password
MAIL_FROM=info@spartup.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
MAIL_STARTTLS=True
MAIL_SSL_TLS=False
```

#### Frontend (.env)
```env
# OpenRouter API Key for Chatbot
REACT_APP_OPENROUTER_API_KEY=your-openrouter-api-key-here

# Backend API URL
REACT_APP_API_URL=http://localhost:8080
```

### Default Admin Credentials
- **Username**: admin
- **Password**: admin123

## 📊 Database Schema

The platform uses the following main entities:
- **Users**: Authentication and role management
- **Contacts**: Community member information
- **Mentors**: Startup mentor profiles
- **Events**: Event management and RSVPs
- **Newsletters**: Content management
- **Tasks**: Task assignment and tracking
- **Engagement**: Login sessions, RSVPs, contact requests

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Admin and Member permissions
- **API Key Protection**: Environment variable configuration
- **Input Validation**: Pydantic schemas for data validation
- **CORS Configuration**: Cross-origin resource sharing setup

## 📈 Engagement Tracking

The platform tracks various engagement metrics:
- **Login Sessions**: User login activity
- **Event RSVPs**: Event participation
- **Mentor Contact Requests**: Mentor engagement
- **Task Completion**: Task management metrics

## 🤖 AI Chatbot

The public chatbot integrates with OpenRouter API to provide:
- Real-time platform information
- Event and mentor recommendations
- General startup ecosystem guidance
- Dynamic responses based on current data

## 📧 Email Functionality

- **Mentor Contact Requests**: Automated email notifications
- **SMTP Integration**: Configurable email service
- **Background Processing**: Asynchronous email sending

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 📝 API Documentation

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:8080/docs`
- **ReDoc**: `http://localhost:8080/redoc`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team

## 🔄 Recent Updates

- Enhanced RSVP functionality with email collection
- Improved role-based permissions for contacts
- Added comprehensive engagement tracking
- Implemented public chatbot with real-time data
- Enhanced email functionality with proper error handling
- Added comprehensive .gitignore for security 
# SpartUp CRM - Ecosystem Platform

A comprehensive Customer Relationship Management (CRM) system designed specifically for the SpartUp ecosystem. This platform connects students, researchers, and industry professionals through opportunities, mentorship programs, events, and community engagement.

## 🎯 Purpose

The SpartUp CRM platform serves as a central hub for:
- **Research Opportunities**: Internships, fellowships, grants, and research projects
- **Mentor Network**: Connecting students with experienced researchers and industry professionals
- **Event Management**: Conferences, workshops, hackathons, and tech talks
- **Community Engagement**: Contact management, newsletters, and task coordination
- **Academic Collaboration**: Facilitating partnerships between students, faculty, and industry

## 🚀 Features

### Core Modules

#### 1. **Research Opportunities**
- Browse and search research opportunities by type, field, and location
- Apply for internships, fellowships, grants, and projects
- Track application status and deadlines
- Filter by virtual/on-site opportunities

#### 2. **Mentor Network**
- Comprehensive mentor profiles with expertise areas
- Virtual and in-person mentorship options
- Organization and location-based filtering
- Direct contact and scheduling capabilities

#### 3. **Event Management**
- Create and manage academic events (conferences, workshops, hackathons)
- RSVP functionality and attendance tracking
- Event categorization and tagging
- Integration with calendar systems

#### 4. **Contact Management**
- Centralized contact database with tagging system
- Automatic user account creation for contacts
- Engagement tracking and communication history
- Export and import capabilities

#### 5. **Task Management**
- Assign tasks between administrators and members
- Track task completion and deadlines
- Role-based task visibility
- Progress monitoring and reporting

#### 6. **Newsletter System**
- Create and publish newsletters to the community
- Rich content editing with image support
- Scheduled publishing and delivery tracking
- Audience segmentation

### User Roles & Permissions

#### **Admin Users**
- Full system access and management
- User account management
- Content creation and moderation
- Analytics and reporting
- System configuration

#### **Member Users**
- Browse opportunities and events
- Apply for research positions
- Connect with mentors
- Manage personal profile
- View assigned tasks

## 🏗️ Architecture

### Backend (FastAPI)
```
├── main.py                 # FastAPI application entry point
├── models.py              # SQLAlchemy database models
├── schemas.py             # Pydantic data validation schemas
├── database.py            # Database connection and session management
├── routes/                # API route handlers
│   ├── users.py          # User management endpoints
│   └── posts.py          # Content management endpoints
└── requirements.txt       # Python dependencies
```

### Frontend (React)
```
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   │   ├── DashboardPage.js
│   │   ├── ContactsPage.js
│   │   ├── EventsPage.js
│   │   ├── MentorsPage.js
│   │   ├── TasksPage.js
│   │   └── NewslettersPage.js
│   ├── services/         # API service layer
│   └── App.js           # Main application component
└── package.json         # Node.js dependencies
```

### Database Schema
- **Users**: Authentication and user profiles
- **Contacts**: Community member database
- **Mentors**: Research mentor profiles
- **Events**: Academic event management
- **Tasks**: Task assignment and tracking
- **Newsletters**: Content publishing system
- **Tags**: Categorization system

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: Database ORM
- **PostgreSQL/SQLite**: Database systems
- **JWT**: Authentication tokens
- **bcrypt**: Password hashing
- **Pydantic**: Data validation

### Frontend
- **React**: User interface framework
- **Material-UI**: Component library
- **Axios**: HTTP client
- **React Router**: Navigation
- **DataGrid**: Data table components

### DevOps
- **Docker**: Containerization
- **Railway**: Deployment platform
- **Alembic**: Database migrations

## 📦 Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL (for production)
- Git

### Backend Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd spartup-crm
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Environment configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Database setup**
```bash
# For development (SQLite)
python init_db.py

# For production (PostgreSQL)
# Set DATABASE_URL in .env
alembic upgrade head
```

6. **Create admin user**
```bash
python create_admin.py
```

7. **Run the backend**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd platform/frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure API endpoint**
```bash
# Create .env file
echo "REACT_APP_API_URL=http://localhost:8080" > .env
```

4. **Start development server**
```bash
npm start
```

## 🚀 Deployment

### Railway Deployment

1. **Connect to Railway**
```bash
railway login
railway link
```

2. **Set environment variables**
```bash
railway variables set SECRET_KEY=your-secret-key
railway variables set DATABASE_URL=your-postgres-url
```

3. **Deploy**
```bash
railway up
```

### Docker Deployment

1. **Build and run with Docker Compose**
```bash
docker-compose up --build
```

## 📊 API Documentation

Once the backend is running, visit:
- **Interactive API Docs**: http://localhost:8080/docs
- **ReDoc Documentation**: http://localhost:8080/redoc

### Key Endpoints

#### Authentication
- `POST /api/token` - User login
- `POST /api/users` - User registration
- `GET /api/users/me` - Get current user

#### Research Opportunities
- `GET /api/opportunities` - List opportunities
- `POST /api/opportunities` - Create opportunity
- `PUT /api/opportunities/{id}` - Update opportunity

#### Mentors
- `GET /api/mentors` - List mentors
- `POST /api/mentors` - Add mentor
- `PUT /api/mentors/{id}` - Update mentor

#### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `PUT /api/events/{id}` - Update event

#### Contacts
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Add contact
- `PUT /api/contacts/{id}` - Update contact

#### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/{id}/status` - Update task status

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost/spartup_crm

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Email (for newsletters)
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-email-password
MAIL_FROM=info@ecosystem-crm.com
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
```

### Database Configuration

The application supports both SQLite (development) and PostgreSQL (production):

- **Development**: Uses SQLite with file-based storage
- **Production**: Uses PostgreSQL for scalability and concurrent access

## 🧪 Testing

### Backend Testing
```bash
# Run tests
python -m pytest

# Run with coverage
python -m pytest --cov=.
```

### Frontend Testing
```bash
cd platform/frontend
npm test
```

## 📈 Monitoring & Analytics

### User Engagement Tracking
- Login frequency and patterns
- Feature usage analytics
- Content interaction metrics
- Task completion rates

### Performance Monitoring
- API response times
- Database query optimization
- Frontend load times
- Error tracking and logging

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Role-based Access Control**: Admin and member permissions
- **CORS Configuration**: Cross-origin request handling
- **Input Validation**: Pydantic schema validation
- **SQL Injection Protection**: SQLAlchemy ORM

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation at `/docs`

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Core CRM functionality
- ✅ User authentication and roles
- ✅ Basic content management

### Phase 2 (Planned)
- 🔄 Advanced search and filtering
- 🔄 Email notifications and alerts
- 🔄 Mobile-responsive design
- 🔄 API rate limiting

### Phase 3 (Future)
- 📋 Integration with SpartUp systems
- 📋 Advanced analytics dashboard
- 📋 Machine learning recommendations
- 📋 Mobile application

---

**Built with ❤️ for the SpartUp Community** 
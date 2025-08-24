#!/bin/bash

# SpartUp CRM - Ecosystem Platform
# Setup Script
# 
# This script automates the installation and configuration of the SpartUp CRM platform
# for both development and production environments.

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    local missing_deps=()
    
    # Check Python
    if ! command_exists python3; then
        missing_deps+=("python3")
    fi
    
    # Check pip
    if ! command_exists pip3; then
        missing_deps+=("pip3")
    fi
    
    # Check Node.js
    if ! command_exists node; then
        missing_deps+=("node")
    fi
    
    # Check npm
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    # Check Git
    if ! command_exists git; then
        missing_deps+=("git")
    fi
    
    # Check Docker (optional)
    if ! command_exists docker; then
        print_warning "Docker not found. Docker installation is optional for containerized deployment."
    fi
    
    # Check Docker Compose (optional)
    if ! command_exists docker-compose; then
        print_warning "Docker Compose not found. Docker Compose installation is optional for containerized deployment."
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        print_status "Please install the missing dependencies and run this script again."
        exit 1
    fi
    
    print_success "All required dependencies are installed."
}

# Function to create virtual environment
setup_python_env() {
    print_status "Setting up Python virtual environment..."
    
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        print_success "Virtual environment created."
    else
        print_warning "Virtual environment already exists."
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install Python dependencies
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    print_success "Python environment setup complete."
}

# Function to setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd platform/frontend
    
    # Install Node.js dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    # Create environment file
    if [ ! -f ".env" ]; then
        echo "REACT_APP_API_URL=http://localhost:8080" > .env
        print_success "Frontend environment file created."
    fi
    
    cd ../..
    print_success "Frontend setup complete."
}

# Function to setup database
setup_database() {
    print_status "Setting up database..."
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Initialize database
    python init_db.py
    
    # Create admin user
    python create_admin.py
    
    print_success "Database setup complete."
}

# Function to create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    
    if [ ! -f ".env" ]; then
        cp env.example .env
        print_success "Environment file created from template."
        print_warning "Please edit .env file with your specific configuration."
    else
        print_warning "Environment file already exists."
    fi
}

# Function to setup logging
setup_logging() {
    print_status "Setting up logging directories..."
    
    mkdir -p logs
    mkdir -p backups
    
    print_success "Logging directories created."
}

# Function to setup development environment
setup_development() {
    print_status "Setting up development environment..."
    
    check_requirements
    create_env_file
    setup_python_env
    setup_frontend
    setup_database
    setup_logging
    
    print_success "Development environment setup complete!"
    print_status "To start the development servers:"
    echo "  1. Backend: source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8080"
    echo "  2. Frontend: cd platform/frontend && npm start"
    echo ""
    print_status "Access the application at:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:8080"
    echo "  - API Documentation: http://localhost:8080/docs"
}

# Function to setup production environment
setup_production() {
    print_status "Setting up production environment..."
    
    if ! command_exists docker; then
        print_error "Docker is required for production setup."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is required for production setup."
        exit 1
    fi
    
    create_env_file
    setup_logging
    
    print_status "Building Docker images..."
    docker-compose build
    
    print_status "Starting production services..."
    docker-compose up -d
    
    print_success "Production environment setup complete!"
    print_status "Services are starting up. Check status with: docker-compose ps"
    print_status "Access the application at:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:8080"
    echo "  - API Documentation: http://localhost:8080/docs"
}

# Function to setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring environment..."
    
    if ! command_exists docker; then
        print_error "Docker is required for monitoring setup."
        exit 1
    fi
    
    # Create monitoring directories
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/datasources
    
    # Create basic Prometheus configuration
    cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'spartup-crm-backend'
    static_configs:
      - targets: ['backend:8080']
    metrics_path: '/metrics'
    
  - job_name: 'spartup-crm-frontend'
    static_configs:
      - targets: ['frontend:3000']
EOF
    
    # Create Grafana datasource
    cat > monitoring/grafana/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://monitoring:9090
    isDefault: true
EOF
    
    print_status "Starting monitoring services..."
    docker-compose --profile monitoring up -d
    
    print_success "Monitoring environment setup complete!"
    print_status "Access monitoring at:"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - Grafana: http://localhost:3001 (admin/admin)"
}

# Function to backup database
backup_database() {
    print_status "Creating database backup..."
    
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_file="backups/spartup_crm_backup_${timestamp}.sql"
    
    if [ -f ".env" ]; then
        source .env
        if [ -n "$DATABASE_URL" ]; then
            # Extract database connection details
            if [[ $DATABASE_URL == postgresql://* ]]; then
                # PostgreSQL backup
                pg_dump "$DATABASE_URL" > "$backup_file"
                print_success "Database backup created: $backup_file"
            else
                # SQLite backup
                cp app.db "$backup_file"
                print_success "Database backup created: $backup_file"
            fi
        else
            print_error "DATABASE_URL not found in .env file."
        fi
    else
        print_error ".env file not found."
    fi
}

# Function to restore database
restore_database() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        print_error "Please specify a backup file to restore."
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    print_status "Restoring database from backup: $backup_file"
    
    if [ -f ".env" ]; then
        source .env
        if [ -n "$DATABASE_URL" ]; then
            if [[ $DATABASE_URL == postgresql://* ]]; then
                # PostgreSQL restore
                psql "$DATABASE_URL" < "$backup_file"
                print_success "Database restored successfully."
            else
                # SQLite restore
                cp "$backup_file" app.db
                print_success "Database restored successfully."
            fi
        else
            print_error "DATABASE_URL not found in .env file."
        fi
    else
        print_error ".env file not found."
    fi
}

# Function to show help
show_help() {
    echo "SpartUp CRM - Ecosystem Platform Setup Script"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  dev, development    Setup development environment"
    echo "  prod, production    Setup production environment with Docker"
    echo "  monitoring          Setup monitoring with Prometheus and Grafana"
    echo "  backup              Create database backup"
    echo "  restore <file>      Restore database from backup file"
    echo "  check               Check system requirements"
    echo "  help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev              # Setup development environment"
    echo "  $0 prod             # Setup production environment"
    echo "  $0 backup           # Create database backup"
    echo "  $0 restore backup.sql  # Restore from backup"
    echo ""
}

# Main script logic
case "${1:-dev}" in
    dev|development)
        setup_development
        ;;
    prod|production)
        setup_production
        ;;
    monitoring)
        setup_monitoring
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database "$2"
        ;;
    check)
        check_requirements
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac 
# Medical Profile Backend API

Backend API for the Medical Profile Management System built with PHP Slim Framework.

## Features

- **User Authentication**: Simple name-based authentication with JWT tokens
- **User Profile Management**: CRUD operations for user profiles
- **Medical Records Management**: Store and manage lab results and prescriptions
- **File Upload**: Handle medical document uploads
- **RESTful API**: Clean REST endpoints with JSON responses
- **Database Integration**: MySQL database with proper schema
- **CORS Support**: Cross-origin requests enabled for frontend integration

## Requirements

- PHP 8.1 or higher
- MySQL 5.7 or higher
- Composer

## Installation

1. **Install dependencies:**
   ```bash
   cd backend
   composer install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env file with your database credentials
   ```

3. **Create database:**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

4. **Start development server:**
   ```bash
   composer start
   # Or manually: php -S localhost:8000 -t public
   ```

## API Endpoints

### Authentication
- `POST /api/login` - User login/registration

### Users
- `GET /api/users/{id}` - Get user profile
- `PUT /api/users/{id}` - Update user profile

### Medical Records
- `GET /api/users/{userId}/records` - List user's medical records
- `POST /api/records` - Create new medical record
- `GET /api/records/{id}` - Get specific medical record
- `DELETE /api/records/{id}` - Delete medical record

### File Upload
- `POST /api/upload` - Upload medical documents

## Database Schema

### Users Table
- `id` - Primary key
- `name` - User's full name
- `age` - User's age
- `blood_type` - Blood type (e.g., "O+", "A-")
- `allergies` - Known allergies
- `current_conditions` - Current medical conditions
- `created_at`, `updated_at` - Timestamps

### Medical Records Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `record_name` - Name/title of the record
- `type` - Either "lab_result" or "prescription"
- `file_url` - Path to uploaded file
- `analysis` - AI analysis text
- `created_at`, `updated_at` - Timestamps

## Configuration

Key environment variables in `.env`:

```env
# Database
DB_HOST=localhost
DB_NAME=medical_profile
DB_USER=root
DB_PASS=

# JWT
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256

# CORS
CORS_ORIGIN=http://localhost:3000

# File Upload
UPLOAD_PATH=uploads/
MAX_FILE_SIZE=10485760
```

## Development

The API follows clean architecture principles:

- **Domain Layer**: Business entities and interfaces
- **Application Layer**: Use cases and actions
- **Infrastructure Layer**: Database implementations
- **Presentation Layer**: HTTP controllers and routes

## Testing

Run tests with:
```bash
composer test
```

## Production Deployment

1. Set `APP_ENV=production` in `.env`
2. Configure proper database credentials
3. Set up proper web server (Apache/Nginx)
4. Enable PHP-DI compilation for better performance
5. Set up proper logging and error handling

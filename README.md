# 🏥 Medical Profile Management System
*Hệ thống Quản lý Hồ sơ Y tế*

A comprehensive medical profile management system that allows users to store, manage, and analyze their personal health records with AI-powered insights.

## ✨ Features

- 👤 **User Authentication & Profiles**: Simple name-based authentication with personal medical profiles
- 📋 **Medical Records Management**: Store and organize lab results and prescriptions
- 🤖 **AI-Powered Analysis**: Automatic analysis of medical documents using Google GenAI
- 💬 **AI Doctor Chat**: Interactive health consultation based on your medical records
- 📁 **File Upload**: Secure upload and storage of medical documents
- 🌐 **Multilingual Support**: Vietnamese and English language support
- 📱 **Responsive Design**: Modern, mobile-friendly interface

## 🏗️ Architecture

This is a full-stack application with a clear separation between backend and frontend:

```
hosoyte/
├── backend/          # PHP Slim Framework API
│   ├── src/         # Application source code
│   ├── public/      # Web server entry point
│   └── database/    # Database schema and migrations
└── web/             # React TypeScript frontend
    ├── components/  # React components
    ├── services/    # API services
    └── types.ts     # TypeScript type definitions
```

## 🛠️ Tech Stack

### Backend
- **Framework**: PHP Slim 4
- **Database**: MySQL 5.7+
- **Authentication**: JWT tokens
- **Dependencies**: 
  - Monolog for logging
  - PHP-DI for dependency injection
  - Respect/Validation for input validation
  - CORS middleware for cross-origin requests

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **AI Integration**: Google GenAI
- **Styling**: Tailwind CSS (implied from component structure)
- **State Management**: React hooks

## 🚀 Quick Start

### Prerequisites
- PHP 8.1 or higher
- Node.js 18+ and npm/bun
- Composer
- Docker and Docker Compose (for database)

### Option 1: Using Docker for MySQL (Recommended)

1. **Start MySQL with Docker:**
   ```bash
   # Start MySQL and phpMyAdmin
   ./start-mysql.sh
   # or manually: docker-compose up -d
   ```

2. **Set up backend environment:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env file with Docker database credentials:
   # DB_HOST=localhost
   # DB_USER=medical_user
   # DB_PASS=medical_password
   ```

3. **Install and start backend:**
   ```bash
   composer install
   composer start
   # Server will run on http://localhost:8000
   ```

4. **Install and start frontend:**
   ```bash
   cd web
   npm install
   echo "VITE_GENAI_API_KEY=your_google_genai_api_key" > .env.local
   npm run dev
   # Server will run on http://localhost:3001
   ```

5. **Access phpMyAdmin (optional):**
   - URL: http://localhost:8080
   - Username: medical_user
   - Password: medical_password

### Option 2: Manual MySQL Setup

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install PHP dependencies:**
   ```bash
   composer install
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env file with your database credentials and API keys
   ```

4. **Create database:**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

5. **Start backend server:**
   ```bash
   composer start
   # Server will run on http://localhost:8000
   ```

### Frontend Setup

1. **Navigate to web directory:**
   ```bash
   cd web
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or if using bun: bun install
   ```

3. **Set up environment:**
   ```bash
   # Create .env.local file and add your Google GenAI API key
   echo "VITE_GENAI_API_KEY=your_google_genai_api_key" > .env.local
   ```

4. **Start development server:**
   ```bash
   npm run dev
   # Server will run on http://localhost:5173
   ```

## 📊 Database Schema

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | INT PRIMARY KEY | User identifier |
| name | VARCHAR(255) | User's full name |
| age | INT | User's age |
| blood_type | VARCHAR(10) | Blood type (e.g., "O+", "A-") |
| allergies | TEXT | Known allergies |
| current_conditions | TEXT | Current medical conditions |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

### Medical Records Table
| Column | Type | Description |
|--------|------|-------------|
| id | INT PRIMARY KEY | Record identifier |
| user_id | INT FOREIGN KEY | Reference to users table |
| record_name | VARCHAR(255) | Name/title of the record |
| type | ENUM | Either "lab_result" or "prescription" |
| file_url | VARCHAR(500) | Path to uploaded file |
| analysis | TEXT | AI analysis results |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

## 🔌 API Endpoints

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

## 🎨 Frontend Components

- **Auth**: User authentication interface
- **Dashboard**: Main application dashboard
- **ProfilePage**: User profile management
- **FileUpload**: Medical document upload interface
- **AnalysisPage**: Document analysis display
- **AnalysisResult**: AI analysis results
- **ChatPage**: AI doctor chat interface
- **History**: Medical records history

## ⚙️ Configuration

### Backend Environment Variables (.env)
```env
# Database Configuration
DB_HOST=localhost
DB_NAME=medical_profile
DB_USER=root
DB_PASS=your_password

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# File Upload Configuration
UPLOAD_PATH=uploads/
MAX_FILE_SIZE=10485760
```

### Frontend Environment Variables (.env.local)
```env
VITE_GENAI_API_KEY=your_google_genai_api_key
VITE_API_BASE_URL=http://localhost:8000/api
```

## 🐳 Docker Support

The project includes Docker support for easy database setup:

### MySQL with Docker
```bash
# Start MySQL and phpMyAdmin
./start-mysql.sh

# Stop MySQL
./stop-mysql.sh

# Or use docker-compose directly
docker-compose up -d    # Start
docker-compose down     # Stop
docker-compose down -v  # Stop and remove data
```

### Database Access
- **MySQL**: localhost:3306
- **phpMyAdmin**: http://localhost:8080
- **Credentials**: medical_user / medical_password

## 🧪 Testing

### Backend Tests
```bash
cd backend
composer test
```

### Frontend Tests
```bash
cd web
npm run test
```

## 🚀 Production Deployment

### Backend
1. Set `APP_ENV=production` in `.env`
2. Configure production database credentials
3. Set up proper web server (Apache/Nginx)
4. Enable PHP-DI compilation for better performance
5. Configure proper logging and error handling

### Frontend
1. Build the application:
   ```bash
   npm run build
   ```
2. Deploy the `dist/` folder to your web server
3. Configure environment variables for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions, please:
1. Check the existing documentation
2. Search through existing issues
3. Create a new issue with detailed information

## 🙏 Acknowledgments

- Google GenAI for AI-powered medical analysis
- Slim Framework for the robust PHP backend
- React and Vite for the modern frontend experience
- All contributors who help improve this project

---

*Built with ❤️ for better healthcare management*

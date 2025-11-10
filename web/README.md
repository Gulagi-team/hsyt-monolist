# 🌐 Medical Profile Frontend

React TypeScript frontend for the Medical Profile Management System with AI-powered health analysis and consultation features.

## 🎯 Overview

This is the frontend application for the Medical Profile Management System, built with React 19 and TypeScript. It provides a modern, responsive interface for managing personal health records with integrated AI capabilities.

## ✨ Features

- 🔐 **Simple Authentication**: Name-based login system
- 👤 **Profile Management**: Personal medical information management
- 📋 **Medical Records**: Upload and organize lab results and prescriptions
- 🤖 **AI Analysis**: Automatic analysis of medical documents using Google GenAI
- 💬 **AI Doctor Chat**: Interactive health consultation based on your records
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🌍 **Vietnamese Support**: Localized for Vietnamese users

## 🛠️ Tech Stack

- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Google GenAI** - AI-powered medical analysis
- **Modern CSS** - Responsive design with dark mode support

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or bun package manager

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   # or with bun: bun install
   ```

2. **Set up environment variables:**
   ```bash
   # Create .env.local file
   echo "VITE_GENAI_API_KEY=your_google_genai_api_key" > .env.local
   echo "VITE_API_BASE_URL=http://localhost:8000/api" >> .env.local
   ```

3. **Start development server:**
   ```bash
   npm run dev
   # Application will be available at http://localhost:5173
   ```

## 📁 Project Structure

```
web/
├── components/           # React components
│   ├── Auth.tsx         # Authentication component
│   ├── Dashboard.tsx    # Main dashboard
│   ├── ProfilePage.tsx  # User profile management
│   ├── FileUpload.tsx   # File upload interface
│   ├── AnalysisPage.tsx # Document analysis display
│   ├── AnalysisResult.tsx # AI analysis results
│   ├── ChatPage.tsx     # AI doctor chat
│   ├── History.tsx      # Medical records history
│   └── icons/           # Custom icons
├── services/            # API service layer
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main application component
├── index.tsx           # Application entry point
└── vite.config.ts      # Vite configuration
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the web directory:

```env
# Google GenAI API Key (required for AI features)
VITE_GENAI_API_KEY=your_google_genai_api_key

# Backend API URL (default: http://localhost:8000/api)
VITE_API_BASE_URL=http://localhost:8000/api
```

### Vite Configuration

The project uses Vite with React plugin for optimal development experience:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
})
```

## 🎨 Components Overview

### Core Components

- **Auth**: Handles user authentication with simple name-based login
- **Dashboard**: Main application interface with navigation and content areas
- **ProfilePage**: User profile management with medical information
- **FileUpload**: Drag-and-drop file upload for medical documents

### AI-Powered Components

- **AnalysisPage**: Displays AI analysis of uploaded medical documents
- **AnalysisResult**: Formatted display of AI analysis results
- **ChatPage**: Interactive AI doctor consultation interface

### Utility Components

- **History**: Medical records history with search and filter capabilities
- **Icons**: Custom SVG icons for the application

## 📊 Type Definitions

```typescript
// Medical Record interface
interface MedicalRecord {
  id: string;
  recordName: string;
  type: 'lab_result' | 'prescription';
  fileUrl: string;
  analysis: string;
  createdAt: Date;
}

// User Profile interface
interface UserProfile {
  name: string;
  age: number;
  bloodType: string;
  allergies: string;
  currentConditions: string;
}
```

## 🔨 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npx tsc --noEmit
```

## 🎯 Key Features Implementation

### AI Integration
The application integrates with Google GenAI for:
- Medical document analysis
- Health consultation chat
- Intelligent recommendations

### State Management
Uses React hooks for state management:
- `useState` for component state
- `useCallback` for performance optimization
- Local state for user session and medical records

### Responsive Design
- Mobile-first approach
- Dark mode support
- Accessible UI components

## 🚀 Production Build

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **The build output will be in the `dist/` directory**

3. **Deploy to your preferred hosting service:**
   - Netlify
   - Vercel
   - GitHub Pages
   - Any static hosting service

## 🤝 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Implement proper error handling

### Component Structure
- Keep components focused and reusable
- Use proper TypeScript interfaces
- Implement loading and error states
- Follow accessibility guidelines

## 🐛 Troubleshooting

### Common Issues

1. **GenAI API not working:**
   - Check your API key in `.env.local`
   - Ensure the API key has proper permissions

2. **Backend connection issues:**
   - Verify backend is running on port 8000
   - Check CORS configuration

3. **Build issues:**
   - Clear node_modules and reinstall dependencies
   - Check TypeScript errors

## 📝 Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Test components thoroughly
4. Update documentation as needed

---

*Part of the Medical Profile Management System - Built with React and TypeScript*

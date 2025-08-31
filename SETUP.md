# Setup Instructions

## 1. Install Required Dependencies

Run the following command to install the authentication dependencies:

```bash
npm install bcryptjs jsonwebtoken @types/bcryptjs @types/jsonwebtoken
```

## 2. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="your-postgres-connection-string"

# JWT Secret (use a strong random string)
JWT_SECRET="your-very-secure-jwt-secret-key-here"

# Node Environment
NODE_ENV="development"
```

## 3. Database Migration

Run the database migration to create the tables:

```bash
npm run drizzle:migrate
```

## 4. Start the Development Server

```bash
npm run dev
```

## Authentication Flow

1. **Landing Page** (`/`): Shows welcome page with login/register options
2. **Login** (`/login`): User authentication 
3. **Register** (`/register`): User registration
4. **Dashboard** (`/dashboard`): Protected route showing user statistics
5. **Notes** (`/notes`): Protected route for managing notes
6. **Note Editor** (`/notes/[id]`): Protected route for editing individual notes

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Notes
- `GET /api/notes` - Get user's notes (with search/filter)
- `POST /api/notes` - Create new note
- `GET /api/notes/[id]` - Get specific note
- `PUT /api/notes/[id]` - Update note
- `DELETE /api/notes/[id]` - Delete note

### Tags
- `GET /api/tags` - Get user's tags
- `POST /api/tags` - Create new tag

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

## Features

✅ **User Authentication**
- Registration with email/password
- Login with JWT tokens
- Secure HTTP-only cookies
- Protected routes

✅ **Notes Management**
- Create, read, update, delete notes
- Search notes by content
- Filter notes by tags
- Rich text support

✅ **Tags System**
- Create color-coded tags
- Assign multiple tags to notes
- Filter notes by tags

✅ **Dashboard**
- Statistics overview
- Recent notes display
- Quick access to create notes

✅ **Security**
- Password hashing with bcrypt
- JWT token authentication
- CSRF protection
- Input validation

## Database Schema

The app uses the following tables:
- `users` - User accounts
- `notes` - User notes
- `tags` - User-level tags
- `note_tags` - Many-to-many relationship between notes and tags

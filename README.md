
# Slack Connect - Message Scheduling Application

A full-stack web application that enables users to send immediate messages and schedule future messages to Slack channels through OAuth integration.

## 🚀 Features

- **Slack OAuth Authentication** - Secure login with Slack workspace integration
- **Real-time Message Sending** - Instant message delivery to selected Slack channels
- **Message Scheduling** - Schedule messages for future delivery with precise timing
- **Smart Dashboard** - Auto-refreshing interface showing only upcoming scheduled messages
- **Message Management** - Cancel scheduled messages with real-time UI updates
- **Responsive Design** - Modern Material-UI interface that works across devices

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for component library
- **React Router** for navigation
- **Axios** for API communication
- **JWT** for authentication tokens

### Backend
- **Node.js** with Express.js framework
- **TypeScript** for type safety
- **SQLite** database for message persistence
- **Slack Web API** for Slack integration
- **JWT** for secure authentication
- **Background job processing** for message scheduling

## 📋 Prerequisites

- **Node.js** (version 16 or higher)
- **npm** or **yarn** package manager
- **Slack workspace** admin access (for creating Slack app)
- **Git** for cloning the repository

## 🔧 Setup Instructions

### 1. Clone the Repository

```
git clone https://github.com/yourusername/slack-connect.git
cd slack-connect
```

### 2. Slack App Configuration

1. **Create a Slack App:**
   - Go to [Slack API](https://api.slack.com/apps)
   - Click "Create New App" → "From scratch"
   - Name: "Slack Connect" (or your preferred name)
   - Select your workspace

2. **Configure OAuth & Permissions:**
   - Go to "OAuth & Permissions" in your app settings
   - Add these **Bot Token Scopes**:
     - `channels:read`
     - `chat:write`
     - `chat:write.public`
     - `groups:read`
     - `im:read`
     - `users:read`
   - Add **Redirect URL**: `http://localhost:3000/auth/callback`

3. **Install App to Workspace:**
   - Click "Install to Workspace"
   - Authorize the permissions
   - Copy the **Bot User OAuth Token** (starts with `xoxb-`)

4. **Get App Credentials:**
   - Go to "Basic Information"
   - Copy **Client ID** and **Client Secret**

### 3. Backend Setup

```
cd backend
npm install
```

**Create Environment File:**
```
cp .env.example .env
```

**Configure `.env` file:**
```
# Slack OAuth Configuration
SLACK_CLIENT_ID=your_slack_client_id_here
SLACK_CLIENT_SECRET=your_slack_client_secret_here
SLACK_REDIRECT_URI=http://localhost:3000/auth/callback

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Database
DB_PATH=./database/slack-connect.db

# Server Configuration
PORT=3001
```

**Start Backend Server:**
```
npm run dev
```

The backend will be running on `http://localhost:3001`

### 4. Frontend Setup

```
cd frontend
npm install
```

**Create Environment File:**
```
cp .env.example .env
```

**Configure `.env` file:**
```
REACT_APP_API_BASE_URL=http://localhost:3001
```

**Start Frontend Development Server:**
```
npm start
```

The frontend will be running on `http://localhost:3000`

### 5. First Time Setup

1. **Navigate to** `http://localhost:3000`
2. **Click "Login with Slack"**
3. **Authorize the application** in your Slack workspace
4. **You'll be redirected** to the dashboard upon successful authentication

## 🏗️ Architectural Overview

### Authentication Flow
```
User → Slack OAuth → Backend Token Exchange → JWT Generation → Frontend Storage
```

1. **OAuth Initialization**: Frontend redirects user to Slack's OAuth URL
2. **Authorization**: User grants permissions in Slack workspace
3. **Token Exchange**: Backend exchanges authorization code for access token
4. **JWT Creation**: Backend creates JWT containing user info and Slack tokens
5. **Session Management**: Frontend stores JWT for subsequent API requests

### Token Management Strategy

- **Access Tokens**: Short-lived JWT tokens for API authentication
- **Slack Tokens**: Long-lived tokens stored securely for Slack API calls
- **Refresh Mechanism**: Automatic token renewal using Slack refresh tokens
- **Security**: All API endpoints protected with JWT middleware

### Message Scheduling Architecture

```
Frontend Schedule Request → Database Storage → Slack API Scheduling → Real-time UI Updates
```

**Components:**
- **Immediate Messages**: Direct API calls to Slack's `chat.postMessage`
- **Scheduled Messages**: Uses Slack's `chat.scheduleMessage` API
- **Database Persistence**: SQLite stores scheduling metadata
- **Real-time Updates**: Frontend auto-refresh every 5 seconds
- **Smart Filtering**: Only displays upcoming scheduled messages

### Database Schema

**Users Table:**
```
- id (Primary Key)
- slack_user_id 
- team_id
- access_token (encrypted)
- refresh_token (encrypted)
- token_expiry
- timestamps
```

**Scheduled Messages Table:**
```
- id (Primary Key)
- user_id (Foreign Key)
- channel
- message
- scheduled_at
- status (pending/sent/cancelled)
- slack_message_id
- timestamps
```

### Background Job Processing

- **Message Status Tracking**: Real-time filtering removes expired messages
- **Database Cleanup**: Automatic removal of sent/cancelled messages
- **Error Handling**: Comprehensive error logging and recovery

## 🧪 API Endpoints

### Authentication
- `GET /auth/slack` - Initiate Slack OAuth
- `GET /auth/callback` - Handle OAuth callback
- `POST /auth/refresh` - Refresh expired tokens

### Messages
- `GET /messages/channels` - List available Slack channels
- `POST /messages/send` - Send immediate message
- `POST /messages/schedule` - Schedule future message
- `GET /messages/scheduled` - List upcoming scheduled messages
- `DELETE /messages/scheduled/:id` - Cancel scheduled message

## 🚧 Challenges & Learnings

### 1. **OAuth Integration Complexity**
**Challenge**: Implementing secure Slack OAuth with proper token management
**Solution**: Created dedicated JWT service with refresh token handling and secure token storage

**Key Learning**: OAuth flow requires careful state management and proper error handling at each step

### 2. **Real-time UI Updates**
**Challenge**: Scheduled messages not disappearing from dashboard after their time passed
**Solution**: Implemented dual-layer approach:
- 5-second frontend filtering for immediate UI updates
- 60-second backend refresh for data consistency

**Key Learning**: Real-time UX requires both client-side optimization and server-side reliability

### 3. **Message Cancellation Issues**
**Challenge**: Cancelled messages reappearing after page refresh
**Solution**: Changed from status updates to actual database deletion
- Frontend: Optimistic UI updates
- Backend: Immediate database deletion
- Error handling: Rollback on API failures

**Key Learning**: Database operations must match user expectations - "cancelled" should mean "gone"

### 4. **Database Connection Timing**
**Challenge**: Background jobs initializing before database connection established
**Solution**: Moved all database-dependent services inside the async server startup function

**Key Learning**: Proper dependency injection and service lifecycle management is crucial

### 5. **Token Expiry Management**
**Challenge**: Users getting logged out unexpectedly due to token expiry
**Solution**: Implemented comprehensive token refresh mechanism with graceful degradation

**Key Learning**: Authentication systems need robust error handling and user-friendly fallbacks

## 🔐 Security Considerations

- **Environment Variables**: All sensitive credentials stored in `.env` files
- **JWT Security**: Tokens signed with strong secrets and reasonable expiry times
- **API Protection**: All endpoints protected with authentication middleware
- **Input Validation**: Comprehensive validation on all user inputs
- **Error Handling**: Secure error messages that don't leak sensitive information

## 🚀 Deployment Notes

### Production Considerations

1. **Environment Variables**: Update all URLs to production domains
2. **Database**: Consider migrating to PostgreSQL for production
3. **SSL/TLS**: Ensure HTTPS for OAuth redirects
4. **Monitoring**: Add logging and error tracking (e.g., Sentry)
5. **Rate Limiting**: Implement API rate limiting for production use

### Slack App Configuration for Production

- Update OAuth redirect URLs to production domain
- Configure proper scopes for your use case
- Set up Slack app distribution if needed

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. **Check the console logs** in both frontend and backend
2. **Verify Slack app configuration** matches the setup instructions
3. **Ensure all environment variables** are properly set
4. **Check database permissions** and file paths

## 🙏 Acknowledgments

- **Slack API Documentation** for comprehensive OAuth guidance
- **Material-UI Team** for the excellent React component library
- **Express.js Community** for the robust backend framework

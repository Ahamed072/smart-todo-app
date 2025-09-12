# 🤖 Smart AI To-Do List Application

A modern, AI-powered task management application built with React, Node.js, and SQLite. Features intelligent task extraction, real-time notifications, voice input, and comprehensive task filtering.

![Smart AI Todo App](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![React](https://img.shields.io/badge/React-18.x-blue)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![SQLite](https://img.shields.io/badge/Database-SQLite-lightblue)

## ✨ Features

### 🎯 Core Task Management
- ✅ Create, edit, delete, and complete tasks
- 🎨 Priority levels (High, Medium, Low) with color coding
- 📁 Categories (Work, Personal, Health, Finance, Development, etc.)
- ⏰ Deadline management with overdue detection
- 📊 Status tracking (Pending, In Progress, Completed)

### 🔍 Advanced Search & Filtering
- 🔎 Real-time search across task titles, descriptions, and categories
- 🎛️ Filter by status, priority, and deadlines
- 📈 Clickable statistics cards for instant filtering
- 🧹 Clear filters functionality

### 🤖 AI-Powered Features
- 🧠 Intelligent task extraction from natural language
- 📊 AI insights and productivity analytics
- 📝 Bulk import from emails/notes
- 📋 Daily summary generation
- 🎤 Voice input integration (Web Speech API)

### ⚡ Real-Time Features
- 🔔 WebSocket notifications
- ⚡ Instant task updates
- 📊 Live statistics
- 🔄 Real-time filtering and search

### 🎨 Modern UI/UX
- 💎 Professional Tailwind CSS design
- 📱 Responsive grid and list views
- 🖼️ Interactive modals and panels
- ⏳ Loading states and error handling

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed:
- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/ahamed072/smart-ai-todo-app.git
   cd smart-ai-todo-app
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Initialize the database**
   ```bash
   node scripts/initDatabase.js
   ```

5. **Start the backend server**
   ```bash
   npm start
   ```
   The backend will start on `http://localhost:5000`

6. **Start the frontend (in a new terminal)**
   ```bash
   cd client
   npm run dev
   ```
   The frontend will start on `http://localhost:3000`

7. **Open your browser**
   Navigate to `http://localhost:3000` and login with:
   - **Username:** `admin`
   - **Password:** `Admin@12`

## 📋 Usage Guide

### 🔐 Login
- Use the credentials: `admin` / `Admin@12`
- The app uses simple authentication for demonstration

### ➕ Creating Tasks
1. Click the **"Add Task"** button
2. Fill in task details (title, description, priority, category, deadline)
3. Click **"Save"** to create the task

### 🔍 Searching and Filtering
- **Search:** Use the search bar to find tasks by title, description, or category
- **Quick Filters:** Click on any statistics card (Total, Completed, Pending, etc.) to filter tasks
- **Dropdown Filter:** Use the filter dropdown for more specific filtering options
- **Clear Filters:** Click "Clear" to reset all filters

### 🤖 AI Features
- **Voice Input:** Click the microphone icon to add tasks using voice
- **Bulk Import:** Use the "Bulk Import" button to extract multiple tasks from text
- **AI Insights:** Click "AI Insights" to see productivity analytics and recommendations

### 📊 Task Management
- **Complete Tasks:** Click the checkmark icon on any task
- **Edit Tasks:** Click on a task to open the edit modal
- **Delete Tasks:** Click the delete icon (with confirmation)
- **View Modes:** Switch between grid and list views

## 🛠️ Technical Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database (PostgreSQL compatible schema)
- **WebSocket** - Real-time notifications
- **JWT** - Authentication
- **AI Integration** - OpenRouter API (with fallback to mock responses)

### Frontend
- **React 18** - Frontend framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **Lucide React** - Icon library
- **Context API** - State management

### Features
- **Real-time WebSocket notifications**
- **Voice recognition (Web Speech API)**
- **AI task extraction and insights**
- **Responsive design**
- **Error boundaries and loading states**

## 📁 Project Structure

```
smart-ai-todo-app/
├── 📄 package.json              # Backend dependencies
├── 🚀 server.js                 # Main server file
├── 🌍 .env                      # Environment variables
├── 📂 client/                   # Frontend React app
│   ├── 📄 package.json
│   ├── ⚡ vite.config.js
│   ├── 🎨 tailwind.config.js
│   └── 📂 src/
│       ├── 📱 App.jsx
│       ├── 🎯 main.jsx
│       ├── 📂 components/       # Reusable UI components
│       ├── 📂 contexts/         # React Context providers
│       ├── 📂 pages/            # Page components
│       └── 📂 services/         # API services
├── 📂 controllers/              # API route handlers
├── 📂 models/                   # Database models
├── 📂 routes/                   # API routes
├── 📂 services/                 # Business logic services
├── 📂 middleware/               # Authentication middleware
├── 📂 scripts/                  # Database initialization
└── 📂 database/                 # SQLite database files
```

## ⚙️ Configuration

### Environment Variables
The `.env` file contains important configuration:

```env
NODE_ENV=development
PORT=5000
DB_PATH=./database/tasks.db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@12
OPENROUTER_API_KEY=your-openrouter-api-key-here
WS_PORT=8080
```

### AI Configuration
- The app currently uses mock AI responses by default
- To enable full AI features, get an API key from [OpenRouter](https://openrouter.ai/)
- Update `OPENROUTER_API_KEY` in the `.env` file

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/complete` - Mark task as complete

### AI Features
- `POST /api/ai/extract-tasks` - Extract tasks from text
- `POST /api/ai/enhance-task` - Enhance task with AI suggestions
- `GET /api/ai/insights` - Get productivity insights
- `GET /api/ai/daily-summary` - Get daily task summary

### Notifications
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications/test` - Create test notification
- `PUT /api/notifications/:id/read` - Mark notification as read

## 🧪 Development

### Running in Development Mode
```bash
# Backend (with auto-restart)
npm run dev

# Frontend (with hot reload)
cd client && npm run dev
```

### Database Management
```bash
# Initialize/reset database
node scripts/initDatabase.js

# The database file is located at: ./database/tasks.db
```

### Testing the API
You can test the API endpoints using curl or tools like Postman:

```bash
# Login to get a token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@12"}'

# Create a task (replace TOKEN with the JWT from login)
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"Test Task","description":"A test task","priority":"High","category":"Work"}'
```

## 🎨 Customization

### Adding New Categories
Edit the task creation modal in `client/src/components/TaskModal.jsx` to add new categories.

### Changing Color Themes
Modify the Tailwind configuration in `client/tailwind.config.js` to customize colors.

### Adding New AI Models
Update `services/AIService.js` to integrate with different AI providers.

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill processes on ports 5000 and 3000
   lsof -ti:5000 | xargs kill -9
   lsof -ti:3000 | xargs kill -9
   ```

2. **Database Issues**
   ```bash
   # Reinitialize the database
   rm database/tasks.db
   node scripts/initDatabase.js
   ```

3. **Node Modules Issues**
   ```bash
   # Clean install
   rm -rf node_modules client/node_modules
   npm install
   cd client && npm install
   ```

4. **AI Features Not Working**
   - AI features fall back to mock responses by default
   - To enable full AI: Get an OpenRouter API key and update `.env`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Ahamed Rizwan**
- GitHub: [@ahamed072](https://github.com/ahamed072)

## 🙏 Acknowledgments

- Built with modern web technologies
- AI-powered features for enhanced productivity
- Responsive design for all devices
- Real-time updates for better user experience

---

## 🚀 Ready to Get Started?

1. Clone the repo
2. Run `npm install` in both root and client folders
3. Initialize the database with `node scripts/initDatabase.js`
4. Start both backend (`npm start`) and frontend (`cd client && npm run dev`)
5. Open `http://localhost:3000` and login with `admin` / `Admin@12`

**Happy task managing! 🎯**

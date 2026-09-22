# 🌐 DevConnect

<p align="center">
  <strong>A production-grade developer community platform combining the networking power of LinkedIn with the content richness of dev.to — built with the MERN stack.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Stack-MERN-00D8FF?style=for-the-badge&logo=react&logoColor=white" alt="MERN Stack" />
  <img src="https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-Backend-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT" />
</p>

---

## 📌 Repository Overview

**DevConnect** is a modern, full-stack social networking and technical publishing platform engineered for software engineers, designers, and tech professionals. It features enterprise-grade authentication with rotating JWT tokens, real-time WebSocket notifications and presence tracking, rich markdown authoring with Cloudinary media management, and complete containerization via Docker.

---

## ✨ Key Features

### 🔐 Authentication & Security
- **Dual-Token System**: Short-lived Access Tokens (15m) + secure Refresh Tokens (7d) stored in `httpOnly`, `SameSite` cookies.
- **Automatic Token Rotation**: Axios interceptors seamlessly handle token renewal on `401 Unauthorized`.
- **Protected Routes & Role Guards**: Robust client and server-side authorization middleware.
- **Data Validation & Sanitization**: Zod validation schemas on forms and Express validation middleware.

### 📝 Content & Developer Feed
- **Rich Markdown Engine**: Interactive Markdown authoring with live preview, syntax highlighting, custom cover images, tags, and automatic reading-time calculation.
- **Smart Feed Algorithm**: Chronological community feed and personalized following-based feeds.
- **Full-Text Search**: Optimized MongoDB text indexing across post titles, tags, content, and user bios.
- **Engagements**: Threaded comments, optimistic liking, and personal bookmarking.

### ⚡ Real-Time Engine (Socket.io)
- **Instant Notifications**: Targeted room delivery for likes, comments, and new followers.
- **Live Online Presence**: Dynamic online/offline indicator for active developers.
- **Unread Badges**: Real-time counter updates without page refreshes.

### 👤 Developer Profiles
- **Portfolio Showcases**: Bio, tech skills, GitHub link, personal website, and social links.
- **Cloudinary Asset Storage**: Direct-to-cloud profile avatar and cover image uploads with automatic resizing and optimization.
- **Follow Network**: Follow/unfollow system with follower and following counters.

### 🐳 DevOps & Architecture
- **Dockerized Environment**: Multi-stage build Dockerfiles for backend and frontend with `docker-compose`.
- **Production Reverse Proxy**: Production-ready NGINX configuration for serving the SPA frontend.
- **CI/CD Automation**: GitHub Actions workflow running automated linting, test suites, and build verifications.

---

## 🛠️ Tech Stack & Architecture

### **Frontend**
- **Core**: React 18, Vite
- **Styling**: Tailwind CSS, PostCSS
- **State & Caching**: TanStack React Query v5 (server-state cache, optimistic updates), React Context API (Auth & Socket states)
- **Form Handling**: React Hook Form, Zod
- **Routing & Networking**: React Router DOM v6, Axios with request/response interceptors

### **Backend**
- **Runtime**: Node.js (v20+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-Time**: Socket.io
- **Media**: Cloudinary SDK, Multer
- **Security**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `cookie-parser`, `cors`, `helmet`

---

## 📂 Project Structure

```text
devconnect/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI pipeline
├── backend/
│   ├── config/                  # MongoDB & Cloudinary configuration
│   ├── controllers/             # Request handlers & business logic
│   ├── middleware/              # Auth, validation, upload, error middleware
│   ├── models/                  # Mongoose models (User, Post, Comment, Notification)
│   ├── routes/                  # Express REST route definitions
│   ├── socket/                  # Socket.io connection & event handlers
│   ├── utils/                   # ApiError, ApiResponse, asyncHandler, token helpers
│   ├── Dockerfile               # Production multi-stage Docker build
│   └── server.js                # Server entry point & HTTP/WS initialization
├── frontend/
│   ├── public/                  # Static assets & SVG icons
│   ├── src/
│   │   ├── api/                 # Axios client with interceptors
│   │   ├── components/          # Reusable UI components & layouts
│   │   ├── context/             # AuthContext & SocketContext
│   │   ├── hooks/               # Custom React Query & WebSocket hooks
│   │   ├── pages/               # Route views (Home, Profile, PostDetail, etc.)
│   │   └── App.jsx              # Application router
│   ├── Dockerfile               # Multi-stage build with Nginx
│   ├── nginx.conf               # Production Nginx reverse proxy
│   └── vite.config.js           # Vite development server & proxy config
├── docker-compose.yml           # Multi-container orchestration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v20 or higher
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account or local MongoDB instance
- [Cloudinary](https://cloudinary.com/) free tier account for media uploads

### 1. Clone the Repository
```bash
git clone https://github.com/<YOUR_USERNAME>/devconnect.git
cd devconnect
```

### 2. Configure Environment Variables

#### Backend (`backend/.env`):
```bash
cp backend/.env.example backend/.env
```
Fill in the following fields:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/devconnect?retryWrites=true&w=majority
JWT_ACCESS_SECRET=your_jwt_access_secret_min_64_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_64_chars
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_ORIGIN=http://localhost:5173
```

> **Tip**: Generate 64-byte random secrets for JWT:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

#### Frontend (`frontend/.env`):
```bash
cp frontend/.env.example frontend/.env
```
*(Default settings route via Vite proxy during development; no changes required for local dev).*

---

### 3. Install Dependencies & Run

#### Run with Local Node.js:

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

#### Run with Docker Compose:

Ensure your `backend/.env` is configured, then run:
```bash
docker-compose up --build
```
Access the application at **`http://localhost`**.

---

## 📡 REST API Reference

All backend API endpoints are namespaced under `/api/v1`.

| Module | Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/auth/register` | Register a new developer | ❌ |
| | `POST` | `/auth/login` | Authenticate user & issue tokens | ❌ |
| | `POST` | `/auth/refresh` | Rotate refresh token | Cookie |
| | `POST` | `/auth/logout` | Clear refresh token & session | ✅ |
| | `GET` | `/auth/me` | Fetch authenticated user data | ✅ |
| **Users** | `GET` | `/users/:username` | Fetch user profile by username | ❌ |
| | `PUT` | `/users/profile` | Update profile information | ✅ |
| | `POST` | `/users/avatar` | Upload and set user avatar | ✅ |
| | `POST` | `/users/:id/follow` | Toggle follow / unfollow status | ✅ |
| **Posts** | `GET` | `/posts` | Get paginated community posts | ❌ |
| | `POST` | `/posts` | Publish a new markdown post | ✅ |
| | `GET` | `/posts/feed` | Personalized feed of followed creators | ✅ |
| | `GET` | `/posts/search` | Search posts with full-text queries | ❌ |
| | `POST` | `/posts/:id/like` | Like or unlike a post | ✅ |
| | `POST` | `/posts/:id/bookmark`| Save or remove post from bookmarks | ✅ |
| **Comments**| `GET`| `/comments/post/:id` | Fetch comments for a post | ❌ |
| | `POST` | `/comments/post/:id` | Add comment to a post | ✅ |
| | `POST` | `/comments/:id/reply`| Reply to an existing comment | ✅ |
| **Notifications** | `GET` | `/notifications` | Retrieve user notifications | ✅ |
| | `PUT` | `/notifications/read-all` | Mark all notifications as read | ✅ |

---

## 🧪 CI/CD & Testing

This project incorporates automated CI through GitHub Actions (`.github/workflows/ci.yml`):
- Runs ESLint validation across both backend and frontend workspaces.
- Validates production frontend builds via Vite.
- Ensures dependency integrity on pull requests and pushes to `main`.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ for developers by <a href="https://github.com/preettt10"><strong>Preet</strong></a>
</p>

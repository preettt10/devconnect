# DevConnect

> A production-grade developer community platform — LinkedIn + dev.to built with the MERN stack.

![DevConnect](https://img.shields.io/badge/stack-MERN-brightgreen)
![Node](https://img.shields.io/badge/node-20+-blue)
![React](https://img.shields.io/badge/react-18-61DAFB)
![License](https://img.shields.io/badge/license-MIT-yellow)

## Features

- 🔐 **JWT Auth** — Access token (15m) + Refresh token (7d) rotation with httpOnly cookies
- 👤 **Developer Profiles** — Bio, skills, GitHub, portfolio, avatar via Cloudinary
- 📝 **Rich Posts** — Markdown editor with live preview, cover image, tags, read time
- ❤️ **Interactions** — Like, comment (threaded), bookmark, follow/unfollow
- 🔍 **Full-text Search** — MongoDB text indexes on posts and users
- 🔔 **Real-time Notifications** — Socket.io targeted room-based delivery
- 🟢 **Online Presence** — Live online/offline status tracking
- 🐳 **Docker** — Multi-stage builds, docker-compose, nginx
- 🚀 **CI/CD** — GitHub Actions pipeline

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js v20+ |
| Backend | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh) |
| Real-time | Socket.io |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v4 |
| State | Context API + useReducer |
| Server state | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| HTTP client | Axios with interceptors |

## Project Structure

```
devconnect/
├── backend/          # Express API
│   ├── config/       # DB + Cloudinary
│   ├── controllers/  # Business logic
│   ├── middleware/   # Auth, error, validate, upload
│   ├── models/       # Mongoose schemas
│   ├── routes/       # Express routers
│   ├── socket/       # Socket.io setup
│   └── utils/        # Helpers
├── frontend/         # React + Vite app
│   └── src/
│       ├── api/      # Axios instance
│       ├── components/
│       ├── context/  # Auth + Socket contexts
│       ├── hooks/    # React Query hooks
│       └── pages/    # All 8 pages
├── .github/workflows/ci.yml
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Node.js v20+
- MongoDB Atlas account → [mongodb.com/atlas](https://mongodb.com/atlas)
- Cloudinary account → [cloudinary.com](https://cloudinary.com)

### 1. Clone & Install

```bash
git clone https://github.com/yourname/devconnect.git
cd devconnect

# Install backend
cd backend && npm install

# Install frontend
cd ../frontend && npm install
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
```

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | 64-char random string |
| `JWT_REFRESH_SECRET` | 64-char random string |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |
| `CLIENT_ORIGIN` | `http://localhost:5173` for local dev |

Generate JWT secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Frontend** (`frontend/.env`):
```bash
cp frontend/.env.example frontend/.env
# No changes needed for local dev — Vite proxy handles /api routing
```

### 3. Run Locally

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open → [http://localhost:5173](http://localhost:5173)

### 4. Run with Docker

```bash
# Fill in backend/.env first, then:
docker-compose up --build
```

Open → [http://localhost](http://localhost)

## API Reference

All endpoints are under `/api/v1/`.

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Login → tokens |
| POST | `/auth/refresh` | Cookie | Rotate refresh token |
| POST | `/auth/logout` | Yes | Invalidate tokens |
| GET | `/auth/me` | Yes | Current user |
| GET | `/users/:username` | No | Public profile |
| PUT | `/users/profile` | Yes | Update profile |
| POST | `/users/avatar` | Yes | Upload avatar |
| POST | `/users/:id/follow` | Yes | Follow/unfollow |
| GET | `/posts` | No | All posts (paginated) |
| POST | `/posts` | Yes | Create post |
| GET | `/posts/feed` | Yes | Personalized feed |
| GET | `/posts/search` | No | Full-text search |
| POST | `/posts/:id/like` | Yes | Like/unlike |
| POST | `/posts/:id/bookmark` | Yes | Bookmark toggle |
| GET | `/comments/post/:id` | No | Post comments |
| POST | `/comments/post/:id` | Yes | Add comment |
| POST | `/comments/:id/reply` | Yes | Reply to comment |
| GET | `/notifications` | Yes | My notifications |
| PUT | `/notifications/read-all` | Yes | Mark all read |

## Deployment

### Backend (Render / Railway)

1. Connect your GitHub repo
2. Set all environment variables from `.env.example`
3. Set `CLIENT_ORIGIN` to your Vercel frontend URL
4. Build command: `npm install`
5. Start command: `node server.js`

### Frontend (Vercel)

1. Connect your GitHub repo, root = `frontend/`
2. Set `VITE_API_URL` = `https://your-backend.onrender.com/api/v1`
3. Set `VITE_SOCKET_URL` = `https://your-backend.onrender.com`

## License

MIT — see [LICENSE](LICENSE)

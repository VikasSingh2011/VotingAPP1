# 🗳️ Enterprise Voting App

<div align="center">

![Enterprise Voting](https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io)

**A full-stack, real-time, secure online voting platform built with Node.js, React, and MongoDB.**

### 🌐 [Live Demo → https://voting-app-ixar.onrender.com](https://voting-app-ixar.onrender.com)

</div>

---

## ✨ Features

### 👤 Voter Features
- **Secure Registration & Login** — Register using Aadhar Card Number, name, age, and address
- **JWT-Based Authentication** — Access tokens + Refresh tokens for secure sessions
- **Vote in Elections** — Browse active elections, view approved candidates, and cast your vote
- **One Person, One Vote** — System strictly prevents double voting per election
- **Live Vote Tallies** — Real-time vote count updates powered by **Socket.IO** (no page refresh needed)
- **Election Results** — View results with a beautiful bar chart visualization
- **Dark / Light Mode** — Toggle between dark and light themes

### 🛡️ Admin Features
- **Admin Control Panel** — Dedicated dashboard for administrators
- **Candidate Management** — Add, approve, or reject candidate applications
- **Party Symbol Picker** — Assign unique party symbols to each candidate
- **Election Management** — Create elections, set start/end dates, activate or close elections
- **View Analytics** — Monitor election participation and vote distribution
- **Audit Trail** — Every vote action is logged with `voteAudit` for transparency
- **Declare Results** — Officially declare election results with one click

### 🔒 Security Features
- **Password Hashing** — All passwords are hashed using **bcrypt** before storing
- **Helmet.js** — Sets secure HTTP headers to protect against common attacks
- **Rate Limiting** — Prevents brute-force attacks on API endpoints
- **CORS Protection** — Strict origin validation for API access
- **Input Validation** — All inputs validated server-side using **express-validator**
- **Passport.js** — Strategy-based local authentication middleware
- **Refresh Token Rotation** — Secure token management with HTTP-only cookies

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | Server-side JavaScript runtime |
| **Express.js v5** | Web framework for REST API |
| **MongoDB** | NoSQL database for storing users, elections, votes |
| **Mongoose** | ODM for MongoDB schema modeling |
| **Socket.IO** | Real-time bidirectional communication |
| **JWT (jsonwebtoken)** | Authentication via access & refresh tokens |
| **Bcrypt** | Secure password hashing |
| **Passport.js** | Authentication middleware |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | API rate limiting |
| **express-validator** | Input sanitization and validation |
| **dotenv** | Environment variable management |
| **Nodemailer** | Email notifications |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI component library |
| **Vite** | Fast development build tool |
| **Socket.IO Client** | Real-time vote updates on the UI |
| **Axios** | HTTP requests to backend API |
| **Vanilla CSS** | Custom styling with dark/light mode support |

### DevOps & Deployment
| Technology | Purpose |
|---|---|
| **Docker** | Containerized deployment (multi-stage build) |
| **Docker Compose** | Local multi-container development |
| **Render** | Cloud hosting platform |
| **MongoDB Atlas** | Cloud database hosting |
| **Nodemon** | Auto-restart server in development |
| **Concurrently** | Run backend and frontend simultaneously in dev |

---

## 📁 Project Structure

```
Voting App/
├── 📂 controllers/          # Business logic (auth, candidates, elections, users)
│   ├── authController.js
│   ├── candidateController.js
│   ├── electionController.js
│   └── userController.js
├── 📂 models/               # MongoDB Schemas
│   ├── user.js              # Voter/Admin user model
│   ├── candidate.js         # Candidate model with party info
│   ├── election.js          # Election model with status management
│   ├── voteAudit.js         # Immutable vote audit log
│   ├── voteTracker.js       # Tracks who voted in which election
│   └── otpVerification.js   # OTP model for verification
├── 📂 routes/               # Express API routes
│   ├── userRoutes.js
│   ├── candidateRoutes.js
│   └── electionRoutes.js
├── 📂 middlewares/          # Custom middleware (auth guards, validators)
├── 📂 utils/                # Helper utilities (JWT, validators)
├── 📂 services/             # Service layer (email, etc.)
├── 📂 public/               # Static files
├── 📂 frontend/             # React + Vite frontend app
│   └── src/
│       ├── pages/
│       │   ├── Auth.jsx            # Login & Signup page
│       │   ├── Dashboard.jsx       # Voter dashboard
│       │   └── AdminDashboard.jsx  # Admin control panel
│       ├── components/
│       │   ├── BarChart.jsx        # Vote result visualization
│       │   ├── PartySymbol.jsx     # Renders emoji party symbols
│       │   └── ThemeToggle.jsx     # Dark/Light mode toggle
│       ├── context/
│       │   └── AuthContext.jsx     # Global auth state management
│       └── services/
│           └── api.js              # Axios instance with interceptors
├── server.js                # Main Express + Socket.IO server
├── db.js                    # MongoDB connection
├── Dockerfile.render        # Docker build for Render deployment
├── docker-compose.yml       # Local Docker development setup
└── render.yaml              # Render deployment configuration
```

---

## 🚀 Getting Started (Local Setup)

### Prerequisites
- **Node.js** v18 or higher
- **MongoDB** (local or MongoDB Atlas account)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/VikasSingh2011/VotingAPP1.git
cd VotingAPP1
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3001
MONGODB_URL=mongodb://localhost:27017/voting
JWT_SECRET=your_super_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
```

### 4. Run the App
```bash
npm run dev
```
This starts both the backend (port **3001**) and frontend (port **5173**) simultaneously.

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api

---

## 🐳 Run with Docker

```bash
# Build and start all containers
npm run docker

# Or directly with Docker Compose
docker-compose up --build
```

- **App:** http://localhost (served on port 80)

---

## 📡 API Endpoints

### Auth Routes (`/api/user`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/user/signup` | Register a new voter |
| POST | `/api/user/login` | Login and receive JWT tokens |
| POST | `/api/user/logout` | Logout and clear session |
| GET | `/api/user/profile` | Get current user profile |
| POST | `/api/user/refresh-token` | Refresh access token |

### Candidate Routes (`/api/candidate`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/candidate` | Get all approved candidates |
| POST | `/api/candidate` | Add new candidate (Admin) |
| PUT | `/api/candidate/:id/approve` | Approve candidate (Admin) |
| DELETE | `/api/candidate/:id` | Remove candidate (Admin) |

### Election Routes (`/api/election`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/election` | Get all elections |
| POST | `/api/election` | Create new election (Admin) |
| POST | `/api/election/:id/vote` | Cast a vote |
| GET | `/api/election/:id/result` | Get election results |
| PUT | `/api/election/:id/status` | Update election status (Admin) |

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 3001) |
| `MONGODB_URL` | Yes | MongoDB connection string (local) |
| `MONGODB_URI` | Yes | MongoDB connection string (production/Render) |
| `JWT_SECRET` | Yes | Secret key for access tokens |
| `JWT_REFRESH_SECRET` | Yes | Secret key for refresh tokens |
| `NODE_ENV` | No | Set to `production` in deployment |
| `FRONTEND_URL` | No | Frontend URL for CORS |

---

## ☁️ Deployment (Render)

This project is configured for **one-click deployment** on Render using `render.yaml`.

### Steps:
1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
3. Connect your GitHub repository (`VikasSingh2011/VotingAPP1`)
4. Add the environment variable: `MONGODB_URI` → your MongoDB Atlas connection string
5. Click **Apply** — Render handles everything else automatically!

### MongoDB Atlas Setup:
1. Create a free cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a database user with a strong password
3. Go to **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`)
4. Copy the connection string (format: `mongodb+srv://user:password@cluster.mongodb.net/voting`)
5. Set it as `MONGODB_URI` in Render's Environment settings

---

## 👥 User Roles

| Role | How to Get It | Permissions |
|---|---|---|
| **Voter** | Default role on signup | Register, Login, Vote, View Results |
| **Admin** | Set manually in database | Everything + Manage Candidates & Elections |

> **To make a user Admin:** Go to MongoDB Atlas → Data Explorer → users collection → find your user → change `role` field from `"voter"` to `"admin"`.

---

## 🔄 Real-Time Voting (Socket.IO)

The app uses **WebSocket connections via Socket.IO** to update vote tallies live:
- When a voter submits a vote, the server emits a `vote-update` event
- All connected clients (admin dashboard, voter dashboards) instantly receive the updated vote counts
- No page refresh required!

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [ISC License](LICENSE).

---

## 👨‍💻 Developer

**Vikas Singh**
🔗 GitHub: [@VikasSingh2011](https://github.com/VikasSingh2011)
📧 Email: singhvikas1004@gmail.com

---

<div align="center">

Made with ❤️ | ⭐ Star this repo if you found it helpful!

**🌐 [Live Demo → https://voting-app-ixar.onrender.com](https://voting-app-ixar.onrender.com)**

</div>

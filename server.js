const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./db');
const { errorHandler } = require('./middlewares/errorMiddleware');

// Load env vars
dotenv.config();

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 3000;
const frontendDistPath = path.join(__dirname, 'frontend', 'dist');
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
    process.env.RENDER_EXTERNAL_URL,
    'http://localhost',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
].filter(Boolean);

// The frontend container proxies API traffic through nginx, so Express needs
// to trust the forwarded client headers for rate limiting and secure cookies.
app.set('trust proxy', 1);

// Create HTTP Server and Socket.io instance
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

// Pass io to request object so controllers can use it
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Socket Connection Handling
io.on('connection', (socket) => {
    console.log(`Socket Connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
        console.log(`Socket Disconnected: ${socket.id}`);
    });
});

// Security Middlewares
app.use(helmet()); // Set security HTTP headers
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 mins
    max: 100 // 100 requests per 10 mins
});
app.use(limiter);

// Body parser
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
    res.status(200).json({ success: true, status: 'ok' });
});

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(frontendDistPath));
} else {
    // Serve old frontend temporarily for backward compatibility until React is ready
    app.use(express.static('public'));
}

// Import Routers
const userRoutes = require('./routes/userRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const electionRoutes = require('./routes/electionRoutes');

// Mount Routers
app.use('/api/user', userRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/election', electionRoutes);

if (process.env.NODE_ENV === 'production') {
    app.get(/.*/, (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
            return next();
        }
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
}

// Error Handling Middleware
app.use(errorHandler);

server.listen(PORT, () => {
    console.log(`\n================================================`);
    console.log(`🚀 Application successfully started!`);
    console.log(`👉 Frontend (Website): http://localhost`);
    console.log(`👉 Backend (API): http://localhost:${PORT}/api`);
    console.log(`================================================\n`);
});

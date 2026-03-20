const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

const app = express();

// --- 1. LAN Access Control (The Bouncer) ---
const allowOnlyLan = (req, res, next) => {
    let ip = req.ip || req.connection.remoteAddress;
    if (ip.substr(0, 7) === "::ffff:") ip = ip.substr(7);

    // Allow Localhost (127.0.0.1) & Private IPs (192.168.x.x, 10.x.x.x)
    const isLocal = ip === '127.0.0.1' || ip === '::1';
    const isPrivate = ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.');

    if (isLocal || isPrivate) {
        next();
    } else {
        console.log(`⛔ Blocked external access from: ${ip}`);
        res.status(403).send('Access Denied: Local Network Only.');
    }
};
app.use(allowOnlyLan);

// --- 2. Security & Performance ---
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, 
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// --- 3. Database & Basics ---
connectDB();
app.use(cors({ origin: '*', credentials: true })); 
app.use(express.json());

// FIXED: Use absolute path for uploads (prevents broken images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 4. Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/support', require('./routes/support'));
app.use('/api/products', require('./routes/products'));
app.use('/api/lead-products', require('./routes/leadProducts'));
app.use('/api/product-orders', require('./routes/productOrders'));
app.use('/api/dashboard', require('./routes/dashboard'));

// --- 5. Start Secure Server (HTTPS) ---
const PORT = process.env.PORT || 5000;

// Check if SSL keys exist (fallback to HTTP if missing to prevent crash)
if (fs.existsSync('server.key') && fs.existsSync('server.cert')) {
    const sslOptions = {
        key: fs.readFileSync('server.key'),
        cert: fs.readFileSync('server.cert')
    };
    https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
        console.log(`🔒 Secure Server running on LAN port ${PORT}`);
    });
} else {
    console.log("⚠️ No SSL Keys found! Running in insecure HTTP mode.");
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on LAN port ${PORT}`);
    });
}
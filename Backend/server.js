const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');

// Initialize Express ONLY ONCE
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500', 
        'https://food-court-service.onrender.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true 
}));

app.use(express.json());

app.use(express.static(path.join(__dirname, '../Frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log("DB Error:", err));

// --- 4. API Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/staff', require('./routes/staff'));
// Add other routes (users, staff) here as needed

// --- 5. Default Route ---
// Send users to login.html if they hit an unknown route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/html/login.html'));
});

// --- 6. Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
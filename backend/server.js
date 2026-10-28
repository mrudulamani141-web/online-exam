/**
 * Web-Based Examination Management System - Express Backend Server
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./src/config/config');
const { isSupabaseConfigured } = require('./src/config/supabase');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

// Route Imports
const authRoutes = require('./src/routes/authRoutes');
const examRoutes = require('./src/routes/examRoutes');
const questionRoutes = require('./src/routes/questionRoutes');
const attemptRoutes = require('./src/routes/attemptRoutes');
const userRoutes = require('./src/routes/userRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logger (Development friendly)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Serve Frontend Static Assets (Unified Full-Stack Deployment)
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    version: '1.0.0',
    supabaseConnected: isSupabaseConfigured,
    storageEngine: isSupabaseConfigured ? 'Supabase PostgreSQL Cloud' : 'Local Persistent Engine (Fallback Active)',
    timestamp: new Date().toISOString()
  });
});

// Mount API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/users', userRoutes);

// SPA Fallback for Direct Navigation
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
const server = app.listen(config.port, () => {
  console.log('====================================================');
  console.log(`🚀 Examination Management System Server Running`);
  console.log(`🌐 Server Port:     http://localhost:${config.port}`);
  console.log(`📁 Frontend:        http://localhost:${config.port}/index.html`);
  console.log(`📡 Health Check:    http://localhost:${config.port}/api/health`);
  console.log(`🗄️ Database Mode:   ${isSupabaseConfigured ? 'Supabase PostgreSQL Cloud' : 'Local Fallback Active (Zero Setup Required)'}`);
  console.log('====================================================');
});

module.exports = { app, server };

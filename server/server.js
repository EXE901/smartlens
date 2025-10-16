/* eslint-env node */

/**
 * ==========================================
 * Server Entry Point
 * ==========================================
 * Express server with authentication, image detection, and search APIs
 * Handles CORS, environment configuration, and all API routes
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  handleSignin, 
  handleRegister, 
  handleProfileGet, 
  handleImage, 
  handleOAuthLogin,
  handleProfileUpdate,
  handlePasswordUpdate,
  handleAccountDelete,
  checkAuthType
} from './database.js';
import { handleFaceDetect, handleObjectDetect } from './clarifai.js';

// Get directory path (ES modules don't have __dirname by default)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory (root)
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// ==========================================
// Middleware Configuration
// ==========================================

// Dynamic CORS - allows frontend URL from environment variable
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies (limit 5MB for base64 images)
app.use(express.json({ limit: '5mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ==========================================
// Authentication Routes
// ==========================================

app.post('/signin', handleSignin);
app.post('/register', handleRegister);
app.post('/oauth-login', handleOAuthLogin);

// ==========================================
// Image Search Route
// ==========================================

app.post('/api/search-image', async (req, res) => {
  try {
    const { query, imageUrl } = req.body;
    
    const serpApiKey = process.env.SERP_API_KEY;
    if (!serpApiKey) {
      return res.status(500).json({ error: 'SERP_API_KEY not configured' });
    }

    let searchUrl;
    if (imageUrl) {
      // Google Lens reverse image search
      searchUrl = `https://serpapi.com/search.json?engine=google_lens&url=${encodeURIComponent(imageUrl)}&api_key=${serpApiKey}`;
    } else {
      // Google Images text search
      searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&tbm=isch&api_key=${serpApiKey}`;
    }

    const response = await fetch(searchUrl);
    const data = await response.json();

    res.json({ results: data });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ==========================================
// Profile Management Routes
// ==========================================

app.get('/profile/:id', handleProfileGet);
app.put('/profile/:id', handleProfileUpdate);
app.put('/profile/:id/password', handlePasswordUpdate);
app.delete('/profile/:id', handleAccountDelete);
app.get('/check-auth/:email', checkAuthType);

// ==========================================
// Image Detection Routes
// ==========================================

app.put('/image', handleImage);
app.post('/api/face-detect', handleFaceDetect);
app.post('/api/object-detect', handleObjectDetect);

// ==========================================
// Health Check Route
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'Server is running',
    env: process.env.NODE_ENV 
  });
});

// ==========================================
// Start Server
// ==========================================

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS allowed for: ${FRONTEND_URL}`);
});

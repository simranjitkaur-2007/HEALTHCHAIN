// server.js
// ==========================================
// WHY: This is the entry point for the entire backend.
// It wires together Express, middleware, and all route handlers.
// ==========================================

require('dotenv').config(); // Load .env variables FIRST

const express = require('express');
const cors = require('cors');
const app = express();

// ---- MIDDLEWARE ----
// CORS: Allow requests from the frontend (Live Server on port 5500)
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse form data

// ---- HEALTH CHECK ----
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'HealthChain Backend',
    timestamp: new Date().toISOString(),
    env: {
      supabase: !!process.env.SUPABASE_URL,
      pinata: !!process.env.PINATA_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      blockchain: !!process.env.INFURA_SEPOLIA_URL
    }
  });
});

// ---- ROUTES ----
const authMiddleware = require('./middlewares/auth');
const roleMiddleware = require('./middlewares/role');

// Public routes (no login required)
app.use('/api/auth', require('./routes/auth'));

// Protected routes (JWT required + role check)
app.use('/api/patient', authMiddleware, roleMiddleware('patient'), require('./routes/patient'));
app.use('/api/hospital', authMiddleware, roleMiddleware('hospital'), require('./routes/hospital'));
app.use('/api/insurer', authMiddleware, roleMiddleware('insurer'), require('./routes/insurer'));

// ---- ERROR HANDLER ----
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ---- 404 HANDLER ----
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ---- START SERVER ----
const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🏥 HealthChain Backend running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`\n📋 API Routes:`);
    console.log(`   POST /api/auth/login`);
    console.log(`   POST /api/auth/seed-demo`);
    console.log(`   GET  /api/patient/treatments`);
    console.log(`   POST /api/patient/claims`);
    console.log(`   POST /api/hospital/register-patient`);
    console.log(`   POST /api/hospital/upload-treatment`);
    console.log(`   GET  /api/insurer/claims`);
    console.log(`   POST /api/insurer/claims/:id/resolve\n`);
  });
}

module.exports = app; // for testing with supertest

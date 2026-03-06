// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();

// ---- CORS: Allow all localhost origins ----
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow any localhost or 127.0.0.1 port
    if (
      origin.match(/^http:\/\/localhost(:\d+)?$/) ||
      origin.match(/^http:\/\/127\.0\.0\.1(:\d+)?$/)
    ) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use('/api/auth', require('./routes/auth'));
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

module.exports = app;
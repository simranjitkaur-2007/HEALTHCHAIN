// controllers/authController.js
// ==========================================
// WHY: Handles login for all three user types (patient, hospital, insurer).
// Uses the ID prefix (PAT/HSP/INS) to determine role automatically.
// Returns a JWT token valid for 24 hours.
// ==========================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');

// ---- HELPER: Determine role from ID prefix ----
function getRoleFromId(uniqueId) {
  if (uniqueId.startsWith('PAT-')) return 'patient';
  if (uniqueId.startsWith('HSP-')) return 'hospital';
  if (uniqueId.startsWith('INS-')) return 'insurer';
  return null;
}

// ---- HELPER: Generate unique PAT-XXXXXX ID ----
async function generateUniqueId(prefix) {
  let id, exists;
  do {
    const suffix = Math.floor(100000 + Math.random() * 900000); // 6 digit number
    id = `${prefix}-${suffix}`;
    const { data } = await supabase.from('users').select('unique_id').eq('unique_id', id).single();
    exists = !!data;
  } while (exists);
  return id;
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { uniqueId, password } = req.body;

    if (!uniqueId || !password) {
      return res.status(400).json({ error: 'Please provide both ID and password.' });
    }

    const role = getRoleFromId(uniqueId);
    if (!role) {
      return res.status(400).json({ error: 'Invalid ID format. Must start with PAT-, HSP-, or INS-' });
    }

    // Fetch user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('unique_id', uniqueId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'User not found. Check your ID.' });
    }

    // Compare password with stored hash
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    // Issue JWT — expires in 24 hours
    const token = jwt.sign(
      { uniqueId: user.unique_id, role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      role,
      name: user.name,
      uniqueId: user.unique_id
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
}

// POST /api/auth/seed-demo (Development only — creates demo accounts)
async function seedDemo(req, res) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production.' });
  }

  try {
    const hash = await bcrypt.hash('demo123', 12);
    const demoUsers = [
      { unique_id: 'HSP-000001', role: 'hospital', password_hash: hash, name: 'AIIMS Delhi', registration_number: 'REG-001', supported_insurers: ['INS-000001'] },
      { unique_id: 'INS-000001', role: 'insurer', password_hash: hash, name: 'StarHealth Insurance' },
      { unique_id: 'PAT-000001', role: 'patient', password_hash: hash, name: 'Rahul Kumar', age: 32, insurance_policy_id: 'POLICY-12345', insurer_unique_id: 'INS-000001' },
    ];

    for (const user of demoUsers) {
      await supabase.from('users').upsert(user, { onConflict: 'unique_id' });
    }

    res.json({
      success: true,
      message: 'Demo accounts created. Password for all: demo123',
      accounts: demoUsers.map(u => ({ id: u.unique_id, name: u.name, role: u.role }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { login, seedDemo, generateUniqueId };

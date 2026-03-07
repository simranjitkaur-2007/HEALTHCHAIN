// routes/auth.js
const express = require('express');
const router = express.Router();
const { login, seedDemo } = require('../controllers/authController');

router.post('/login', login);
router.post('/seed-demo', seedDemo); // Dev only

module.exports = router;
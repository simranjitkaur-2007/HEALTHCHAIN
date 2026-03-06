// routes/insurer.js
const express = require('express');
const router = express.Router();
const { getClaims, getClaimDetail, resolveClaim, getStats } = require('../controllers/insurerController');

router.get('/claims', getClaims);
router.get('/claims/:id', getClaimDetail);
router.post('/claims/:id/resolve', resolveClaim);
router.get('/stats', getStats);

module.exports = router;

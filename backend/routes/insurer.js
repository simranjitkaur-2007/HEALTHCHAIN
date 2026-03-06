// routes/insurer.js
const express = require('express');
const router = express.Router();
const { getClaims, getClaimDetail, downloadTreatmentFile, resolveClaim, getStats } = require('../controllers/insurerController');

router.get('/claims', getClaims);
router.get('/claims/:id', getClaimDetail);
router.post('/claims/:id/resolve', resolveClaim);
router.get('/treatments/:id/download/:type', downloadTreatmentFile);
router.get('/stats', getStats);

module.exports = router;
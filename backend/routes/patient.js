// routes/patient.js
const express = require('express');
const router = express.Router();
const { getTreatments, downloadFile, getClaims, submitClaim, getProfile } = require('../controllers/patientController');

router.get('/profile', getProfile);
router.get('/treatments', getTreatments);
router.get('/treatments/:id/download/:type', downloadFile);
router.get('/claims', getClaims);
router.post('/claims', submitClaim);

module.exports = router;

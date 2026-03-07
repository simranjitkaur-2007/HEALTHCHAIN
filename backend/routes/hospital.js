// routes/hospital.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const { registerPatient, uploadTreatment, getPatients, downloadTreatmentFile } = require('../controllers/hospitalController');

// Multer: store files in memory (we encrypt then upload to IPFS)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max per file
});

const uploadFields = upload.fields([
  { name: 'prescription', maxCount: 1 },
  { name: 'invoice', maxCount: 1 },
  { name: 'photos', maxCount: 5 },
  { name: 'labReports', maxCount: 5 }
]);

router.post('/register-patient', registerPatient);
router.post('/upload-treatment', uploadFields, uploadTreatment);
router.get('/patients', getPatients);
router.get('/treatments/:id/download/:type', downloadTreatmentFile);

module.exports = router;
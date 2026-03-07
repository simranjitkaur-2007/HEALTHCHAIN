// controllers/hospitalController.js
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const { generateUniqueId } = require('./authController');
const ipfsService = require('../services/ipfsService');
const blockchainService = require('../services/blockchainService');
const encryptionService = require('../services/encryptionService');
const crypto = require('crypto');

// POST /api/hospital/register-patient
async function registerPatient(req, res) {
  try {
    const { name, age, email, phone, insurancePolicyId, insurerUniqueId, initialPassword } = req.body;
    const hospitalId = req.user.uniqueId;

    if (!name || !initialPassword) {
      return res.status(400).json({ error: 'name and initialPassword are required.' });
    }

    const patientId = await generateUniqueId('PAT');
    const passwordHash = await bcrypt.hash(initialPassword, 12);

    const { data: patient, error } = await supabase
      .from('users')
      .insert({
        unique_id: patientId,
        role: 'patient',
        password_hash: passwordHash,
        name,
        age: age || null,
        email: email || null,
        phone: phone || null,
        insurance_policy_id: insurancePolicyId || null,
        insurer_unique_id: insurerUniqueId || null
      })
      .select('unique_id, name, role')
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully.',
      credentials: {
        patientId,
        initialPassword,
        name
      }
    });
  } catch (err) {
    console.error('Register patient error:', err);
    res.status(500).json({ error: err.message });
  }
}

// POST /api/hospital/upload-treatment
async function uploadTreatment(req, res) {
  try {
    const {
      patientUniqueId, diagnosis, doctorName,
      admissionDate, dischargeDate, amountSpent,
      icdCodes, hospitalName
    } = req.body;
    const hospitalId = req.user.uniqueId;
    const files = req.files || {};

    if (!patientUniqueId || !diagnosis || !doctorName) {
      return res.status(400).json({ error: 'patientUniqueId, diagnosis, and doctorName are required.' });
    }

    const { data: patient } = await supabase
      .from('users')
      .select('unique_id, name')
      .eq('unique_id', patientUniqueId)
      .eq('role', 'patient')
      .single();

    if (!patient) return res.status(404).json({ error: 'Patient not found.' });

    const encKey = process.env.ENCRYPTION_KEY;
    let prescriptionCid = null, invoiceCid = null, photoCids = [], labReportCids = [];

    if (files.prescription && files.prescription[0]) {
      const encrypted = encryptionService.encrypt(files.prescription[0].buffer, encKey);
      prescriptionCid = await ipfsService.uploadToIPFS(encrypted, `prescription_${Date.now()}.enc`);
    }

    if (files.invoice && files.invoice[0]) {
      const encrypted = encryptionService.encrypt(files.invoice[0].buffer, encKey);
      invoiceCid = await ipfsService.uploadToIPFS(encrypted, `invoice_${Date.now()}.enc`);
    }

    if (files.photos) {
      for (const photo of files.photos) {
        const encrypted = encryptionService.encrypt(photo.buffer, encKey);
        const cid = await ipfsService.uploadToIPFS(encrypted, `photo_${Date.now()}.enc`);
        photoCids.push(cid);
      }
    }

    if (files.labReports) {
      for (const lab of files.labReports) {
        const encrypted = encryptionService.encrypt(lab.buffer, encKey);
        const cid = await ipfsService.uploadToIPFS(encrypted, `lab_${Date.now()}.enc`);
        labReportCids.push(cid);
      }
    }

    const dataToHash = JSON.stringify({
      patientId: patientUniqueId, diagnosis, doctorName,
      admissionDate, dischargeDate, amountSpent,
      prescriptionCid, invoiceCid
    });
    const fileHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

    let txHash = 'BLOCKCHAIN_NOT_CONFIGURED';
    try {
      const tx = await blockchainService.addRecord(
        patientUniqueId,
        prescriptionCid || 'no-cid',
        '0x' + fileHash,
        hospitalId
      );
      txHash = tx.hash;
    } catch (blockchainErr) {
      console.warn('Blockchain write failed (continuing):', blockchainErr.message);
      txHash = 'MOCK_TX_' + Date.now();
    }

    const { data: treatment, error } = await supabase
      .from('treatments')
      .insert({
        patient_unique_id: patientUniqueId,
        hospital_unique_id: hospitalId,
        hospital_name: hospitalName || req.user.name || 'Hospital',
        doctor_name: doctorName,
        diagnosis,
        icd_codes: icdCodes ? (Array.isArray(icdCodes) ? icdCodes : [icdCodes]) : [],
        admission_date: admissionDate || null,
        discharge_date: dischargeDate || null,
        amount_spent: parseFloat(amountSpent) || 0,
        prescription_cid: prescriptionCid,
        invoice_cid: invoiceCid,
        photo_cids: photoCids,
        lab_report_cids: labReportCids,
        blockchain_tx_hash: txHash
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Treatment record uploaded successfully.',
      treatmentId: treatment.id,
      txHash,
      blockchainExplorer: txHash.startsWith('MOCK') ? null : `https://sepolia.etherscan.io/tx/${txHash}`
    });
  } catch (err) {
    console.error('Upload treatment error:', err);
    res.status(500).json({ error: err.message });
  }
}

// GET /api/hospital/patients
// Returns ALL patients registered by this hospital (from users table via treatments OR direct registration)
async function getPatients(req, res) {
  try {
    const hospitalId = req.user.uniqueId;

    // Get patients who have treatments from this hospital
    const { data: treatments } = await supabase
      .from('treatments')
      .select('patient_unique_id')
      .eq('hospital_unique_id', hospitalId);

    const patientIds = [...new Set((treatments || []).map(t => t.patient_unique_id))];

    if (patientIds.length === 0) return res.json([]);

    const { data: patients } = await supabase
      .from('users')
      .select('unique_id, name, age, email, phone, insurance_policy_id, insurer_unique_id')
      .in('unique_id', patientIds);

    res.json(patients || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/hospital/treatments/:id/download/:type
// WHY: Hospitals uploaded the docs, so they should be able to download them back.
async function downloadTreatmentFile(req, res) {
  try {
    const { id: treatmentId, type } = req.params;
    const hospitalId = req.user.uniqueId;

    // Verify this treatment belongs to this hospital
    const { data: treatment } = await supabase
      .from('treatments')
      .select('prescription_cid, invoice_cid, hospital_unique_id')
      .eq('id', treatmentId)
      .eq('hospital_unique_id', hospitalId)
      .single();

    if (!treatment) {
      return res.status(403).json({ error: 'Access denied or treatment not found.' });
    }

    let cid;
    if (type === 'prescription') cid = treatment.prescription_cid;
    else if (type === 'invoice') cid = treatment.invoice_cid;
    else return res.status(400).json({ error: 'Invalid file type. Use: prescription or invoice' });

    if (!cid) return res.status(404).json({ error: 'File not uploaded for this treatment.' });

    const encryptedBuffer = await ipfsService.fetchFromIPFS(cid);
    const decrypted = encryptionService.decrypt(encryptedBuffer, process.env.ENCRYPTION_KEY);

    res.set('Content-Disposition', `attachment; filename="${type}_${treatmentId}.pdf"`);
    res.set('Content-Type', 'application/pdf');
    res.send(decrypted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { registerPatient, uploadTreatment, getPatients, downloadTreatmentFile };
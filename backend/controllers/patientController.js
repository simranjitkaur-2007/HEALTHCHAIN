// controllers/patientController.js
// ==========================================
// WHY: Patients can view their treatment records and submit insurance claims.
// When a claim is submitted, AI fraud scoring runs automatically.
// No document upload needed — it all comes from hospital records.
// ==========================================

const supabase = require('../config/supabase');
const aiService = require('../services/aiService');
const blockchainService = require('../services/blockchainService');
const ipfsService = require('../services/ipfsService');
const encryptionService = require('../services/encryptionService');

// GET /api/patient/treatments
async function getTreatments(req, res) {
  try {
    const { data: treatments, error } = await supabase
      .from('treatments')
      .select('*')
      .eq('patient_unique_id', req.user.uniqueId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(treatments || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/patient/treatments/:id/download/:type
async function downloadFile(req, res) {
  try {
    const { id, type } = req.params;
    const { data: treatment } = await supabase
      .from('treatments')
      .select('*')
      .eq('id', id)
      .eq('patient_unique_id', req.user.uniqueId)
      .single();

    if (!treatment) return res.status(404).json({ error: 'Treatment not found.' });

    let cid;
    if (type === 'prescription') cid = treatment.prescription_cid;
    else if (type === 'invoice') cid = treatment.invoice_cid;
    else return res.status(400).json({ error: 'Invalid file type. Use: prescription or invoice' });

    if (!cid) return res.status(404).json({ error: 'File not uploaded for this treatment.' });

    const encryptedBuffer = await ipfsService.fetchFromIPFS(cid);
    const decrypted = encryptionService.decrypt(encryptedBuffer, process.env.ENCRYPTION_KEY);

    res.set('Content-Disposition', `attachment; filename="${type}_${id}.pdf"`);
    res.set('Content-Type', 'application/octet-stream');
    res.send(decrypted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/patient/claims
async function getClaims(req, res) {
  try {
    const { data: claims, error } = await supabase
      .from('claims')
      .select('*, treatments(diagnosis, hospital_name, doctor_name, admission_date, discharge_date)')
      .eq('patient_unique_id', req.user.uniqueId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    res.json(claims || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/patient/claims
async function submitClaim(req, res) {
  try {
    const { treatmentId, policyNumber, insurerUniqueId, claimedAmount } = req.body;
    const patientId = req.user.uniqueId;

    if (!treatmentId || !insurerUniqueId || !claimedAmount) {
      return res.status(400).json({ error: 'treatmentId, insurerUniqueId, and claimedAmount are required.' });
    }

    // Verify the treatment belongs to this patient
    const { data: treatment } = await supabase
      .from('treatments')
      .select('*')
      .eq('id', treatmentId)
      .eq('patient_unique_id', patientId)
      .single();

    if (!treatment) return res.status(404).json({ error: 'Treatment not found.' });

    // Check for duplicate claim
    const { data: existing } = await supabase
      .from('claims')
      .select('id')
      .eq('treatment_id', treatmentId)
      .eq('patient_unique_id', patientId)
      .neq('status', 'rejected')
      .single();

    if (existing) return res.status(409).json({ error: 'A claim for this treatment already exists.' });

    // Get patient info for AI analysis
    const { data: patient } = await supabase
      .from('users')
      .select('name, age, insurance_policy_id')
      .eq('unique_id', patientId)
      .single();

    // Run AI fraud scoring
    let fraudScore = 0;
    let aiExplanation = 'Claim submitted for review.';
    try {
      const analysis = await aiService.analyzeClaim({
        patientAge: patient?.age,
        diagnosis: treatment.diagnosis,
        icdCodes: treatment.icd_codes,
        admissionDate: treatment.admission_date,
        dischargeDate: treatment.discharge_date,
        amountSpent: treatment.amount_spent,
        claimedAmount: parseFloat(claimedAmount),
        hospitalId: treatment.hospital_unique_id,
        policyNumber
      });
      fraudScore = analysis.fraudScore || 0;
      aiExplanation = analysis.summary || aiExplanation;
    } catch (aiErr) {
      console.warn('AI scoring failed (continuing):', aiErr.message);
    }

    // Write claim hash to blockchain
    let txHash = 'BLOCKCHAIN_NOT_CONFIGURED';
    try {
      const claimData = JSON.stringify({ patientId, treatmentId, claimedAmount, policyNumber });
      const tx = await blockchainService.submitClaim(patientId, treatmentId, parseFloat(claimedAmount));
      txHash = tx.hash;
    } catch (err) {
      console.warn('Blockchain claim write failed:', err.message);
      txHash = 'MOCK_CLAIM_TX_' + Date.now();
    }

    // Insert claim to Supabase
    const { data: claim, error } = await supabase
      .from('claims')
      .insert({
        patient_unique_id: patientId,
        treatment_id: treatmentId,
        insurer_unique_id: insurerUniqueId,
        policy_number: policyNumber || null,
        claimed_amount: parseFloat(claimedAmount),
        status: 'pending',
        fraud_score: Math.min(100, Math.max(0, fraudScore)),
        ai_explanation: aiExplanation,
        blockchain_tx_hash: txHash
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      claimId: claim.id,
      fraudScore,
      message: 'Claim submitted successfully. You will be notified when the insurer reviews it.'
    });
  } catch (err) {
    console.error('Submit claim error:', err);
    res.status(500).json({ error: err.message });
  }
}

// GET /api/patient/profile
async function getProfile(req, res) {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('unique_id, name, age, email, phone, insurance_policy_id, insurer_unique_id, created_at')
      .eq('unique_id', req.user.uniqueId)
      .single();

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getTreatments, downloadFile, getClaims, submitClaim, getProfile };

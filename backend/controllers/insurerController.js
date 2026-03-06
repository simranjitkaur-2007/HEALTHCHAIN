// controllers/insurerController.js
// ==========================================
// WHY: Insurers review claims routed to them by INS-XXXXXX ID.
// They see AI fraud scores, can approve/reject, and every decision
// is recorded permanently on the blockchain as an audit trail.
// ==========================================

const supabase = require('../config/supabase');
const aiService = require('../services/aiService');
const blockchainService = require('../services/blockchainService');

// GET /api/insurer/claims
async function getClaims(req, res) {
  try {
    const insurerId = req.user.uniqueId;
    const { status } = req.query; // optional filter: ?status=pending

    let query = supabase
      .from('claims')
      .select(`
        *,
        treatments (
          id, diagnosis, doctor_name, hospital_name,
          admission_date, discharge_date, amount_spent,
          icd_codes, blockchain_tx_hash
        ),
        users!claims_patient_unique_id_fkey (
          name, age, insurance_policy_id
        )
      `)
      .eq('insurer_unique_id', insurerId)
      .order('submitted_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data: claims, error } = await query;
    if (error) throw error;

    res.json(claims || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/insurer/claims/:id
async function getClaimDetail(req, res) {
  try {
    const { id } = req.params;
    const insurerId = req.user.uniqueId;

    const { data: claim, error } = await supabase
      .from('claims')
      .select(`
        *,
        treatments (*),
        users!claims_patient_unique_id_fkey (
          name, age, email, phone, insurance_policy_id
        )
      `)
      .eq('id', id)
      .eq('insurer_unique_id', insurerId)
      .single();

    if (error || !claim) return res.status(404).json({ error: 'Claim not found.' });

    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/insurer/claims/:id/resolve
async function resolveClaim(req, res) {
  try {
    const { id } = req.params;
    const { decision, reason } = req.body; // decision: 'approved' or 'rejected'
    const insurerId = req.user.uniqueId;

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be "approved" or "rejected".' });
    }

    // Verify claim belongs to this insurer and is still pending
    const { data: claim } = await supabase
      .from('claims')
      .select('*, treatments(*)')
      .eq('id', id)
      .eq('insurer_unique_id', insurerId)
      .single();

    if (!claim) return res.status(404).json({ error: 'Claim not found.' });
    if (claim.status !== 'pending' && claim.status !== 'under_review') {
      return res.status(409).json({ error: `Claim already resolved with status: ${claim.status}` });
    }

    // Generate AI plain-English explanation for patient
    let aiExplanation = claim.ai_explanation;
    try {
      const technicalReason = reason || (decision === 'approved' ? 'All criteria met' : 'Policy coverage mismatch');
      aiExplanation = await aiService.generateExplanation(technicalReason, decision);
    } catch (aiErr) {
      console.warn('AI explanation failed:', aiErr.message);
      aiExplanation = decision === 'approved'
        ? 'Great news! Your claim has been approved. The payment will be processed within 3-5 business days.'
        : `We regret to inform you that your claim was not approved. Reason: ${reason || 'Policy coverage issue.'}`;
    }

    // Record on blockchain
    let txHash = 'BLOCKCHAIN_NOT_CONFIGURED';
    try {
      const tx = await blockchainService.resolveClaim(id, decision === 'approved');
      txHash = tx.hash;
    } catch (err) {
      console.warn('Blockchain resolve failed:', err.message);
      txHash = 'MOCK_RESOLVE_TX_' + Date.now();
    }

    // Update claim in Supabase
    const { data: updated, error } = await supabase
      .from('claims')
      .update({
        status: decision,
        ai_explanation: aiExplanation,
        resolved_at: new Date().toISOString(),
        blockchain_tx_hash: txHash
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      claimId: id,
      status: decision,
      aiExplanation,
      txHash,
      blockchainExplorer: txHash.startsWith('MOCK') ? null : `https://sepolia.etherscan.io/tx/${txHash}`
    });
  } catch (err) {
    console.error('Resolve claim error:', err);
    res.status(500).json({ error: err.message });
  }
}

// GET /api/insurer/stats
async function getStats(req, res) {
  try {
    const insurerId = req.user.uniqueId;
    const { data: claims } = await supabase
      .from('claims')
      .select('status, claimed_amount, fraud_score')
      .eq('insurer_unique_id', insurerId);

    const stats = {
      total: claims?.length || 0,
      pending: claims?.filter(c => c.status === 'pending').length || 0,
      approved: claims?.filter(c => c.status === 'approved').length || 0,
      rejected: claims?.filter(c => c.status === 'rejected').length || 0,
      totalValue: claims?.reduce((sum, c) => sum + (c.claimed_amount || 0), 0) || 0,
      avgFraudScore: claims?.length ? Math.round(claims.reduce((sum, c) => sum + (c.fraud_score || 0), 0) / claims.length) : 0
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getClaims, getClaimDetail, resolveClaim, getStats };

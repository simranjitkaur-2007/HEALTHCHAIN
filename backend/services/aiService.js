// services/aiService.js
// ==========================================
// WHY: The Claude AI API does two jobs:
// 1. analyzeClaim() — gives every claim a fraud score 0-100
// 2. generateExplanation() — converts rejection codes into human language
// Using claude-sonnet-4-20250514 for cost efficiency vs Opus
// ==========================================

const Anthropic = require('@anthropic-ai/sdk');

// Lazy-init the client (only if ANTHROPIC_API_KEY is set)
let client = null;
function getClient() {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set in .env');
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

// Analyze claim for fraud — returns { fraudScore, concerns, summary }
async function analyzeClaim(claimData) {
  try {
    const msg = await getClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `You are a healthcare insurance fraud detection system for an Indian insurance company.
Analyse the claim data provided and return ONLY valid JSON — no markdown, no explanation outside JSON.
Return exactly this structure:
{
  "fraudScore": <integer 0-100>,
  "concerns": [<array of specific concern strings, empty if none>],
  "summary": "<one sentence plain English summary for the insurer>"
}

Scoring guidelines:
- 0-20: Very low risk — common treatment, amounts match diagnosis, dates consistent
- 21-50: Moderate — some inconsistencies worth noting
- 51-80: High risk — multiple red flags (inflated amounts, unusual patterns, date issues)
- 81-100: Critical — likely fraudulent (impossible dates, duplicate claims, extreme amounts)`,
      messages: [{
        role: 'user',
        content: `Analyse this insurance claim:\n${JSON.stringify(claimData, null, 2)}`
      }]
    });

    const raw = msg.content[0].text.trim();
    // Strip markdown code fences if present
    const clean = raw.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('AI analyzeClaim error:', err.message);
    // Fallback — don't block claim submission if AI fails
    return { fraudScore: 25, concerns: [], summary: 'AI analysis unavailable. Manual review recommended.' };
  }
}

// Generate plain-English explanation for patient
async function generateExplanation(technicalReason, decision) {
  try {
    const msg = await getClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: `You write patient-friendly insurance claim notifications for Indian patients.
Write in simple, warm, empathetic English. No medical jargon. No legal language.
Return ONLY the message text — no subject line, no formatting, no preamble.
Keep it to 2-3 short paragraphs maximum.`,
      messages: [{
        role: 'user',
        content: `Write a ${decision} notification for a patient.
Technical reason from insurer: "${technicalReason}"
Decision: ${decision.toUpperCase()}`
      }]
    });

    return msg.content[0].text.trim();
  } catch (err) {
    console.error('AI generateExplanation error:', err.message);
    return decision === 'approved'
      ? 'Your claim has been approved! The payment will be processed within 3-5 business days.'
      : `We regret to inform you that your claim was not approved. Technical reason: ${technicalReason}`;
  }
}

module.exports = { analyzeClaim, generateExplanation };

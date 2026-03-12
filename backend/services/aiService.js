// services/aiService.js — using Groq instead of Anthropic
const Groq = require('groq-sdk');

let client = null;
function getClient() {
  if (!client) {
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set in .env');
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

async function analyzeClaim(claimData) {
  try {
    const completion = await getClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: `You are a healthcare insurance fraud detection system for an Indian insurance company.
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
- 81-100: Critical — likely fraudulent (impossible dates, duplicate claims, extreme amounts)`
        },
        {
          role: 'user',
          content: `Analyse this insurance claim:\n${JSON.stringify(claimData, null, 2)}`
        }
      ]
    });

    const raw = completion.choices[0].message.content.trim();
    const clean = raw.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('AI analyzeClaim error:', err.message);
    return { fraudScore: 25, concerns: [], summary: 'AI analysis unavailable. Manual review recommended.' };
  }
}

async function generateExplanation(technicalReason, decision) {
  try {
    const completion = await getClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 512,
      messages: [
        {
          role: 'system',
          content: `You write patient-friendly insurance claim notifications for Indian patients.
Write in simple, warm, empathetic English. No medical jargon. No legal language.
Return ONLY the message text — no subject line, no formatting, no preamble.
Keep it to 2-3 short paragraphs maximum.`
        },
        {
          role: 'user',
          content: `Write a ${decision} notification for a patient.\nTechnical reason from insurer: "${technicalReason}"\nDecision: ${decision.toUpperCase()}`
        }
      ]
    });

    return completion.choices[0].message.content.trim();
  } catch (err) {
    console.error('AI generateExplanation error:', err.message);
    return decision === 'approved'
      ? 'Your claim has been approved! The payment will be processed within 3-5 business days.'
      : `We regret to inform you that your claim was not approved. Technical reason: ${technicalReason}`;
  }
}

module.exports = { analyzeClaim, generateExplanation };
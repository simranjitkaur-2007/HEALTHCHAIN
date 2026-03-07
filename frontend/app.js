// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = `${window.location.protocol}//${window.location.hostname}:5000/api`;

// ─── STATE ────────────────────────────────────────────────────────────────────
let currentRole = null;
let authToken   = null;
let currentUser = null;
let currentTab  = 'overview';
let cachedTreatments = [];

// ─── API HELPER ───────────────────────────────────────────────────────────────
async function apiCall(method, path, body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authorization': 'Bearer ' + authToken } : {})
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-text">${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

// ─── DOTS CANVAS ──────────────────────────────────────────────────────────────
(function() {
  const canvas = document.getElementById('dots-canvas');
  const ctx = canvas.getContext('2d');
  let dots = [];
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  function initDots() {
    dots = [];
    for (let i = 0; i < 90; i++) {
      dots.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*1.8+0.4, vx: (Math.random()-.5)*.35, vy: (Math.random()-.5)*.35, opacity: Math.random()*.4+.08 });
    }
  }
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (let i=0;i<dots.length;i++) for (let j=i+1;j<dots.length;j++) {
      const dx=dots[i].x-dots[j].x, dy=dots[i].y-dots[j].y, dist=Math.sqrt(dx*dx+dy*dy);
      if (dist<120) { ctx.beginPath(); ctx.strokeStyle=`rgba(59,130,246,${.04*(1-dist/120)})`; ctx.lineWidth=.5; ctx.moveTo(dots[i].x,dots[i].y); ctx.lineTo(dots[j].x,dots[j].y); ctx.stroke(); }
    }
    dots.forEach(d => {
      ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(255,255,255,${d.opacity})`; ctx.fill();
      d.x+=d.vx; d.y+=d.vy;
      if (d.x<0||d.x>canvas.width) d.vx*=-1;
      if (d.y<0||d.y>canvas.height) d.vy*=-1;
    });
    requestAnimationFrame(draw);
  }
  resize(); initDots(); draw();
  window.addEventListener('resize', () => { resize(); initDots(); });
})();

// ─── PAGE NAVIGATION ──────────────────────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showLanding() {
  showPage('page-landing');
}

function showAuth(role) {
  currentRole = role;
  showPage('page-auth');

  document.getElementById('auth-error-banner').style.display = 'none';
  document.getElementById('auth-error-text').textContent = '';

  const configs = {
    patient:   { iconClass: 'blue',   name: 'Patient Login',   title: 'Patient Access',         sub: 'Sign in with your Patient ID (PAT-XXXXXX) and password.',   placeholder: 'PAT-XXXXXX', label: 'Patient ID',   btnClass: 'blue' },
    hospital:  { iconClass: 'green',  name: 'Hospital Login',  title: 'Staff Authentication',   sub: 'Sign in with your Hospital ID (HSP-XXXXXX) and password.',  placeholder: 'HSP-XXXXXX', label: 'Hospital ID',  btnClass: 'green' },
    insurance: { iconClass: 'purple', name: 'Insurance Login', title: 'Company Authentication', sub: 'Sign in with your Insurer ID (INS-XXXXXX) and password.',   placeholder: 'INS-XXXXXX', label: 'Insurer ID',   btnClass: 'purple' },
  };
  const svgIcons = {
    patient:   `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" fill="none" style="width:18px;height:18px;"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    hospital:  `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" fill="none" style="width:18px;height:18px;"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>`,
    insurance: `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" fill="none" style="width:18px;height:18px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  };

  const c = configs[role];
  document.getElementById('auth-logo-icon').innerHTML = svgIcons[role];
  document.getElementById('auth-logo-icon').className = 'auth-logo-icon ' + c.iconClass;
  document.getElementById('auth-logo-name').textContent = c.name;
  document.getElementById('auth-title').textContent = c.title;
  document.getElementById('auth-sub').textContent = c.sub;
  document.getElementById('auth-id-label').textContent = c.label;
  document.getElementById('input-uniqueid').placeholder = c.placeholder;
  document.getElementById('input-uniqueid').value = '';
  document.getElementById('input-password').value = '';

  const btn = document.getElementById('btn-login');
  btn.className = 'btn-primary ' + c.btnClass;
  btn.innerHTML = 'Sign In';
  btn.disabled = false;

  document.getElementById('auth-step-login').style.display = 'block';
  document.getElementById('auth-step-verified').style.display = 'none';

  setTimeout(() => document.getElementById('input-uniqueid').focus(), 100);
}

// ─── ENTER KEY SUPPORT ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  ['input-uniqueid', 'input-password'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doLogin();
    });
  });
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
async function doLogin() {
  const uniqueId = document.getElementById('input-uniqueid').value.trim();
  const password = document.getElementById('input-password').value;

  document.getElementById('auth-error-banner').style.display = 'none';

  if (!uniqueId || !password) {
    showAuthError('Please enter your ID and password.');
    return;
  }

  const btn = document.getElementById('btn-login');
  btn.innerHTML = '<span class="spinner"></span> Signing in...';
  btn.disabled = true;

  try {
    const data = await apiCall('POST', '/auth/login', { uniqueId, password });
    authToken = data.token;
    currentUser = { name: data.name, uniqueId: data.uniqueId, role: data.role };
    currentRole = data.role === 'insurer' ? 'insurance' : data.role;

    document.getElementById('auth-step-login').style.display = 'none';
    document.getElementById('auth-step-verified').style.display = 'block';

    setTimeout(() => showDashboard(), 1400);
  } catch (err) {
    let msg = err.message;
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch')) {
      msg = 'Cannot connect to server. Make sure the backend is running on port 5000.';
    }
    showAuthError(msg);
    btn.innerHTML = 'Sign In';
    btn.disabled = false;
  }
}

function showAuthError(msg) {
  const banner = document.getElementById('auth-error-banner');
  document.getElementById('auth-error-text').textContent = msg;
  banner.style.display = 'flex';
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
function doLogout() {
  authToken = null;
  currentUser = null;
  currentRole = null;
  cachedTreatments = [];
  showLanding();
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function showDashboard() {
  showPage('page-dashboard');
  const roleLabel = { patient: 'Patient', hospital: 'Hospital', insurance: 'Insurer' };
  document.getElementById('sidebar-role-tag').textContent = roleLabel[currentRole] || currentRole;
  document.getElementById('sidebar-username').textContent = currentUser.name;
  document.getElementById('sidebar-usersub').textContent = currentUser.uniqueId;
  document.getElementById('dash-header-sub').textContent = 'Welcome back, ' + currentUser.name;

  const navItems = {
    patient:   [['Overview','overview'],['Treatments','treatments'],['Claims','claims'],['Profile','profile']],
    hospital:  [['Overview','overview'],['Patients','patients'],['Upload Record','upload'],['Register Patient','register']],
    insurance: [['Overview','overview'],['All Claims','claims'],['Reports','reports']],
  };

  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = (navItems[currentRole] || []).map(([label, tab]) =>
    `<div class="sidebar-item ${tab==='overview'?'active':''}" onclick="switchTab('${tab}',this)">${label}</div>`
  ).join('');

  switchTab('overview', nav.querySelector('.sidebar-item.active'));
}

function switchTab(tab, el) {
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');
  currentTab = tab;
  const titles = { overview:'Overview', treatments:'Treatment Records', claims:'Insurance Claims', profile:'My Profile', patients:'Patients', upload:'Upload Treatment', register:'Register Patient', reports:'Reports' };
  document.getElementById('dash-header-title').textContent = titles[tab] || tab;
  renderTab(tab);
}

// ─── RENDER TAB ───────────────────────────────────────────────────────────────
async function renderTab(tab) {
  const body = document.getElementById('dash-body');
  body.innerHTML = '<div class="loading-state"><span class="spinner"></span> Loading...</div>';
  try {
    if (currentRole === 'patient') await renderPatientTab(tab, body);
    else if (currentRole === 'hospital') await renderHospitalTab(tab, body);
    else await renderInsurerTab(tab, body);
  } catch (err) {
    let msg = err.message;
    if (msg.includes('Failed to fetch') || msg.includes('fetch')) {
      msg = 'Cannot reach server. Check that the backend is running on port 5000.';
    }
    body.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠</div><div class="empty-state-text" style="color:var(--red2);">${msg}</div></div>`;
    showToast(msg, 'error');
  }
}

// ─── PATIENT TABS ─────────────────────────────────────────────────────────────
async function renderPatientTab(tab, body) {
  if (tab === 'overview' || tab === 'treatments') {
    const treatments = await apiCall('GET', '/patient/treatments');
    cachedTreatments = treatments;
    // Fetch claims to know which treatments already have an approved/pending claim
    const claims = await apiCall('GET', '/patient/claims');
    const totalSpent = treatments.reduce((s,t) => s+(t.amount_spent||0), 0);
    const approvedCount = claims.filter(c=>c.status==='approved').length;

    body.innerHTML = `
    <div class="stats-grid">
      ${statCard('Total Treatments', treatments.length, 'All time records')}
      ${statCard('Total Spent', '₹'+totalSpent.toLocaleString(), 'Medical expenses')}
      ${statCard('Insurance Claims', claims.length, approvedCount+' approved', 'green')}
      ${statCard('Records On-Chain', treatments.filter(t=>t.blockchain_tx_hash&&!t.blockchain_tx_hash.startsWith('MOCK')).length, 'Verified', 'green')}
    </div>
    <div class="section-card">
      <div class="section-header">
        <div class="section-title">Treatment Records (${treatments.length})</div>
        <button class="action-btn green" onclick="openClaimModal()">+ New Claim</button>
      </div>
      <div class="section-body">
        ${treatments.length ? treatments.map(t => treatmentCardHTML(t, claims)).join('') : emptyState('No treatment records found. Ask your hospital to upload your records.')}
      </div>
    </div>`;
  }

  if (tab === 'claims') {
    const claims = await apiCall('GET', '/patient/claims');
    if (cachedTreatments.length === 0) {
      cachedTreatments = await apiCall('GET', '/patient/treatments');
    }
    body.innerHTML = `
    <div class="section-card">
      <div class="section-header">
        <div class="section-title">Insurance Claims (${claims.length})</div>
        <button class="action-btn green" onclick="openClaimModal()">+ New Claim</button>
      </div>
      <div class="section-body" style="padding:14px;">
        ${claims.length ? claims.map(c => claimCardHTML(c, false)).join('') : emptyState('No claims submitted yet. Apply for a claim from your treatments.')}
      </div>
    </div>`;
  }

  if (tab === 'profile') {
    const profile = await apiCall('GET', '/patient/profile');
    body.innerHTML = `
    <div class="section-card" style="max-width:520px;">
      <div class="section-header"><div class="section-title">Profile</div></div>
      <div class="section-body">
        <div style="display:flex;align-items:center;gap:18px;margin-bottom:20px;">
          <div class="profile-avatar">${(profile.name||'?')[0].toUpperCase()}</div>
          <div>
            <div class="profile-name">${profile.name||'—'}</div>
            <div class="profile-meta"><span>Age ${profile.age||'—'}</span></div>
            <div class="profile-tags">
              <span class="profile-tag blue">${profile.unique_id}</span>
              <span class="profile-tag green">Verified Patient</span>
            </div>
          </div>
        </div>
        <hr style="border-color:var(--border);margin-bottom:4px;">
        ${infoRow('Patient ID', profile.unique_id||'—')}
        ${infoRow('Email', profile.email||'—')}
        ${infoRow('Phone', profile.phone||'—')}
        ${infoRow('Policy Number', profile.insurance_policy_id||'—')}
        ${infoRow('Insurer ID', profile.insurer_unique_id||'—')}
        ${infoRow('Member Since', fmtDate(profile.created_at))}
      </div>
    </div>`;
  }
}

// ─── HOSPITAL TABS ─────────────────────────────────────────────────────────────
async function renderHospitalTab(tab, body) {
  if (tab === 'overview') {
    const patients = await apiCall('GET', '/hospital/patients');
    body.innerHTML = `
    <div class="stats-grid">
      ${statCard('Total Patients', patients.length, 'Registered')}
      ${statCard('Hospital', currentUser.name, currentUser.uniqueId)}
      ${statCard('Upload Records', 'Active', 'Blockchain ready', 'green')}
      ${statCard('Register Patients', 'Active', 'Onboarding ready', 'green')}
    </div>
    <div class="quick-actions">
      <div class="quick-btn green" onclick="openModal('modal-upload')">
        <div class="quick-icon green"><svg viewBox="0 0 24 24" stroke="var(--green2)" stroke-width="1.8" fill="none" style="width:20px;height:20px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>
        <div class="quick-label">Upload Treatment</div>
        <div class="quick-sub">Add new treatment to blockchain</div>
      </div>
      <div class="quick-btn blue" onclick="openModal('modal-register')">
        <div class="quick-icon blue"><svg viewBox="0 0 24 24" stroke="var(--blue2)" stroke-width="1.8" fill="none" style="width:20px;height:20px;"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg></div>
        <div class="quick-label">Register Patient</div>
        <div class="quick-sub">Onboard a new patient</div>
      </div>
    </div>
    <div class="section-card">
      <div class="section-header">
        <div class="section-title">Registered Patients (${patients.length})</div>
        <button class="action-btn blue" onclick="openModal('modal-register')">+ Register Patient</button>
      </div>
      <div class="section-body" id="patients-list-body">
        ${renderPatientsList(patients)}
      </div>
    </div>`;
  }

  if (tab === 'patients') {
    const patients = await apiCall('GET', '/hospital/patients');
    body.innerHTML = `
    <div class="section-card">
      <div class="section-header">
        <div class="section-title">All Patients (${patients.length})</div>
        <button class="action-btn blue" onclick="openModal('modal-register')">+ Register Patient</button>
      </div>
      <div class="section-body" style="padding:0;" id="patients-table-body">
        <div class="overflow-x">
          <table class="data-table">
            <thead><tr><th>Patient</th><th>ID</th><th>Age</th><th>Policy</th><th>Insurer</th><th>Contact</th></tr></thead>
            <tbody id="patients-tbody">
              ${renderPatientsTableRows(patients)}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  }

  if (tab === 'upload') {
    body.innerHTML = `
    <div style="max-width:560px;">
      <div class="section-card">
        <div class="section-header"><div class="section-title">Upload Treatment Record</div></div>
        <div class="section-body">
          <p style="color:var(--text2);font-size:13px;margin-bottom:20px;">Upload a new treatment record for a patient. All data will be anchored on the blockchain.</p>
          <button class="btn-primary green" onclick="openModal('modal-upload')">Open Upload Form</button>
        </div>
      </div>
    </div>`;
  }

  if (tab === 'register') {
    body.innerHTML = `
    <div style="max-width:560px;">
      <div class="section-card">
        <div class="section-header"><div class="section-title">Register New Patient</div></div>
        <div class="section-body">
          <p style="color:var(--text2);font-size:13px;margin-bottom:20px;">Register a new patient in the system. A unique PAT-XXXXXX ID will be generated automatically.</p>
          <button class="btn-primary blue" onclick="openModal('modal-register')">Open Registration Form</button>
        </div>
      </div>
    </div>`;
  }
}

// ─── RENDER PATIENTS LIST ─────────────────────────────────────────────────────
function renderPatientsList(patients) {
  if (!patients.length) return emptyState('No patients registered yet');
  const clrs = ['blue','green','purple'];
  return patients.map((p, i) => {
    const clr = clrs[i % 3];
    const rgb = clr==='blue'?'59,130,246':clr==='green'?'16,185,129':'139,92,246';
    return `<div class="patient-item">
      <div class="patient-avatar" style="background:rgba(${rgb},.15);color:var(--${clr}2);">${(p.name||'?')[0].toUpperCase()}</div>
      <div><div class="patient-name">${p.name}</div><div class="patient-meta">Age ${p.age||'—'} · ${p.unique_id}</div></div>
      <div class="patient-right"><div style="font-weight:600;">${p.insurance_policy_id||'No Policy'}</div><div style="font-size:11px;">${p.email||p.phone||'—'}</div></div>
    </div>`;
  }).join('');
}

function renderPatientsTableRows(patients) {
  if (!patients.length) return `<tr><td colspan="6" style="text-align:center;color:var(--text2);padding:30px;">No patients registered yet</td></tr>`;
  return patients.map(p => `<tr>
    <td style="font-weight:600;">${p.name}</td>
    <td style="font-family:'DM Mono',monospace;font-size:12px;">${p.unique_id}</td>
    <td>${p.age||'—'}</td>
    <td>${p.insurance_policy_id||'—'}</td>
    <td>${p.insurer_unique_id||'—'}</td>
    <td style="color:var(--text2);">${p.email||p.phone||'—'}</td>
  </tr>`).join('');
}

// ─── INSURER TABS ─────────────────────────────────────────────────────────────
async function renderInsurerTab(tab, body) {
  if (tab === 'overview') {
    const [stats, claims] = await Promise.all([
      apiCall('GET', '/insurer/stats'),
      apiCall('GET', '/insurer/claims')
    ]);
    body.innerHTML = `
    <div class="stats-grid">
      ${statCard('Total Claims', stats.total, 'All time')}
      ${statCard('Pending Review', stats.pending, 'Needs attention', stats.pending>0?'amber':'')}
      ${statCard('Approved', stats.approved, 'Processed', 'green')}
      ${statCard('Avg Fraud Score', (stats.avgFraudScore||0)+'%', 'AI risk score', (stats.avgFraudScore||0)>60?'red':'')}
    </div>
    ${renderClaimsSection(claims, true)}`;
  }

  if (tab === 'claims') {
    const claims = await apiCall('GET', '/insurer/claims');
    body.innerHTML = renderClaimsSection(claims, true);
  }

  if (tab === 'reports') {
    const stats = await apiCall('GET', '/insurer/stats');
    body.innerHTML = `
    <div class="section-card" style="max-width:540px;">
      <div class="section-header"><div class="section-title">Claims Report</div></div>
      <div class="section-body">
        ${infoRow('Total Claims Filed', stats.total)}
        ${infoRow('Total Value', '₹'+((stats.totalValue||0)).toLocaleString())}
        ${infoRow('Approved Claims', stats.approved)}
        ${infoRow('Rejected Claims', stats.rejected)}
        ${infoRow('Pending Review', stats.pending)}
        ${infoRow('Avg Fraud Score', (stats.avgFraudScore||0)+'%')}
        ${infoRow('Approval Rate', stats.total > 0 ? Math.round(stats.approved/stats.total*100)+'%' : '—')}
      </div>
    </div>`;
  }
}

// ─── HTML BUILDERS ────────────────────────────────────────────────────────────
function statCard(label, value, hint='', hintClass='') {
  return `<div class="stat-card">
    <div class="stat-card-bg">■</div>
    <div class="stat-label">${label}</div>
    <div class="stat-value">${value}</div>
    <div class="stat-hint ${hintClass}">${hint}</div>
  </div>`;
}

/**
 * Builds the treatment card HTML.
 * @param {object} t - Treatment object
 * @param {Array}  claims - All patient claims (used to decide whether to show "Apply for Claim" button)
 */
function treatmentCardHTML(t, claims = []) {
  const txLink = t.blockchain_tx_hash && !t.blockchain_tx_hash.startsWith('MOCK') && t.blockchain_tx_hash !== 'BLOCKCHAIN_NOT_CONFIGURED'
    ? `<a href="https://sepolia.etherscan.io/tx/${t.blockchain_tx_hash}" target="_blank" class="action-btn purple">View On-Chain ↗</a>` : '';

  // Hide "Apply for Claim" if there is already an approved claim for this treatment
  const approvedClaim = claims.find(c => c.treatment_id === t.id && c.status === 'approved');
  const claimBtn = approvedClaim
    ? `<span style="font-size:12px;color:var(--green2);display:flex;align-items:center;gap:5px;">✓ Claim Approved</span>`
    : `<button class="action-btn green" onclick="openClaimModal('${t.id}', ${t.amount_spent||0})">Apply for Claim</button>`;

  return `
  <div class="treatment-card">
    <div class="treatment-top">
      <div>
        <div class="treatment-hospital">${t.hospital_name||t.hospital_unique_id||'—'}</div>
        <div class="treatment-date">${fmtDate(t.admission_date||t.created_at)}</div>
      </div>
      <div style="text-align:right;">
        <div class="treatment-amount">₹${(t.amount_spent||0).toLocaleString()}</div>
        <div class="treatment-invoice" style="font-family:'DM Mono',monospace;font-size:10px;">${(t.blockchain_tx_hash||'').slice(0,20)}...</div>
      </div>
    </div>
    <div class="treatment-grid">
      <div class="treatment-field"><label>Doctor</label><p>${t.doctor_name||'—'}</p></div>
      <div class="treatment-field"><label>Diagnosis</label><p>${t.diagnosis||'—'}</p></div>
      <div class="treatment-field"><label>ICD Codes</label><p>${(t.icd_codes||[]).join(', ')||'—'}</p></div>
    </div>
    <div class="treatment-actions">
      ${claimBtn}
      ${t.prescription_cid && !t.prescription_cid.startsWith('MOCK') ? `<button class="action-btn blue" onclick="downloadTreatmentFile('${t.id}','prescription')">⬇ Prescription</button>` : ''}
      ${t.invoice_cid && !t.invoice_cid.startsWith('MOCK') ? `<button class="action-btn blue" onclick="downloadTreatmentFile('${t.id}','invoice')">⬇ Invoice</button>` : ''}
      ${txLink}
    </div>
  </div>`;
}

function claimCardHTML(c, withActions) {
  const treatment = c.treatments || {};
  const patient = c.users || {};
  const fraudColor = (c.fraud_score||0) > 70 ? 'var(--red2)' : (c.fraud_score||0) > 40 ? 'var(--amber2)' : 'var(--green2)';
  const fraudBarColor = (c.fraud_score||0) > 70 ? '#ef4444' : (c.fraud_score||0) > 40 ? '#f59e0b' : '#10b981';

  return `
  <div class="claim-card">
    <div class="claim-top">
      <div>
        <div style="font-weight:600;font-size:14px;">${patient.name || c.patient_unique_id}</div>
        <div class="claim-id">${(c.id||'').slice(0,8)} · ${c.policy_number||'No Policy'}</div>
      </div>
      ${statusBadge(c.status)}
    </div>
    <div class="claim-mid">
      <div class="claim-field"><label>Amount</label><p style="font-weight:700;color:var(--blue2);">₹${(c.claimed_amount||0).toLocaleString()}</p></div>
      <div class="claim-field"><label>Submitted</label><p>${fmtDate(c.submitted_at)}</p></div>
      <div class="claim-field"><label>Diagnosis</label><p>${treatment.diagnosis||'—'}</p></div>
    </div>
    ${c.fraud_score !== undefined ? `
    <div style="margin-bottom:12px;">
      <div style="font-size:10px;color:var(--text3);letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px;">AI Fraud Risk Score</div>
      <div class="fraud-score">
        <div class="fraud-bar-bg"><div class="fraud-bar" style="width:${c.fraud_score||0}%;background:${fraudBarColor};"></div></div>
        <span class="fraud-score-val" style="color:${fraudColor};">${c.fraud_score||0}%</span>
      </div>
    </div>` : ''}
    ${c.ai_explanation ? `<div style="font-size:12px;color:var(--text2);margin-bottom:12px;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:8px;padding:10px;line-height:1.5;">💬 ${c.ai_explanation}</div>` : ''}
    <div class="claim-actions">
      ${withActions && (c.status === 'pending' || c.status === 'under_review') ? `
      <button class="action-btn green" onclick="doResolveClaim('${c.id}','approved')">✓ Approve</button>
      <button class="action-btn red" onclick="doResolveClaim('${c.id}','rejected')">✕ Reject</button>` : ''}
      <button class="action-btn blue" onclick="viewClaimDetail('${c.id}')">View Details</button>
    </div>
  </div>`;
}

function renderClaimsSection(claims, withActions) {
  return `
  <div class="section-card">
    <div class="section-header"><div class="section-title">Claims (${claims.length})</div></div>
    <div class="section-body" style="padding:14px;">
      ${claims.length ? claims.map(c => claimCardHTML(c, withActions)).join('') : emptyState('No claims found')}
    </div>
  </div>`;
}

function statusBadge(s) {
  const map = { pending:'⏳ Pending', approved:'✓ Approved', rejected:'✕ Rejected', under_review:'🔍 Under Review' };
  return `<span class="status ${s}">${map[s]||s}</span>`;
}

function infoRow(label, value) {
  return `<div style="padding:11px 0;border-bottom:1px solid var(--border);">
    <div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px;">${label}</div>
    <div style="font-size:14px;">${value}</div>
  </div>`;
}

function emptyState(msg) {
  return `<div class="empty-state"><div class="empty-state-icon">◎</div><div class="empty-state-text">${msg}</div></div>`;
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }); }
  catch(e) { return d; }
}

// ─── MODALS ───────────────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

['modal-claim','modal-upload','modal-claim-detail','modal-register','modal-credentials'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', function(e) { if (e.target === this) closeModal(id); });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    ['modal-claim','modal-upload','modal-claim-detail','modal-register','modal-credentials'].forEach(id => closeModal(id));
  }
});

function openClaimModal(treatmentId, amount) {
  const sel = document.getElementById('claim-treatment-id');
  sel.innerHTML = cachedTreatments.length
    ? cachedTreatments.map(t => `<option value="${t.id}" ${t.id===treatmentId?'selected':''}>${t.hospital_name||t.hospital_unique_id||'Unknown Hospital'} — ${t.diagnosis} (₹${t.amount_spent||0})</option>`).join('')
    : '<option value="">No treatments available. Load treatments first.</option>';
  if (amount) document.getElementById('claim-amount').value = amount;
  openModal('modal-claim');
}

// ─── SUBMIT CLAIM ─────────────────────────────────────────────────────────────
async function doSubmitClaim() {
  const treatmentId = document.getElementById('claim-treatment-id').value;
  const insurerUniqueId = document.getElementById('claim-insurer-id').value.trim();
  const policyNumber = document.getElementById('claim-policy').value.trim();
  const claimedAmount = document.getElementById('claim-amount').value;

  if (!treatmentId || !insurerUniqueId || !claimedAmount) {
    showToast('Treatment, Insurer ID, and Amount are required.', 'error'); return;
  }

  try {
    showToast('Submitting claim and running AI analysis...', 'info');
    const data = await apiCall('POST', '/patient/claims', { treatmentId, insurerUniqueId, policyNumber, claimedAmount });
    showToast(`Claim submitted! AI Fraud Score: ${data.fraudScore}%`, 'success');
    closeModal('modal-claim');
    switchTab('claims', null);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── UPLOAD TREATMENT ─────────────────────────────────────────────────────────
async function doUploadTreatment() {
  const patientUniqueId = document.getElementById('upload-patient-id').value.trim();
  const diagnosis = document.getElementById('upload-diagnosis').value.trim();
  const doctorName = document.getElementById('upload-doctor').value.trim();
  const hospitalName = document.getElementById('upload-hospital-name').value.trim();
  const icdCodes = document.getElementById('upload-icd').value.trim();
  const admissionDate = document.getElementById('upload-admission').value;
  const dischargeDate = document.getElementById('upload-discharge').value;
  const amountSpent = document.getElementById('upload-amount').value;

  if (!patientUniqueId || !diagnosis || !doctorName) {
    showToast('Patient ID, Diagnosis, and Doctor Name are required.', 'error'); return;
  }

  const btn = document.getElementById('btn-upload');
  btn.innerHTML = '<span class="spinner"></span> Uploading to IPFS...';
  btn.disabled = true;

  try {
    const formData = new FormData();
    formData.append('patientUniqueId', patientUniqueId);
    formData.append('diagnosis', diagnosis);
    formData.append('doctorName', doctorName);
    formData.append('hospitalName', hospitalName);
    formData.append('admissionDate', admissionDate);
    formData.append('dischargeDate', dischargeDate);
    formData.append('amountSpent', amountSpent);
    if (icdCodes) {
      icdCodes.split(',').map(s => s.trim()).filter(Boolean).forEach(code => formData.append('icdCodes', code));
    }

    const prescriptionFile = document.getElementById('upload-prescription').files[0];
    if (prescriptionFile) formData.append('prescription', prescriptionFile);

    const invoiceFile = document.getElementById('upload-invoice').files[0];
    if (invoiceFile) formData.append('invoice', invoiceFile);

    const labFiles = document.getElementById('upload-lab-reports').files;
    for (const f of labFiles) formData.append('labReports', f);

    const photoFiles = document.getElementById('upload-photos').files;
    for (const f of photoFiles) formData.append('photos', f);

    const res = await fetch(API_BASE + '/hospital/upload-treatment', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + authToken },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');

    const fileMsg = prescriptionFile || invoiceFile ? ' Files stored on IPFS.' : '';
    showToast('Treatment uploaded! TX: ' + (data.txHash||'').slice(0,20) + fileMsg, 'success');
    closeModal('modal-upload');
    ['upload-patient-id','upload-diagnosis','upload-doctor','upload-hospital-name','upload-icd','upload-admission','upload-discharge','upload-amount'].forEach(id => document.getElementById(id).value = '');
    ['upload-prescription','upload-invoice','upload-lab-reports','upload-photos'].forEach(id => document.getElementById(id).value = '');
    switchTab('overview', document.querySelector('.sidebar-item'));
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.innerHTML = 'Upload to Blockchain + IPFS';
    btn.disabled = false;
  }
}

// ─── REGISTER PATIENT ─────────────────────────────────────────────────────────
async function doRegisterPatient() {
  const name = document.getElementById('reg-name').value.trim();
  const age = document.getElementById('reg-age').value;
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const insurancePolicyId = document.getElementById('reg-policy').value.trim();
  const insurerUniqueId = document.getElementById('reg-insurer').value.trim();
  const initialPassword = document.getElementById('reg-password').value;

  if (!name || !initialPassword) {
    showToast('Name and initial password are required.', 'error'); return;
  }

  try {
    const data = await apiCall('POST', '/hospital/register-patient', {
      name, age, email, phone, insurancePolicyId, insurerUniqueId, initialPassword
    });
    closeModal('modal-register');

    // Show credentials modal
    document.getElementById('credentials-body').innerHTML = `
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:40px;margin-bottom:10px;">🎉</div>
        <p style="color:var(--text2);font-size:13px;">Patient registered successfully. Share these credentials securely:</p>
      </div>
      <div style="background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.2);border-radius:12px;padding:18px;margin-bottom:16px;">
        ${infoRow('Patient Name', data.credentials?.name||name)}
        ${infoRow('Patient ID', data.credentials?.patientId||'—')}
        ${infoRow('Initial Password', data.credentials?.initialPassword||initialPassword)}
      </div>
      <p style="color:var(--amber2);font-size:12px;text-align:center;">⚠ Share these credentials securely with the patient. They should change the password on first login.</p>`;
    openModal('modal-credentials');

    // Clear form fields
    ['reg-name','reg-age','reg-email','reg-phone','reg-policy','reg-insurer','reg-password'].forEach(id => document.getElementById(id).value='');
    showToast('Patient registered successfully!', 'success');

    // ── AUTO-REFRESH patient list if currently on overview or patients tab ──
    if (currentRole === 'hospital') {
      if (currentTab === 'overview') {
        // Silently refresh the patients list section
        try {
          const updatedPatients = await apiCall('GET', '/hospital/patients');
          const listBody = document.getElementById('patients-list-body');
          if (listBody) {
            listBody.innerHTML = renderPatientsList(updatedPatients);
            // Update the stat card count
            const statValues = document.querySelectorAll('.stat-value');
            if (statValues[0]) statValues[0].textContent = updatedPatients.length;
          }
        } catch(_) { /* silently ignore */ }
      } else if (currentTab === 'patients') {
        // Reload the whole patients tab
        try {
          const updatedPatients = await apiCall('GET', '/hospital/patients');
          const tbody = document.getElementById('patients-tbody');
          if (tbody) tbody.innerHTML = renderPatientsTableRows(updatedPatients);
          // Update section title count
          const sectionTitle = document.querySelector('.section-title');
          if (sectionTitle) sectionTitle.textContent = `All Patients (${updatedPatients.length})`;
        } catch(_) { /* silently ignore */ }
      }
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── RESOLVE CLAIM ────────────────────────────────────────────────────────────
async function doResolveClaim(claimId, decision) {
  let reason = null;
  if (decision === 'rejected') {
    reason = prompt('Reason for rejection (optional, will be shown to patient):');
  }
  try {
    showToast('Processing decision...', 'info');
    await apiCall('POST', `/insurer/claims/${claimId}/resolve`, { decision, reason });
    showToast(`Claim ${decision} successfully!`, 'success');
    renderTab(currentTab);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── VIEW CLAIM DETAIL ────────────────────────────────────────────────────────
async function viewClaimDetail(claimId) {
  try {
    let claim;
    if (currentRole === 'insurance') {
      claim = await apiCall('GET', `/insurer/claims/${claimId}`);
    } else {
      const claims = await apiCall('GET', '/patient/claims');
      claim = claims.find(c=>c.id===claimId);
    }
    if (!claim) { showToast('Claim not found', 'error'); return; }

    const t = claim.treatments || {};
    const p = claim.users || {};
    document.getElementById('claim-detail-body').innerHTML = `
      <div class="modal-section-title">Claim Information</div>
      <div style="margin-bottom:20px;">
        ${infoRow('Claim ID', claim.id||'—')}
        ${infoRow('Status', statusBadge(claim.status))}
        ${infoRow('Patient', p.name||claim.patient_unique_id)}
        ${infoRow('Policy Number', claim.policy_number||'—')}
        ${infoRow('Claimed Amount', '₹'+(claim.claimed_amount||0).toLocaleString())}
        ${infoRow('Submitted', fmtDate(claim.submitted_at))}
        ${claim.resolved_at ? infoRow('Resolved', fmtDate(claim.resolved_at)) : ''}
        ${claim.fraud_score !== undefined ? infoRow('AI Fraud Score', claim.fraud_score+'%') : ''}
      </div>
      ${t.diagnosis ? `
      <div class="modal-section-title">Treatment Details</div>
      <div style="margin-bottom:20px;">
        ${infoRow('Hospital', t.hospital_name||'—')}
        ${infoRow('Doctor', t.doctor_name||'—')}
        ${infoRow('Diagnosis', t.diagnosis||'—')}
        ${infoRow('Period', fmtDate(t.admission_date)+' → '+fmtDate(t.discharge_date))}
        ${infoRow('Amount Spent', '₹'+(t.amount_spent||0).toLocaleString())}
        ${t.blockchain_tx_hash ? infoRow('Blockchain TX', `<span class="hash-badge">⛓ ${t.blockchain_tx_hash}</span>`) : ''}
        ${(t.prescription_cid && !t.prescription_cid.startsWith('MOCK')) || (t.invoice_cid && !t.invoice_cid.startsWith('MOCK')) ? `
        <div style="padding:11px 0;border-bottom:1px solid var(--border);">
          <div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">IPFS Documents</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${t.prescription_cid && !t.prescription_cid.startsWith('MOCK') ? `<button class="action-btn blue" onclick="downloadInsurerFile('${claim.treatment_id}','prescription')">⬇ Prescription PDF</button>` : ''}
            ${t.invoice_cid && !t.invoice_cid.startsWith('MOCK') ? `<button class="action-btn blue" onclick="downloadInsurerFile('${claim.treatment_id}','invoice')">⬇ Invoice PDF</button>` : ''}
          </div>
        </div>` : ''}
      </div>` : ''}
      ${claim.ai_explanation ? `
      <div class="modal-section-title">AI Analysis / Patient Message</div>
      <div style="background:rgba(59,130,246,.04);border:1px solid rgba(59,130,246,.12);border-radius:10px;padding:14px;font-size:13px;color:var(--text2);line-height:1.6;">
        💬 ${claim.ai_explanation}
      </div>` : ''}`;
    openModal('modal-claim-detail');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── DOWNLOAD TREATMENT FILES (Patient) ──────────────────────────────────────
async function downloadTreatmentFile(treatmentId, type) {
  try {
    showToast('Fetching file from IPFS...', 'info');
    const res = await fetch(`${API_BASE}/patient/treatments/${treatmentId}/download/${type}`, {
      headers: { 'Authorization': 'Bearer ' + authToken }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Download failed');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_${treatmentId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(`${type.charAt(0).toUpperCase()+type.slice(1)} downloaded successfully.`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── DOWNLOAD TREATMENT FILES (Insurer) ──────────────────────────────────────
async function downloadInsurerFile(treatmentId, type) {
  try {
    showToast('Fetching file from IPFS...', 'info');
    const res = await fetch(`${API_BASE}/insurer/treatments/${treatmentId}/download/${type}`, {
      headers: { 'Authorization': 'Bearer ' + authToken }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Download failed');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_${treatmentId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(`${type.charAt(0).toUpperCase()+type.slice(1)} downloaded successfully.`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}
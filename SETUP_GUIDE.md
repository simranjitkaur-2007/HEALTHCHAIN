# 🏥 HealthChain — Complete Setup Guide
**Blockchain-Secured Medical Records | Node.js + Supabase + IPFS + Ethereum + Claude AI**

---

## What You're Building

HealthChain is a full-stack web app with **5 layers**:

| Layer | Tech | Purpose |
|-------|------|---------|
| Frontend | Single HTML file | Patient, Hospital, Insurer dashboards |
| Backend | Node.js + Express | REST API server on port 5000 |
| Database | Supabase (PostgreSQL) | Users, treatments, claims |
| Blockchain | Ethereum Sepolia | Tamper-proof audit trail |
| AI | Claude API | Fraud detection + explanations |
| Storage | IPFS via Pinata | Encrypted medical file storage |

**Demo credentials (after seeding):** All use password `demo123`

---

## Project Structure

```
healthchain/
├── backend/                   ← Node.js API server (port 5000)
│   ├── server.js              ← Entry point — start here
│   ├── package.json
│   ├── .env                   ← YOUR SECRET KEYS (never commit!)
│   ├── config/
│   │   └── supabase.js        ← Supabase client
│   ├── controllers/           ← Business logic
│   │   ├── authController.js
│   │   ├── patientController.js
│   │   ├── hospitalController.js
│   │   └── insurerController.js
│   ├── middlewares/
│   │   ├── auth.js            ← JWT verification
│   │   └── role.js            ← Role-based access (patient/hospital/insurer)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── patient.js
│   │   ├── hospital.js
│   │   └── insurer.js
│   └── services/
│       ├── aiService.js       ← Claude AI fraud scoring
│       ├── blockchainService.js ← Ethereum write/read
│       ├── encryptionService.js ← AES-256 file encryption
│       └── ipfsService.js     ← Pinata IPFS upload/fetch
│
├── blockchain/                ← Solidity smart contracts
│   ├── contracts/
│   │   ├── MedicalRecord.sol
│   │   └── InsuranceClaim.sol
│   ├── scripts/
│   │   └── deploy.js
│   └── hardhat.config.js
│
├── frontend/
│   └── index.html             ← Full app — single file, no build needed
│
├── supabase-setup.sql         ← Run this once in Supabase SQL Editor
└── SETUP_GUIDE.md             ← This file
```

---

## Prerequisites

Install these before starting:

| Tool | Where to get it | Verify |
|------|----------------|--------|
| Node.js v18+ | nodejs.org → LTS | `node --version` |
| npm v9+ | Comes with Node | `npm --version` |
| VS Code | code.visualstudio.com | — |
| Live Server extension | VS Code Extensions tab | — |
| Git | git-scm.com | `git --version` |

---

## STEP 1 — Get Your API Keys (4 services, all free)

### 1A — Supabase (Database)

1. Go to **supabase.com** → Sign Up
2. Click **New Project** → name it `healthchain`, pick a region near you
3. Set a database password → wait ~2 minutes for setup
4. Go to **Settings → API** in the left sidebar
5. Copy two values:
   - **Project URL** → `https://xxxxxxxx.supabase.co`
   - **service_role key** → the longer key labeled `service_role` (starts with `eyJ...`)

> ⚠️ Use only the `service_role` key in your backend `.env`. Never put it in frontend code.

---

### 1B — Pinata (IPFS File Storage)

1. Go to **pinata.cloud** → Sign Up (free tier works)
2. Click your avatar → **API Keys** → **+ New Key**
3. Enable permission: `pinFileToIPFS`
4. Click **Create Key**
5. Copy your **API Key** and **API Secret** — you only see the secret once!

---

### 1C — Infura (Ethereum RPC)

1. Go to **infura.io** → Sign Up
2. Click **Create New API Key** → choose **Web3 API**
3. Open your project → click the **Sepolia** network tab
4. Copy the HTTPS URL: `https://sepolia.infura.io/v3/YOUR_ID`

> 💡 Alternative: Use **Alchemy** (alchemy.com) — create an app, pick Ethereum Sepolia, copy the HTTPS URL. Either works.

---

### 1D — Anthropic Claude API (AI Fraud Scoring)

1. Go to **console.anthropic.com** → Sign Up
2. Click **API Keys** → **Create Key**
3. Copy the key starting with `sk-ant-...`

> 💡 Anthropic gives free credits to new accounts. You can request hackathon credits at console.anthropic.com/settings/billing

---

## STEP 2 — Set Up the Supabase Database

1. Open your Supabase project → click **SQL Editor** → **New Query**
2. Open `supabase-setup.sql` from this project in VS Code
3. Copy the entire file contents and paste into the SQL Editor
4. Click **Run** (or `Ctrl + Enter`)

You should see `Success. No rows returned` for each statement.

**Verify:** Click **Table Editor** in the left sidebar — you should see three tables: `users`, `treatments`, `claims`.

---

## STEP 3 — Get a MetaMask Wallet + Sepolia ETH

This is needed to write records to the Ethereum blockchain.

### Create the wallet

1. Install **MetaMask** from metamask.io (browser extension)
2. Click **Create a new wallet** → save your seed phrase somewhere safe
3. After setup: click your account name → **Account Details** → **Show private key**
4. Enter your password → copy the private key (64 hex characters, starts with `0x`)

### Get free Sepolia test ETH

1. Go to **sepoliafaucet.com** (or search "Sepolia faucet")
2. Connect your MetaMask wallet or paste your wallet address
3. Request ETH — you'll receive 0.5 test ETH within ~1 minute

> ℹ️ Sepolia is a testnet — the ETH has no real value. It's just needed to pay gas fees for deploying contracts.

---

## STEP 4 — Configure Environment Variables

1. Open `healthchain/backend/.env` in VS Code
2. Fill in all your values:

```env
# ── Supabase ──────────────────────────────────────────
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...your_service_role_key

# ── JWT ───────────────────────────────────────────────
# Any long random string works — min 32 characters
JWT_SECRET=pick_any_long_random_string_here_abc123xyz789

# ── Pinata (IPFS) ────────────────────────────────────
PINATA_API_KEY=your_pinata_api_key
PINATA_API_SECRET=your_pinata_api_secret

# ── Infura / Alchemy (Ethereum) ──────────────────────
INFURA_SEPOLIA_URL=https://sepolia.infura.io/v3/your_project_id

# ── MetaMask Wallet ───────────────────────────────────
WALLET_PRIVATE_KEY=0x_your_64_character_private_key

# ── Anthropic Claude ─────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-your_key_here

# ── Encryption ────────────────────────────────────────
# Generate one: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4

# ── Smart Contract Addresses (fill AFTER deploying in Step 8) ──
MEDICAL_RECORD_CONTRACT=
INSURANCE_CLAIM_CONTRACT=

# ── Server ────────────────────────────────────────────
PORT=5000
FRONTEND_URL=http://localhost:5500
NODE_ENV=development
```

> 💡 To generate a secure ENCRYPTION_KEY, run this in your terminal:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## STEP 5 — Install Backend Dependencies

Open a terminal in VS Code (**Terminal → New Terminal**) and run:

```bash
cd healthchain/backend
npm install
```

This downloads all required packages (~30 packages including Express, Supabase, bcrypt, JWT, ethers.js, multer, Anthropic SDK). Takes about 1 minute.

**Verify it worked:**
```bash
ls node_modules
```
You should see a `node_modules/` folder with many packages inside.

---

## STEP 6 — Start the Backend Server

Still inside `healthchain/backend/`, run:

```bash
npm run dev
```

You should see:

```
🏥 HealthChain Backend running on http://localhost:5000
📊 Health check: http://localhost:5000/health

📋 API Routes:
   POST /api/auth/login
   POST /api/auth/seed-demo
   GET  /api/patient/treatments
   POST /api/patient/claims
   POST /api/hospital/register-patient
   POST /api/hospital/upload-treatment
   GET  /api/insurer/claims
   POST /api/insurer/claims/:id/resolve
```

**Verify:** Open `http://localhost:5000/health` in your browser. You should see:
```json
{
  "status": "ok",
  "service": "HealthChain Backend",
  "env": { "supabase": true, "pinata": true, "anthropic": true, "blockchain": true }
}
```

Keep this terminal open — the server must stay running.

---

## STEP 7 — Seed Demo Accounts

With the backend running, open a **new terminal** and run:

```bash
curl -X POST http://localhost:5000/api/auth/seed-demo
```

Or if you don't have curl, use this Node.js one-liner:

```bash
node -e "fetch('http://localhost:5000/api/auth/seed-demo',{method:'POST'}).then(r=>r.json()).then(d=>console.log(JSON.stringify(d,null,2)))"
```

You should see:

```json
{
  "success": true,
  "message": "Demo accounts created. Password for all: demo123",
  "accounts": [
    { "id": "HSP-000001", "name": "AIIMS Delhi", "role": "hospital" },
    { "id": "INS-000001", "name": "StarHealth Insurance", "role": "insurer" },
    { "id": "PAT-000001", "name": "Rahul Kumar", "role": "patient" }
  ]
}
```

**Verify:** Go to Supabase → Table Editor → `users`. You should see 3 rows.

Demo credentials:

| Role | ID | Password |
|------|----|----------|
| 🏥 Hospital | `HSP-000001` | `demo123` |
| 🛡️ Insurer | `INS-000001` | `demo123` |
| 👤 Patient | `PAT-000001` | `demo123` |

---

## STEP 8 — Open the Frontend

1. In VS Code, right-click **`healthchain/frontend/index.html`**
2. Click **"Open with Live Server"**
3. Your browser opens at `http://localhost:5500`

You'll see the HealthChain landing page with three portal cards — Patient, Hospital, and Insurance Company.

> ⚠️ **Must use Live Server.** The backend only allows CORS from `http://localhost:5500`. Opening `index.html` directly as a `file://` URL will cause login to fail with a CORS/network error.

> ℹ️ **No build step needed.** The entire frontend is one self-contained `index.html` file — no npm, no webpack, no React. Just open and go.

---

## STEP 9 — Test the Full Demo Flow

Follow this sequence to verify the entire system end-to-end:

```
1. LOGIN AS HOSPITAL (HSP-000001 / demo123)
   ├─ Sidebar → Register Patient
   │   Fill in: name, age, initial password
   │   → You get a PAT-XXXXXX ID + password — save these
   └─ Sidebar → Upload Record
       Fill in: the new patient's PAT-XXXXXX ID, diagnosis, doctor name, amount
       → Record is encrypted, sent to IPFS (or mock), hash written to blockchain

2. LOGIN AS PATIENT (PAT-XXXXXX / the password you set)
   ├─ Treatments tab → see the treatment uploaded by the hospital
   └─ Click "Apply for Claim"
       Fill in: Insurer ID = INS-000001, policy number, claim amount
       → Claim submitted, Claude AI fraud score runs automatically

3. LOGIN AS INSURER (INS-000001 / demo123)
   ├─ Claims tab → see the new claim with AI fraud score (0–100)
   ├─ Click "View Details" → see full treatment + AI explanation
   └─ Click "Approve" or "Reject"
       → Decision + Claude-generated patient explanation saved to DB
       → Blockchain transaction recorded

4. LOGIN BACK AS PATIENT
   └─ Claims tab → status now shows Approved / Rejected
       → AI explanation visible explaining the decision in plain English
```

---

## STEP 10 — Deploy Smart Contracts (Optional but Recommended)

Without this step the app works fine using mock transaction hashes. To write real records to Ethereum Sepolia:

### Install Hardhat

```bash
cd healthchain/blockchain
npm install
```

### Create blockchain `.env`

Create a new file `healthchain/blockchain/.env` with:

```env
INFURA_SEPOLIA_URL=https://sepolia.infura.io/v3/your_project_id
WALLET_PRIVATE_KEY=0x_your_private_key
```

### Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Output will look like:

```
✅ MedicalRecord deployed to: 0xAbCd...1234
✅ InsuranceClaim deployed to: 0xEfGh...5678

📋 COPY THESE TO YOUR backend/.env FILE:
MEDICAL_RECORD_CONTRACT=0xAbCd...1234
INSURANCE_CLAIM_CONTRACT=0xEfGh...5678
```

### Activate contract addresses

1. Copy the two addresses into `healthchain/backend/.env`
2. Restart the backend server (`Ctrl+C` then `npm run dev`)
3. From now on, every treatment upload and claim submission writes a real Ethereum transaction

**View transactions:** Go to `https://sepolia.etherscan.io/tx/YOUR_TX_HASH`

---

## API Reference

All API routes served at `http://localhost:5000`

### Auth (public)
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | `{ uniqueId, password }` | Login, returns JWT token |
| POST | `/api/auth/seed-demo` | — | Create demo accounts (dev only) |

### Patient (JWT required, role: patient)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/patient/profile` | Get own profile |
| GET | `/api/patient/treatments` | List all treatments |
| GET | `/api/patient/treatments/:id/download/:type` | Download file (prescription / invoice) |
| GET | `/api/patient/claims` | List submitted claims |
| POST | `/api/patient/claims` | Submit new insurance claim |

### Hospital (JWT required, role: hospital)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/hospital/register-patient` | Register a new patient |
| POST | `/api/hospital/upload-treatment` | Upload treatment + files |
| GET | `/api/hospital/patients` | List hospital's patients |

### Insurer (JWT required, role: insurer)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/insurer/claims` | List all claims for this insurer |
| GET | `/api/insurer/claims/:id` | Get full claim details |
| POST | `/api/insurer/claims/:id/resolve` | Approve or reject a claim |
| GET | `/api/insurer/stats` | Dashboard statistics |

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot connect to server` | Backend not running | Run `npm run dev` in `backend/` folder |
| `CORS error` in browser | Wrong frontend port | Open via Live Server on port 5500, not as `file://` |
| `401 Unauthorized` on login | Wrong credentials or format | ID must start with `PAT-`, `HSP-`, or `INS-` |
| `User not found` | Demo accounts not seeded | Run `POST /api/auth/seed-demo` |
| `Missing SUPABASE_URL` on server start | Wrong working directory | Must run `node server.js` from inside `backend/` folder |
| `Pinata 401` | Wrong Pinata keys | Regenerate keys at pinata.cloud — app works in mock mode without them |
| `Blockchain mock mode` | Contract addresses empty | App still works — fill in contract addresses after deploying (Step 10) |
| `AI returns generic text` | Missing Anthropic key | Add `ANTHROPIC_API_KEY` to `.env` |
| Port 5000 already in use | Another app on port 5000 | Change `PORT=5001` in `.env`, and update `API_BASE` in `frontend/index.html` |

---

## Quick Start Cheatsheet

```bash
# ── One-time setup ────────────────────────────────────
cd healthchain/backend
npm install

# ── Every time you work on the project ───────────────
cd healthchain/backend
npm run dev                          # Start backend (keep running)

# ── Seed demo data (run once after npm install) ───────
curl -X POST http://localhost:5000/api/auth/seed-demo

# ── Open frontend ─────────────────────────────────────
# Right-click frontend/index.html → Open with Live Server

# ── Demo login credentials ────────────────────────────
# Hospital:  HSP-000001 / demo123
# Insurer:   INS-000001 / demo123
# Patient:   PAT-000001 / demo123

# ── Deploy contracts (optional) ───────────────────────
cd healthchain/blockchain
npm install
npx hardhat run scripts/deploy.js --network sepolia
```

---

## For the Demo Pitch

**Problem:** Insurance claims take 2–4 weeks. Fraud is rampant. Patients carry stacks of documents.

**Solution:** HealthChain processes claims in 24 hours with:
- 🔒 **Zero patient document upload** — hospitals upload once, blockchain proves authenticity
- 🤖 **AI fraud scoring** — every claim gets a 0–100 risk score with plain-English explanation (Claude)
- ⛓️ **Blockchain audit trail** — approvals/rejections permanently recorded on Ethereum
- 📦 **Encrypted IPFS storage** — medical files AES-256 encrypted before upload

**Live demo flow:** Hospital uploads → Patient applies → Insurer sees AI score → Approves → Blockchain records it

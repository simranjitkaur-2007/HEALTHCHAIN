<div align="center">

<img src="https://img.shields.io/badge/Ethereum-Sepolia-3B82F6?style=for-the-badge&logo=ethereum&logoColor=white"/>
<img src="https://img.shields.io/badge/IPFS-Pinata-6366F1?style=for-the-badge&logo=ipfs&logoColor=white"/>
<img src="https://img.shields.io/badge/MongoDB-Atlas-10B981?style=for-the-badge&logo=mongodb&logoColor=white"/>
<img src="https://img.shields.io/badge/Cloudflare-Workers-F59E0B?style=for-the-badge&logo=cloudflare&logoColor=white"/>
<img src="https://img.shields.io/badge/AI-Fraud%20Detection-EF4444?style=for-the-badge&logo=openai&logoColor=white"/>

<br/><br/>

```
██╗  ██╗███████╗ █████╗ ██╗  ████████╗██╗  ██╗ ██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗
██║  ██║██╔════╝██╔══██╗██║  ╚══██╔══╝██║  ██║██╔════╝██║  ██║██╔══██╗██║████╗  ██║
███████║█████╗  ███████║██║     ██║   ███████║██║     ███████║███████║██║██╔██╗ ██║
██╔══██║██╔══╝  ██╔══██║██║     ██║   ██╔══██║██║     ██╔══██║██╔══██║██║██║╚██╗██║
██║  ██║███████╗██║  ██║███████╗██║   ██║  ██║╚██████╗██║  ██║██║  ██║██║██║ ╚████║
╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝
```

### *"Because health data should heal, not harm"*

<br/>

**A decentralized medical records platform built on Ethereum — where hospitals can't lie, patients can't be ignored, and insurers can't be fooled.**

<br/>

[![Live Demo](https://img.shields.io/badge/🔗%20Live%20Demo-Sepolia%20Testnet-3B82F6?style=for-the-badge)](https://github.com/simranjitkaur-2007/HEALTHCHAIN)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## ⚡ The Problem

Healthcare in India runs on paperwork — and paperwork can be faked.

A diagnosis can be changed. A bill can be inflated. A patient can be denied a claim they genuinely deserve. All because there was **no single source of truth** that anyone could trust.

HealthChain was built to fix that.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        HealthChain Platform                      │
├───────────────┬──────────────────┬──────────────────────────────┤
│   🧑 Patient  │   🏥 Hospital    │   🛡️ Insurance Company       │
│   Portal      │   Portal         │   Portal                     │
│  PAT-XXXXXX   │  HSP-XXXXXX      │  INS-XXXXXX                  │
└───────┬───────┴────────┬─────────┴──────────────┬───────────────┘
        │                │                         │
        ▼                ▼                         ▼
┌───────────────────────────────────────────────────────────────┐
│                     Node.js Backend API                        │
│              JWT Auth  ·  Role Middleware  ·  REST             │
└───────────────┬───────────────────────────────────────────────┘
        ┌───────┴────────────────────────────┐
        ▼                                    ▼
┌──────────────────┐               ┌──────────────────────────┐
│   MongoDB Atlas   │               │   Ethereum (Sepolia)      │
│   (Encrypted DB)  │               │   Smart Contracts         │
│   Cloudflare R2   │               │   Immutable Audit Trail   │
└──────────────────┘               └──────────────────────────┘
        │                                    │
        ▼                                    ▼
┌──────────────────┐               ┌──────────────────────────┐
│  Pinata IPFS      │               │   AI Fraud Engine         │
│  AES-256-GCM      │               │   Self-Trained LLM        │
│  Encrypted Files  │               │   0–100 Risk Scoring      │
└──────────────────┘               └──────────────────────────┘
```

---

## 🌟 What Makes This Different

| Feature | Traditional Systems | HealthChain |
|---|---|---|
| Record tampering | Possible anytime | **Impossible — on-chain** |
| File privacy | Server can read your files | **AES-256-GCM encrypted before upload** |
| Fraud detection | Manual review | **AI-scored at submission** |
| Identity verification | Self-declared documents | **DigiLocker OAuth 2.0** |
| Scheme eligibility | Manual verification | **Ayushman Bharat API** |
| Audit trail | Internal logs (editable) | **Public blockchain transactions** |

---

## 👥 Three Portals, One Truth

<br/>

### 🧑 Patient Portal — `PAT-XXXXXX`

> *Your health history belongs to you.*

- Access your complete medical records, diagnoses, and prescriptions — anytime, anywhere
- Submit insurance claims directly from your treatment history
- Verify your identity instantly via **DigiLocker** — no physical documents needed
- Receive AI-generated, plain-English explanations when a claim is approved or rejected
- Every record linked to an immutable blockchain transaction

<br/>

### 🏥 Hospital Portal — `HSP-XXXXXX`

> *What you record today, you can't change tomorrow.*

- Register patients and upload treatment records directly to the blockchain
- Records become **permanently immutable** the moment they're submitted
- **Ayushman Bharat (NHA) API** integration for real-time scheme eligibility verification
- Upload prescriptions, invoices, lab reports, and medical photos — all encrypted to IPFS
- View and manage all registered patients from a single dashboard

<br/>

### 🛡️ Insurance Portal — `INS-XXXXXX`

> *Stop reviewing documents. Start reviewing truth.*

- Every incoming claim arrives pre-scored with a **0–100 AI fraud risk rating**
- The treatment record behind each claim is on-chain — unchanged since the day it was created
- Approve or reject claims with one click — AI generates the patient notification automatically
- Full claim history with blockchain verification links

---

## 🔐 Security Stack

```
File Upload Flow:
─────────────────────────────────────────────────────────
Hospital uploads file
        │
        ▼
AES-256-GCM Encryption (key stored server-side only)
        │
        ▼
Encrypted blob → Pinata IPFS → CID stored in MongoDB
        │
        ▼
Transaction hash → Ethereum Sepolia → Permanent record
─────────────────────────────────────────────────────────
Even Pinata cannot read your files. Even if the DB is
compromised, files are unreadable without the key.
```

- 🔑 **JWT Authentication** with role-based access control
- 🚫 **Zero-trust middleware** — a patient token cannot hit a hospital route, ever
- 🔒 **AES-256-GCM** encryption on all files before leaving the server
- ⛓️ **Immutable on-chain records** — no retroactive edits possible
- 🪪 **DigiLocker OAuth 2.0** for government-verified patient identity

---

## 🤖 AI Fraud Detection

Every insurance claim is automatically analyzed the moment it is submitted:

```
Claim Submitted
      │
      ▼
AI Model pulls: diagnosis · treatment cost · ICD codes
                patient history · insurer patterns
      │
      ▼
Fraud Risk Score: 0 ──────────────────── 100
                  ✅ Low Risk        🚨 High Risk
      │
      ▼
Insurer sees score + explanation
Insurer approves / rejects
      │
      ▼
AI generates plain-English notification for patient
```

Built on a **self-trained fraud detection model** — the scoring logic, training data pipeline, and model weights are fully owned by the project.

---

## 🏛️ Government Integrations

| Integration | Portal | Purpose |
|---|---|---|
| **DigiLocker OAuth 2.0** | Patient | Government-verified identity — no fake documents |
| **Ayushman Bharat (NHA) API** | Hospital | Real-time PM-JAY scheme eligibility verification |

> *Integration designed and sandbox-ready — pending NHA developer portal approval.*
> This is intentional. Knowing the compliance process matters more than faking the integration.

---

## ⛓️ Smart Contracts

```solidity
contracts/
├── MedicalRecord.sol      // Stores treatment record hashes on-chain
└── InsuranceClaim.sol     // Records claim submissions and resolutions
```

- Deployed on **Ethereum Sepolia testnet**
- Every upload emits an on-chain event with a verifiable transaction hash
- View any record live on **Etherscan** — no trust required

---

## 🗂️ Project Structure

```
HEALTHCHAIN/
├── 📁 contracts/
│   ├── MedicalRecord.sol
│   └── InsuranceClaim.sol
├── 📁 controllers/
│   ├── authController.js
│   ├── hospitalController.js
│   ├── patientController.js
│   └── insurerController.js
├── 📁 middlewares/
│   ├── auth.js              # JWT verification
│   └── role.js              # Role-based access enforcement
├── 📁 services/
│   ├── aiService.js         # Fraud scoring + claim explanation
│   ├── blockchainService.js # Ethereum interaction + mock fallback
│   └── encryptionService.js # AES-256-GCM file encryption
├── 📁 frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── supabase-setup.sql       # Database schema
├── deploy.js                # Smart contract deployment
└── server.js
```

---

## 🚀 Getting Started

### Prerequisites

```bash
Node.js >= 18
MongoDB Atlas account
Cloudflare Workers account
Pinata IPFS account
MetaMask wallet (for Sepolia testnet)
```

### Installation

```bash
# Clone the repository
git clone https://github.com/simranjitkaur-2007/HEALTHCHAIN.git
cd HEALTHCHAIN

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your MongoDB URI, Cloudflare keys, Pinata API key,
# Ethereum RPC URL, and contract addresses

# Deploy smart contracts to Sepolia
node deploy.js

# Start the server
npm start
```

### Environment Variables

```env
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
ETHEREUM_RPC_URL=your_sepolia_rpc_url
PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS_MEDICAL=deployed_contract_address
CONTRACT_ADDRESS_CLAIM=deployed_contract_address
PINATA_API_KEY=your_pinata_key
PINATA_SECRET=your_pinata_secret
ENCRYPTION_KEY=your_aes_256_key
CLOUDFLARE_ACCOUNT_ID=your_cf_account_id
```

---

## 💰 Infrastructure Cost

| Stage | Monthly Cost | Stack |
|---|---|---|
| **Dev / Demo** | ~$0 | MongoDB Free · Cloudflare Free · Pinata Free |
| **MVP Production** | ~$80–120 | MongoDB M10 · Cloudflare Workers · Own LLM |
| **At Scale (50 hospitals)** | ~$1,500–1,800 | MongoDB M30+ · Cloudflare Enterprise · GPU Inference |

---

## 🗓️ Built In

```
Phase 01 — Days 01–07   Smart Contracts & Auth
Phase 02 — Days 08–14   IPFS + Encryption Layer
Phase 03 — Days 15–21   AI Fraud Scoring Engine
Phase 04 — Days 22–24   DigiLocker + Ayushman Bharat Integration
Phase 05 — Days 25–28   Frontend & End-to-End QA
```

---

## 🧑‍💻 Built By

**Simranjit Kaur** — [@simranjitkaur-2007](https://github.com/simranjitkaur-2007)

---

<div align="center">

**HealthChain doesn't ask anyone to trust each other.**
**It makes trust unnecessary.**

<br/>

⭐ Star this repo if you believe healthcare data should be owned by patients, not hospitals.

</div>

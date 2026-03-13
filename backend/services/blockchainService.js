// services/blockchainService.js
// ==========================================
// WHY: This service connects Node.js to Ethereum using ethers.js.
// It writes record hashes and claim events to the smart contracts.
// If blockchain is not configured, it gracefully falls back to mock mode.
// ==========================================

const { ethers } = require('ethers');

// ABI — minimal interface to call only the functions we need
const MEDICAL_RECORD_ABI = [
  'function addRecord(string patientId, string cid, bytes32 fileHash, string hospitalId) external',
  'function verifyRecord(string patientId, bytes32 fileHash) external view returns (bool)',
  'function getRecords(string patientId) external view returns (tuple(string ipfsCid, bytes32 fileHash, uint256 timestamp, string hospitalId)[])'
];

const INSURANCE_CLAIM_ABI = [
  'function submitClaim(string patientId, string treatmentId, uint256 amount) external returns (uint256)',
  'function resolveClaim(uint256 claimId, bool approved) external',
  'function getClaim(uint256 claimId) external view returns (tuple(string patientId, string treatmentId, uint256 amount, bool approved, bool resolved, uint256 timestamp))'
];

let provider = null;
let wallet = null;
let medicalContract = null;
let claimContract = null;

function init() {
  if (
    !process.env.INFURA_SEPOLIA_URL ||
    !process.env.WALLET_PRIVATE_KEY ||
    process.env.INFURA_SEPOLIA_URL.includes('your_infura') ||
    process.env.WALLET_PRIVATE_KEY.includes('your_wallet')
  ) {
    console.warn('⚠️  Blockchain not configured — running in MOCK mode');
    return false;
  }

  try {
    provider = new ethers.JsonRpcProvider(process.env.INFURA_SEPOLIA_URL);
    wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);

    if (process.env.MEDICAL_RECORD_CONTRACT && !process.env.MEDICAL_RECORD_CONTRACT.includes('your_')) {
      medicalContract = new ethers.Contract(
        process.env.MEDICAL_RECORD_CONTRACT,
        MEDICAL_RECORD_ABI,
        wallet
      );
    }

    if (process.env.INSURANCE_CLAIM_CONTRACT && !process.env.INSURANCE_CLAIM_CONTRACT.includes('your_')) {
      claimContract = new ethers.Contract(
        process.env.INSURANCE_CLAIM_CONTRACT,
        INSURANCE_CLAIM_ABI,
        wallet
      );
    }

    console.log('✅ Blockchain connected to Sepolia');
    return true;
  } catch (err) {
    console.warn('Blockchain init failed:', err.message);
    return false;
  }
}

async function addRecord(patientId, cid, fileHashHex, hospitalId) {
  if (!medicalContract) {
    return { hash: 'MOCK_TX_' + Date.now(), wait: async () => {} };
  }
  const bytes32Hash = ethers.zeroPadValue(
    ethers.hexlify(Buffer.from(fileHashHex.replace('0x', '').padEnd(64, '0').slice(0, 64), 'hex')),
    32
  );
  const tx = await medicalContract.addRecord(patientId, cid, bytes32Hash, hospitalId);
  await tx.wait();
  return tx;
}

async function submitClaim(patientId, treatmentId, amount) {
  if (!claimContract) {
    return { hash: 'MOCK_CLAIM_TX_' + Date.now(), wait: async () => {} };
  }
  const amountWei = ethers.parseUnits(amount.toString(), 2); // 2 decimal places for INR paise
  const tx = await claimContract.submitClaim(patientId, treatmentId, amountWei);
  await tx.wait();
  return tx;
}

async function resolveClaim(claimId, approved) {
  if (!claimContract) {
    return { hash: 'MOCK_RESOLVE_TX_' + Date.now(), wait: async () => {} };
  }
  const tx = await claimContract.resolveClaim(claimId, approved);
  await tx.wait();
  return tx;
}

// Initialize on module load
init();

module.exports = { addRecord, submitClaim, resolveClaim };

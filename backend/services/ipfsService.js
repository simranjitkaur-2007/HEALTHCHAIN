// services/ipfsService.js
// ==========================================
// WHY: IPFS stores medical files permanently and gives a content hash (CID).
// Pinata "pins" our files so they never disappear from the IPFS network.
// Files are encrypted BEFORE upload — Pinata never sees the actual content.
// ==========================================

const axios = require('axios');
const FormData = require('form-data');

async function uploadToIPFS(encryptedBuffer, filename) {
  if (!process.env.PINATA_API_KEY) {
    console.warn('Pinata not configured — returning mock CID');
    return 'MOCK_CID_' + Date.now();
  }

  try {
    const form = new FormData();
    form.append('file', encryptedBuffer, { filename });

    const res = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      form,
      {
        headers: {
          ...form.getHeaders(),
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_API_SECRET
        },
        maxBodyLength: Infinity
      }
    );

    return res.data.IpfsHash; // the CID
  } catch (err) {
    console.error('IPFS upload error:', err.response?.data || err.message);
    throw new Error('Failed to upload file to IPFS: ' + err.message);
  }
}

async function fetchFromIPFS(cid) {
  if (cid.startsWith('MOCK_CID_')) {
    return Buffer.from('Mock file content — IPFS not configured');
  }

  try {
    const res = await axios.get(
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      { responseType: 'arraybuffer', timeout: 30000 }
    );
    return Buffer.from(res.data);
  } catch (err) {
    throw new Error('Failed to fetch file from IPFS: ' + err.message);
  }
}

module.exports = { uploadToIPFS, fetchFromIPFS };

// scripts/deploy.js
// ==========================================
// WHY: This script deploys both smart contracts to Ethereum Sepolia testnet.
// Run with: npx hardhat run scripts/deploy.js --network sepolia
// After running, copy the printed addresses to your backend .env file!
// ==========================================

const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log('\n🚀 Deploying HealthChain contracts...');
  console.log(`📍 Deploying from wallet: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Wallet balance: ${hre.ethers.formatEther(balance)} ETH\n`);

  if (balance < hre.ethers.parseEther('0.05')) {
    console.error('❌ Insufficient ETH! Get Sepolia ETH from https://sepoliafaucet.com');
    process.exit(1);
  }

  // Deploy MedicalRecord
  console.log('1️⃣  Deploying MedicalRecord.sol...');
  const MedicalRecord = await hre.ethers.getContractFactory('MedicalRecord');
  const medicalRecord = await MedicalRecord.deploy();
  await medicalRecord.waitForDeployment();
  const medicalAddress = await medicalRecord.getAddress();
  console.log(`✅ MedicalRecord deployed to: ${medicalAddress}`);

  // Deploy InsuranceClaim
  console.log('\n2️⃣  Deploying InsuranceClaim.sol...');
  const InsuranceClaim = await hre.ethers.getContractFactory('InsuranceClaim');
  const insuranceClaim = await InsuranceClaim.deploy();
  await insuranceClaim.waitForDeployment();
  const claimAddress = await insuranceClaim.getAddress();
  console.log(`✅ InsuranceClaim deployed to: ${claimAddress}`);

  console.log('\n' + '='.repeat(60));
  console.log('📋 COPY THESE TO YOUR backend/.env FILE:');
  console.log('='.repeat(60));
  console.log(`MEDICAL_RECORD_CONTRACT=${medicalAddress}`);
  console.log(`INSURANCE_CLAIM_CONTRACT=${claimAddress}`);
  console.log('='.repeat(60));

  console.log('\n🔗 View on Etherscan:');
  console.log(`https://sepolia.etherscan.io/address/${medicalAddress}`);
  console.log(`https://sepolia.etherscan.io/address/${claimAddress}`);
  console.log('\n✅ Deployment complete!\n');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config({ path: './.env' });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    // Local network for testing (no ETH needed)
    hardhat: {},

    // Sepolia testnet — where you deploy for the demo
    sepolia: {
      url: process.env.INFURA_SEPOLIA_URL || '',
      accounts: process.env.WALLET_PRIVATE_KEY ? [process.env.WALLET_PRIVATE_KEY] : [],
      gasPrice: 'auto'
    }
  },
  // Etherscan verification (optional)
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || ''
  }
};

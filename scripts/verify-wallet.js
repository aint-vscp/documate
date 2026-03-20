require('dotenv').config();
const { ethers } = require('ethers');

async function verifyWallet(targetAddress) {
  const rpc = process.env.POLKADOT_HUB_RPC_URL || 'https://eth-rpc-testnet.polkadot.io/';
  const privateKey = process.env.PRIVATE_KEY;
  const contractAddress = process.env.NEXT_PUBLIC_DOCUMATE_CONTRACT_ADDRESS || process.env.MARKETPLACE_CONTRACT_ADDRESS;

  if (!privateKey) throw new Error('PRIVATE_KEY not set in .env');
  if (!contractAddress) throw new Error('Contract address not set in .env');
  if (!targetAddress) throw new Error('Target address required as argument: node scripts/verify-wallet.js 0xADDRESS');

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(privateKey, provider);

  const abi = [
    'function mockKiltPrecompile(address) external',
    'function isVerified(address) view returns (bool)'
  ];

  const contract = new ethers.Contract(contractAddress, abi, wallet);

  console.log('Verifying:', targetAddress);
  console.log('Contract:', contractAddress);
  console.log('Network:', rpc);

  const beforeStatus = await contract.isVerified(targetAddress);
  console.log('Status before:', beforeStatus);

  if (beforeStatus) {
    console.log('Already verified - no transaction needed.');
    return;
  }

  const tx = await contract.mockKiltPrecompile(targetAddress);
  console.log('Transaction sent:', tx.hash);
  await tx.wait();
  console.log('Transaction confirmed.');

  const afterStatus = await contract.isVerified(targetAddress);
  console.log('verified =', afterStatus);
  console.log('tx =', tx.hash);
}

const target = process.argv[2];
verifyWallet(target).catch(e => { console.error(e); process.exit(1); });

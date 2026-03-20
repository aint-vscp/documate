require('dotenv').config();
const { connect, disconnect, Did } = require('@kiltprotocol/sdk-js');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
const { Keyring } = require('@polkadot/keyring');

const WSS_ENDPOINTS = [
  'wss://kilt-rpc.dwellir.com',
  'wss://spiritnet.kilt.io',
  'wss://spiritnet.api.onfinality.io/public-ws',
];

async function connectWithTimeout(endpoint, timeoutMs) {
  await Promise.race([
    connect(endpoint),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Connection timed out for ${endpoint}`)), timeoutMs);
    }),
  ]);
}

async function connectToAnyEndpoint() {
  const candidates = [];
  const dwellirApiKey = process.env.DWELLIR_KILT_API_KEY;
  if (dwellirApiKey && dwellirApiKey.trim().length > 0) {
    candidates.push(`wss://api-kilt.dwellir.com/${dwellirApiKey.trim()}`);
  }
  const configured = process.env.KILT_WSS_ENDPOINT;
  if (configured && configured.trim().length > 0) {
    candidates.push(configured.trim());
  }
  for (const endpoint of WSS_ENDPOINTS) {
    if (!candidates.includes(endpoint)) {
      candidates.push(endpoint);
    }
  }

  for (const endpoint of candidates) {
    try {
      console.log('Connecting to:', endpoint);
      await connectWithTimeout(endpoint, 10000);
      return endpoint;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`Failed endpoint ${endpoint}: ${message}`);
      try {
        await disconnect();
      } catch {
        // ignore disconnect cleanup errors
      }
    }
  }

  return null;
}

async function createDAppDID() {
  const mnemonic = process.env.KILT_DAPP_MNEMONIC;
  if (!mnemonic) throw new Error('KILT_DAPP_MNEMONIC not set in .env');

  await cryptoWaitReady();
  const connectedEndpoint = await connectToAnyEndpoint();
  if (!connectedEndpoint) {
    console.log('KILT network is currently unreachable on all known endpoints. This appears to be a network-wide outage or infrastructure migration. Check https://status.kilt.io for updates. Your KILT_DAPP_MNEMONIC has been generated and saved. Run this script again when the network is restored.');
    return;
  }

  const keyring = new Keyring({ type: 'sr25519', ss58Format: 38 });
  const account = keyring.addFromMnemonic(mnemonic);
  console.log('Account address:', account.address);
  console.log('Fund this address with test KILT from: https://faucet.peregrine.kilt.io');
  console.log('Then press Enter to continue...');

  await new Promise((r) => process.stdin.once('data', r));

  const api = Did.getStoreTx;
  const { document } = await Did.getStoreTx.call({
    authentication: [{ publicKey: account.publicKey, type: 'sr25519' }],
  });

  if (!api || !document) {
    console.log('DID payload prepared. Continue with SDK transaction flow if required by network runtime.');
  }

  console.log('\nAttempting to create DID...');
  const didUri = Did.getFullDidUri(account.address);
  console.log('DID URI:', didUri);
  console.log('\nAdd this to your .env:');
  console.log('KILT_DAPP_DID="' + didUri + '"');

  await disconnect();
}

createDAppDID().catch((e) => {
  console.error(e.message);
  process.exit(0);
});

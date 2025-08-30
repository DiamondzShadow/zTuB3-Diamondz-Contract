#!/usr/bin/env node

const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { createMetadataAccountV3 } = require('@metaplex-foundation/mpl-token-metadata');
const { keypairIdentity, publicKey, some, none } = require('@metaplex-foundation/umi');
const fs = require('fs');

async function fixTokenName() {
  console.log('🔧 Fixing SDM token name display...');
  
  // Your existing token
  const MINT_ADDRESS = "CrqJ1HPrrDS8DDwWneBXGX5eqoxDF7NcYLDhFTCXVUsr";
  
  // Load your wallet (put your keypair path here)
  const walletPath = process.env.SOLANA_KEYPAIR || '/home/ubuntu/.config/solana/id.json';
  const walletData = JSON.parse(fs.readFileSync(walletPath));
  const wallet = Keypair.fromSecretKey(new Uint8Array(walletData));
  
  // Setup UMI
  const umi = createUmi('https://api.mainnet-beta.solana.com');
  const umiKeypair = {
    publicKey: publicKey(wallet.publicKey.toString()),
    secretKey: wallet.secretKey,
  };
  umi.use(keypairIdentity(umiKeypair));
  
  console.log(`👛 Wallet: ${wallet.publicKey.toString()}`);
  console.log(`🪙 Token: ${MINT_ADDRESS}`);
  
  // Check balance
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`💰 Balance: ${balance / 1000000000} SOL`);
  
  if (balance < 0.002 * 1000000000) {
    console.log('❌ Need at least 0.002 SOL for metadata creation');
    console.log('💡 Add SOL to your wallet and try again');
    return;
  }
  
  try {
    console.log('📝 Creating metadata...');
    
    const result = await createMetadataAccountV3(umi, {
      mint: publicKey(MINT_ADDRESS),
      data: {
        name: "Diamondz Shadow Game + Movies",
        symbol: "SDM", 
        uri: "",
        sellerFeeBasisPoints: 0,
        creators: some([{
          address: publicKey(wallet.publicKey.toString()),
          verified: true,
          share: 100,
        }]),
        collection: none(),
        uses: none(),
      },
      isMutable: true,
      collectionDetails: none(),
    }).sendAndConfirm(umi);
    
    console.log('✅ Metadata created successfully!');
    console.log(`📋 Transaction: ${result.signature}`);
    console.log('🔄 Wait 5-10 minutes for explorers to update');
    
  } catch (error) {
    console.log('❌ Failed:', error.message);
    console.log('💡 Try again later or add more SOL');
  }
}

// Run it
fixTokenName().catch(console.error);
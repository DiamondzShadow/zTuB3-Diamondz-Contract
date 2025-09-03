const { Connection, PublicKey } = require('@solana/web3.js');
const fs = require('fs');

async function debugAccount() {
  try {
    const connection = new Connection('https://black-still-butterfly.solana-mainnet.quiknode.pro/ed845667579c683613d3f8b9e397ddc46239ce76/');
    
    // Load wallet
    const walletData = JSON.parse(fs.readFileSync('./wallet.json', 'utf8'));
    const { Keypair } = require('@solana/web3.js');
    const keypair = Keypair.fromSecretKey(new Uint8Array(walletData));
    
    console.log('🔍 Account Diagnostics');
    console.log('======================');
    console.log(`💼 Wallet: ${keypair.publicKey.toString()}`);
    
    // Check account info
    const accountInfo = await connection.getAccountInfo(keypair.publicKey);
    
    if (accountInfo) {
      console.log('✅ Account exists on mainnet');
      console.log(`💰 Balance: ${accountInfo.lamports} lamports (${accountInfo.lamports / 1e9} SOL)`);
      console.log(`👤 Owner: ${accountInfo.owner.toString()}`);
      console.log(`📏 Data length: ${accountInfo.data.length} bytes`);
      console.log(`🔒 Executable: ${accountInfo.executable}`);
    } else {
      console.log('❌ Account does not exist on mainnet');
    }
    
    // Check token mint
    const mintAddress = new PublicKey('CrqJ1HPrrDS8DDwWneBXGX5eqoxDF7NcYLDhFTCXVUsr');
    const mintInfo = await connection.getAccountInfo(mintAddress);
    
    console.log('\n🪙 Token Mint Info:');
    if (mintInfo) {
      console.log('✅ Token mint exists');
      console.log(`👤 Owner: ${mintInfo.owner.toString()}`);
    } else {
      console.log('❌ Token mint does not exist');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugAccount();
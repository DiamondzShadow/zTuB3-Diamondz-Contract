const { Connection, PublicKey } = require('@solana/web3.js');
const fs = require('fs');

// Your existing wallet public key
const publicKey = "ADhVqeQJikfAd86Pi1zYnGeVBkMAmz2n9ttSyHcs14ut";

// Check balance
async function checkWallet() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const pubkey = new PublicKey(publicKey);
  const balance = await connection.getBalance(pubkey);
  
  console.log('Wallet:', publicKey);
  console.log('Balance:', balance / 1000000000, 'SOL');
  
  if (balance > 0) {
    console.log('✅ Wallet has sufficient balance for deployment');
    return true;
  } else {
    console.log('❌ Wallet needs SOL for deployment');
    return false;
  }
}

checkWallet().catch(console.error);

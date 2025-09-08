/**
 * Wallet Verification Script
 * Checks if your wallet.json matches your expected public key
 */

import { Keypair } from '@solana/web3.js';
import fs from 'fs';

function checkWallet() {
  try {
    console.log('🔍 Checking wallet.json...');
    
    // Check if wallet file exists
    if (!fs.existsSync('./wallet.json')) {
      console.error('❌ wallet.json not found in current directory');
      return;
    }

    // Load and parse wallet
    const walletData = JSON.parse(fs.readFileSync('./wallet.json', 'utf8'));
    console.log(`📁 Wallet file loaded (${walletData.length} bytes)`);
    
    // Create keypair from the secret key
    const keypair = Keypair.fromSecretKey(new Uint8Array(walletData));
    
    console.log('\n✅ Wallet Information:');
    console.log(`🔑 Public Key: ${keypair.publicKey.toString()}`);
    console.log(`🔐 Secret Key Length: ${walletData.length} bytes`);
    
    // Show first few bytes of secret key for verification (not full key for security)
    const firstBytes = walletData.slice(0, 4);
    const lastBytes = walletData.slice(-4);
    console.log(`🔒 Secret Key Preview: [${firstBytes.join(',')}...${lastBytes.join(',')}]`);
    
    console.log('\n📋 Verification:');
    console.log('1. Copy the public key above');
    console.log('2. Compare it with your expected wallet address');
    console.log('3. If they match, your wallet.json is correct! ✅');
    console.log('4. If they don\'t match, you may have the wrong wallet file ❌');
    
    // Additional checks
    console.log('\n🔧 Additional Info:');
    console.log(`📏 Secret key should be exactly 64 bytes (current: ${walletData.length})`);
    
    if (walletData.length !== 64) {
      console.warn('⚠️  WARNING: Secret key should be 64 bytes, but found ' + walletData.length);
    }
    
    return keypair.publicKey.toString();
    
  } catch (error) {
    console.error('❌ Error reading wallet:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('JSON')) {
        console.error('💡 Tip: Make sure wallet.json is valid JSON format');
      } else if (error.message.includes('Invalid')) {
        console.error('💡 Tip: Make sure wallet.json contains a valid 64-byte secret key array');
      }
    }
    
    return null;
  }
}

// Run the check
console.log('🚀 Wallet Verification Tool');
console.log('==========================');
const publicKey = checkWallet();

if (publicKey) {
  console.log('\n🎉 Wallet verification completed successfully!');
  console.log(`Your wallet public key: ${publicKey}`);
} else {
  console.log('\n💥 Wallet verification failed!');
}
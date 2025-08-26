const { Keypair } = require('@solana/web3.js');
const fs = require('fs');

// Generate a new keypair
const keypair = Keypair.generate();

// Create the keypair in the format expected by Solana CLI
const keypairArray = Array.from(keypair.secretKey);

// Save to file
fs.writeFileSync('/home/ubuntu/.config/solana/id.json', JSON.stringify(keypairArray));

console.log('Generated keypair:');
console.log('Public Key:', keypair.publicKey.toString());
console.log('Saved to: /home/ubuntu/.config/solana/id.json');

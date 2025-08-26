const { Keypair, PublicKey } = require('@solana/web3.js');
const bip39 = require('bip39');
const { derivePath } = require('ed25519-hd-key');
const fs = require('fs');

const targetPublicKey = "ADhVqeQJikfAd86Pi1zYnGeVBkMAmz2n9ttSyHcs14ut";
const mnemonic = "believe drift mother upgrade length sample chair lonely cradle risk calm soup";

// Try more derivation paths
const paths = [];
for (let account = 0; account < 10; account++) {
  for (let change = 0; change < 2; change++) {
    for (let index = 0; index < 10; index++) {
      paths.push(`m/44'/501'/${account}'/${change}'/${index}'`);
      paths.push(`m/44'/501'/${account}'/${index}'`);
    }
  }
}

// Add some common Solana paths
paths.push(...[
  "m/44'/501'/0'",
  "m/44'/501'/0'/0'", 
  "m/44'/501'/1'",
  "m/44'/501'/2'",
  "m/44'/501'/0'/0'/0'",
  "m/44'/501'/0'/1'/0'",
  "m/44'/501'/1'/0'/0'",
  "m/501'/0'/0'",
  "m/501'/0'/0'/0'",
  "m/501'",
  "m/0'/0'"
]);

const seed = bip39.mnemonicToSeedSync(mnemonic);

console.log(`Testing ${paths.length} derivation paths...`);

let found = false;
for (let i = 0; i < paths.length && !found; i++) {
  try {
    const derivedSeed = derivePath(paths[i], seed.toString('hex')).key;
    const keypair = Keypair.fromSeed(derivedSeed);
    
    if (keypair.publicKey.toString() === targetPublicKey) {
      console.log(`✅ Found correct derivation path: ${paths[i]}`);
      console.log(`Public Key: ${keypair.publicKey.toString()}`);
      
      // Save the correct keypair
      const keypairArray = Array.from(keypair.secretKey);
      fs.writeFileSync('deploy_keypair.json', JSON.stringify(keypairArray));
      fs.writeFileSync('/home/ubuntu/.config/solana/id.json', JSON.stringify(keypairArray));
      
      console.log('✅ Correct keypair saved!');
      found = true;
    }
    
    if (i % 50 === 0) {
      console.log(`Tested ${i + 1} paths...`);
    }
  } catch (e) {
    // Skip errors
  }
}

if (!found) {
  console.log('❌ Could not find matching derivation path from seed phrase');
  console.log('Will proceed with manual keypair...');
}

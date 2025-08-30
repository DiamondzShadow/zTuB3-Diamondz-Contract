const { Connection, Keypair, PublicKey, Transaction, SystemProgram } = require('@solana/web3.js');
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { createMetadataAccountV3 } = require('@metaplex-foundation/mpl-token-metadata');
const { keypairIdentity, publicKey } = require('@metaplex-foundation/umi');
const fs = require('fs');

async function addMetaplexMetadata() {
  console.log('🏷️  Adding Metaplex metadata to SDM token...');
  
  // Load wallet
  const walletData = JSON.parse(fs.readFileSync('/home/ubuntu/.config/solana/id.json'));
  const wallet = Keypair.fromSecretKey(new Uint8Array(walletData));
  
  // Create UMI instance
  const umi = createUmi('https://api.mainnet-beta.solana.com');
  
  // Convert wallet to UMI format
  const umiKeypair = {
    publicKey: publicKey(wallet.publicKey.toString()),
    secretKey: wallet.secretKey,
  };
  
  umi.use(keypairIdentity(umiKeypair));
  
  // Your token mint address
  const mintAddress = publicKey("CrqJ1HPrrDS8DDwWneBXGX5eqoxDF7NcYLDhFTCXVUsr");
  
  console.log(`📋 Token Mint: ${mintAddress}`);
  console.log(`👛 Authority: ${wallet.publicKey.toString()}`);
  
  try {
    console.log('📝 Creating metadata account...');
    
    // Create metadata
    const result = await createMetadataAccountV3(umi, {
      mint: mintAddress,
      data: {
        name: "Diamondz Shadow Game + Movies",
        symbol: "SDM",
        uri: "https://raw.githubusercontent.com/DiamondzShadow/metadata/main/sdm.json", // You can create this later
        sellerFeeBasisPoints: 0,
        creators: [
          {
            address: publicKey(wallet.publicKey.toString()),
            verified: true,
            share: 100,
          },
        ],
        collection: null,
        uses: null,
      },
      isMutable: true,
    }).sendAndConfirm(umi);
    
    console.log('✅ METADATA ADDED SUCCESSFULLY!');
    console.log(`   Name: "Diamondz Shadow Game + Movies"`);
    console.log(`   Symbol: "SDM"`);
    console.log(`   Transaction: ${result.signature}`);
    
    console.log('\n🎉 Your token will now show the correct name!');
    console.log('   It may take a few minutes for explorers to update.');
    
    // Save metadata info
    const metadataInfo = {
      mint: "CrqJ1HPrrDS8DDwWneBXGX5eqoxDF7NcYLDhFTCXVUsr",
      name: "Diamondz Shadow Game + Movies",
      symbol: "SDM",
      metadataAdded: true,
      transaction: result.signature,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('metadata-added.json', JSON.stringify(metadataInfo, null, 2));
    
  } catch (error) {
    console.error('❌ Failed to add metadata:', error);
    
    if (error.message.includes('already in use')) {
      console.log('\nℹ️  Metadata account already exists!');
      console.log('   The token should already have metadata.');
      console.log('   If it\'s not showing, it might be an indexing delay.');
    } else if (error.message.includes('insufficient funds')) {
      console.log('\n💰 Need more SOL for metadata creation.');
      console.log('   Metadata creation costs ~0.002 SOL');
    }
  }
}

addMetaplexMetadata().catch(console.error);

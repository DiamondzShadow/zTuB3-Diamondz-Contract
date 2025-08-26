const { Connection, Keypair, PublicKey, Transaction, SystemProgram } = require('@solana/web3.js');
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { createMetadataAccountV3, CreateMetadataAccountV3InstructionAccounts, CreateMetadataAccountV3InstructionData } = require('@metaplex-foundation/mpl-token-metadata');
const { keypairIdentity, publicKey, some, none } = require('@metaplex-foundation/umi');
const fs = require('fs');

async function addMetadataFixed() {
  console.log('🏷️  Adding Metaplex metadata to SDM token (fixed)...');
  
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
    
    // Create metadata with proper structure
    const result = await createMetadataAccountV3(umi, {
      mint: mintAddress,
      data: {
        name: "Diamondz Shadow Game + Movies",
        symbol: "SDM",
        uri: "",
        sellerFeeBasisPoints: 0,
        creators: some([
          {
            address: publicKey(wallet.publicKey.toString()),
            verified: true,
            share: 100,
          },
        ]),
        collection: none(),
        uses: none(),
      },
      isMutable: true,
      collectionDetails: none(),
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
      timestamp: new Date().toISOString(),
      explorerUrls: {
        solscan: `https://solscan.io/token/${mintAddress}`,
        solanaFM: `https://solana.fm/address/${mintAddress}`,
        xray: `https://xray.helius.xyz/token/${mintAddress}`
      }
    };
    
    fs.writeFileSync('metadata-success.json', JSON.stringify(metadataInfo, null, 2));
    console.log('\n📄 Metadata info saved to: metadata-success.json');
    console.log('\n🔍 Check your token on:');
    console.log(`   Solscan: https://solscan.io/token/${mintAddress}`);
    console.log(`   Solana FM: https://solana.fm/address/${mintAddress}`);
    
  } catch (error) {
    console.error('❌ Failed to add metadata:', error);
    
    if (error.message.includes('already in use')) {
      console.log('\nℹ️  Metadata account already exists!');
      console.log('   The token should already have metadata.');
    } else if (error.message.includes('insufficient funds')) {
      console.log('\n💰 Need more SOL for metadata creation.');
      
      // Check current balance
      const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
      const balance = await connection.getBalance(wallet.publicKey);
      console.log(`   Current balance: ${balance / 1000000000} SOL`);
      console.log('   Metadata creation costs ~0.002 SOL');
    }
  }
}

addMetadataFixed().catch(console.error);

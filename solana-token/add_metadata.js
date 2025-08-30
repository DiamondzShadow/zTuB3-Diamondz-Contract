const { Connection, Keypair, PublicKey, Transaction } = require('@solana/web3.js');
const { 
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID: METADATA_PROGRAM_ID 
} = require('@metaplex-foundation/mpl-token-metadata');
const fs = require('fs');

async function addTokenMetadata() {
  console.log('🏷️  Adding metadata to SDM token...');
  
  // Setup connection
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  
  // Load wallet
  const walletData = JSON.parse(fs.readFileSync('/home/ubuntu/.config/solana/id.json'));
  const wallet = Keypair.fromSecretKey(new Uint8Array(walletData));
  
  // Your token mint address
  const mintAddress = new PublicKey("CrqJ1HPrrDS8DDwWneBXGX5eqoxDF7NcYLDhFTCXVUsr");
  
  // Derive metadata PDA
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METADATA_PROGRAM_ID.toBuffer(),
      mintAddress.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );
  
  console.log(`📋 Metadata PDA: ${metadataPDA.toString()}`);
  
  // Metadata for your token
  const tokenMetadata = {
    name: "Diamondz Shadow Game + Movies",
    symbol: "SDM",
    uri: "", // Empty URI for now
    sellerFeeBasisPoints: 0,
    creators: [
      {
        address: wallet.publicKey,
        verified: true,
        share: 100,
      },
    ],
    collection: null,
    uses: null,
  };
  
  try {
    // Create metadata instruction
    const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataPDA,
        mint: mintAddress,
        mintAuthority: wallet.publicKey,
        payer: wallet.publicKey,
        updateAuthority: wallet.publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data: tokenMetadata,
          isMutable: true,
          collectionDetails: null,
        },
      }
    );
    
    // Create and send transaction
    const transaction = new Transaction().add(createMetadataInstruction);
    
    console.log('📝 Creating metadata account...');
    const signature = await connection.sendTransaction(transaction, [wallet]);
    
    console.log('⏳ Confirming transaction...');
    await connection.confirmTransaction(signature);
    
    console.log('✅ METADATA ADDED SUCCESSFULLY!');
    console.log(`   Token: CrqJ1HPrrDS8DDwWneBXGX5eqoxDF7NcYLDhFTCXVUsr`);
    console.log(`   Name: ${tokenMetadata.name}`);
    console.log(`   Symbol: ${tokenMetadata.symbol}`);
    console.log(`   Metadata PDA: ${metadataPDA.toString()}`);
    console.log(`   Transaction: ${signature}`);
    console.log('\n🎉 Your token name should now show correctly!');
    
  } catch (error) {
    console.error('❌ Failed to add metadata:', error);
    
    if (error.message.includes('already in use')) {
      console.log('ℹ️  Metadata account already exists. Token name should already be set.');
    }
  }
}

addTokenMetadata().catch(console.error);

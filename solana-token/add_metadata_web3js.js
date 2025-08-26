const { Connection, Keypair, PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY } = require('@solana/web3.js');
const fs = require('fs');

// Metaplex Token Metadata Program ID
const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

function createMetadataInstruction(
  metadataPDA,
  mint,
  mintAuthority,
  payer,
  updateAuthority,
  tokenName,
  tokenSymbol,
  uri
) {
  const data = Buffer.concat([
    // Instruction discriminator (0 for CreateMetadataAccountV3)
    Buffer.from([0]),
    
    // Data struct
    Buffer.from([
      // Name length (4 bytes) + name
      ...new Uint8Array(new Uint32Array([tokenName.length]).buffer),
      ...Buffer.from(tokenName, 'utf8'),
      
      // Symbol length (4 bytes) + symbol  
      ...new Uint8Array(new Uint32Array([tokenSymbol.length]).buffer),
      ...Buffer.from(tokenSymbol, 'utf8'),
      
      // URI length (4 bytes) + uri
      ...new Uint8Array(new Uint32Array([uri.length]).buffer),
      ...Buffer.from(uri, 'utf8'),
      
      // Seller fee basis points (2 bytes)
      0, 0,
      
      // Has creators (1 byte) - false
      0,
      
      // Collection (1 byte) - none
      0,
      
      // Uses (1 byte) - none
      0
    ]),
    
    // Is mutable (1 byte)
    Buffer.from([1]),
    
    // Collection details (1 byte) - none
    Buffer.from([0])
  ]);

  return {
    keys: [
      { pubkey: metadataPDA, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: mintAuthority, isSigner: true, isWritable: false },
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: updateAuthority, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    programId: METADATA_PROGRAM_ID,
    data: data,
  };
}

async function addMetadataWeb3js() {
  console.log('🏷️  Adding Metaplex metadata using web3.js...');
  
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
  
  console.log(`📋 Token Mint: ${mintAddress.toString()}`);
  console.log(`📋 Metadata PDA: ${metadataPDA.toString()}`);
  console.log(`👛 Authority: ${wallet.publicKey.toString()}`);
  
  // Check balance
  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`💰 Balance: ${balance / 1000000000} SOL`);
  
  if (balance < 0.002 * 1000000000) {
    throw new Error('Insufficient SOL balance for metadata creation (need ~0.002 SOL)');
  }
  
  try {
    // Check if metadata account already exists
    const metadataAccount = await connection.getAccountInfo(metadataPDA);
    if (metadataAccount) {
      console.log('ℹ️  Metadata account already exists!');
      console.log('   Your token should already have the correct name.');
      console.log('   If it\'s not showing, it might be an indexing delay.');
      return;
    }
    
    console.log('📝 Creating metadata account...');
    
    // Create metadata instruction
    const instruction = createMetadataInstruction(
      metadataPDA,
      mintAddress,
      wallet.publicKey,
      wallet.publicKey,
      wallet.publicKey,
      "Diamondz Shadow Game + Movies",
      "SDM",
      ""
    );
    
    // Create and send transaction
    const transaction = new Transaction().add(instruction);
    
    const signature = await connection.sendTransaction(transaction, [wallet]);
    
    console.log('⏳ Confirming transaction...');
    await connection.confirmTransaction(signature);
    
    console.log('✅ METADATA ADDED SUCCESSFULLY!');
    console.log(`   Name: "Diamondz Shadow Game + Movies"`);
    console.log(`   Symbol: "SDM"`);
    console.log(`   Transaction: ${signature}`);
    console.log(`   Metadata PDA: ${metadataPDA.toString()}`);
    
    console.log('\n🎉 Your token will now show the correct name!');
    console.log('   It may take a few minutes for explorers to update.');
    
    // Save metadata info
    const metadataInfo = {
      mint: "CrqJ1HPrrDS8DDwWneBXGX5eqoxDF7NcYLDhFTCXVUsr",
      name: "Diamondz Shadow Game + Movies",
      symbol: "SDM",
      metadataPDA: metadataPDA.toString(),
      metadataAdded: true,
      transaction: signature,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('metadata-success.json', JSON.stringify(metadataInfo, null, 2));
    
    console.log('\n🔍 Check your token on:');
    console.log(`   Solscan: https://solscan.io/token/${mintAddress.toString()}`);
    console.log(`   Solana FM: https://solana.fm/address/${mintAddress.toString()}`);
    
  } catch (error) {
    console.error('❌ Failed to add metadata:', error);
    
    if (error.message.includes('insufficient funds')) {
      console.log('\n💰 Need more SOL for metadata creation.');
      console.log(`   Current balance: ${balance / 1000000000} SOL`);
      console.log('   Metadata creation costs ~0.002 SOL');
    }
  }
}

addMetadataWeb3js().catch(console.error);

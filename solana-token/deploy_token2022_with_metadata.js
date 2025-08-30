const { Connection, Keypair, PublicKey, Transaction, SystemProgram } = require('@solana/web3.js');
const { 
  createInitializeMintInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeInstruction,
  createUpdateFieldInstruction,
  getMintLen,
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
  LENGTH_SIZE,
} = require('@solana/spl-token');
const fs = require('fs');

async function deployToken2022WithMetadata() {
  console.log('🚀 Deploying new TOKEN-2022 with built-in metadata...');
  
  // Setup connection
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  
  // Load wallet
  const walletData = JSON.parse(fs.readFileSync('/home/ubuntu/.config/solana/id.json'));
  const wallet = Keypair.fromSecretKey(new Uint8Array(walletData));
  
  console.log(`👛 Deployer: ${wallet.publicKey.toString()}`);
  
  // Check balance
  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`💰 Balance: ${balance / 1000000000} SOL`);
  
  if (balance < 0.003 * 1000000000) {
    throw new Error('Insufficient SOL balance for TOKEN-2022 deployment');
  }
  
  try {
    // Create mint keypair
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;
    
    console.log(`🪙 New Token Mint: ${mint.toString()}`);
    
    // Token metadata
    const metadata = {
      name: "Diamondz Shadow Game + Movies",
      symbol: "SDM",
      uri: "https://raw.githubusercontent.com/DiamondzShadow/metadata/main/sdm.json",
    };
    
    // Calculate space needed for mint with metadata pointer
    const extensions = [ExtensionType.MetadataPointer];
    const mintLen = getMintLen(extensions);
    
    // Calculate rent
    const mintRent = await connection.getMinimumBalanceForRentExemption(mintLen);
    
    console.log('📝 Creating TOKEN-2022 mint with metadata...');
    
    // Create mint account with metadata pointer
    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: mint,
      space: mintLen,
      lamports: mintRent,
      programId: TOKEN_2022_PROGRAM_ID,
    });
    
    // Initialize metadata pointer (pointing to the mint itself)
    const initializeMetadataPointerInstruction = createInitializeMetadataPointerInstruction(
      mint,
      wallet.publicKey, // update authority
      mint, // metadata account (self)
      TOKEN_2022_PROGRAM_ID
    );
    
    // Initialize mint
    const initializeMintInstruction = createInitializeMintInstruction(
      mint,
      9, // decimals
      wallet.publicKey, // mint authority
      wallet.publicKey, // freeze authority
      TOKEN_2022_PROGRAM_ID
    );
    
    // Initialize metadata
    const initializeMetadataInstruction = createInitializeInstruction({
      programId: TOKEN_2022_PROGRAM_ID,
      metadata: mint,
      updateAuthority: wallet.publicKey,
      mint: mint,
      mintAuthority: wallet.publicKey,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
    });
    
    // Create transaction
    const transaction = new Transaction().add(
      createAccountInstruction,
      initializeMetadataPointerInstruction,
      initializeMintInstruction,
      initializeMetadataInstruction
    );
    
    // Send transaction
    const signature = await connection.sendTransaction(transaction, [wallet, mintKeypair]);
    
    console.log('⏳ Confirming transaction...');
    await connection.confirmTransaction(signature);
    
    console.log('✅ TOKEN-2022 WITH METADATA CREATED SUCCESSFULLY!');
    console.log(`   Name: ${metadata.name}`);
    console.log(`   Symbol: ${metadata.symbol}`);
    console.log(`   Mint: ${mint.toString()}`);
    console.log(`   Transaction: ${signature}`);
    console.log(`   Program: TOKEN-2022`);
    
    // Save deployment info
    const deploymentInfo = {
      mint: mint.toString(),
      name: metadata.name,
      symbol: metadata.symbol,
      decimals: 9,
      program: "TOKEN-2022",
      programId: TOKEN_2022_PROGRAM_ID.toString(),
      hasMetadata: true,
      metadataBuiltIn: true,
      deployer: wallet.publicKey.toString(),
      transaction: signature,
      timestamp: new Date().toISOString(),
      ccipCompatible: true,
      network: "mainnet-beta"
    };
    
    fs.writeFileSync('token2022-deployment.json', JSON.stringify(deploymentInfo, null, 2));
    
    console.log('\n🎉 NEW SDM TOKEN WITH PROPER METADATA!');
    console.log('=====================================');
    console.log(`📋 This token will show the correct name immediately!`);
    console.log(`🔗 Still CCIP-compatible for bridging`);
    console.log(`📄 Details saved to: token2022-deployment.json`);
    
    console.log('\n🔍 Check your new token on:');
    console.log(`   Solscan: https://solscan.io/token/${mint.toString()}`);
    console.log(`   Solana FM: https://solana.fm/address/${mint.toString()}`);
    
    return mint.toString();
    
  } catch (error) {
    console.error('❌ TOKEN-2022 deployment failed:', error);
    throw error;
  }
}

deployToken2022WithMetadata().catch(console.error);

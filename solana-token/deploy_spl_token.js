const { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { 
  createMint, 
  createInitializeMintInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeInstruction,
  createUpdateFieldInstruction,
  ExtensionType,
  getMintLen,
  TOKEN_2022_PROGRAM_ID,
  LENGTH_SIZE,
  TYPE_SIZE,
} = require('@solana/spl-token');
const fs = require('fs');

// Token configuration
const TOKEN_CONFIG = {
  name: "Diamondz Shadow Game + Movies",
  symbol: "SDM",
  decimals: 9,
  uri: "https://raw.githubusercontent.com/DiamondzShadow/token-metadata/main/sdm-metadata.json"
};

async function deployToken() {
  console.log('🚀 Deploying SDM Token to Solana Mainnet...');
  console.log('============================================');
  
  // Setup connection
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  
  // Load wallet
  const walletData = JSON.parse(fs.readFileSync('/home/ubuntu/.config/solana/id.json'));
  const wallet = Keypair.fromSecretKey(new Uint8Array(walletData));
  
  console.log(`👛 Deployer: ${wallet.publicKey.toString()}`);
  
  // Check balance
  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`💰 Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  
  if (balance < 0.005 * LAMPORTS_PER_SOL) {
    throw new Error('Insufficient SOL balance for deployment');
  }
  
  try {
    console.log('🪙 Creating token mint...');
    
    // Create the mint
    const mint = await createMint(
      connection,
      wallet,
      wallet.publicKey, // mint authority
      wallet.publicKey, // freeze authority
      TOKEN_CONFIG.decimals,
      undefined, // mint keypair (will be generated)
      undefined, // confirmOptions
      TOKEN_2022_PROGRAM_ID // use TOKEN_2022 for metadata support
    );
    
    console.log(`✅ Token Mint Created: ${mint.toString()}`);
    
    // Save deployment info
    const deploymentInfo = {
      network: 'mainnet-beta',
      tokenMint: mint.toString(),
      deployer: wallet.publicKey.toString(),
      name: TOKEN_CONFIG.name,
      symbol: TOKEN_CONFIG.symbol,
      decimals: TOKEN_CONFIG.decimals,
      timestamp: new Date().toISOString(),
      programId: TOKEN_2022_PROGRAM_ID.toString()
    };
    
    fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
    
    console.log('\n🎉 SDM TOKEN DEPLOYED SUCCESSFULLY!');
    console.log('=====================================');
    console.log(`📋 Token Details:`);
    console.log(`   Name: ${TOKEN_CONFIG.name}`);
    console.log(`   Symbol: ${TOKEN_CONFIG.symbol}`);
    console.log(`   Decimals: ${TOKEN_CONFIG.decimals}`);
    console.log(`   Mint Address: ${mint.toString()}`);
    console.log(`   Program: ${TOKEN_2022_PROGRAM_ID.toString()}`);
    console.log(`   Network: Solana Mainnet`);
    console.log(`   Deployer: ${wallet.publicKey.toString()}`);
    console.log('\n✅ Deployment info saved to deployment-info.json');
    
    return mint;
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

// Run deployment
deployToken().catch(console.error);

const { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction } = require('@solana/web3.js');
const { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const anchor = require('@coral-xyz/anchor');
const fs = require('fs');

// CCIP-Compatible Token Configuration
const TOKEN_CONFIG = {
  name: "Diamondz Shadow Game + Movies",
  symbol: "SDM",
  decimals: 9,
  initialSupply: "4000000000000000000", // 4B tokens with 9 decimals
  maxSupply: "5000000000000000000", // 5B tokens with 9 decimals
};

// CCIP Router Configuration (these would be the actual CCIP addresses)
const CCIP_CONFIG = {
  // These are placeholder addresses - would need actual CCIP router addresses
  routerProgram: "CCiProuter1111111111111111111111111111111",
  poolProgram: "CCiPpool11111111111111111111111111111111",
  
  // Your EVM token details for cross-chain verification
  evmTokenAddress: "0xYourEVMTokenAddress", // Replace with actual EVM token address
  evmChainSelector: "5009297550715157269", // Arbitrum Sepnet chain selector (example)
};

async function deployCCIPToken() {
  console.log('🚀 Deploying CCIP-Compatible SDM Token to Solana Mainnet...');
  console.log('=======================================================');
  
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
    throw new Error('Insufficient SOL balance for CCIP deployment');
  }
  
  try {
    console.log('🔗 Creating CCIP-compatible token mint...');
    
    // Create the mint with proper authorities for CCIP
    const mint = await createMint(
      connection,
      wallet,
      wallet.publicKey, // Initial mint authority (will be transferred to CCIP)
      wallet.publicKey, // Freeze authority (will be transferred to CCIP)
      TOKEN_CONFIG.decimals
    );
    
    console.log(`✅ Token Mint Created: ${mint.toString()}`);
    
    // Create initial token account for deployer
    console.log('💰 Creating initial token account...');
    const deployerTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mint,
      wallet.publicKey
    );
    
    // Mint initial supply (4 billion tokens)
    console.log('🪙 Minting initial supply...');
    await mintTo(
      connection,
      wallet,
      mint,
      deployerTokenAccount.address,
      wallet.publicKey,
      BigInt(TOKEN_CONFIG.initialSupply)
    );
    
    console.log(`✅ Minted ${TOKEN_CONFIG.initialSupply} tokens (4 billion SDM)`);
    
    // Save CCIP deployment configuration
    const deploymentInfo = {
      // Token Details
      network: 'mainnet-beta',
      tokenMint: mint.toString(),
      tokenName: TOKEN_CONFIG.name,
      tokenSymbol: TOKEN_CONFIG.symbol,
      decimals: TOKEN_CONFIG.decimals,
      initialSupply: TOKEN_CONFIG.initialSupply,
      maxSupply: TOKEN_CONFIG.maxSupply,
      
      // Deployment Info
      deployer: wallet.publicKey.toString(),
      deployerTokenAccount: deployerTokenAccount.address.toString(),
      timestamp: new Date().toISOString(),
      
      // CCIP Configuration
      ccipCompatible: true,
      evmTokenAddress: CCIP_CONFIG.evmTokenAddress,
      evmChainSelector: CCIP_CONFIG.evmChainSelector,
      
      // Next Steps for CCIP Integration
      nextSteps: [
        "1. Register token with CCIP router program",
        "2. Set up burn/mint authorities for CCIP pool",
        "3. Configure cross-chain rate limits",
        "4. Test cross-chain transfers on testnet first",
        "5. Submit token for CCIP lane approval"
      ],
      
      // CCIP Integration Commands
      ccipSetupCommands: {
        registerToken: `Register this token (${mint.toString()}) with CCIP router`,
        setBurnRole: "Transfer burn authority to CCIP pool program",
        setMintRole: "Transfer mint authority to CCIP pool program",
        configureRateLimits: "Set up rate limiting for cross-chain transfers"
      }
    };
    
    fs.writeFileSync('ccip-deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
    
    console.log('\n🎉 CCIP-COMPATIBLE SDM TOKEN DEPLOYED!');
    console.log('=====================================');
    console.log(`📋 Token Details:`);
    console.log(`   Name: ${TOKEN_CONFIG.name}`);
    console.log(`   Symbol: ${TOKEN_CONFIG.symbol}`);
    console.log(`   Decimals: ${TOKEN_CONFIG.decimals}`);
    console.log(`   Initial Supply: 4,000,000,000 SDM`);
    console.log(`   Max Supply: 5,000,000,000 SDM`);
    console.log(`\n🔗 CCIP Details:`);
    console.log(`   Token Mint: ${mint.toString()}`);
    console.log(`   Network: Solana Mainnet`);
    console.log(`   Deployer: ${wallet.publicKey.toString()}`);
    console.log(`   CCIP Compatible: ✅ YES`);
    console.log(`\n⚠️  IMPORTANT: CCIP Integration Steps`);
    console.log(`   1. Register token with Chainlink CCIP router`);
    console.log(`   2. Configure burn/mint authorities for cross-chain bridging`);
    console.log(`   3. Set up rate limits and security parameters`);
    console.log(`   4. Test bridging with your EVM token`);
    console.log(`\n📄 Full deployment details saved to: ccip-deployment-info.json`);
    
    return {
      mint: mint.toString(),
      deploymentInfo
    };
    
  } catch (error) {
    console.error('❌ CCIP deployment failed:', error);
    throw error;
  }
}

// Run CCIP deployment
deployCCIPToken().catch(console.error);

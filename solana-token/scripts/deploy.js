const anchor = require('@coral-xyz/anchor');
const { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount, mintTo } = require('@solana/spl-token');
const fs = require('fs');

// Configuration
const NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';

// Token configuration - mirroring EVM version
const TOKEN_CONFIG = {
  name: "BurnMintSPL Token",
  symbol: "BMTK",
  decimals: 18,
  initialSupply: "4000000000000000000000000000", // 4 billion tokens with 18 decimals
  maxSupply: "5000000000000000000000000000", // 5 billion tokens with 18 decimals
};

async function deploy() {
  console.log(`🚀 Deploying BurnMintSPL token to ${NETWORK}...`);
  
  // Setup connection
  const connection = new Connection(RPC_URL, 'confirmed');
  
  // Load wallet
  const walletKeypair = loadWallet();
  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  anchor.setProvider(provider);

  // Load the program
  const idl = JSON.parse(fs.readFileSync('./target/idl/burn_mint_spl.json', 'utf8'));
  const programId = new PublicKey(idl.metadata.address);
  const program = new anchor.Program(idl, programId, provider);

  console.log(`📋 Program ID: ${programId.toString()}`);
  console.log(`👛 Deployer: ${wallet.publicKey.toString()}`);

  // Check balance
  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`💰 Deployer balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  if (balance < 0.1 * LAMPORTS_PER_SOL) {
    throw new Error('Insufficient SOL balance. Need at least 0.1 SOL for deployment.');
  }

  try {
    // Derive PDAs
    const [tokenConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from('token_config')],
      programId
    );

    const [tokenAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from('token_authority')],
      programId
    );

    console.log(`🔧 Token Config PDA: ${tokenConfig.toString()}`);
    console.log(`🔐 Token Authority PDA: ${tokenAuthority.toString()}`);

    // Create mint account
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    console.log(`🪙 Mint Address: ${mint.toString()}`);

    // Create initial token account for the deployer
    const initialTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      walletKeypair,
      mint,
      wallet.publicKey
    );

    // Derive user stats PDA
    const [ownerStats] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_stats'), wallet.publicKey.toBuffer()],
      programId
    );

    // Derive owner role PDAs
    const [ownerMinterRole] = PublicKey.findProgramAddressSync(
      [Buffer.from('minter_role'), tokenConfig.toBuffer(), wallet.publicKey.toBuffer()],
      programId
    );

    const [ownerBurnerRole] = PublicKey.findProgramAddressSync(
      [Buffer.from('burner_role'), tokenConfig.toBuffer(), wallet.publicKey.toBuffer()],
      programId
    );

    // Initialize the token
    console.log('🔄 Initializing token...');
    
    const tx = await program.methods
      .initialize(
        TOKEN_CONFIG.decimals,
        new anchor.BN(TOKEN_CONFIG.initialSupply),
        new anchor.BN(TOKEN_CONFIG.maxSupply),
        TOKEN_CONFIG.name,
        TOKEN_CONFIG.symbol
      )
      .accounts({
        tokenConfig,
        mint,
        tokenAuthority,
        initialTokenAccount: initialTokenAccount.address,
        ownerStats,
        ownerMinterRole,
        ownerBurnerRole,
        owner: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([mintKeypair])
      .rpc();

    console.log(`✅ Token initialized! Transaction: ${tx}`);

    // Save deployment info
    const deploymentInfo = {
      network: NETWORK,
      programId: programId.toString(),
      mint: mint.toString(),
      tokenConfig: tokenConfig.toString(),
      tokenAuthority: tokenAuthority.toString(),
      deployer: wallet.publicKey.toString(),
      initialTokenAccount: initialTokenAccount.address.toString(),
      transaction: tx,
      timestamp: new Date().toISOString(),
      config: TOKEN_CONFIG,
    };

    fs.writeFileSync(
      `./deployment-${NETWORK}.json`,
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log('🎉 Deployment completed successfully!');
    console.log('📄 Deployment info saved to:', `deployment-${NETWORK}.json`);
    
    return deploymentInfo;

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

function loadWallet() {
  const walletPath = process.env.ANCHOR_WALLET || process.env.HOME + '/.config/solana/id.json';
  
  if (!fs.existsSync(walletPath)) {
    throw new Error(`Wallet file not found at ${walletPath}. Please set ANCHOR_WALLET environment variable or create a wallet.`);
  }

  const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
  return Keypair.fromSecretKey(new Uint8Array(walletData));
}

// Export for use as module
module.exports = { deploy };

// Run if called directly
if (require.main === module) {
  deploy()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
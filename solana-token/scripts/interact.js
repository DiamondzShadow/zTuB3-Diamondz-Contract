const anchor = require('@coral-xyz/anchor');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount } = require('@solana/spl-token');
const fs = require('fs');

// Configuration
const NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';

class BurnMintSPLClient {
  constructor(connection, wallet, programId) {
    this.connection = connection;
    this.wallet = wallet;
    
    // Load IDL and create program instance
    const idl = JSON.parse(fs.readFileSync('./target/idl/burn_mint_spl.json', 'utf8'));
    this.program = new anchor.Program(idl, programId, new anchor.AnchorProvider(connection, wallet, {}));
    
    // Derive common PDAs
    this.tokenConfig = PublicKey.findProgramAddressSync(
      [Buffer.from('token_config')],
      programId
    )[0];
    
    this.tokenAuthority = PublicKey.findProgramAddressSync(
      [Buffer.from('token_authority')],
      programId
    )[0];
  }

  async getTokenConfig() {
    try {
      return await this.program.account.tokenConfig.fetch(this.tokenConfig);
    } catch (error) {
      throw new Error(`Failed to fetch token config: ${error.message}`);
    }
  }

  async getUserStats(userPubkey) {
    const [userStats] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_stats'), userPubkey.toBuffer()],
      this.program.programId
    );

    try {
      return await this.program.account.userStats.fetch(userStats);
    } catch (error) {
      console.log(`User stats not found for ${userPubkey.toString()}`);
      return null;
    }
  }

  async getMinterRole(minter) {
    const [minterRole] = PublicKey.findProgramAddressSync(
      [Buffer.from('minter_role'), this.tokenConfig.toBuffer(), minter.toBuffer()],
      this.program.programId
    );

    try {
      return await this.program.account.minterRole.fetch(minterRole);
    } catch (error) {
      console.log(`Minter role not found for ${minter.toString()}`);
      return null;
    }
  }

  async getBurnerRole(burner) {
    const [burnerRole] = PublicKey.findProgramAddressSync(
      [Buffer.from('burner_role'), this.tokenConfig.toBuffer(), burner.toBuffer()],
      this.program.programId
    );

    try {
      return await this.program.account.burnerRole.fetch(burnerRole);
    } catch (error) {
      console.log(`Burner role not found for ${burner.toString()}`);
      return null;
    }
  }

  async mintTokens(recipient, amount) {
    const tokenConfig = await this.getTokenConfig();
    const mint = tokenConfig.mint;

    // Get or create recipient token account
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      this.wallet.payer,
      mint,
      recipient
    );

    // Derive recipient stats PDA
    const [recipientStats] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_stats'), recipient.toBuffer()],
      this.program.programId
    );

    // Derive minter role PDA
    const [minterRole] = PublicKey.findProgramAddressSync(
      [Buffer.from('minter_role'), this.tokenConfig.toBuffer(), this.wallet.publicKey.toBuffer()],
      this.program.programId
    );

    const tx = await this.program.methods
      .mintTokens(new anchor.BN(amount))
      .accounts({
        tokenConfig: this.tokenConfig,
        mint,
        tokenAuthority: this.tokenAuthority,
        recipientTokenAccount: recipientTokenAccount.address,
        recipientStats,
        minterRole,
        minter: this.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  async mintTokensWithCCIP(recipient, amount, sourceChain, ccipMessageId) {
    const tokenConfig = await this.getTokenConfig();
    const mint = tokenConfig.mint;

    // Get or create recipient token account
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      this.wallet.payer,
      mint,
      recipient
    );

    // Derive recipient stats PDA
    const [recipientStats] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_stats'), recipient.toBuffer()],
      this.program.programId
    );

    // Derive minter role PDA
    const [minterRole] = PublicKey.findProgramAddressSync(
      [Buffer.from('minter_role'), this.tokenConfig.toBuffer(), this.wallet.publicKey.toBuffer()],
      this.program.programId
    );

    const tx = await this.program.methods
      .mintTokensWithCcip(
        new anchor.BN(amount),
        sourceChain,
        Array.from(ccipMessageId)
      )
      .accounts({
        tokenConfig: this.tokenConfig,
        mint,
        tokenAuthority: this.tokenAuthority,
        recipientTokenAccount: recipientTokenAccount.address,
        recipientStats,
        minterRole,
        minter: this.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  async burnTokens(amount) {
    const tokenConfig = await this.getTokenConfig();
    const mint = tokenConfig.mint;

    // Get burner token account
    const burnerTokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      this.wallet.payer,
      mint,
      this.wallet.publicKey
    );

    // Derive burner role PDA
    const [burnerRole] = PublicKey.findProgramAddressSync(
      [Buffer.from('burner_role'), this.tokenConfig.toBuffer(), this.wallet.publicKey.toBuffer()],
      this.program.programId
    );

    const tx = await this.program.methods
      .burnTokens(new anchor.BN(amount))
      .accounts({
        tokenConfig: this.tokenConfig,
        burnerTokenAccount: burnerTokenAccount.address,
        burnerRole,
        burner: this.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx;
  }

  async grantMintRole(minter) {
    const [minterRole] = PublicKey.findProgramAddressSync(
      [Buffer.from('minter_role'), this.tokenConfig.toBuffer(), minter.toBuffer()],
      this.program.programId
    );

    const tx = await this.program.methods
      .grantMintRole(minter)
      .accounts({
        tokenConfig: this.tokenConfig,
        minterRole,
        owner: this.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  async revokeMintRole(minter) {
    const [minterRole] = PublicKey.findProgramAddressSync(
      [Buffer.from('minter_role'), this.tokenConfig.toBuffer(), minter.toBuffer()],
      this.program.programId
    );

    const tx = await this.program.methods
      .revokeMintRole(minter)
      .accounts({
        tokenConfig: this.tokenConfig,
        minterRole,
        owner: this.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  async grantBurnRole(burner) {
    const [burnerRole] = PublicKey.findProgramAddressSync(
      [Buffer.from('burner_role'), this.tokenConfig.toBuffer(), burner.toBuffer()],
      this.program.programId
    );

    const tx = await this.program.methods
      .grantBurnRole(burner)
      .accounts({
        tokenConfig: this.tokenConfig,
        burnerRole,
        owner: this.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  async revokeBurnRole(burner) {
    const [burnerRole] = PublicKey.findProgramAddressSync(
      [Buffer.from('burner_role'), this.tokenConfig.toBuffer(), burner.toBuffer()],
      this.program.programId
    );

    const tx = await this.program.methods
      .revokeBurnRole(burner)
      .accounts({
        tokenConfig: this.tokenConfig,
        burnerRole,
        owner: this.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  async setMaxSupply(newMaxSupply) {
    const tx = await this.program.methods
      .setMaxSupply(new anchor.BN(newMaxSupply))
      .accounts({
        tokenConfig: this.tokenConfig,
        owner: this.wallet.publicKey,
      })
      .rpc();

    return tx;
  }
}

// Example usage
async function demonstrateTokenFunctionality() {
  console.log('🎯 Demonstrating BurnMintSPL Token Functionality...');

  // Load deployment info
  const deploymentInfo = JSON.parse(fs.readFileSync(`./deployment-${NETWORK}.json`, 'utf8'));
  
  // Setup connection
  const connection = new Connection(RPC_URL, 'confirmed');
  
  // Load wallet
  const walletPath = process.env.ANCHOR_WALLET || process.env.HOME + '/.config/solana/id.json';
  const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
  const walletKeypair = Keypair.fromSecretKey(new Uint8Array(walletData));
  const wallet = new anchor.Wallet(walletKeypair);

  // Create client
  const client = new BurnMintSPLClient(
    connection,
    wallet,
    new PublicKey(deploymentInfo.programId)
  );

  try {
    // Get token configuration
    console.log('\n📋 Token Configuration:');
    const tokenConfig = await client.getTokenConfig();
    console.log(`  Name: ${tokenConfig.name}`);
    console.log(`  Symbol: ${tokenConfig.symbol}`);
    console.log(`  Decimals: ${tokenConfig.decimals}`);
    console.log(`  Max Supply: ${tokenConfig.maxSupply.toString()}`);
    console.log(`  Total Mint Events: ${tokenConfig.totalMintEvents.toString()}`);

    // Get user stats
    console.log('\n👤 Owner Stats:');
    const ownerStats = await client.getUserStats(wallet.publicKey);
    if (ownerStats) {
      console.log(`  Total Minted: ${ownerStats.totalMinted.toString()}`);
      console.log(`  Mint Count: ${ownerStats.mintCount.toString()}`);
      console.log(`  Milestones Achieved: ${ownerStats.milestonesAchieved.toString()}`);
    }

    // Demonstrate minting to a new recipient
    const testRecipient = Keypair.generate().publicKey;
    console.log(`\n🪙 Minting 1000 tokens to test recipient: ${testRecipient.toString()}`);
    
    const mintTx = await client.mintTokens(testRecipient, '1000000000000000000000'); // 1000 tokens with 18 decimals
    console.log(`  Transaction: ${mintTx}`);

    // Demonstrate CCIP mint
    console.log('\n🌉 Demonstrating CCIP cross-chain mint...');
    const ccipMessageId = new Uint8Array(32).fill(42); // Example message ID
    const ccipTx = await client.mintTokensWithCCIP(
      testRecipient,
      '500000000000000000000', // 500 tokens
      'arbitrum',
      ccipMessageId
    );
    console.log(`  CCIP Transaction: ${ccipTx}`);

    console.log('\n✅ Demonstration completed successfully!');

  } catch (error) {
    console.error('❌ Demonstration failed:', error);
    throw error;
  }
}

// Export for use as module
module.exports = { BurnMintSPLClient };

// Run if called directly
if (require.main === module) {
  demonstrateTokenFunctionality()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
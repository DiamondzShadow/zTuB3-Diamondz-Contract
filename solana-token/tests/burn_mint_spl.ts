import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BurnMintSpl } from "../target/types/burn_mint_spl";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount, getAccount } from "@solana/spl-token";
import { expect } from "chai";

describe("BurnMintSPL", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.BurnMintSpl as Program<BurnMintSpl>;
  const provider = anchor.getProvider();
  const connection = provider.connection;

  // Test keypairs
  const owner = (provider.wallet as anchor.Wallet).payer;
  const testUser = Keypair.generate();
  const mintKeypair = Keypair.generate();

  // Token configuration
  const TOKEN_CONFIG = {
    name: "Test BurnMint Token",
    symbol: "TBMT", 
    decimals: 18,
    initialSupply: new anchor.BN("4000000000000000000000000000"), // 4B tokens
    maxSupply: new anchor.BN("5000000000000000000000000000"), // 5B tokens
  };

  // PDAs
  let tokenConfig: PublicKey;
  let tokenAuthority: PublicKey;
  let ownerStats: PublicKey;
  let testUserStats: PublicKey;
  let ownerMinterRole: PublicKey;
  let ownerBurnerRole: PublicKey;
  let testUserMinterRole: PublicKey;

  // Token accounts
  let ownerTokenAccount: any;
  let testUserTokenAccount: any;

  before(async () => {
    // Airdrop to test user
    const airdropTx = await connection.requestAirdrop(testUser.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(airdropTx);

    // Derive PDAs
    [tokenConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_config")],
      program.programId
    );

    [tokenAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_authority")],
      program.programId
    );

    [ownerStats] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_stats"), owner.publicKey.toBuffer()],
      program.programId
    );

    [testUserStats] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_stats"), testUser.publicKey.toBuffer()],
      program.programId
    );

    [ownerMinterRole] = PublicKey.findProgramAddressSync(
      [Buffer.from("minter_role"), tokenConfig.toBuffer(), owner.publicKey.toBuffer()],
      program.programId
    );

    [ownerBurnerRole] = PublicKey.findProgramAddressSync(
      [Buffer.from("burner_role"), tokenConfig.toBuffer(), owner.publicKey.toBuffer()],
      program.programId
    );

    [testUserMinterRole] = PublicKey.findProgramAddressSync(
      [Buffer.from("minter_role"), tokenConfig.toBuffer(), testUser.publicKey.toBuffer()],
      program.programId
    );
  });

  it("Initializes the token", async () => {
    // Create initial token account for owner
    ownerTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      mintKeypair.publicKey,
      owner.publicKey
    );

    const tx = await program.methods
      .initialize(
        TOKEN_CONFIG.decimals,
        TOKEN_CONFIG.initialSupply,
        TOKEN_CONFIG.maxSupply,
        TOKEN_CONFIG.name,
        TOKEN_CONFIG.symbol
      )
      .accounts({
        tokenConfig,
        mint: mintKeypair.publicKey,
        tokenAuthority,
        initialTokenAccount: ownerTokenAccount.address,
        ownerStats,
        ownerMinterRole,
        ownerBurnerRole,
        owner: owner.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([mintKeypair])
      .rpc();

    console.log("Initialize transaction signature:", tx);

    // Verify token config
    const tokenConfigAccount = await program.account.tokenConfig.fetch(tokenConfig);
    expect(tokenConfigAccount.owner.toString()).to.equal(owner.publicKey.toString());
    expect(tokenConfigAccount.name).to.equal(TOKEN_CONFIG.name);
    expect(tokenConfigAccount.symbol).to.equal(TOKEN_CONFIG.symbol);
    expect(tokenConfigAccount.decimals).to.equal(TOKEN_CONFIG.decimals);
    expect(tokenConfigAccount.maxSupply.toString()).to.equal(TOKEN_CONFIG.maxSupply.toString());

    // Verify owner stats
    const ownerStatsAccount = await program.account.userStats.fetch(ownerStats);
    expect(ownerStatsAccount.totalMinted.toString()).to.equal(TOKEN_CONFIG.initialSupply.toString());
    expect(ownerStatsAccount.mintCount.toString()).to.equal("1");

    // Verify initial token balance
    const tokenAccount = await getAccount(connection, ownerTokenAccount.address);
    expect(tokenAccount.amount.toString()).to.equal(TOKEN_CONFIG.initialSupply.toString());
  });

  it("Mints tokens to a new user", async () => {
    const mintAmount = new anchor.BN("1000000000000"); // 1000 tokens with 9 decimals

    // Create token account for test user
    testUserTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      owner, // payer
      mintKeypair.publicKey,
      testUser.publicKey
    );

    const tx = await program.methods
      .mintTokens(mintAmount)
      .accounts({
        tokenConfig,
        mint: mintKeypair.publicKey,
        tokenAuthority,
        recipientTokenAccount: testUserTokenAccount.address,
        recipientStats: testUserStats,
        minterRole: ownerMinterRole,
        minter: owner.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Mint transaction signature:", tx);

    // Verify test user stats
    const testUserStatsAccount = await program.account.userStats.fetch(testUserStats);
    expect(testUserStatsAccount.totalMinted.toString()).to.equal(mintAmount.toString());
    expect(testUserStatsAccount.mintCount.toString()).to.equal("1");

    // Verify token balance
    const tokenAccount = await getAccount(connection, testUserTokenAccount.address);
    expect(tokenAccount.amount.toString()).to.equal(mintAmount.toString());
  });

  it("Mints tokens with CCIP metadata", async () => {
    const mintAmount = new anchor.BN("500000000000000000000"); // 500 tokens
    const sourceChain = "arbitrum";
    const ccipMessageId = Array.from({ length: 32 }, (_, i) => i + 1); // Example message ID

    const tx = await program.methods
      .mintTokensWithCcip(mintAmount, sourceChain, ccipMessageId)
      .accounts({
        tokenConfig,
        mint: mintKeypair.publicKey,
        tokenAuthority,
        recipientTokenAccount: testUserTokenAccount.address,
        recipientStats: testUserStats,
        minterRole: ownerMinterRole,
        minter: owner.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("CCIP mint transaction signature:", tx);

    // Verify updated user stats
    const testUserStatsAccount = await program.account.userStats.fetch(testUserStats);
    const expectedTotal = new anchor.BN("1500000000000000000000"); // 1500 tokens total
    expect(testUserStatsAccount.totalMinted.toString()).to.equal(expectedTotal.toString());
    expect(testUserStatsAccount.mintCount.toString()).to.equal("2");

    // Verify token balance
    const tokenAccount = await getAccount(connection, testUserTokenAccount.address);
    expect(tokenAccount.amount.toString()).to.equal(expectedTotal.toString());
  });

  it("Grants mint role to test user", async () => {
    const tx = await program.methods
      .grantMintRole(testUser.publicKey)
      .accounts({
        tokenConfig,
        minterRole: testUserMinterRole,
        owner: owner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Grant mint role transaction signature:", tx);

    // Verify minter role
    const minterRoleAccount = await program.account.minterRole.fetch(testUserMinterRole);
    expect(minterRoleAccount.minter.toString()).to.equal(testUser.publicKey.toString());
    expect(minterRoleAccount.grantedBy.toString()).to.equal(owner.publicKey.toString());
  });

  it("Test user mints tokens using granted role", async () => {
    const mintAmount = new anchor.BN("250000000000000000000"); // 250 tokens

    const tx = await program.methods
      .mintTokens(mintAmount)
      .accounts({
        tokenConfig,
        mint: mintKeypair.publicKey,
        tokenAuthority,
        recipientTokenAccount: testUserTokenAccount.address,
        recipientStats: testUserStats,
        minterRole: testUserMinterRole,
        minter: testUser.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([testUser])
      .rpc();

    console.log("Test user mint transaction signature:", tx);

    // Verify updated stats
    const testUserStatsAccount = await program.account.userStats.fetch(testUserStats);
    const expectedTotal = new anchor.BN("1750000000000000000000"); // 1750 tokens total
    expect(testUserStatsAccount.totalMinted.toString()).to.equal(expectedTotal.toString());

    // Verify minter role stats
    const minterRoleAccount = await program.account.minterRole.fetch(testUserMinterRole);
    expect(minterRoleAccount.mintCount.toString()).to.equal("1");
    expect(minterRoleAccount.totalMinted.toString()).to.equal(mintAmount.toString());
  });

  it("Burns tokens", async () => {
    const burnAmount = new anchor.BN("100000000000"); // 100 tokens with 9 decimals

    const tx = await program.methods
      .burnTokens(burnAmount)
      .accounts({
        tokenConfig,
        burnerTokenAccount: ownerTokenAccount.address,
        burnerRole: ownerBurnerRole,
        burner: owner.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Burn transaction signature:", tx);

    // Verify burner role stats
    const burnerRoleAccount = await program.account.burnerRole.fetch(ownerBurnerRole);
    expect(burnerRoleAccount.burnCount.toString()).to.equal("1");
    expect(burnerRoleAccount.totalBurned.toString()).to.equal(burnAmount.toString());

    // Verify reduced token balance
    const tokenAccount = await getAccount(connection, ownerTokenAccount.address);
    const expectedBalance = TOKEN_CONFIG.initialSupply.sub(burnAmount);
    expect(tokenAccount.amount.toString()).to.equal(expectedBalance.toString());
  });

  it("Sets new max supply", async () => {
    const newMaxSupply = new anchor.BN("6000000000000000000000000000"); // 6B tokens

    const tx = await program.methods
      .setMaxSupply(newMaxSupply)
      .accounts({
        tokenConfig,
        owner: owner.publicKey,
      })
      .rpc();

    console.log("Set max supply transaction signature:", tx);

    // Verify updated max supply
    const tokenConfigAccount = await program.account.tokenConfig.fetch(tokenConfig);
    expect(tokenConfigAccount.maxSupply.toString()).to.equal(newMaxSupply.toString());
  });

  it("Revokes mint role from test user", async () => {
    const tx = await program.methods
      .revokeMintRole(testUser.publicKey)
      .accounts({
        tokenConfig,
        minterRole: testUserMinterRole,
        owner: owner.publicKey,
      })
      .rpc();

    console.log("Revoke mint role transaction signature:", tx);

    // Verify role is removed
    try {
      await program.account.minterRole.fetch(testUserMinterRole);
      expect.fail("Minter role should have been revoked");
    } catch (error) {
      expect(error.message).to.include("Account does not exist");
    }
  });

  it("Fails to mint when role is revoked", async () => {
    const mintAmount = new anchor.BN("100000000000"); // 100 tokens with 9 decimals

    try {
      await program.methods
        .mintTokens(mintAmount)
        .accounts({
          tokenConfig,
          mint: mintKeypair.publicKey,
          tokenAuthority,
          recipientTokenAccount: testUserTokenAccount.address,
          recipientStats: testUserStats,
          minterRole: testUserMinterRole,
          minter: testUser.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([testUser])
        .rpc();

      expect.fail("Should have failed to mint without role");
    } catch (error) {
      expect(error.message).to.include("Account does not exist");
    }
  });

  it("Fails to exceed max supply", async () => {
    // Try to mint more than the remaining supply
    const currentSupply = await (await program.account.tokenConfig.fetch(tokenConfig)).maxSupply;
    const excessiveAmount = currentSupply.add(new anchor.BN("1000000000000")); // Max supply + 1000 tokens

    try {
      await program.methods
        .mintTokens(excessiveAmount)
        .accounts({
          tokenConfig,
          mint: mintKeypair.publicKey,
          tokenAuthority,
          recipientTokenAccount: ownerTokenAccount.address,
          recipientStats: ownerStats,
          minterRole: ownerMinterRole,
          minter: owner.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      expect.fail("Should have failed to exceed max supply");
    } catch (error) {
      expect(error.toString()).to.include("MaxSupplyExceeded");
    }
  });
});
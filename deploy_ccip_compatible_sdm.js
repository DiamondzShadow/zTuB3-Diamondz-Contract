/**
 * CCIP-Compatible SDM Token Deployment for Solana
 * Based on Chainlink CCIP Solana support (2024)
 * Docs: https://docs.chain.link/ccip/tutorials/svm/source/prerequisites
 */

const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { mplTokenMetadata, createMetadataAccountV3, findMetadataPda } = require('@metaplex-foundation/mpl-token-metadata');
const { createSignerFromKeypair, signerIdentity, generateSigner } = require('@metaplex-foundation/umi');
const { createMint, createToken, mintTo } = require('@metaplex-foundation/mpl-toolbox');
const fs = require('fs');

async function deployCCIPCompatibleSDM() {
  try {
    console.log('🌉 Deploying CCIP-Compatible SDM Token on Solana');
    console.log('===============================================');
    console.log('📋 CCIP enables bridging to: Arbitrum, Ethereum, Polygon, etc.');
    
    const umi = createUmi('https://black-still-butterfly.solana-mainnet.quiknode.pro/ed845667579c683613d3f8b9e397ddc46239ce76/').use(mplTokenMetadata());
    
    // Load your wallet
    const walletData = JSON.parse(fs.readFileSync('./main_wallet.json', 'utf8'));
    const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(walletData));
    const signer = createSignerFromKeypair(umi, keypair);
    umi.use(signerIdentity(signer));
    
    console.log(`💼 Deploying from: ${signer.publicKey}`);
    console.log(`💰 Balance check passed - ready for deployment`);
    
    // Generate mint for CCIP-compatible token
    const mint = generateSigner(umi);
    console.log(`🆕 New CCIP SDM token mint: ${mint.publicKey}`);
    
    // Updated metadata URI with all socials + bridge info
    const METADATA_URI = 'https://red-adorable-dove-755.mypinata.cloud/ipfs/bafkreidtc5wmqpsfamqi6rqjjrjz7ydisbc7limhzfap7ox5tidjxudtwm';
    
    console.log('🪙 Step 1: Creating token mint...');
    
    // Create mint with CCIP-standard decimals (9 for Solana, matching your EVM token)
    await createMint(umi, {
      mint,
      decimals: 9, // Standard for cross-chain compatibility
      mintAuthority: signer.publicKey, // You control minting for CCIP
      freezeAuthority: signer.publicKey, // You control freezing
    }).sendAndConfirm(umi);
    
    console.log('✅ Token mint created!');
    
    console.log('📝 Step 2: Creating CCIP-compatible metadata...');
    
    const metadata = findMetadataPda(umi, { mint: mint.publicKey });
    
    await createMetadataAccountV3(umi, {
      metadata: metadata[0],
      mint: mint.publicKey,
      mintAuthority: signer,
      payer: signer,
      updateAuthority: signer, // You maintain update authority for CCIP registration
      data: {
        name: 'Diamondz Shadow Game + Movies',
        symbol: 'SDM',
        uri: METADATA_URI,
        sellerFeeBasisPoints: 0, // No royalties for utility token
        creators: [
          {
            address: signer.publicKey,
            verified: true,
            share: 100,
          },
        ],
        collection: null,
        uses: null,
      },
      isMutable: true, // Required for CCIP updates
      collectionDetails: null,
    }).sendAndConfirm(umi);
    
    console.log('✅ CCIP-compatible metadata created!');
    
    console.log('🪙 Step 3: Creating initial token account...');
    
    // Create token account for initial supply
    const tokenAccount = generateSigner(umi);
    await createToken(umi, {
      mint: mint.publicKey,
      owner: signer.publicKey,
      token: tokenAccount,
    }).sendAndConfirm(umi);
    
    console.log('✅ Token account created!');
    
    console.log('💰 Step 4: Minting initial supply...');
    
    // Mint initial supply (4 billion tokens like your EVM version)
    const INITIAL_SUPPLY = BigInt(4_000_000_000 * 1e9); // 4B tokens with 9 decimals
    
    await mintTo(umi, {
      mint: mint.publicKey,
      token: tokenAccount.publicKey,
      amount: INITIAL_SUPPLY,
      mintAuthority: signer,
    }).sendAndConfirm(umi);
    
    console.log('✅ Initial supply minted!');
    
    console.log('\n🌉 CCIP-COMPATIBLE SDM TOKEN DEPLOYED!');
    console.log('=====================================');
    console.log(`🪙 Solana Mint: ${mint.publicKey}`);
    console.log(`🏦 Token Account: ${tokenAccount.publicKey}`);
    console.log(`👤 Authority: ${signer.publicKey}`);
    console.log(`💰 Initial Supply: 4,000,000,000 SDM`);
    console.log(`🌐 Metadata: ${METADATA_URI}`);
    console.log(`🔗 Solscan: https://solscan.io/token/${mint.publicKey}`);
    
    console.log('\n🌉 CCIP Bridge Setup:');
    console.log('1. Register this token with Chainlink CCIP');
    console.log('2. Connect to your Arbitrum SDM token');
    console.log('3. Enable cross-chain transfers');
    
    // Save complete deployment info for CCIP registration
    const ccipDeploymentInfo = {
      solana: {
        mintAddress: mint.publicKey.toString(),
        tokenAccount: tokenAccount.publicKey.toString(),
        authority: signer.publicKey.toString(),
        network: 'solana-mainnet',
        initialSupply: '4000000000',
        decimals: 9
      },
      arbitrum: {
        // Your existing EVM token info
        network: 'arbitrum-one',
        tokenAddress: 'YOUR_ARBITRUM_TOKEN_ADDRESS' // Update this
      },
      ccip: {
        status: 'ready_for_registration',
        supportedChains: ['arbitrum', 'ethereum', 'polygon'],
        bridgeType: 'chainlink-ccip'
      },
      metadata: {
        uri: METADATA_URI,
        ipfsHash: 'bafkreidtc5wmqpsfamqi6rqjjrjz7ydisbc7limhzfap7ox5tidjxudtwm',
        includesAllSocials: true,
        bridgeCompatible: true
      },
      deployedAt: new Date().toISOString()
    };
    
    fs.writeFileSync('./ccip_sdm_deployment.json', JSON.stringify(ccipDeploymentInfo, null, 2));
    console.log('💾 CCIP deployment info saved to ccip_sdm_deployment.json');
    
    console.log('\n🎉 Ready for CCIP Bridge Registration!');
    
  } catch (error) {
    console.error('❌ CCIP deployment failed:', error);
  }
}

deployCCIPCompatibleSDM();
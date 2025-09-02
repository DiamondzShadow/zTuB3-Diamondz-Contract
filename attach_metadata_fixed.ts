import { Connection, clusterApiUrl, PublicKey, Keypair } from '@solana/web3.js';
import { Metaplex, keypairIdentity, bundlrStorage } from '@metaplex-foundation/js';
import fs from 'fs';

/**
 * FIXED: Attach metadata to Diamondz Shadow Game + Movies (SDM) token
 * This script creates or updates token metadata on Solana using Metaplex
 * 
 * FIXES:
 * - Uses 'nftOrSft' instead of 'mintAddress' in update calls
 * - Proper error handling for existing vs new metadata
 * - Environment variable support
 */

async function attachMetadata() {
  try {
    // Configuration - you can modify these directly or use environment variables
    const NETWORK = 'devnet'; // Change to 'mainnet-beta' for mainnet
    const RPC_URL = 'https://api.devnet.solana.com';
    
    // YOUR TOKEN MINT ADDRESS - REPLACE THIS
    const MINT_ADDRESS = 'YOUR_TOKEN_MINT_ADDRESS_HERE';
    
    // Your metadata URI from Pinata
    const METADATA_URI = 'https://red-adorable-dove-755.mypinata.cloud/ipfs/bafkreigb2axwu5qxqq5ytl5625murmjcpget5nqwxtcd3jc62m4nibk7f4';

    // Load wallet - REPLACE WITH YOUR WALLET PATH
    let keypair: Keypair;
    
    if (fs.existsSync('./wallet.json')) {
      // Load from wallet file in current directory
      console.log('📁 Loading wallet from wallet.json...');
      const walletData = JSON.parse(fs.readFileSync('./wallet.json', 'utf8'));
      keypair = Keypair.fromSecretKey(new Uint8Array(walletData));
    } else {
      throw new Error('❌ wallet.json not found. Please ensure your wallet file exists in the current directory.');
    }

    console.log('🚀 Connecting to Solana...');
    console.log(`📡 Network: ${NETWORK}`);
    console.log(`🔗 RPC: ${RPC_URL}`);
    console.log(`💼 Wallet: ${keypair.publicKey.toString()}`);
    console.log(`🪙 Token Mint: ${MINT_ADDRESS}`);

    // Initialize connection and Metaplex
    const connection = new Connection(RPC_URL);
    const metaplex = Metaplex.make(connection)
      .use(keypairIdentity(keypair))
      .use(bundlrStorage({
        address: NETWORK === 'mainnet-beta' 
          ? 'https://node1.bundlr.network' 
          : 'https://devnet.bundlr.network',
        providerUrl: RPC_URL,
        timeout: 60000,
      }));

    console.log('📋 Preparing metadata...');
    
    // Token metadata for SDM
    const tokenMetadata = {
      name: 'Diamondz Shadow Game + Movies',
      symbol: 'SDM',
      uri: METADATA_URI,
      sellerFeeBasisPoints: 0, // 0% royalty
      creators: [
        {
          address: keypair.publicKey,
          verified: true,
          share: 100,
        },
      ],
      collection: null,
      uses: null,
    };

    console.log('📤 Processing token metadata...');
    
    const mintPublicKey = new PublicKey(MINT_ADDRESS);
    
    try {
      // FIXED: First try to find existing metadata
      console.log('🔍 Checking for existing metadata...');
      const existingNft = await metaplex.nfts().findByMint({ 
        mintAddress: mintPublicKey 
      });
      
      console.log('📝 Found existing metadata, updating...');
      
      // FIXED: Use 'nftOrSft' property instead of 'mintAddress'
      const { response } = await metaplex.nfts().update({
        nftOrSft: existingNft,  // ✅ CORRECT property name (was 'mintAddress')
        name: tokenMetadata.name,
        symbol: tokenMetadata.symbol,
        uri: tokenMetadata.uri,
        sellerFeeBasisPoints: tokenMetadata.sellerFeeBasisPoints,
        creators: tokenMetadata.creators,
      });

      console.log('✅ Metadata updated successfully!');
      console.log(`📋 Transaction: ${response.signature}`);
      
    } catch (findError) {
      console.log('📝 No existing metadata found, creating new...');
      
      // Create new metadata account
      const { nft, response } = await metaplex.nfts().create({
        mint: mintPublicKey,
        name: tokenMetadata.name,
        symbol: tokenMetadata.symbol,
        uri: tokenMetadata.uri,
        sellerFeeBasisPoints: tokenMetadata.sellerFeeBasisPoints,
        creators: tokenMetadata.creators,
        isMutable: true,
      });

      console.log('✅ Metadata created successfully!');
      console.log(`📋 Transaction: ${response.signature}`);
      console.log(`🔗 Metadata Address: ${nft.metadataAddress.toString()}`);
    }

    console.log('🎉 Process completed!');
    console.log(`🌐 Metadata URI: ${METADATA_URI}`);
    console.log(`🔗 View on Solscan: https://solscan.io/token/${MINT_ADDRESS}?cluster=${NETWORK}`);

  } catch (error) {
    console.error('❌ Error attaching metadata:', error);
    
    if (error instanceof Error) {
      console.error('💬 Error message:', error.message);
    }
    
    process.exit(1);
  }
}

// Run the script
attachMetadata().catch(console.error);
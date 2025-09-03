import { Connection, clusterApiUrl, PublicKey, Keypair } from '@solana/web3.js';
import { Metaplex, keypairIdentity, bundlrStorage } from '@metaplex-foundation/js';
import fs from 'fs';
import path from 'path';

// Load environment variables
require('dotenv').config();

/**
 * Attach metadata to Diamondz Shadow Game + Movies (SDM) token
 * This script creates or updates token metadata on Solana using Metaplex
 */

async function attachMetadata() {
  try {
    // Configuration
    const NETWORK = process.env.SOLANA_NETWORK || 'devnet';
    const RPC_URL = process.env.RPC_URL || clusterApiUrl(NETWORK as any);
    
    // Your token mint address (replace with actual mint address)
    const MINT_ADDRESS = process.env.TOKEN_MINT_ADDRESS;
    
    if (!MINT_ADDRESS) {
      throw new Error('TOKEN_MINT_ADDRESS environment variable is required');
    }

    // Load wallet keypair from environment or file
    let keypair: Keypair;
    
    if (process.env.WALLET_PRIVATE_KEY) {
      // Load from environment variable (base58 or array format)
      const privateKey = process.env.WALLET_PRIVATE_KEY;
      if (privateKey.startsWith('[')) {
        // Array format: [1,2,3,...]
        const keyArray = JSON.parse(privateKey);
        keypair = Keypair.fromSecretKey(new Uint8Array(keyArray));
      } else {
        // Base58 format
        const bs58 = require('bs58');
        keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
      }
    } else if (fs.existsSync('wallet.json')) {
      // Load from wallet file
      const walletData = JSON.parse(fs.readFileSync('wallet.json', 'utf8'));
      keypair = Keypair.fromSecretKey(new Uint8Array(walletData));
    } else {
      throw new Error('No wallet found. Set WALLET_PRIVATE_KEY or provide wallet.json');
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

    console.log('📋 Loading metadata...');
    
    // Token metadata - using your IPFS hash
    const METADATA_URI = process.env.METADATA_URI || 
      'https://red-adorable-dove-755.mypinata.cloud/ipfs/bafkreigb2axwu5qxqq5ytl5625murmjcpget5nqwxtcd3jc62m4nibk7f4';

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

    console.log('📤 Creating/updating token metadata...');
    
    // Create or update the metadata account
    const mintPublicKey = new PublicKey(MINT_ADDRESS);
    
    try {
      // Try to find existing metadata first
      const existingNft = await metaplex.nfts().findByMint({ 
        mintAddress: mintPublicKey 
      });
      
      console.log('📝 Updating existing metadata...');
      
      // Update existing metadata - correct property name is 'nftOrSft'
      const { response } = await metaplex.nfts().update({
        nftOrSft: existingNft,
        name: tokenMetadata.name,
        symbol: tokenMetadata.symbol,
        uri: tokenMetadata.uri,
        sellerFeeBasisPoints: tokenMetadata.sellerFeeBasisPoints,
        creators: tokenMetadata.creators,
      });

      console.log('✅ Metadata updated successfully!');
      console.log(`📋 Transaction: ${response.signature}`);
      
    } catch (findError) {
      console.log('📝 Creating new metadata account...');
      
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
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  attachMetadata();
}

export { attachMetadata };
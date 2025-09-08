import { Connection, clusterApiUrl, PublicKey, Keypair } from '@solana/web3.js';
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import fs from 'fs';

/**
 * COMPLETELY FIXED: Attach metadata to Diamondz Shadow Game + Movies (SDM) token
 * Updated for current Metaplex JS SDK API (2024)
 * 
 * FIXES:
 * - Removed bundlrStorage (no longer available)
 * - Fixed creator object structure (no 'verified' property)
 * - Uses current Metaplex API patterns
 */

async function attachMetadata() {
  try {
    // Configuration - REPLACE THESE VALUES
    const NETWORK = 'devnet'; // Change to 'mainnet-beta' for mainnet
    const RPC_URL = 'https://api.devnet.solana.com';
    
    // YOUR TOKEN MINT ADDRESS - REPLACE THIS WITH YOUR ACTUAL MINT
    const MINT_ADDRESS = 'YOUR_TOKEN_MINT_ADDRESS_HERE';
    
    // Your metadata URI from Pinata
    const METADATA_URI = 'https://red-adorable-dove-755.mypinata.cloud/ipfs/bafkreigb2axwu5qxqq5ytl5625murmjcpget5nqwxtcd3jc62m4nibk7f4';

    // Load wallet
    let keypair: Keypair;
    
    if (fs.existsSync('./wallet.json')) {
      console.log('📁 Loading wallet from wallet.json...');
      const walletData = JSON.parse(fs.readFileSync('./wallet.json', 'utf8'));
      keypair = Keypair.fromSecretKey(new Uint8Array(walletData));
    } else {
      throw new Error('❌ wallet.json not found in current directory.');
    }

    console.log('🚀 Connecting to Solana...');
    console.log(`📡 Network: ${NETWORK}`);
    console.log(`🔗 RPC: ${RPC_URL}`);
    console.log(`💼 Wallet: ${keypair.publicKey.toString()}`);
    console.log(`🪙 Token Mint: ${MINT_ADDRESS}`);

    // Initialize connection and Metaplex (FIXED: no bundlrStorage)
    const connection = new Connection(RPC_URL);
    const metaplex = Metaplex.make(connection)
      .use(keypairIdentity(keypair));
      // ✅ REMOVED bundlrStorage - not available in current version

    console.log('📋 Preparing metadata...');
    
    const mintPublicKey = new PublicKey(MINT_ADDRESS);
    
    try {
      // Try to find existing metadata first
      console.log('🔍 Checking for existing metadata...');
      const existingNft = await metaplex.nfts().findByMint({ 
        mintAddress: mintPublicKey 
      });
      
      console.log('📝 Found existing metadata, updating...');
      
      // ✅ FIXED: Use 'nftOrSft' and correct creator structure
      const { response } = await metaplex.nfts().update({
        nftOrSft: existingNft,
        name: 'Diamondz Shadow Game + Movies',
        symbol: 'SDM',
        uri: METADATA_URI,
        sellerFeeBasisPoints: 0,
        creators: [
          {
            address: keypair.publicKey,
            // ✅ REMOVED 'verified' - not valid in CreatorInput
            share: 100,
          },
        ],
      });

      console.log('✅ Metadata updated successfully!');
      console.log(`📋 Transaction: ${response.signature}`);
      
    } catch (findError) {
      console.log('📝 No existing metadata found, creating new...');
      
      try {
        // Create new metadata account
        const { nft, response } = await metaplex.nfts().create({
          mint: mintPublicKey,
          name: 'Diamondz Shadow Game + Movies',
          symbol: 'SDM',
          uri: METADATA_URI,
          sellerFeeBasisPoints: 0,
          creators: [
            {
              address: keypair.publicKey,
              // ✅ REMOVED 'verified' - not valid in CreatorInput
              share: 100,
            },
          ],
          isMutable: true,
        });

        console.log('✅ Metadata created successfully!');
        console.log(`📋 Transaction: ${response.signature}`);
        console.log(`🔗 Metadata Address: ${nft.metadataAddress.toString()}`);
        
      } catch (createError) {
        console.error('❌ Failed to create metadata:', createError);
        throw createError;
      }
    }

    console.log('🎉 Process completed!');
    console.log(`🌐 Metadata URI: ${METADATA_URI}`);
    console.log(`🔗 View on Solscan: https://solscan.io/token/${MINT_ADDRESS}?cluster=${NETWORK}`);

  } catch (error) {
    console.error('❌ Error attaching metadata:', error);
    
    if (error instanceof Error) {
      console.error('💬 Error message:', error.message);
      console.error('📚 Error stack:', error.stack);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure your wallet.json file exists in the current directory');
    console.log('2. Replace YOUR_TOKEN_MINT_ADDRESS_HERE with your actual mint address');
    console.log('3. Ensure you have enough SOL for transaction fees');
    console.log('4. Check that your wallet has authority over the token');
    
    process.exit(1);
  }
}

// Run the script
attachMetadata().catch(console.error);
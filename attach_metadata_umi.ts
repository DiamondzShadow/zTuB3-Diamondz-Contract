/**
 * MODERN METAPLEX UMI VERSION: Attach metadata to SDM token
 * This uses the current Metaplex UMI framework (2024)
 * Based on official docs: https://metaplex-foundation.github.io/js/
 */

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { 
  mplTokenMetadata, 
  createMetadataAccountV3,
  updateMetadataAccountV2,
  findMetadataPda 
} from '@metaplex-foundation/mpl-token-metadata';
import { 
  createSignerFromKeypair, 
  signerIdentity, 
  publicKey,
  generateSigner,
  percentAmount 
} from '@metaplex-foundation/umi';
import fs from 'fs';

async function attachMetadata() {
  try {
    // Configuration
    const NETWORK = 'https://api.devnet.solana.com'; // Change to mainnet-beta for production
    
    // YOUR TOKEN MINT ADDRESS - REPLACE THIS
    const MINT_ADDRESS = 'YOUR_TOKEN_MINT_ADDRESS_HERE';
    
    // Your metadata URI from Pinata
    const METADATA_URI = 'https://red-adorable-dove-755.mypinata.cloud/ipfs/bafkreigb2axwu5qxqq5ytl5625murmjcpget5nqwxtcd3jc62m4nibk7f4';

    console.log('🚀 Initializing UMI...');
    
    // Initialize UMI with token metadata plugin
    const umi = createUmi(NETWORK).use(mplTokenMetadata());

    // Load wallet
    let walletSecretKey: Uint8Array;
    
    if (fs.existsSync('./wallet.json')) {
      console.log('📁 Loading wallet from wallet.json...');
      const walletData = JSON.parse(fs.readFileSync('./wallet.json', 'utf8'));
      walletSecretKey = new Uint8Array(walletData);
    } else {
      throw new Error('❌ wallet.json not found in current directory.');
    }

    // Create keypair and signer for UMI
    const keypair = umi.eddsa.createKeypairFromSecretKey(walletSecretKey);
    const signer = createSignerFromKeypair(umi, keypair);
    umi.use(signerIdentity(signer));

    console.log(`💼 Wallet: ${signer.publicKey}`);
    console.log(`🪙 Token Mint: ${MINT_ADDRESS}`);

    // Convert mint address to UMI public key
    const mint = publicKey(MINT_ADDRESS);
    
    // Find the metadata PDA
    const metadata = findMetadataPda(umi, { mint });
    
    console.log(`🔗 Metadata PDA: ${metadata[0]}`);

    // Metadata structure for SDM token
    const tokenData = {
      name: 'Diamondz Shadow Game + Movies',
      symbol: 'SDM',
      uri: METADATA_URI,
      sellerFeeBasisPoints: 0, // 0% royalty
      creators: [
        {
          address: signer.publicKey,
          verified: true,
          share: 100,
        },
      ],
      collection: null,
      uses: null,
    };

    try {
      console.log('📝 Attempting to create metadata account...');
      
      // Try to create metadata account (UMI way)
      const createTx = createMetadataAccountV3(umi, {
        metadata: metadata[0],
        mint,
        mintAuthority: signer,
        payer: signer,
        updateAuthority: signer,
        data: {
          name: tokenData.name,
          symbol: tokenData.symbol,
          uri: tokenData.uri,
          sellerFeeBasisPoints: tokenData.sellerFeeBasisPoints,
          creators: tokenData.creators,
          collection: tokenData.collection,
          uses: tokenData.uses,
        },
        isMutable: true,
        collectionDetails: null,
      });

      const result = await createTx.sendAndConfirm(umi);
      
      console.log('✅ Metadata created successfully!');
      console.log(`📋 Transaction: ${result.signature}`);
      
    } catch (createError) {
      console.log('📝 Metadata account exists, attempting to update...');
      
      try {
        // Update existing metadata
        const updateTx = updateMetadataAccountV2(umi, {
          metadata: metadata[0],
          updateAuthority: signer,
          data: {
            name: tokenData.name,
            symbol: tokenData.symbol,
            uri: tokenData.uri,
            sellerFeeBasisPoints: tokenData.sellerFeeBasisPoints,
            creators: tokenData.creators,
            collection: tokenData.collection,
            uses: tokenData.uses,
          },
          newUpdateAuthority: signer.publicKey,
          primarySaleHappened: false,
          isMutable: true,
        });

        const result = await updateTx.sendAndConfirm(umi);
        
        console.log('✅ Metadata updated successfully!');
        console.log(`📋 Transaction: ${result.signature}`);
        
      } catch (updateError) {
        console.error('❌ Failed to update metadata:', updateError);
        throw updateError;
      }
    }

    console.log('🎉 Process completed!');
    console.log(`🌐 Metadata URI: ${METADATA_URI}`);
    console.log(`🔗 View on Solscan: https://solscan.io/token/${MINT_ADDRESS}?cluster=devnet`);

  } catch (error) {
    console.error('❌ Error attaching metadata:', error);
    
    if (error instanceof Error) {
      console.error('💬 Error message:', error.message);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure your wallet.json file exists in the current directory');
    console.log('2. Replace YOUR_TOKEN_MINT_ADDRESS_HERE with your actual mint address');
    console.log('3. Ensure you have enough SOL for transaction fees');
    console.log('4. Check that your wallet has update authority over the token');
    
    process.exit(1);
  }
}

// Run the script
attachMetadata().catch(console.error);
#!/bin/bash

# Pinata upload script for metadata.json
# This script uploads the metadata.json file to Pinata IPFS storage

# Pinata API credentials
PINATA_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0ZmJmZWQ2Mi0yNGZlLTRlZjAtOTQyOC1lNDAzMGYyOTRhYWEiLCJlbWFpbCI6ImRpMHpjaGFpbkBkaWFtb25kenNoYWRvdy5uZXQiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiMzJkOGMzODI3YzU4MTA4MzQ0ODYiLCJzY29wZWRLZXlTZWNyZXQiOiIxYzY3YjU4MDc1OGI2ZTc0MzdhYzFhMzUxYzNlN2Q0MDI2NWI0MTU1YjczYjZkM2Y5YjFiYWEyZTlmZWE4M2UzIiwiZXhwIjoxNzg4MjMzMDAzfQ.Abt-32fZRuyrHqQFVSbQg8ewfHW9koU4R2DQNCxIAu0"

# File to upload
FILE_PATH="/workspace/metadata.json"

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
    echo "❌ Error: metadata.json file not found at $FILE_PATH"
    exit 1
fi

echo "🚀 Starting upload to Pinata..."
echo "📄 Uploading: $FILE_PATH"

# Create metadata for the pin
METADATA='{
    "name": "Diamondz Shadow Game + Movies Metadata",
    "keyvalues": {
        "project": "Diamondz Shadow Game + Movies",
        "type": "metadata"
    }
}'

# Upload the file to Pinata
echo "📤 Uploading to Pinata IPFS..."

RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $PINATA_JWT" \
    -F "file=@$FILE_PATH" \
    -F "pinataMetadata=$METADATA" \
    -F 'pinataOptions={"cidVersion": 1}' \
    "https://api.pinata.cloud/pinning/pinFileToIPFS")

# Check if the upload was successful
if echo "$RESPONSE" | grep -q '"IpfsHash"'; then
    # Extract the IPFS hash
    IPFS_HASH=$(echo "$RESPONSE" | grep -o '"IpfsHash":"[^"]*"' | cut -d'"' -f4)
    
    echo ""
    echo "✅ File uploaded successfully!"
    echo "📁 File: metadata.json"
    echo "🔗 IPFS Hash: $IPFS_HASH"
    echo "🌐 Gateway URL: https://gateway.pinata.cloud/ipfs/$IPFS_HASH"
    echo "🌐 Your Gateway URL: https://red-adorable-dove-755.mypinata.cloud/ipfs/$IPFS_HASH"
    echo ""
    echo "🎉 Upload completed successfully!"
    echo "You can now use this IPFS hash in your token metadata or NFT collection."
    
    # Save the response for reference
    echo "$RESPONSE" > /workspace/pinata_upload_response.json
    echo "📋 Full response saved to: pinata_upload_response.json"
    
else
    echo "❌ Upload failed!"
    echo "Response: $RESPONSE"
    exit 1
fi
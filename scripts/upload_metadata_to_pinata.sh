#!/bin/bash

# Secure Pinata Upload Script for Diamondz Shadow Game + Movies Token Metadata
# This script uploads token metadata to Pinata IPFS storage using environment variables for security

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error "Environment file .env not found!"
    print_warning "Please create a .env file with your Pinata credentials."
    print_warning "See .env.example for the required format."
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
if [ -z "$PINATA_JWT" ]; then
    print_error "PINATA_JWT environment variable not set!"
    print_warning "Please add PINATA_JWT to your .env file."
    exit 1
fi

# Default file path
FILE_PATH="${1:-metadata.json}"

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
    print_error "File not found: $FILE_PATH"
    print_warning "Usage: $0 [file_path]"
    print_warning "Example: $0 metadata.json"
    exit 1
fi

print_status "Starting upload to Pinata IPFS..."
print_status "File: $FILE_PATH"

# Extract filename for metadata
FILENAME=$(basename "$FILE_PATH")
NAME_WITHOUT_EXT="${FILENAME%.*}"

# Create metadata for the pin
METADATA="{
    \"name\": \"Diamondz Shadow - $NAME_WITHOUT_EXT\",
    \"keyvalues\": {
        \"project\": \"Diamondz Shadow Game + Movies\",
        \"type\": \"token-metadata\",
        \"symbol\": \"SDM\",
        \"uploadedBy\": \"automated-script\",
        \"uploadDate\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }
}"

# Upload options
PINATA_OPTIONS='{
    "cidVersion": 1,
    "wrapWithDirectory": false
}'

print_status "Uploading to Pinata..."

# Upload the file to Pinata
RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $PINATA_JWT" \
    -F "file=@$FILE_PATH" \
    -F "pinataMetadata=$METADATA" \
    -F "pinataOptions=$PINATA_OPTIONS" \
    "https://api.pinata.cloud/pinning/pinFileToIPFS")

# Check if the upload was successful
if echo "$RESPONSE" | grep -q '"IpfsHash"'; then
    # Extract the IPFS hash
    IPFS_HASH=$(echo "$RESPONSE" | grep -o '"IpfsHash":"[^"]*"' | cut -d'"' -f4)
    
    echo ""
    print_success "File uploaded successfully!"
    echo "📁 File: $FILE_PATH"
    echo "🔗 IPFS Hash: $IPFS_HASH"
    echo "🌐 Gateway URL: https://gateway.pinata.cloud/ipfs/$IPFS_HASH"
    echo "🌐 Your Gateway URL: https://red-adorable-dove-755.mypinata.cloud/ipfs/$IPFS_HASH"
    echo ""
    
    # Save upload info (without sensitive data)
    UPLOAD_INFO="{
  \"filename\": \"$FILENAME\",
  \"ipfsHash\": \"$IPFS_HASH\",
  \"gatewayUrl\": \"https://gateway.pinata.cloud/ipfs/$IPFS_HASH\",
  \"customGatewayUrl\": \"https://red-adorable-dove-755.mypinata.cloud/ipfs/$IPFS_HASH\",
  \"uploadDate\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"project\": \"Diamondz Shadow Game + Movies\"
}"
    
    echo "$UPLOAD_INFO" > "uploads/$(date +%Y%m%d_%H%M%S)_${NAME_WITHOUT_EXT}_upload.json"
    print_success "Upload info saved to uploads/ directory"
    
    print_success "Upload completed successfully!"
    echo "You can now use this IPFS hash in your token contracts or NFT collections."
    
else
    print_error "Upload failed!"
    echo "Response: $RESPONSE"
    exit 1
fi
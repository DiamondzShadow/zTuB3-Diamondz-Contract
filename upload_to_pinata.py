#!/usr/bin/env python3
"""
Script to upload metadata.json to Pinata IPFS storage
"""

import requests
import json
import os

# Pinata API credentials
PINATA_API_KEY = "32d8c3827c5810834486"
PINATA_SECRET_API_KEY = "1c67b580758b6e7437ac1a351c3e7d40265b4155b73b6d3f9b1baa2e9fea83e3"
PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0ZmJmZWQ2Mi0yNGZlLTRlZjAtOTQyOC1lNDAzMGYyOTRhYWEiLCJlbWFpbCI6ImRpMHpjaGFpbkBkaWFtb25kenNoYWRvdy5uZXQiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiMzJkOGMzODI3YzU4MTA4MzQ0ODYiLCJzY29wZWRLZXlTZWNyZXQiOiIxYzY3YjU4MDc1OGI2ZTc0MzdhYzFhMzUxYzNlN2Q0MDI2NWI0MTU1YjczYjZkM2Y5YjFiYWEyZTlmZWE4M2UzIiwiZXhwIjoxNzg4MjMzMDAzfQ.Abt-32fZRuyrHqQFVSbQg8ewfHW9koU4R2DQNCxIAu0"

def upload_to_pinata(file_path, pin_name=None):
    """
    Upload a file to Pinata IPFS storage
    
    Args:
        file_path (str): Path to the file to upload
        pin_name (str): Optional name for the pinned file
    
    Returns:
        dict: Response from Pinata API
    """
    
    # Pinata API endpoint for file uploads
    url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
    
    # Headers with authentication
    headers = {
        "Authorization": f"Bearer {PINATA_JWT}"
    }
    
    # Prepare the file for upload
    try:
        with open(file_path, 'rb') as file:
            files = {
                'file': (os.path.basename(file_path), file, 'application/json')
            }
            
            # Optional metadata for the pin
            metadata = {
                "name": pin_name or os.path.basename(file_path),
                "keyvalues": {
                    "project": "Diamondz Shadow Game + Movies",
                    "type": "metadata"
                }
            }
            
            # Add metadata to the request
            data = {
                'pinataMetadata': json.dumps(metadata),
                'pinataOptions': json.dumps({
                    "cidVersion": 1
                })
            }
            
            # Make the upload request
            response = requests.post(url, headers=headers, files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ File uploaded successfully!")
                print(f"📁 File: {file_path}")
                print(f"🔗 IPFS Hash: {result['IpfsHash']}")
                print(f"🌐 Gateway URL: https://gateway.pinata.cloud/ipfs/{result['IpfsHash']}")
                print(f"🌐 Your Gateway URL: https://red-adorable-dove-755.mypinata.cloud/ipfs/{result['IpfsHash']}")
                return result
            else:
                print(f"❌ Upload failed with status code: {response.status_code}")
                print(f"Error: {response.text}")
                return None
                
    except FileNotFoundError:
        print(f"❌ File not found: {file_path}")
        return None
    except Exception as e:
        print(f"❌ An error occurred: {str(e)}")
        return None

def main():
    """Main function to upload metadata.json"""
    metadata_file = "/workspace/metadata.json"
    
    print("🚀 Starting upload to Pinata...")
    print(f"📄 Uploading: {metadata_file}")
    
    # Check if file exists
    if not os.path.exists(metadata_file):
        print(f"❌ File does not exist: {metadata_file}")
        return
    
    # Upload the file
    result = upload_to_pinata(metadata_file, "Diamondz Shadow Game + Movies Metadata")
    
    if result:
        print("\n🎉 Upload completed successfully!")
        print("You can now use this IPFS hash in your token metadata or NFT collection.")
    else:
        print("\n💥 Upload failed. Please check your credentials and try again.")

if __name__ == "__main__":
    main()
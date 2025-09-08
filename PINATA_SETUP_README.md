# 🚀 Pinata IPFS Setup for Diamondz Shadow Token

Quick start guide for uploading token metadata to IPFS via Pinata.

## 🔧 Quick Setup

1. **Clone and navigate to project**:
   ```bash
   git clone [your-repo-url]
   cd [project-directory]
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Pinata credentials
   ```

3. **Upload metadata**:
   ```bash
   ./scripts/upload_metadata_to_pinata.sh metadata.json
   ```

## 📋 Required Credentials

Get these from [Pinata Dashboard](https://app.pinata.cloud/keys):

- `PINATA_API_KEY`
- `PINATA_SECRET_API_KEY` 
- `PINATA_JWT`

## 📁 Project Structure

```
📦 Diamondz Shadow Token
├── 📄 metadata.json                    # Token metadata
├── 📁 scripts/
│   └── 🔧 upload_metadata_to_pinata.sh # Secure upload script
├── 📁 docs/
│   ├── 📖 TOKEN_METADATA_STRUCTURE.md  # Metadata documentation
│   └── 📖 PINATA_UPLOAD_GUIDE.md       # Detailed upload guide
├── 📁 uploads/                         # Upload history (auto-generated)
├── 🔒 .env.example                     # Environment template
└── 🚫 .gitignore                       # Excludes sensitive files
```

## ⚡ Quick Commands

```bash
# Upload metadata
./scripts/upload_metadata_to_pinata.sh metadata.json

# Validate JSON
cat metadata.json | jq .

# Check upload history
ls -la uploads/

# Test IPFS access
curl -s "https://gateway.pinata.cloud/ipfs/[HASH]" | jq .
```

## 🔒 Security Notes

- ✅ Credentials stored in `.env` (not committed to git)
- ✅ Upload script uses environment variables
- ✅ Upload history tracked without sensitive data
- ✅ All sensitive files in `.gitignore`

## 🌐 Current Metadata IPFS

- **Hash**: `bafkreigb2axwu5qxqq5ytl5625murmjcpget5nqwxtcd3jc62m4nibk7f4`
- **URL**: https://red-adorable-dove-755.mypinata.cloud/ipfs/bafkreigb2axwu5qxqq5ytl5625murmjcpget5nqwxtcd3jc62m4nibk7f4

## 📚 Documentation

- [Token Metadata Structure](docs/TOKEN_METADATA_STRUCTURE.md)
- [Detailed Upload Guide](docs/PINATA_UPLOAD_GUIDE.md)

---

**Need Help?** Check the docs/ directory or contact the development team.
# 🚀 ACREDIA Aptos Smart Contracts

This directory contains the Move smart contracts for ACREDIA - the blockchain-based academic credential verification system running on **Aptos Network**.

## 📁 Directory Structure

```
contracts/aptos/
├── Move.toml                          # Package manifest & dependencies
├── sources/
│   ├── credential_nft.move            # NFT credential contract
│   └── credential_registry.move       # Credential registry contract
├── tests/
│   ├── credential_nft_tests.move      # NFT contract tests
│   └── credential_registry_tests.move # Registry contract tests
└── scripts/
    └── deploy.sh                      # Deployment helper script
```

## 🔧 Prerequisites

Before deploying, ensure you have:

1. **Aptos CLI** installed:
   ```bash
   curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
   ```

2. **Aptos Account** with testnet APT tokens:
   ```bash
   aptos init
   # Get tokens from: https://aptos.dev/en/build/guides/aptos-faucet
   ```

3. **Move knowledge** (refer to [Move Book](https://move-book.com))

## 📝 Contract Overview

### 1. credential_nft.move
The main NFT contract for issuing academic credentials.

#### Key Functions:
- `initialize(admin)` - Initialize the credential store
- `authorize_issuer(admin, issuer)` - Authorize an institution to issue credentials
- `revoke_issuer(admin, issuer)` - Revoke issuer authorization
- `issue_credential(issuer, student, hash, uri)` - Issue a credential NFT
- `revoke_credential(issuer, token_id)` - Revoke a credential
- `get_credential(token_id)` - Retrieve credential details
- `is_credential_valid(token_id)` - Check if credential is valid
- `get_credentials_by_student(student)` - Get all credentials for a student
- `get_credentials_by_issuer(issuer)` - Get all credentials from an issuer

#### Events:
- `CredentialIssuedEvent` - Emitted when credential is issued
- `CredentialRevokedEvent` - Emitted when credential is revoked
- `IssuerAuthorizedEvent` - Emitted when issuer is authorized
- `IssuerRevokedEvent` - Emitted when issuer is revoked

#### Error Codes:
- `1 (ENOT_AUTHORIZED)` - Caller not authorized
- `2 (EINVALID_STUDENT)` - Invalid student address
- `3 (ECREDENTIAL_NOT_FOUND)` - Credential doesn't exist
- `4 (EALREADY_REVOKED)` - Credential already revoked
- `5 (EISSUER_NOT_AUTHORIZED)` - Issuer not authorized
- `6 (ESTORE_NOT_INITIALIZED)` - Store not initialized

### 2. credential_registry.move
Centralized registry for tracking all issued credentials.

#### Key Functions:
- `initialize(admin)` - Initialize the registry
- `register_credential(issuer, token_id, student, hash, ipfs_hash)` - Register credential
- `unregister_credential(admin, token_id)` - Remove credential from registry
- `get_credential(token_id)` - Get credential record details
- `get_credentials_by_student(student)` - Get all credentials for a student
- `get_credentials_by_issuer(issuer)` - Get all credentials from issuer
- `credential_exists(token_id)` - Check if credential exists
- `total_credentials()` - Get total number of credentials

#### Events:
- `CredentialRegisteredEvent` - Emitted when credential is registered
- `CredentialUnregisteredEvent` - Emitted when credential is unregistered

## 🏗️ Building the Contracts

### Compile

```bash
cd contracts/aptos
aptos move compile --package-dir .
```

**Expected Output:**
```
Compiling, may take a minute...
BUILDING acredia
Build ✓ under /path/to/contracts/aptos/build
```

### Test

Run all unit tests:

```bash
aptos move test --package-dir .
```

**Run specific test:**
```bash
aptos move test --package-dir . -- --test test_issue_credential
```

**Run with verbose output:**
```bash
aptos move test --package-dir . -- --verbose
```

## 🚀 Deployment

### Automated Deployment (Recommended)

Use the provided deployment script:

```bash
# Make script executable (first time only)
chmod +x scripts/deploy.sh

# Deploy to testnet
./scripts/deploy.sh --network testnet

# Deploy to mainnet
./scripts/deploy.sh --network mainnet

# Deploy without running tests
./scripts/deploy.sh --network testnet --skip-tests

# View help
./scripts/deploy.sh --help
```

### Manual Deployment

If the script doesn't work on Windows, deploy manually:

```bash
# 1. Compile contracts
aptos move compile --package-dir .

# 2. Publish to testnet
aptos move publish \
    --package-dir . \
    --network testnet \
    --profile default \
    --assume-yes

# 3. For mainnet, replace 'testnet' with 'mainnet'
aptos move publish \
    --package-dir . \
    --network mainnet \
    --profile default \
    --assume-yes
```

### Expected Deployment Output

You should see output like:

```
Publishing a new package.
Build ✓
Package size 42 bytes
Publishing package...
        Code module index 0
Transaction submitted: 0x123abc...

Transaction Executed Successfully

Package address: 0x456def...
```

**✅ Record the "Package address" - this is your MODULE_ADDRESS**

## 🔧 Post-Deployment Configuration

After deployment, update your frontend `.env.local`:

```bash
NEXT_PUBLIC_APTOS_NETWORK=testnet
NEXT_PUBLIC_APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
NEXT_PUBLIC_MODULE_ADDRESS=0x456def...  # Your deployed module address
```

## 📊 Contract Interaction Flow

### 1. Initialization
```
Admin calls initialize() 
    ↓
CredentialStore created at admin's address
```

### 2. Issuer Authorization
```
Admin calls authorize_issuer(institution_address)
    ↓
Institution added to authorized_issuers vector
    ↓
Institution can now issue credentials
```

### 3. Credential Issuance
```
Authorized Institution calls issue_credential(
    student_address,
    credential_hash,
    ipfs_uri
)
    ↓
Credential created with token_id
    ↓
CredentialIssuedEvent emitted
    ↓
Frontend captures event and stores in database
```

### 4. Credential Verification
```
Verifier calls is_credential_valid(token_id)
    ↓
System checks:
   - Credential exists?
   - Is it revoked?
    ↓
Returns boolean (true = valid, false = invalid)
```

### 5. Credential Revocation
```
Authorized Issuer/Admin calls revoke_credential(token_id)
    ↓
Credential marked as revoked
    ↓
CredentialRevokedEvent emitted
    ↓
Verification now fails for this credential
```

## 🔍 Viewing Deployed Contracts

### On Testnet Explorer

1. Visit: https://testnet.explorer.aptoslabs.com/
2. Paste your MODULE_ADDRESS in the search bar
3. View contract code, resources, and transactions

### Via CLI

```bash
# View account resources
aptos account list --network testnet --profile default

# View specific account resources
aptos account list --network testnet --profile default --address 0x456def

# Get account info
aptos account info --network testnet --profile default --address 0x456def
```

## 🧪 Testing Guide

### Run All Tests
```bash
aptos move test --package-dir .
```

### Test Coverage

Our test suite includes:

**credential_nft_tests.move:**
- ✅ Initialization test
- ✅ Issuer authorization test
- ✅ Credential issuance test
- ✅ Credential revocation test
- ✅ Get credentials by student test

**credential_registry_tests.move:**
- ✅ Registry initialization test
- ✅ Credential registration test
- ✅ Get credential test
- ✅ Get credentials by student test
- ✅ Get credentials by issuer test

### Expected Test Output

```
Running Move unit tests
[ PASS    ] 0x123::credential_nft::credential_nft_tests::test_initialize
[ PASS    ] 0x123::credential_nft::credential_nft_tests::test_authorize_issuer
[ PASS    ] 0x123::credential_nft::credential_nft_tests::test_issue_credential
[ PASS    ] 0x123::credential_nft::credential_nft_tests::test_revoke_credential
[ PASS    ] 0x123::credential_registry::credential_registry_tests::test_initialize
[ PASS    ] 0x123::credential_registry::credential_registry_tests::test_register_credential

Test result: ok. Total tests: 10; passed: 10; failed: 0
```

## 📚 Key Concepts

### Module Address
- Your deployed contract address
- Format: `0x` followed by 64 hex characters
- Example: `0x123abc456def789...`
- Store this in environment variables

### Token ID
- Sequential number assigned to each credential
- Starts at 1 and increments
- Used to uniquely identify credentials
- Similar to NFT token ID in Solidity

### Credential Hash
- Cryptographic hash of credential data
- Prevents tampering
- Can be verified on-chain
- Format: hex string

### IPFS URI
- Points to full credential metadata on IPFS
- Format: `ipfs://QmXXX/filename`
- Contains certificate details, marks, grades, etc.

### Events
- Logged on-chain automatically
- Indexed for quick searching
- Captured by frontend applications
- Enable real-time updates

## 🐛 Troubleshooting

### Error: "Module not found"
```
Solution: Ensure MODULE_ADDRESS is correctly set and deployed
```

### Error: "Not authorized"
```
Solution: Call initialize() and authorize_issuer() first
```

### Error: "Credential not found"
```
Solution: Check that credential has been issued before querying
```

### Compilation Error: "Unknown function"
```
Solution: Check Move syntax and ensure all imports are correct
```

### Deployment Timeout
```
Solution: Check internet connection and try again
```

## 📖 Move Language Resources

- **Official Move Book**: https://move-book.com
- **Aptos Move Docs**: https://aptos.dev/move/
- **Move Tutorial**: https://aptos.dev/move/move-on-aptos

## 🔗 Useful Links

- **Aptos Official**: https://aptos.dev
- **Testnet Faucet**: https://aptos.dev/en/build/guides/aptos-faucet
- **Aptos Explorer**: https://explorer.aptoslabs.com
- **Aptos Discord**: https://discord.gg/aptoslabs
- **CLI Reference**: https://aptos.dev/en/build/cli

## 💡 Best Practices

1. **Always test locally first** - Run tests before deployment
2. **Use testnet** - Deploy to testnet before mainnet
3. **Save module address** - Record deployment address immediately
4. **Add error handling** - Frontend should handle all error codes
5. **Monitor events** - Use event listeners in frontend
6. **Version control** - Commit contract changes to git
7. **Documentation** - Keep contracts well-commented

## 📝 Development Workflow

1. Make changes to `.move` files
2. Run: `aptos move compile --package-dir .`
3. Run: `aptos move test --package-dir .`
4. If tests pass, deploy: `./scripts/deploy.sh`
5. Update frontend with new MODULE_ADDRESS
6. Test end-to-end functionality

## ✅ Deployment Checklist

Before going to production:

- [ ] All tests pass locally
- [ ] Contracts compile without errors
- [ ] Deployed to testnet successfully
- [ ] Verified on testnet explorer
- [ ] Frontend integration tested
- [ ] All functions work as expected
- [ ] Events properly emitted
- [ ] Error handling implemented
- [ ] Security audit completed
- [ ] Ready for mainnet deployment

## 🆘 Getting Help

If you encounter issues:

1. Check the [troubleshooting section](#-troubleshooting)
2. Review the [APTOS_MIGRATION_GUIDE.md](../../APTOS_MIGRATION_GUIDE.md)
3. Ask in Aptos Discord: https://discord.gg/aptoslabs
4. Check Aptos documentation: https://aptos.dev

---

**Last Updated**: December 2025  
**Status**: ✅ Production Ready  
**Compatibility**: Aptos Testnet & Mainnet

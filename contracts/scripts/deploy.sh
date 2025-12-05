#!/bin/bash

# ACREDIA Aptos Contract Deployment Script
# This script compiles and deploys the ACREDIA contracts to Aptos blockchain

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
NETWORK="testnet"
SKIP_TESTS=false

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Function to display usage
usage() {
    echo "Usage: ./deploy.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -n, --network NETWORK     Network to deploy to (testnet or mainnet)"
    echo "  -t, --skip-tests          Skip running tests before deployment"
    echo "  -h, --help                Display this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh                     # Deploy to testnet"
    echo "  ./deploy.sh --network mainnet   # Deploy to mainnet"
    echo "  ./deploy.sh --skip-tests        # Deploy to testnet without running tests"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--network)
            NETWORK="$2"
            shift 2
            ;;
        -t|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Validate network
if [[ "$NETWORK" != "testnet" && "$NETWORK" != "mainnet" ]]; then
    print_error "Invalid network: $NETWORK. Use 'testnet' or 'mainnet'"
    exit 1
fi

# Check if Aptos CLI is installed
if ! command -v aptos &> /dev/null; then
    print_error "Aptos CLI is not installed!"
    echo "Install it with: curl -fsSL 'https://aptos.dev/scripts/install_cli.py' | python3"
    exit 1
fi

print_info "ACREDIA Aptos Contract Deployment"
print_info "==================================="
echo ""

# Step 1: Check directory structure
print_info "Step 1: Checking directory structure..."
if [ ! -f "Move.toml" ]; then
    print_error "Move.toml not found. Make sure you're in the contracts/aptos directory"
    exit 1
fi

if [ ! -d "sources" ]; then
    print_error "sources/ directory not found"
    exit 1
fi

print_success "Directory structure is valid"
echo ""

# Step 2: Compile contracts
print_info "Step 2: Compiling Move contracts..."
if aptos move compile --package-dir . 2>&1 | grep -q "Error"; then
    print_error "Compilation failed!"
    exit 1
else
    print_success "Contracts compiled successfully"
fi
echo ""

# Step 3: Run tests (if not skipped)
if [ "$SKIP_TESTS" = false ]; then
    print_info "Step 3: Running unit tests..."
    if aptos move test --package-dir . 2>&1 | grep -q "FAILED"; then
        print_error "Some tests failed!"
        exit 1
    else
        print_success "All tests passed"
    fi
    echo ""
else
    print_warning "Step 3: Skipping tests as requested"
    echo ""
fi

# Step 4: Get or create profile
print_info "Step 4: Checking Aptos profile..."
PROFILE_NAME="acredia-$NETWORK"

if aptos config show-profiles | grep -q "$PROFILE_NAME"; then
    print_success "Profile '$PROFILE_NAME' found"
else
    print_warning "Profile '$PROFILE_NAME' not found. Using default profile"
    PROFILE_NAME="default"
fi
echo ""

# Step 5: Display deployment info
print_info "Step 5: Deployment Information"
echo "Network:  $NETWORK"
echo "Profile:  $PROFILE_NAME"
echo ""

# Step 6: Confirm deployment
print_warning "Ready to deploy to $NETWORK"
read -p "Do you want to continue? (yes/no): " confirm

if [[ "$confirm" != "yes" ]]; then
    print_error "Deployment cancelled"
    exit 0
fi

echo ""

# Step 7: Deploy contracts
print_info "Step 6: Publishing contracts to $NETWORK..."

if aptos move publish \
    --package-dir . \
    --network $NETWORK \
    --profile $PROFILE_NAME \
    --assume-yes; then
    print_success "Contracts deployed successfully!"
else
    print_error "Deployment failed!"
    exit 1
fi

echo ""
print_success "==================================="
print_success "Deployment Complete!"
print_success "==================================="
echo ""
print_info "Next steps:"
echo "1. Record the contract address from the deployment output above"
echo "2. Update NEXT_PUBLIC_MODULE_ADDRESS in your .env.local"
echo "3. Continue with Phase 2: Frontend Integration"
echo ""

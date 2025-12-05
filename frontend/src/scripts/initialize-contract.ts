/**
 * Contract Initialization Script
 * 
 * This script initializes the CredentialStore for the admin wallet.
 * Run this ONCE after deploying the contract to set up the credential store.
 * 
 * Usage:
 * 1. Make sure your Petra wallet is connected
 * 2. Navigate to: http://localhost:3000/admin/initialize
 * 3. Click "Initialize Contract"
 */

import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const MODULE_ADDRESS = process.env.NEXT_PUBLIC_MODULE_ADDRESS || '';
const APTOS_NETWORK = (process.env.NEXT_PUBLIC_APTOS_NETWORK || 'testnet') as Network;

const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

export async function initializeContract(accountAddress: string) {
    try {
        console.log('🚀 Initializing contract...');
        console.log('Admin Address:', accountAddress);
        console.log('Module Address:', MODULE_ADDRESS);

        // Create the transaction payload for Petra wallet
        const transaction = {
            type: 'entry_function_payload',
            function: `${MODULE_ADDRESS}::credential_nft::initialize`,
            type_arguments: [],
            arguments: [],
        };

        console.log('📝 Transaction payload:', transaction);
        return transaction;
    } catch (error) {
        console.error('❌ Error creating initialization transaction:', error);
        throw error;
    }
}

export async function checkIfInitialized(accountAddress: string): Promise<boolean> {
    try {
        console.log('🔍 Checking if contract is initialized...');

        // Try to fetch the owner - if it succeeds, the store exists
        const result = await aptos.view({
            payload: {
                function: `${MODULE_ADDRESS}::credential_nft::get_owner` as any,
                typeArguments: [],
                functionArguments: [accountAddress],
            },
        });

        console.log('✅ Contract is already initialized!');
        console.log('Owner:', (result as any[])[0]);
        return true;
    } catch (error) {
        console.log('⚠️ Contract not yet initialized');
        return false;
    }
}

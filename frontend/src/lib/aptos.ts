import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// Network configuration
const network = (process.env.NEXT_PUBLIC_APTOS_NETWORK || "testnet") as Network;
const config = new AptosConfig({ network });
export const aptos = new Aptos(config);

// Module address from deployment
export const MODULE_ADDRESS =
    process.env.NEXT_PUBLIC_MODULE_ADDRESS ||
    "0x262e014c482dbed31f46796ed1acd3ebe69a8d4572c5177a7774ef9add39d029";

// Contract module paths
export const CONTRACTS = {
    CREDENTIAL_NFT: `${MODULE_ADDRESS}::credential_nft`,
    CREDENTIAL_REGISTRY: `${MODULE_ADDRESS}::credential_registry`,
};

// Helper functions
export function isValidAptoAddress(address: string): boolean {
    return /^0x[0-9a-fA-F]{1,64}$/.test(address);
}

export function formatAddress(address: string): string {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getFullAddress(address: string): string {
    if (!address.startsWith("0x")) {
        return `0x${address.padStart(64, "0")}`;
    }
    return `0x${address.slice(2).padStart(64, "0")}`;
}

// Transaction helpers
export async function signAndSubmitTransaction(
    account: any,
    signAndSubmitTransaction: any,
    transaction: any
) {
    try {
        const response = await signAndSubmitTransaction({
            data: transaction,
        });

        // Wait for transaction confirmation
        const confirmedTxn = await aptos.waitForTransaction({
            transactionHash: response.hash,
        });

        return confirmedTxn;
    } catch (error: any) {
        console.error("Transaction error:", error);
        throw error;
    }
}

// Contract function helpers
export function buildIssueCredentialTx(
    issuer: string,
    student: string,
    credentialHash: string,
    ipfsUri: string
) {
    return {
        type: 'entry_function_payload',
        function: `${CONTRACTS.CREDENTIAL_NFT}::issue_credential` as any,
        type_arguments: [],
        arguments: [student, credentialHash, ipfsUri, MODULE_ADDRESS], // issuer is automatic from signer
    };
}

export function buildAuthorizeIssuerTx(issuer: string) {
    return {
        type: 'entry_function_payload',
        function: `${CONTRACTS.CREDENTIAL_NFT}::authorize_issuer` as any,
        type_arguments: [],
        arguments: [issuer], // Only issuer address - signer is automatic
    };
}

export function buildRevokeCredentialTx(tokenId: number) {
    return {
        type: 'entry_function_payload',
        function: `${CONTRACTS.CREDENTIAL_NFT}::revoke_credential` as any,
        type_arguments: [],
        arguments: [tokenId, MODULE_ADDRESS], // issuer is automatic from signer
    };
}

// View functions (no transaction needed)
export async function getCredential(tokenId: number) {
    try {
        const result = await aptos.view({
            payload: {
                function: `${CONTRACTS.CREDENTIAL_NFT}::get_credential` as any,
                typeArguments: [],
                functionArguments: [tokenId, MODULE_ADDRESS],
            },
        });
        return result;
    } catch (error) {
        console.error("Error fetching credential:", error);
        return null;
    }
}

export async function getCredentialsByStudent(studentAddress: string) {
    try {
        const result = await aptos.view({
            payload: {
                function: `${CONTRACTS.CREDENTIAL_NFT}::get_credentials_by_student` as any,
                typeArguments: [],
                functionArguments: [studentAddress, MODULE_ADDRESS],
            },
        });
        return result as number[];
    } catch (error) {
        console.error("Error fetching student credentials:", error);
        return [];
    }
}

export async function getCredentialsByIssuer(issuerAddress: string) {
    try {
        const result = await aptos.view({
            payload: {
                function: `${CONTRACTS.CREDENTIAL_NFT}::get_credentials_by_issuer` as any,
                typeArguments: [],
                functionArguments: [issuerAddress, MODULE_ADDRESS],
            },
        });
        return result as number[];
    } catch (error) {
        console.error("Error fetching issuer credentials:", error);
        return [];
    }
}

export async function isCredentialValid(tokenId: number) {
    try {
        const result = await aptos.view({
            payload: {
                function: `${CONTRACTS.CREDENTIAL_NFT}::is_credential_valid` as any,
                typeArguments: [],
                functionArguments: [tokenId, MODULE_ADDRESS],
            },
        });
        return (result as any[])[0] === true;
    } catch (error) {
        console.error("Error checking credential validity:", error);
        return false;
    }
}

export async function getTotalCredentials() {
    try {
        const result = await aptos.view({
            payload: {
                function: `${CONTRACTS.CREDENTIAL_NFT}::total_credentials` as any,
                typeArguments: [],
                functionArguments: [MODULE_ADDRESS],
            },
        });
        return (result as any[])[0] as number;
    } catch (error) {
        console.error("Error fetching total credentials:", error);
        return 0;
    }
}

export async function getRegistryCredential(
    tokenId: number,
    registryAddr: string = MODULE_ADDRESS
) {
    try {
        const result = await aptos.view({
            payload: {
                function: `${CONTRACTS.CREDENTIAL_REGISTRY}::get_credential` as any,
                typeArguments: [],
                functionArguments: [tokenId, registryAddr],
            },
        });
        return result;
    } catch (error) {
        console.error("Error fetching registry credential:", error);
        return null;
    }
}

// View function: Get the owner of the credential store
export async function getOwner(storeAddress: string = MODULE_ADDRESS) {
    try {
        const result = await aptos.view({
            payload: {
                function: `${CONTRACTS.CREDENTIAL_NFT}::get_owner` as any,
                typeArguments: [],
                functionArguments: [storeAddress],
            },
        });
        return (result as any[])[0] as string;
    } catch (error) {
        console.error("Error fetching owner:", error);
        return null;
    }
}

// View function: Check if issuer is authorized on blockchain
export async function isIssuerAuthorized(
    issuerAddress: string,
    storeAddress: string = MODULE_ADDRESS
) {
    try {
        const result = await aptos.view({
            payload: {
                function: `${CONTRACTS.CREDENTIAL_NFT}::is_issuer_authorized` as any,
                typeArguments: [],
                functionArguments: [issuerAddress, storeAddress],
            },
        });
        return (result as any[])[0] === true;
    } catch (error) {
        console.error("Error checking issuer authorization:", error);
        return false;
    }
}

// View function: Get all authorized issuers
export async function getAuthorizedIssuers(storeAddress: string = MODULE_ADDRESS) {
    try {
        const result = await aptos.view({
            payload: {
                function: `${CONTRACTS.CREDENTIAL_NFT}::get_authorized_issuers` as any,
                typeArguments: [],
                functionArguments: [storeAddress],
            },
        });
        return result as string[];
    } catch (error) {
        console.error("Error fetching authorized issuers:", error);
        return [];
    }
}
